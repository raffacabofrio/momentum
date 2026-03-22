const fs = require('fs');
const path = require('path');

const jiraPath = path.join(__dirname, 'sprints-jira.js');
let content = fs.readFileSync(jiraPath, 'utf8');

const prefix = 'const MOMENTUM_SPRINTS_DATA = ';
let jsonStr = content.replace(prefix, '').trim();
if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);

try {
    const data = JSON.parse(jsonStr);
    const sp03 = data.find(s => s.id === 'SP03');
    
    if (sp03) {
        let count = 0;
        sp03.tickets.forEach(t => {
            if (t.id === 'DEAT-11443' || t.id === 'DEAT-10197') {
                t.status = 'done';
                count++;
            }
        });
        
        const newContent = `${prefix}${JSON.stringify(data, null, 4)};`;
        fs.writeFileSync(jiraPath, newContent);
        console.log(`✅ [SP03] ${count} tickets promovidos para 'done' (Soberania da Planilha)!`);
    } else {
        console.error("❌ Sprint SP03 não encontrada.");
    }
} catch (e) {
    console.error("❌ Erro ao processar JSON:", e.message);
}
