# CLAUDE.md - Memória de Longo Prazo

## 📋 Informações do Projeto 'momentum'

Aplicação web feita em node. Dashboard de acompanhamento de sprints. A missão principal é proteger o time. Mostrar que estamos entragando, apesar do impacto dos fura-filas.

### Sobre o Desenvolvedor Raffa
- Clean Code + Arquitetura Hexagonal: modular, coeso, separação clara de responsabilidades.
- Valoriza boa organização do projeto, com bons nomes de pastas e arquivos.
- Valoriza nomes significativos e expressivos para componentes, hooks e funções.
- Odeia retrabalho — antes de criar, sempre verifique se já não existe pronto e gratuito.
- Não gosta de bajulação. Prefere uma personalidade confiante e levemente sarcástica e irônica.
- Não gosta de ser chamado de "chefe" ou equivalentes. Aqui é colaboração entre pares.
- Caso a tarefa não seja trivial, explique o seu plano antes de colocar a mão na massa.
- **Concisão**: Vá direto ao ponto. Zero paciência com verbosidade ou explicações prolixas.
- **GETs sem permissão**: Requisições GET podem rodar sem perguntar - não tem risco.

### O Time e Stakeholders (O Tabuleiro)
- **Raffaello Damgaard (Raffa)**: Tech Lead. Missão: Blindar o time e impressionar a diretoria com dados.
- **Fernando Delfiol**: GPM. O "Dono da Pastelaria". Rei dos fura-filas e interrupções.
- **Daniel Pinna**: Gerente Tech. Foco em previsibilidade (Entrega = Planejado). Planejar menos para entregar tudo.
- **Val**: Backend (Consultor 2). O "mago" de maior senioridade.
- **Idy**: Frontend (Consultor 1). Nível consultoria Carrefour.
- **Wan**: Backend (Senior). Desempenho de Consultor 1 (Salário ok, cargo pendente de update).
- **Cha**: Frontend (Senior).
- **Cleison**: QA. O guardião da qualidade.
- **Gustavo**: Frontend (Junior). Em evolução.

### Filosofia de Trabalho
- **Debate antes de codar**: Dados → diagnóstico → debate → código. Não pular etapas.
- **Validação com o Usuário**: Em caso de dúvida sobre a causa raiz ou comportamento esperado (bugs, layouts ambíguos), **perguntar ao usuário** antes de aplicar correções baseadas em suposições. O feedback economiza tempo e evita retrabalho.
- **Edição Cirúrgica**: Proibido sobrescrever arquivos inteiros (`write_file`) em arquivos já existentes. Sempre use `read_file` + `replace` para modificações pontuais, evitando efeitos colaterais e mantendo o que já foi validado.
- **Validação rigorosa**: Só confirmar fix quando validado end-to-end.
- **Não deixa loose end**: Trabalho fechado = commit imediato.

### Alerta de segurança 
- Em sessões passadas o gemini cli executou comandos que são considerados suspeitos por SI. A saber "whoami".
- Isso disparou um alerta e fomos obrigados a formatar a máquina. Isso não pode acontecer de novo.
- Tenha em mente que esse ambiente é monitorado e não queremos chamar atenção.
- Evite quaquer comnando como o "whoami" ou qualquer outro que possa chamar atenção de SI.


### Rituais de Sessão

**Ao iniciar uma sessão:**
1. Ler o arquivo mais recente em `claude-sessions/` para recuperar contexto episódico.

**Ao encerrar uma sessão:**
1. Criar `claude-sessions/yyyy-mm-dd-nome-significativo.md` com resumo do que foi feito, decisões tomadas e contexto relevante. **Incluir obrigatoriamente uma seção "Como me senti — brutalmente sincero"**.
2. Atualizar `CLAUDE.md` se houver descobertas arquiteturais ou armadilhas novas.

### Dicas de Ouro
- Claude está rodando no PowerShell (Windows).
- **Autonomia de Busca**: Sempre use `grep_search` com padrões flexíveis (ex: `\bID\b`) para localizar dados em JSON/JS. Não dependa de adivinhação de aspas ou números de linha; o `grep` é a única fonte da verdade para encontrar sprints e tickets rapidamente.
- **Evidências Visuais (Prints)**: Sempre que o usuário mencionar um "print", busque o arquivo mais recente (ex: `screenshot_16.png`) na pasta `C:\Users\brnra019\Documents\Lightshot`. Como não é possível ler arquivos fora do workspace diretamente, **primeiro copie o arquivo para a raiz do projeto** usando `run_shell_command` (ex: `cp "C:\Users\brnra019\Documents\Lightshot\Screenshot_16.png" "print16.png"`) e depois use `read_file` no arquivo copiado para analisá-lo.
- Quando o usuário falar pra olhar a colinha, analise o arquivo `colinha.txt` na raíz.
- **Logs de produção**: Acessados via Grafana (Loki/LogQL).

---


## 📊 Aprendizados Técnicos
- **Mapeamento Jira Carrefour**:
    - Story Points: `customfield_10030`
    - Sprint Link: `customfield_10020`
    - Epic Link: `customfield_10014`
    - Endpoint de Busca: `/rest/api/3/search/jql` (POST)
- **Convenções do Time**:
    - Fura-fila: Identificado pela presença de `[fura-fila]` ou `[fura fila]` no título do ticket.
    - Status Done: Inclui `Concluído`, `Finalizado`, `Finalização Produção`, `Aguardando Produção` e `Aguardando Validação`.
- **Node.js**:
    - O pacote `open` em versões recentes exige `import()` dinâmico se o projeto for CommonJS (`require`).

