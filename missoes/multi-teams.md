# 🚀 Missão: Momentum Multi-Teams

**Objetivo:** Transformar o Momentum de uma ferramenta interna em uma plataforma (SaaS/Self-hosted) capaz de atender múltiplos Tech Leads e times simultaneamente.

---

## 🏗️ Pilares da Arquitetura

### 1. Persistência com MongoDB
- **Por quê?** Sair de arquivos estáticos `.js` para permitir concorrência, histórico massivo e multi-tenancy.
- **Estrutura:** 
    - `Teams`: Configurações específicas de cada squad (Jira, Devs, Cores).
    - `Sprints`: Snapshots de tickets vindos do Jira.
    - `Overrides`: A Camada de Soberania (comentários e status manuais) que faz o merge com os dados do Jira.

### 2. Desacoplamento de Domínio (Momentum OS)
- **Configuração Externa:** Criar um schema de configuração para mapear campos customizados do Jira (Story Points, Epics) sem precisar editar o código.
- **Status Mapping:** Permitir que cada Tech Lead defina o seu próprio fluxo de "Done" e "Escapou".

### 3. Camada de Soberania Digital
- **API de Overrides:** Criar endpoints para salvar comentários e mudanças de status diretamente pela UI, eliminando a necessidade de planilhas Excel externas.
- **Histórico de Impedimentos:** Centralizar os "porquês" das escapadas para gerar relatórios de blockers (VTEX, França, Zubale, etc.).

### 4. Gestão de Acesso e Segurança (RBAC)
- **Integração SSO/Jira OAuth:** Utilizar o login do Jira (Atlassian) para autenticação.
- **Níveis de Acesso:**
    - **Tech Lead:** Visão total e edição da Soberania da sua squad.
    - **Gerência (Daniel Pinna):** Visão agregada da tribo/projeto, com leitura em todos os times.
    - **Stakeholders:** Acesso restrito apenas a visualizações de métricas de entrega.
- **Segurança de Dados:** Implementar filtragem por `teamId` no nível da API para garantir isolamento total entre diferentes times no MongoDB.

---

## 🗺️ Roadmap de Execução

### Fase 1: Fundação NoSQL
- [ ] Configurar Docker com MongoDB.
- [ ] Criar Models (Mongoose) para Teams, Sprints e Overrides.
- [ ] Refatorar `sync.js` para realizar `upsert` no Banco de Dados.

### Fase 2: API & Multi-tenancy
- [ ] Criar rotas de API (Express) para servir os dados ao Frontend.
- [ ] Implementar o Merge de dados: `Jira Snapshot + Manual Overrides`.
- [ ] Adicionar suporte a `teamId` em todas as consultas.

### Fase 3: UI de Configuração
- [ ] Criar tela de Setup para novos Tech Leads.
- [ ] Implementar Editor de Comentários em tempo real no Dashboard.

---

## 🎯 Critérios de Sucesso
- Conseguir subir uma nova instância para um Tech Lead diferente em menos de 5 minutos.
- O Dashboard carregar os dados vindo 100% da API do MongoDB.
- Manter 100% do histórico de blindagem (comentários) salvo no banco.
