const MOMENTUM_SPRINTS_DATA = [
    {
        id: 'SP01',
        goal: 'Validar o núcleo do Sharebook: cadastro, catálogo e primeira experiência de doação entre leitores.',
        period: '03/02/2026 - 14/02/2026',
        swat: ['RAF'],
        tickets: [
            { id: 'SB-101', title: 'Criar onboarding com a proposta do Sharebook', dev: 'RAF', pts: 3, status: 'done', epic: 'Primeira Experiência', type: 'planned' },
            { id: 'SB-102', title: 'Implementar cadastro básico de usuário', dev: 'WIL', pts: 5, status: 'done', epic: 'Contas e Perfil', type: 'planned' },
            { id: 'SB-103', title: 'Montar estrutura inicial do catálogo de livros', dev: 'WAL', pts: 5, status: 'done', epic: 'Catálogo Colaborativo', type: 'planned' },
            { id: 'SB-104', title: 'Criar card de livro com capa, autor e condição', dev: 'DAN', pts: 3, status: 'done', epic: 'Catálogo Colaborativo', type: 'planned' },
            { id: 'SB-105', title: 'Publicar manifesto de segurança para trocas', dev: 'RAF', pts: 2, status: 'done', epic: 'Confiança e Comunidade', type: 'planned' },
            { id: 'SB-106', title: 'Hotfix no login social após erro em produção', dev: 'WIL', pts: 2, status: 'done', epic: 'Contas e Perfil', type: 'fura-fila' },
            { id: 'SB-107', title: 'Primeira versão de favoritos de livros', dev: 'WAL', pts: 2, status: 'removed', epic: 'Primeira Experiência', type: 'planned', comment: 'Escopo trocado por estabilização do fluxo principal.' }
        ]
    },
    {
        id: 'SP02',
        goal: 'Fazer o usuário anunciar um livro e sinalizar interesse real em receber uma doação.',
        period: '17/02/2026 - 28/02/2026',
        swat: ['WIL'],
        tickets: [
            { id: 'SB-201', title: 'Criar formulário de anúncio de livro para doação', dev: 'RAF', pts: 5, status: 'done', epic: 'Catálogo Colaborativo', type: 'planned' },
            { id: 'SB-202', title: 'Subir upload de foto de capa', dev: 'WIL', pts: 3, status: 'done', epic: 'Catálogo Colaborativo', type: 'planned' },
            { id: 'SB-203', title: 'Criar CTA de interesse em receber livro', dev: 'WAL', pts: 5, status: 'done', epic: 'Matching e Interesse', type: 'planned' },
            { id: 'SB-204', title: 'Notificação de novo interessado no livro', dev: 'DAN', pts: 3, status: 'done', epic: 'Matching e Interesse', type: 'planned' },
            { id: 'SB-205', title: 'Filtro por cidade para livros disponíveis', dev: 'WAL', pts: 3, status: 'escaped', epic: 'Catálogo Colaborativo', type: 'planned', comment: 'Dependência de geolocalização escapou para a sprint seguinte.' },
            { id: 'SB-206', title: 'Ajuste urgente de LGPD no texto de cadastro', dev: 'RAF', pts: 2, status: 'done', epic: 'Contas e Perfil', type: 'fura-fila' }
        ]
    },
    {
        id: 'SP03',
        goal: 'Transformar interesse em combinação real: chat, confirmação e trilha de acompanhamento.',
        period: '03/03/2026 - 14/03/2026',
        swat: ['WAL'],
        tickets: [
            { id: 'SB-301', title: 'Abrir chat entre doador e leitor interessado', dev: 'RAF', pts: 5, status: 'done', epic: 'Matching e Interesse', type: 'planned' },
            { id: 'SB-302', title: 'Criar status de reserva do livro', dev: 'WIL', pts: 3, status: 'done', epic: 'Matching e Interesse', type: 'planned' },
            { id: 'SB-303', title: 'Linha do tempo da doação no app', dev: 'WAL', pts: 5, status: 'done', epic: 'Entrega da Experiência', type: 'planned' },
            { id: 'SB-304', title: 'Confirmação de retirada ou envio', dev: 'DAN', pts: 3, status: 'done', epic: 'Entrega da Experiência', type: 'planned' },
            { id: 'SB-305', title: 'Geolocalização por bairro e raio de distância', dev: 'WAL', pts: 5, status: 'escaped', epic: 'Catálogo Colaborativo', type: 'planned', comment: 'Complexidade de mapa ficou acima do previsto.' },
            { id: 'SB-306', title: 'Moderação urgente de anúncio denunciado', dev: 'DAN', pts: 2, status: 'done', epic: 'Confiança e Comunidade', type: 'fura-fila' },
            { id: 'SB-307', title: 'Correção rápida no badge de livro reservado', dev: 'WIL', pts: 1, status: 'done', epic: 'Matching e Interesse', type: 'fura-fila' }
        ]
    },
    {
        id: 'SP04',
        goal: 'Dar cara de produto: reputação, curadoria e um fluxo mais confiável de combinação.',
        period: '16/03/2026 - 27/03/2026',
        swat: ['DAN'],
        tickets: [
            { id: 'SB-401', title: 'Sistema de reputação por doações concluídas', dev: 'RAF', pts: 5, status: 'done', epic: 'Confiança e Comunidade', type: 'planned' },
            { id: 'SB-402', title: 'Curadoria de destaques na home', dev: 'WIL', pts: 3, status: 'done', epic: 'Primeira Experiência', type: 'planned' },
            { id: 'SB-403', title: 'Sugestões de leitura por categoria', dev: 'WAL', pts: 5, status: 'done', epic: 'Primeira Experiência', type: 'planned' },
            { id: 'SB-404', title: 'Regras de expiracao para reservas sem resposta', dev: 'DAN', pts: 5, status: 'done', epic: 'Matching e Interesse', type: 'planned' },
            { id: 'SB-405', title: 'Mural de impacto com livros doados', dev: 'RAF', pts: 3, status: 'done', epic: 'Confiança e Comunidade', type: 'planned' },
            { id: 'SB-406', title: 'Correção urgente em push de notificação', dev: 'WIL', pts: 2, status: 'done', epic: 'Entrega da Experiência', type: 'fura-fila' },
            { id: 'SB-407', title: 'Ajuste urgente em filtro de anúncios ofensivos', dev: 'DAN', pts: 2, status: 'done', epic: 'Confiança e Comunidade', type: 'fura-fila' }
        ]
    },
    {
        id: 'SP05',
        goal: 'Fechar o lançamento do Sharebook com estabilidade, polish e narrativa de produto pronta para ir ao ar.',
        period: '24/03/2026 - 31/03/2026',
        swat: ['RAF', 'WIL'],
        tickets: [
            { id: 'SB-501', title: 'Publicar landing de lançamento com manifesto do produto', dev: 'RAF', pts: 3, status: 'done', epic: 'Lançamento Sharebook', type: 'planned' },
            { id: 'SB-502', title: 'Checklist final de estabilidade para produção', dev: 'WIL', pts: 5, status: 'done', epic: 'Lançamento Sharebook', type: 'planned' },
            { id: 'SB-503', title: 'Ajuste fino no feed de livros recomendados', dev: 'WAL', pts: 3, status: 'escaped', epic: 'Primeira Experiência', type: 'planned', comment: 'Melhoria de UX conscientemente empurrada para pós-lançamento.' },
            { id: 'SB-504', title: 'Página pública com números de impacto do Sharebook', dev: 'DAN', pts: 5, status: 'done', epic: 'Lançamento Sharebook', type: 'planned' },
            { id: 'SB-505', title: 'Tela de sucesso após combinação concluída', dev: 'RAF', pts: 2, status: 'done', epic: 'Entrega da Experiência', type: 'planned' },
            { id: 'SB-506', title: 'Ajuste urgente em texto de notificação transacional', dev: 'WIL', pts: 1, status: 'done', epic: 'Lançamento Sharebook', type: 'fura-fila' },
            { id: 'SB-507', title: 'Moderação emergencial de novo tipo de spam', dev: 'DAN', pts: 2, status: 'done', epic: 'Confiança e Comunidade', type: 'fura-fila' }
        ]
    }
];
