require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const { syncSprint, fetchJira } = require('./sync');
const { createPersistenceStore, getPersistenceType } = require('./persistence');
const {
    getBoardAlias,
    getBoardId,
    getDemoBoardAlias,
    getDemoBoardId,
    getCustomSprintsFile,
    getJiraSprintsFile,
    getJiraBrowseBaseUrl,
    getReportsDir,
    getSprintDataDir,
    getTeamConfig,
    getTeamOptions,
    isDemoMode
} = require('./board-config');

const app = express();
const PORT = 3001;
const DEMO_MODE = isDemoMode(__dirname);
const BOARD_ID = DEMO_MODE ? getDemoBoardId() : getBoardId();
const BOARD_ALIAS = DEMO_MODE ? getDemoBoardAlias() : getBoardAlias();
const SPRINT_DATA_DIR = DEMO_MODE ? path.join(__dirname, 'sprint-data-demo') : getSprintDataDir(__dirname);
const JIRA_SPRINTS_FILE = path.join(SPRINT_DATA_DIR, 'sprints-jira.js');
const CUSTOM_SPRINTS_FILE = DEMO_MODE
    ? path.join(SPRINT_DATA_DIR, 'sprints-custom.js')
    : getCustomSprintsFile(__dirname);
const REPORTS_DIR = DEMO_MODE ? path.join(SPRINT_DATA_DIR, 'reports') : getReportsDir(__dirname);
const JIRA_BROWSE_BASE_URL = DEMO_MODE ? '' : getJiraBrowseBaseUrl();
const persistenceStore = createPersistenceStore();
const PERSISTENCE_TYPE = getPersistenceType();

app.use(express.json());
app.use(express.static(__dirname));

app.get('/healthz', (req, res) => {
    res.json({
        status: 'ok',
        persistenceType: PERSISTENCE_TYPE
    });
});

function resolveRequestContext(teamKey) {
    if (DEMO_MODE) {
        const sprintDataDir = path.join(__dirname, 'sprint-data-demo');
        return {
            mode: 'demo',
            teamKey: 'demo',
            teamLabel: 'Demo',
            boardId: String(getDemoBoardId()),
            boardAlias: getDemoBoardAlias(),
            sprintDataDir,
            jiraSprintsFile: path.join(sprintDataDir, 'sprints-jira.js'),
            customSprintsFile: path.join(sprintDataDir, 'sprints-custom.js'),
            reportsDir: path.join(sprintDataDir, 'reports'),
            syncEnabled: false,
            manualEditingEnabled: true,
            banner: 'Modo Demo: configure o .env para conectar o Momentum ao board real do seu time.'
        };
    }

    if (PERSISTENCE_TYPE !== 'mongodb') {
        return {
            mode: 'live',
            teamKey: BOARD_ALIAS,
            teamLabel: BOARD_ALIAS.toUpperCase(),
            boardId: String(BOARD_ID),
            boardAlias: BOARD_ALIAS,
            sprintDataDir: SPRINT_DATA_DIR,
            jiraSprintsFile: JIRA_SPRINTS_FILE,
            customSprintsFile: CUSTOM_SPRINTS_FILE,
            reportsDir: REPORTS_DIR,
            syncEnabled: Boolean(BOARD_ID),
            manualEditingEnabled: true,
            banner: ''
        };
    }

    const team = getTeamConfig(teamKey);
    const sprintDataDir = getSprintDataDir(__dirname, team.boardAlias);
    return {
        mode: 'live',
        teamKey: team.key,
        teamLabel: team.label,
        boardId: team.boardId ? String(team.boardId) : '',
        boardAlias: team.boardAlias,
        sprintDataDir,
        jiraSprintsFile: path.join(sprintDataDir, 'sprints-jira.js'),
        customSprintsFile: path.join(sprintDataDir, 'sprints-custom.js'),
        reportsDir: path.join(sprintDataDir, 'reports'),
        syncEnabled: Boolean(team.boardId),
        manualEditingEnabled: true,
        banner: team.boardId ? '' : `Board do time ${team.label} ainda não configurado.`
    };
}

app.get('/api/sprint-data.js', async (req, res) => {
    try {
        const requestContext = resolveRequestContext(req.query.team);
        const sprints = await persistenceStore.loadSprints(requestContext);
        const teams = PERSISTENCE_TYPE === 'mongodb'
            ? await persistenceStore.listTeams(getTeamOptions())
            : [];
        const payload = `const MOMENTUM_SPRINTS_DATA = ${JSON.stringify(sprints, null, 4)};`;
        const contextScript = `\nconst MOMENTUM_CONTEXT = ${JSON.stringify({
            mode: requestContext.mode,
            teamKey: requestContext.teamKey,
            teamLabel: requestContext.teamLabel,
            teams: teams.map(team => ({ key: team.key, label: team.label })),
            boardAlias: requestContext.boardAlias,
            dataSource: DEMO_MODE ? 'demo' : 'jira',
            persistenceType: PERSISTENCE_TYPE,
            jiraBrowseBaseUrl: JIRA_BROWSE_BASE_URL,
            syncEnabled: requestContext.syncEnabled,
            manualEditingEnabled: requestContext.manualEditingEnabled,
            banner: requestContext.banner
        }, null, 4)};`;
        res.type('application/javascript').send(`${payload}\n${contextScript}`);
    } catch (error) {
        console.error('❌ Erro ao carregar dados da sprint:', error.message);
        res.status(500).type('application/javascript').send('const MOMENTUM_SPRINTS_DATA = [];\nconst MOMENTUM_CONTEXT = { mode: "error", syncEnabled: false, manualEditingEnabled: false };');
    }
});

// Endpoint de Sync
app.post('/api/sync', async (req, res) => {
    const requestContext = resolveRequestContext(req.query.team);
    console.log(`🚀 Sync solicitado pelo Dashboard (${requestContext.teamLabel})...`);
    if (DEMO_MODE) {
        return res.status(400).json({
            success: false,
            error: 'Modo Demo ativo. Configure o .env para habilitar o Sync Jira.'
        });
    }
    if (!requestContext.syncEnabled) {
        return res.status(400).json({
            success: false,
            error: requestContext.banner || 'Sync Jira não configurado para este time.'
        });
    }
    try {
        const sprintData = await fetchJira(`/rest/agile/1.0/board/${requestContext.boardId}/sprint?state=active`);
        if (!sprintData.values || sprintData.values.length === 0) throw new Error('Nenhuma sprint ativa.');
        const activeSprint = sprintData.values[0];

        const result = await syncSprint(activeSprint, {
            context: requestContext,
            store: persistenceStore,
            customSprintsFile: requestContext.customSprintsFile,
            jiraSprintsFile: requestContext.jiraSprintsFile
        });
        res.json({ success: true, sprint: result.id });
    } catch (error) {
        console.error('❌ Erro:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Endpoint de Update de Ticket (Persistência Manual)
app.post('/api/ticket/update', async (req, res) => {
    const { sprintId, ticketId, newStatus, teamKey } = req.body;
    const requestContext = resolveRequestContext(teamKey);
    console.log(`📝 Update manual: Ticket ${ticketId} na Sprint ${sprintId} para ${newStatus}`);
    
    try {
        const data = await persistenceStore.loadSprints(requestContext);
        
        const sprint = data.find(s => s.id === sprintId);
        if (!sprint) return res.status(404).json({ success: false, error: 'Sprint não encontrada' });
        
        const ticket = sprint.tickets.find(t => t.id === ticketId);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket não encontrado' });
        
        ticket.status = newStatus;

        await persistenceStore.saveSprints(requestContext, data);

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Erro no update manual:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de Comentário (Persistência Dupla)
app.post('/api/ticket/comment', async (req, res) => {
    if (DEMO_MODE) {
        return res.status(400).json({ success: false, error: 'Modo Demo nao permite comentarios persistidos.' });
    }
    const { sprintId, ticketId, comment, teamKey } = req.body;
    const requestContext = resolveRequestContext(teamKey);
    console.log(`💬 Comentário: Ticket ${ticketId} -> "${comment}"`);
    
    try {
        // 1. Atualizar snapshot para refletir imediatamente na UI
        const jiraData = await persistenceStore.loadSprints(requestContext);
        const jiraSprint = jiraData.find(s => s.id === sprintId);
        if (jiraSprint) {
            const ticket = jiraSprint.tickets.find(t => t.id === ticketId);
            if (ticket) ticket.comment = comment;
            await persistenceStore.saveSprints(requestContext, jiraData);
        }

        // 2. Atualizar custom (Bunker contra Sync)
        let customData = await persistenceStore.loadCustomSprints(requestContext);
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
        
        await persistenceStore.saveCustomSprints(requestContext, customData);
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Erro no comentário:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint: Check de Relatório (Habilita/Desabilita Botão)
app.get('/api/reports/check/:sprintId', (req, res) => {
    const { sprintId } = req.params;
    const requestContext = resolveRequestContext(req.query.team);
    const reportPath = path.join(requestContext.reportsDir, `RELATORIO-${sprintId}.pdf`);
    const exists = fs.existsSync(reportPath);
    console.log(`🔍 Check de Relatório: ${sprintId} -> ${exists ? 'Encontrado' : 'Ausente'}`);
    res.json({ exists });
});

// Endpoint: Download/Visualização do Relatório
app.get('/api/reports/:sprintId', (req, res) => {
    const { sprintId } = req.params;
    const requestContext = resolveRequestContext(req.query.team);
    const reportPath = path.join(requestContext.reportsDir, `RELATORIO-${sprintId}.pdf`);
    
    if (fs.existsSync(reportPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(reportPath);
    } else {
        res.status(404).send('Relatório não encontrado.');
    }
});

async function startServer() {
    if (typeof persistenceStore.init === 'function') {
        await persistenceStore.init();
    }

    app.listen(PORT, () => {
        console.log(`\n✅ Momentum Dashboard rodando em: http://localhost:${PORT}`);
        console.log(`💾 Persistência: ${PERSISTENCE_TYPE}`);
        if (PERSISTENCE_TYPE === 'mongodb') {
            console.log('🗄️ MongoDB: database momentum');
        } else {
            console.log(`🗂️ Board ativo: ${BOARD_ID} (${BOARD_ALIAS})`);
            console.log(`📁 Diretório de dados: ${path.relative(__dirname, SPRINT_DATA_DIR)}`);
        }
        if (DEMO_MODE) console.log('🧪 Modo Demo ativo: carregando dataset mockado.');
        console.log(`🚀 Servidor pronto e aguardando...`);
    });
}

startServer().catch(error => {
    console.error('❌ Falha ao iniciar servidor:', error.message);
    process.exit(1);
});
