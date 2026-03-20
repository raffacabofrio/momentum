require('dotenv').config();
const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const { syncSprint, fetchJira } = require('./src/sync');

const app = express();
const PORT = 3000;
const BOARD_ID = 1306;

app.use(express.json());
app.use(express.static('src'));

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
app.listen(PORT, async () => {
    console.log(`\n✅ Momentum Dashboard rodando em: http://localhost:${PORT}`);
    console.log(`🚀 Servidor pronto e aguardando...`);
});
