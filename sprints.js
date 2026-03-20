const MOMENTUM_SPRINTS_DATA = [
    {
        id: "SP45",
        goal: "Estabilizar o ambiente de Checkout e iniciar o Dashboard",
        period: "01/03 - 14/03",
        swat: ["VAL", "WAN"],
        tickets: [
            { id: "DEAT-101", title: "Mockup HTML", dev: "WAN", pts: 1, status: "done", epic: "📊 Dashboard Momentum", type: "planned" },
            { id: "DEAT-102", title: "Integração API Jira", dev: "IDY", pts: 5, status: "done", epic: "📊 Dashboard Momentum", type: "planned" },
            { id: "DEAT-103", title: "Persistência de Dados", dev: "CHA", pts: 2, status: "removed", epic: "📊 Dashboard Momentum", type: "planned" },
            { id: "DEAT-104", title: "Ajuste de CSS", dev: "GUS", pts: 2, status: "done", epic: "📊 Dashboard Momentum", type: "fura-fila" },
            { id: "DEAT-105", title: "Bug de Produção", dev: "VAL", pts: 8, status: "done", epic: "🔥 Suporte", type: "fura-fila" }
        ]
    },
    {
        id: "SP46",
        goal: "Entrega do novo motor de PIX e Blindagem de comandos",
        period: "15/03 - 28/03",
        swat: ["VAL", "IDY"],
        tickets: [
            { id: "DEAT-201", title: "Integração PIX", dev: "VAL", pts: 2, status: "done", epic: "🚀 Redesign Checkout", type: "planned" },
            { id: "DEAT-202", title: "Novo Layout Mobile", dev: "IDY", pts: 5, status: "done", epic: "🚀 Redesign Checkout", type: "planned" },
            { id: "DEAT-203", title: "Refatoração de Checkout", dev: "VAL", pts: 8, status: "done", epic: "🚀 Redesign Checkout", type: "planned" },
            { id: "DEAT-204", title: "Captura de Cashback", dev: "WAN", pts: 3, status: "done", epic: "🚀 Redesign Checkout", type: "fura-fila" },
            { id: "DEAT-205", title: "Validação de Endereço", dev: "CHA", pts: 3, status: "escaped", epic: "🚀 Redesign Checkout", type: "planned" },
            { id: "DEAT-206", title: "Testes A/B Checkout", dev: "GUS", pts: 2, status: "escaped", epic: "🚀 Redesign Checkout", type: "planned" },
            { id: "DEAT-207", title: "Auditoria de Logs", dev: "VAL", pts: 2, status: "done", epic: "🛡️ Blindagem SI", type: "planned" },
            { id: "DEAT-208", title: "Refatoração de Comandos", dev: "WAN", pts: 10, status: "escaped", epic: "🛡️ Blindagem SI", type: "planned" }
        ]
    }
];
