const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const https = require('https');
const { getCustomSprintsFile, getJiraHost, getJiraSprintsFile } = require('./board-config');

const JIRA_HOST = getJiraHost();
const JIRA_USER = process.env.JIRA_USER;
const JIRA_TOKEN = process.env.JIRA_API_KEY;
const CUSTOM_SPRINTS_FILE = getCustomSprintsFile(__dirname);
const JIRA_SPRINTS_FILE = getJiraSprintsFile(__dirname);

function parseSprintDataScript(content) {
    return JSON.parse(
        content
            .replace(/^const MOMENTUM_SPRINTS_DATA = /, '')
            .replace(/;\s*$/, '')
    );
}

async function fetchJira(apiUrl) {
    if (!JIRA_USER || !JIRA_TOKEN) throw new Error('Credenciais JIRA não carregadas. Verifique o .env');
    const auth = Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64');
    const headers = { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' };

    return new Promise((resolve, reject) => {
        https.get(`https://${JIRA_HOST}${apiUrl}`, { headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { 
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 400) reject(new Error(parsed.errorMessages ? parsed.errorMessages[0] : `Jira Error ${res.statusCode}`));
                    else resolve(parsed); 
                } catch (e) { reject(new Error('JSON Parse Error')); }
            });
        }).on('error', reject);
    });
}

async function syncSprint(sprintIdOrObject, options = {}) {
    try {
        const customSprintsFile = options.customSprintsFile || CUSTOM_SPRINTS_FILE;
        const jiraSprintsFile = options.jiraSprintsFile || JIRA_SPRINTS_FILE;
        let sprintMetadata = sprintIdOrObject;
        
        // If only ID is passed, fetch basic sprint info first
        if (typeof sprintIdOrObject !== 'object') {
            sprintMetadata = await fetchJira(`/rest/agile/1.0/sprint/${sprintIdOrObject}`);
        }

        if (!sprintMetadata || !sprintMetadata.name) {
            throw new Error(`Dados da sprint ${sprintIdOrObject} inválidos ou não encontrados.`);
        }

        console.log(`🔍 Processando Sprint: ${sprintMetadata.name}...`);

        // 1. Get Tickets (POST /search/jql)
        const auth = Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64');
        const postData = JSON.stringify({
            jql: `sprint=${sprintMetadata.id} AND issuetype NOT IN subtaskIssueTypes()`,
            maxResults: 100,
            fields: ["summary", "assignee", "status", "customfield_10030", "customfield_10014", "customfield_10020"]
        });

        const searchData = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: JIRA_HOST, path: '/rest/api/3/search/jql', method: 'POST',
                headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json', 'Accept': 'application/json', 'Content-Length': postData.length }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                const parsed = JSON.parse(data);
                if (parsed.errorMessages) console.error('🔴 JIRA JQL ERRORS:', parsed.errorMessages);
                resolve(parsed);
            });
            });
            req.on('error', reject); req.write(postData); req.end();
        });

        if (!searchData || !searchData.issues) throw new Error(`Falha ao buscar tickets para sprint ${sprintMetadata.id}`);

        // 2. Fetch Epic Names
        const epicIds = [...new Set(searchData.issues.map(i => i.fields.customfield_10014).filter(id => id))];
        const epicNames = {};
        for (const id of epicIds) {
            try {
                const epicIssue = await fetchJira(`/rest/api/3/issue/${id}?fields=summary`);
                if (epicIssue.fields) epicNames[id] = epicIssue.fields.summary;
            } catch (e) { console.warn(`⚠️ Erro épico ${id}`); }
        }

        // 3. Map Tickets
        const tickets = searchData.issues.map(issue => {
            const f = issue.fields;
            const statusName = f.status ? f.status.name.toLowerCase() : '';
            const statusCategory = f.status && f.status.statusCategory ? f.status.statusCategory.name.toLowerCase() : '';
            
            // Check if still in sprint
            const sprintLinks = f.customfield_10020 || [];
            const isInCurrentSprint = sprintLinks.some(s => s.id === sprintMetadata.id);

            const isDone = statusCategory === 'done' || 
                           statusName.includes('concluído') || 
                           statusName.includes('finalizado') ||
                           statusName.includes('finalização') ||
                           statusName === 'produção' ||
                           statusName.includes('em produção') ||
                           statusName.includes('aguardando produção') ||
                           statusName.includes('aguardando validação') ||
                           statusName.includes('validação');
            
            const isRemoved = !isInCurrentSprint || statusName.includes('cancel') || statusName.includes('removido');
            const isFuraFila = f.summary.toLowerCase().includes('fura-fila') || f.summary.toLowerCase().includes('fura fila');

            return {
                id: issue.key,
                title: f.summary,
                dev: f.assignee ? f.assignee.displayName.split(' ')[0].toUpperCase().substring(0, 3) : 'UNASSIGNED',
                pts: f.customfield_10030 || 0,
                status: isRemoved ? 'removed' : (isDone ? 'done' : 'escaped'),
                epic: epicNames[f.customfield_10014] || 'Sem Épico',
                type: isFuraFila ? 'fura-fila' : 'planned'
            };
        });

        // 4. Parse Goal and Swat
        const goalRaw = sprintMetadata.goal || '';
        const goalParts = goalRaw.split('\n');
        const goal = goalParts[0].replace('Objetivo:', '').replace('🎯', '').trim();
        const swatRaw = goalParts.find(p => p.toLowerCase().includes('swat')) || '';
        const swat = swatRaw.includes(':') ? swatRaw.split(':')[1].split(',').map(s => s.trim().toUpperCase().substring(0, 3)) : [];

        const newSprint = {
            id: sprintMetadata.name.includes('|') ? sprintMetadata.name.split('|').pop().trim() : sprintMetadata.name,
            goal: goal || 'Sem objetivo definido',
            period: sprintMetadata.startDate ? `${new Date(sprintMetadata.startDate).toLocaleDateString('pt-BR')} - ${new Date(sprintMetadata.endDate).toLocaleDateString('pt-BR')}` : 'Período não definido',
            swat: swat,
            tickets: tickets
        };

        // 5. Merge Custom Data (Manual Removed Tickets + Comments)
        if (fs.existsSync(customSprintsFile)) {
            try {
                delete require.cache[require.resolve(customSprintsFile)]; // Force read latest
                const customData = require(customSprintsFile);
                const customForSprint = customData[newSprint.id] || [];
                
                // Aplicar overrides manuais nos tickets que vieram do Jira
                newSprint.tickets.forEach(t => {
                    const ct = customForSprint.find(ct => ct.id === t.id);
                    if (!ct) return;
                    if (ct.status) t.status = ct.status;
                    if (ct.comment) t.comment = ct.comment;
                });

                // Adicionar tickets que estão no custom mas NÃO vieram do Jira (ex: removidos manuais)
                const existingIds = new Set(newSprint.tickets.map(t => t.id));
                for (const ct of customForSprint) {
                    if (!existingIds.has(ct.id)) {
                        newSprint.tickets.push(ct);
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Aviso: Falha ao mesclar sprints-custom.js - ${e.message}`);
            }
        }

        // 6. Update sprints-jira.js
        let currentData = [];
        if (fs.existsSync(jiraSprintsFile)) {
            const content = fs.readFileSync(jiraSprintsFile, 'utf8');
            try { currentData = parseSprintDataScript(content); } catch(e) { currentData = []; }
        }

        currentData = currentData.filter(s => s.id !== newSprint.id);
        currentData.push(newSprint);
        currentData.sort((a, b) => a.id.localeCompare(b.id));

        fs.writeFileSync(jiraSprintsFile, `const MOMENTUM_SPRINTS_DATA = ${JSON.stringify(currentData, null, 4)};`, 'utf8');
        console.log(`✅ Sprint ${newSprint.id} sincronizada!`);
        return newSprint;

    } catch (error) {
        console.error(`❌ Erro no Sync da Sprint:`, error.message);
        throw error;
    }
}

module.exports = { syncSprint, fetchJira };
