const fs = require('fs');
const path = require('path');

const comments = {
    "DEAT-11401": "foi 5 pontos.",
    "DEAT-11353": "foi 5 pontos.",
    "DEAT-11443": "É um card fura-fila. Não deu tempo.",
    "DEAT-11318": "aguardando validação.",
    "DEAT-10453": "aguardando validação.",
    "DEAT-9885": "não deu tempo. Ajudou na ativação de lojas que deu um pouco mais de trabalho. Além disso Wan só trabalhou uma semana nessa sprint.",
    "DEAT-10562": "Ficou focado em outras atividades fora da sprint.",
    "DEAT-9384": "Ficou focado em outras atividades fora da sprint.",
    "DEAT-9786": "Talvez finaliza dentro da sprint.",
    "DEAT-9907": "Removido por conta de fura filas.",
    "DEAT-7467": "A integração não funcionou por conta de um problema do lado da zubale. Precisa desenhar novo fluxo do lado deles. Pinguei quase todo dia, mas ainda não tem estimativa.",
    "DEAT-11198": "Focou no P&P que foi mais dificil que o estimado e teve fura-filas.",
    "DEAT-11085": "Foi bastante complexo. Dependemos da França pra fechar. Perto de fechar. Fizemos tudo de infra do nosso lado."
};

const jiraPath = path.join(__dirname, 'sprints-jira.js');
let content = fs.readFileSync(jiraPath, 'utf8');

// Extrair o JSON da variável
let jsonStr = content.replace('const MOMENTUM_SPRINTS_DATA = ', '').replace(/;$/, '').trim();
if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);

try {
    const data = JSON.parse(jsonStr);
    const sp02 = data.find(s => s.id === 'SP02');
    
    if (sp02) {
        sp02.tickets.forEach(t => {
            if (comments[t.id]) {
                t.comment = comments[t.id];
            }
        });
        
        const newContent = `const MOMENTUM_SPRINTS_DATA = ${JSON.stringify(data, null, 4)};`;
        fs.writeFileSync(jiraPath, newContent);
        console.log("✅ Comentários da SP02 injetados com sucesso no Dashboard!");
    } else {
        console.error("❌ Sprint SP02 não encontrada no arquivo.");
    }
} catch (e) {
    console.error("❌ Erro ao processar JSON:", e.message);
}
