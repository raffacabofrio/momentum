const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const https = require('https');

const JIRA_HOST = 'c4br.atlassian.net';
const JIRA_USER = process.env.JIRA_USER;
const JIRA_TOKEN = process.env.JIRA_API_KEY;

if (!JIRA_USER || !JIRA_TOKEN) {
    console.error('❌ Credenciais não encontradas no .env');
    process.exit(1);
}

const auth = Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64');
const headers = { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' };

console.log(`🔍 Tentando Auth para: ${JIRA_USER}...`);

https.get(`https://${JIRA_HOST}/rest/api/3/myself`, { headers }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const user = JSON.parse(data);
            console.log(`✅ Auth OK! Logado como: ${user.displayName} (${user.emailAddress})`);
        } else {
            console.error(`❌ Erro de Auth: ${res.statusCode}`);
            console.error(data);
        }
    });
}).on('error', err => console.error(`❌ Erro de Conexão: ${err.message}`));
