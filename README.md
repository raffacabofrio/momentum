# Momentum

**Análise inteligente de sprints para Tech Leads.**

Momentum é um dashboard local para transformar sprint em narrativa de gestão.
Ele pega o que aconteceu no Jira e organiza a conversa que normalmente fica espalhada entre feeling, memória, review e justificativa de última hora.

Se a sua rotina envolve compromisso de sprint, entrega, escapados, fura-fila e defesa do time com dados, este projeto foi feito para você.

Visão rápida do produto em ação:

![Dashboard do Momentum - visão geral](docs/readme-assets/momentum-01.png)
![Dashboard do Momentum - épicos e execução](docs/readme-assets/momentum-02.png)
![Dashboard do Momentum - histórico e narrativa](docs/readme-assets/momentum-03.png)

## O que o Momentum entrega

- visão rápida da sprint atual e do histórico recente
- planejado vs entregue
- leitura por épico
- evolução dos devs ao longo das sprints
- itens escapados e removidos
- comentários manuais para preservar contexto que o Jira sozinho não conta
- suporte a múltiplos contextos de board por Tech Lead

## Para quem isso é bom

Momentum brilha em times que realmente operam com sprint.

Excelente fit:
- squads Scrum
- times com compromisso de sprint
- gestão que cobra previsibilidade, throughput e clareza de trade-off

Fit ruim:
- boards operacionais puros
- fluxos Kanban sem ritual de sprint
- times em que "planejado vs entregue" não é uma conversa relevante


## Como o dashboard pensa

O produto nasceu para responder perguntas como:

- O time entregou o que prometeu?
- O que escapou e por quê?
- Quem puxou mais pontos em cada sprint?
- Qual épico avançou de verdade?
- Houve fura-fila?
- A sprint atual está saudável ou caminhando para apertar no review?

## Setup rápido

### 1. Instale as dependências

```powershell
npm install
```

### 2. Configure o `.env`

Exemplo:

```env
BOARD=1111
BOARD_ALIAS=raffa
JIRA_USER=seu-email
JIRA_API_KEY=seu-token
PERSISTENCE_TYPE=filesystem
MONGO_URI=mongodb+srv://usuario:senha@cluster/momentum
```

Campos importantes:

- `BOARD`: ID do board no Jira
- `BOARD_ALIAS`: alias usado para resolver a pasta `src/sprint-data-<alias>`
- `PERSISTENCE_TYPE`: `filesystem` ou `mongodb`
- `MONGO_URI`: obrigatória quando `PERSISTENCE_TYPE=mongodb`

### 3. Suba o dashboard

```powershell
npm run dashboard
```

O app abre em `http://localhost:3001`.

## Persistência

O Momentum suporta duas fontes de dados:

- `filesystem`: usa os arquivos `src/sprint-data-*/sprints-jira.js` e `sprints-custom.js`
- `mongodb`: usa o database `momentum`, com as coleções `teams`, `sprints-jira` e `sprints-custom`

Para migrar os dados locais para MongoDB:

```powershell
npm run import:mongo:dry-run
npm run import:mongo
```

O importador é idempotente e usa upsert. Ele não apaga os arquivos locais.

## Fluxo recomendado para onboardar um novo Tech Lead

### 1. Valide o fit do board

Antes de qualquer adaptação, confirme se o board certo é realmente Scrum.

Se a API responder algo como `O quadro não aceita sprints`, pare e confirme o board com o Tech Lead. Já vimos na prática que o primeiro board compartilhado pode ser um board operacional, não o board real da squad.

### 2. Crie o contexto do novo lead

Monte a pasta:

```text
src/sprint-data-<alias>/
```

Com estes arquivos:

- `sprints-jira.js`
- `sprints-custom.js`
- `reports/`

Começo mínimo para o `sprints-custom.js`:

```js
module.exports = {};
```

### 3. Faça o primeiro sync

Com `.env` apontando para o novo board, rode o dashboard e sincronize a sprint ativa.

### 4. Carregue histórico com calma

Faça uma sprint por vez.

Esse projeto ficou muito mais seguro, mas a estratégia certa continua sendo incremental:

- sincronizar
- validar
- revisar visualmente
- seguir para a próxima

### 5. Trate escapados manualmente quando necessário

Sprint Report, Review e memória do Tech Lead ainda importam.

Quando o Jira não trouxer tudo que escapou, use `sprints-custom.js` para reintroduzir esses cards na sprint correta.

Playbook completo:

- mantido como documentação operacional interna do guardião em `.codex/`

## Comandos úteis

Subir dashboard:

```powershell
npm run dashboard
```

Validar sintaxe de arquivos críticos:

```powershell
node -c src\server.js
node -c src\sync.js
node -c src\app.js
```

## Visão de produto

Momentum não é só um dashboard bonito.

Ele serve para ajudar o Tech Lead a:

- fazer review com mais densidade
- preparar retrospectiva com menos achismo
- defender o time com fatos
- mostrar evolução sem depender de planilha paralela
- identificar padrões de escape e instabilidade

O objetivo é simples: deixar a conversa de sprint mais lúcida, mais justa e mais profissional.

teste
