const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const https = require('https');

const JIRA_HOST = 'c4br.atlassian.net';
const JIRA_USER = process.env.JIRA_USER;
const JIRA_TOKEN = process.env.JIRA_API_KEY;
const TICKET_ID = 'DEAT-11580';

const auth = Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64');
const headers = { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' };

https.get(`https://${JIRA_HOST}/rest/api/3/issue/${TICKET_ID}`, { headers }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const ticket = JSON.parse(data);
            console.log(`--- CAMPOS COM VALOR EM ${TICKET_ID} ---`);
            for (const key in ticket.fields) {
                const val = ticket.fields[key];
                if (val !== null && val !== undefined) {
                    // Se for objeto, mostra o nome ou valor
                    const display = typeof val === 'object' ? (val.name || val.value || JSON.stringify(val).substring(0, 50)) : val;
                    console.log(`${key}: ${display}`);
                }
            }
        } else {
            console.error(`❌ Erro: ${res.statusCode}`);
        }
    });
});
