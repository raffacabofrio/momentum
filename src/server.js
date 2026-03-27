require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const { syncSprint, fetchJira } = require('./sync');
const {
    getBoardAlias,
    getBoardId,
    getCustomSprintsFile,
    getJiraSprintsFile,
    getReportsDir,
    getSprintDataDir
} = require('./board-config');

const app = express();
const PORT = 3000;
const BOARD_ID = getBoardId();
const BOARD_ALIAS = getBoardAlias();
const SPRINT_DATA_DIR = getSprintDataDir(__dirname);
const JIRA_SPRINTS_FILE = getJiraSprintsFile(__dirname);
const CUSTOM_SPRINTS_FILE = getCustomSprintsFile(__dirname);
const REPORTS_DIR = getReportsDir(__dirname);

app.use(express.json());
app.use(express.static(__dirname));

function parseSprintDataScript(content) {
    return JSON.parse(
        content
            .replace(/^const MOMENTUM_SPRINTS_DATA = /, '')
            .replace(/;\s*$/, '')
    );
}

function parseSprintDataFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return parseSprintDataScript(content);
}

function ensureCustomDataFile() {
    if (!fs.existsSync(CUSTOM_SPRINTS_FILE)) {
        fs.writeFileSync(CUSTOM_SPRINTS_FILE, 'module.exports = {};', 'utf8');
    }
}

app.get('/api/sprint-data.js', (req, res) => {
    try {
        const payload = fs.existsSync(JIRA_SPRINTS_FILE)
            ? fs.readFileSync(JIRA_SPRINTS_FILE, 'utf8')
            : 'const MOMENTUM_SPRINTS_DATA = [];';
        res.type('application/javascript').send(payload);
    } catch (error) {
        console.error('❌ Erro ao carregar dados da sprint:', error.message);
        res.status(500).type('application/javascript').send('const MOMENTUM_SPRINTS_DATA = [];');
    }
});

// Endpoint de Sync
app.post('/api/sync', async (req, res) => {
    console.log('🚀 Sync solicitado pelo Dashboard...');
    try {
        const sprintData = await fetchJira(`/rest/agile/1.0/board/${BOARD_ID}/sprint?state=active`);
        if (!sprintData.values || sprintData.values.length === 0) throw new Error('Nenhuma sprint ativa.');
        const activeSprint = sprintData.values[0];

        const result = await syncSprint(activeSprint);
        res.json({ success: true, sprint: result.id });
    } catch (error) {
        console.error('❌ Erro:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Endpoint de Update de Ticket (Persistência Manual)
app.post('/api/ticket/update', async (req, res) => {
    const { sprintId, ticketId, newStatus } = req.body;
    console.log(`📝 Update manual: Ticket ${ticketId} na Sprint ${sprintId} para ${newStatus}`);
    
    try {
        const data = parseSprintDataFile(JIRA_SPRINTS_FILE);
        
        const sprint = data.find(s => s.id === sprintId);
        if (!sprint) return res.status(404).json({ success: false, error: 'Sprint não encontrada' });
        
        const ticket = sprint.tickets.find(t => t.id === ticketId);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket não encontrado' });
        
        ticket.status = newStatus;
        
        // Salvar de volta formatado
        const newContent = `const MOMENTUM_SPRINTS_DATA = ${JSON.stringify(data, null, 4)};`;
        fs.writeFileSync(JIRA_SPRINTS_FILE, newContent, 'utf8');
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Erro no update manual:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de Comentário (Persistência Dupla)
app.post('/api/ticket/comment', async (req, res) => {
    const { sprintId, ticketId, comment } = req.body;
    console.log(`💬 Comentário: Ticket ${ticketId} -> "${comment}"`);
    
    try {
        // 1. Atualizar sprints-jira.js (Lookup imediato)
        const jiraData = parseSprintDataFile(JIRA_SPRINTS_FILE);
        const jiraSprint = jiraData.find(s => s.id === sprintId);
        if (jiraSprint) {
            const ticket = jiraSprint.tickets.find(t => t.id === ticketId);
            if (ticket) ticket.comment = comment;
            fs.writeFileSync(JIRA_SPRINTS_FILE, `const MOMENTUM_SPRINTS_DATA = ${JSON.stringify(jiraData, null, 4)};`, 'utf8');
        }

        // 2. Atualizar sprints-custom.js (Bunker contra Sync)
        ensureCustomDataFile();
        delete require.cache[require.resolve(CUSTOM_SPRINTS_FILE)];
        let customData = require(CUSTOM_SPRINTS_FILE);
        if (!customData[sprintId]) customData[sprintId] = [];
        
        let customTicket = customData[sprintId].find(t => t.id === ticketId);
        if (customTicket) {
            customTicket.comment = comment;
        } else {
            // Se não existe no custom, pegamos o básico do Jira para guardar o comentário
            if (jiraSprint) {
                const jt = jiraSprint.tickets.find(t => t.id === ticketId);
                if (jt) customData[sprintId].push({ ...jt, comment });
            }
        }
        
        fs.writeFileSync(CUSTOM_SPRINTS_FILE, `module.exports = ${JSON.stringify(customData, null, 4)};`, 'utf8');
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Erro no comentário:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint: Check de Relatório (Habilita/Desabilita Botão)
app.get('/api/reports/check/:sprintId', (req, res) => {
    const { sprintId } = req.params;
    const reportPath = path.join(REPORTS_DIR, `RELATORIO-${sprintId}.pdf`);
    const exists = fs.existsSync(reportPath);
    console.log(`🔍 Check de Relatório: ${sprintId} -> ${exists ? 'Encontrado' : 'Ausente'}`);
    res.json({ exists });
});

// Endpoint: Download/Visualização do Relatório
app.get('/api/reports/:sprintId', (req, res) => {
    const { sprintId } = req.params;
    const reportPath = path.join(REPORTS_DIR, `RELATORIO-${sprintId}.pdf`);
    
    if (fs.existsSync(reportPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(reportPath);
    } else {
        res.status(404).send('Relatório não encontrado.');
    }
});

app.listen(PORT, async () => {
    console.log(`\n✅ Momentum Dashboard rodando em: http://localhost:${PORT}`);
    console.log(`🗂️ Board ativo: ${BOARD_ID} (${BOARD_ALIAS})`);
    console.log(`📁 Diretório de dados: ${path.relative(__dirname, SPRINT_DATA_DIR)}`);
    console.log(`🚀 Servidor pronto e aguardando...`);
});
