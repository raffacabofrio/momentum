const fs = require('fs');
const path = require('path');

const commentsSP04 = {
    "DEAT-11592": "Bloqueio VTEX: configuração de pedido mínimo. Chamado aberto.",
    "DEAT-11695": "Bloqueio VTEX: quantidade de produtos por loja. Pendência em algumas lojas. Chamado aberto.",
    "DEAT-11633": "Esforço real: 13 pontos (muito acima do planejado).",
    "DEAT-10562": "Dificuldades com testes do dev. Avançou com code review aprovado.",
    "DEAT-7467": "Bloqueio Zubale: atraso na entrega da parte deles. Caminho feliz OK, aguardando QA.",
    "DEAT-11129": "Despriorizado devido a fura-filas. (Confirmar com Fernando)",
    "DEAT-11847": "Adiantamento de escopo futuro. Não era esperado entregar agora, mas avançamos bem.",
    "DEAT-11882": "Não entregue devido a fura-filas prioritários de OMS.",
    "DEAT-11809": "Despriorizado (60% pronto) para focar no fura-fila do Meta Ads.",
    "DEAT-11520": "Dependência França: integração com OMS ainda não funcional (estamos em 90%).",
    "DEAT-5833": "Despriorizado devido a fura-filas.",
    "DEAT-4797": "Quase pronto. Aguardando finalização do desenho de arquitetura."
};

const statusOverrides = {
    "DEAT-11933": "escaped",
    "DEAT-11888": "escaped"
};

const jiraPath = path.join(__dirname, 'sprints-jira.js');
const customPath = path.join(__dirname, 'sprints-custom.js');

function updateFile(filePath, sprintId, commentsMap, overrides, isJiraFile = true) {
    let content = fs.readFileSync(filePath, 'utf8');
    let data;
    let prefix = '';
    let suffix = ';';

    if (isJiraFile) {
        prefix = 'const MOMENTUM_SPRINTS_DATA = ';
        let jsonStr = content.replace(prefix, '').trim();
        if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
        data = JSON.parse(jsonStr);
        
        const sprint = data.find(s => s.id === sprintId);
        if (sprint) {
            sprint.tickets.forEach(t => {
                if (commentsMap[t.id]) t.comment = commentsMap[t.id];
                if (overrides[t.id]) t.status = overrides[t.id];
            });
        }
    } else {
        delete require.cache[require.resolve(filePath)];
        data = require(filePath);
        if (data[sprintId]) {
            data[sprintId].forEach(t => {
                if (commentsMap[t.id]) t.comment = commentsMap[t.id];
                if (overrides[t.id]) t.status = overrides[t.id];
            });
        } else {
            // Se a SP04 não existir no custom, vamos criar a entrada
            data[sprintId] = Object.keys(overrides).map(id => ({
                id,
                status: overrides[id],
                comment: commentsMap[id] || "Atualizado via soberania da planilha."
            }));
        }
        prefix = 'module.exports = ';
    }

    const newContent = `${prefix}${JSON.stringify(data, null, 4)}${suffix}`;
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ SP04 atualizada em ${path.basename(filePath)}!`);
}

try {
    updateFile(jiraPath, 'SP04', commentsSP04, statusOverrides, true);
    updateFile(customPath, 'SP04', commentsSP04, statusOverrides, false);
} catch (e) {
    console.error("❌ Erro:", e.message);
}
