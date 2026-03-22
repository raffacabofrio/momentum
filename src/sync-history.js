const { syncSprint } = require('./src/sync');

// IDs REAIS das sprints de 2026 do Board 1306
const HISTORICAL_SPRINTS = [
    13280, // 2026 | Q1 | SP01
    11274, // 2026 | Q1 | SP02
    14581, // 2026 | Q1 | SP03
    14582  // 2026 | Q1 | SP04
];

async function run() {
    console.log('⏳ Iniciando carga de histórico (SP01 a SP04) com IDs verificados...');
    
    for (const id of HISTORICAL_SPRINTS) {
        try {
            await syncSprint(id);
        } catch (e) {
            console.error(`⚠️ Falha na sprint ${id}:`, e.message);
        }
    }
    
    console.log('✨ Histórico carregado com sucesso!');
    console.log('🚀 Rode "npm run dashboard" para ver a evolução completa.');
}

run();
