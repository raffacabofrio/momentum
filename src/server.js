require('dotenv').config();
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const { syncSprint, fetchJira } = require('./sync');

const app = express();
const PORT = 3000;
const BOARD_ID = 1306;

app.use(express.json());
app.use(express.static(__dirname));

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
        const filePath = path.join(__dirname, 'sprints-jira.js');
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Extrair o JSON da variável global
        const jsonStr = content.replace('const MOMENTUM_SPRINTS_DATA = ', '').replace(';', '');
        const data = JSON.parse(jsonStr);
        
        const sprint = data.find(s => s.id === sprintId);
        if (!sprint) return res.status(404).json({ success: false, error: 'Sprint não encontrada' });
        
        const ticket = sprint.tickets.find(t => t.id === ticketId);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket não encontrado' });
        
        ticket.status = newStatus;
        
        // Salvar de volta formatado
        const newContent = `const MOMENTUM_SPRINTS_DATA = ${JSON.stringify(data, null, 4)};`;
        fs.writeFileSync(filePath, newContent, 'utf8');
        
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
        const jiraPath = path.join(__dirname, 'sprints-jira.js');
        let jiraContent = fs.readFileSync(jiraPath, 'utf8');
        const jiraData = JSON.parse(jiraContent.replace('const MOMENTUM_SPRINTS_DATA = ', '').replace(';', ''));
        const jiraSprint = jiraData.find(s => s.id === sprintId);
        if (jiraSprint) {
            const ticket = jiraSprint.tickets.find(t => t.id === ticketId);
            if (ticket) ticket.comment = comment;
            fs.writeFileSync(jiraPath, `const MOMENTUM_SPRINTS_DATA = ${JSON.stringify(jiraData, null, 4)};`, 'utf8');
        }

        // 2. Atualizar sprints-custom.js (Bunker contra Sync)
        const customPath = path.join(__dirname, 'sprints-custom.js');
        let customData = require(customPath);
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
        
        fs.writeFileSync(customPath, `module.exports = ${JSON.stringify(customData, null, 4)};`, 'utf8');
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Erro no comentário:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint: Check de Relatório (Habilita/Desabilita Botão)
app.get('/api/reports/check/:sprintId', (req, res) => {
    const { sprintId } = req.params;
    const reportPath = path.join(__dirname, 'reports', `RELATORIO-${sprintId}.pdf`);
    const exists = fs.existsSync(reportPath);
    console.log(`🔍 Check de Relatório: ${sprintId} -> ${exists ? 'Encontrado' : 'Ausente'}`);
    res.json({ exists });
});

// Endpoint: Download/Visualização do Relatório
app.get('/api/reports/:sprintId', (req, res) => {
    const { sprintId } = req.params;
    const reportPath = path.join(__dirname, 'reports', `RELATORIO-${sprintId}.pdf`);
    
    if (fs.existsSync(reportPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(reportPath);
    } else {
        res.status(404).send('Relatório não encontrado.');
    }
});

app.listen(PORT, async () => {
    console.log(`\n✅ Momentum Dashboard rodando em: http://localhost:${PORT}`);
    console.log(`🚀 Servidor pronto e aguardando...`);
});
