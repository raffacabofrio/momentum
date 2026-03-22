const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const https = require('https');

const JIRA_HOST = 'c4br.atlassian.net';
const JIRA_USER = process.env.JIRA_USER;
const JIRA_TOKEN = process.env.JIRA_API_KEY;
const SPRINT_ID = 13313;

const auth = Buffer.from(`${JIRA_USER}:${JIRA_TOKEN}`).toString('base64');

const postData = JSON.stringify({
    jql: `sprint=${SPRINT_ID}`,
    maxResults: 5,
    fields: ["summary", "status", "assignee", "customfield_10030", "customfield_10014"]
});

const options = {
    hostname: JIRA_HOST,
    path: '/rest/api/3/search/jql',
    method: 'POST',
    headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': postData.length
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const result = JSON.parse(data);
            console.log(`✅ Busca OK! Encontrados: ${result.total} tickets.`);
            if (result.issues && result.issues.length > 0) {
                const ticket = result.issues[0];
                console.log(`📌 Exemplo: ${ticket.key} - ${ticket.fields.summary}`);
                console.log(`🔢 Story Points (cf_10030): ${ticket.fields.customfield_10030}`);
                console.log(`👤 Assignee: ${ticket.fields.assignee ? ticket.fields.assignee.displayName : 'N/A'}`);
            }
        } else {
            console.error(`❌ Erro nos Tickets: ${res.statusCode}`);
            console.error(data);
        }
    });
});

req.on('error', err => console.error(`❌ Erro: ${err.message}`));
req.write(postData);
req.end();
