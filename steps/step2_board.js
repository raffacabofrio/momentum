const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const https = require('https');

const JIRA_HOST = 'c4br.atlassian.net';
const JIRA_USER = process.env.JIRA_USER;
const JIRA_TOKEN = process.env.JIRA_API_KEY;
const BOARD_ID = 1306;

const auth = Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64');
const headers = { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' };

https.get(`https://${JIRA_HOST}/rest/agile/1.0/board/${BOARD_ID}`, { headers }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const board = JSON.parse(data);
            console.log(`✅ Board OK! Nome: ${board.name} (Tipo: ${board.type})`);
        } else {
            console.error(`❌ Erro no Board: ${res.statusCode}`);
            console.error(data);
        }
    });
}).on('error', err => console.error(`❌ Erro de Conexão: ${err.message}`));
