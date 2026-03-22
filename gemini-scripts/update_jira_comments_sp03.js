const fs = require('fs');
const path = require('path');

const commentsSP03 = {
    "DEAT-8247": "Na verdade foi 3 pontos porque o QA achou bugs.",
    "DEAT-9786": "Esforço foi maior que o planejado. Na verdade foram 5 pontos.",
    "DEAT-10562": "Saiu da sprint porque o Gus estava em recontratação (bloqueio administrativo).",
    "DEAT-9384": "Saiu da sprint porque o Gus estava em recontratação (bloqueio administrativo).",
    "DEAT-11431": "Não deu tempo porque catálogo foi mais difícil que esperado.",
    "DEAT-11464": "Removido da sprint. Entrou na sprint por engano e sem dono.",
    "DEAT-7467": "Dependemos da Zubale e ainda não entregaram a parte deles (bloqueio externo).",
    "DEAT-11443": "Realizado na raça! Esforço maior que o esperado (8 pontos na real).",
    "DEAT-11580": "Bloqueio VTEX. Dependemos da indexação deles. Chamado aberto.",
    "DEAT-9885": "Não entregue devido ao alto volume de fura-filas na sprint.",
    "DEAT-9841": "Não entregue devido ao alto volume de fura-filas na sprint.",
    "DEAT-11520": "Bloqueado pelo P&P. Esforço real foi de 8 pontos (complexidade alta).",
    "DEAT-11085": "Dependência do time da França (ajuste de fluxo). Esforço real de 8 pontos.",
    "DEAT-11487": "Problema técnico com a solução da VTEX (demora no suporte deles).",
    "DEAT-10197": "Entregue conforme planilha, embora Jira não tenha refletido o status final a tempo."
};

const jiraPath = path.join(__dirname, 'sprints-jira.js');
const customPath = path.join(__dirname, 'sprints-custom.js');

// Função para atualizar um arquivo JS que exporta MOMENTUM_SPRINTS_DATA ou module.exports
function updateFile(filePath, sprintId, commentsMap, isJiraFile = true) {
    let content = fs.readFileSync(filePath, 'utf8');
    let data;
    let prefix = '';
    let suffix = '';

    if (isJiraFile) {
        prefix = 'const MOMENTUM_SPRINTS_DATA = ';
        suffix = ';';
        let jsonStr = content.replace(prefix, '').trim();
        if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
        data = JSON.parse(jsonStr);
        
        const sprint = data.find(s => s.id === sprintId);
        if (sprint) {
            sprint.tickets.forEach(t => {
                if (commentsMap[t.id]) t.comment = commentsMap[t.id];
            });
        }
    } else {
        // Para o sprints-custom.js que usa module.exports
        delete require.cache[require.resolve(filePath)];
        data = require(filePath);
        if (data[sprintId]) {
            data[sprintId].forEach(t => {
                if (commentsMap[t.id]) t.comment = commentsMap[t.id];
            });
        }
        prefix = 'module.exports = ';
        suffix = ';';
    }

    const newContent = `${prefix}${JSON.stringify(data, null, 4)}${suffix}`;
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Comentários da ${sprintId} injetados em ${path.basename(filePath)}!`);
}

try {
    updateFile(jiraPath, 'SP03', commentsSP03, true);
    updateFile(customPath, 'SP03', commentsSP03, false);
} catch (e) {
    console.error("❌ Erro ao processar arquivos:", e.message);
}
