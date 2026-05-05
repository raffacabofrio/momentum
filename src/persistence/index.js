const { createFilesystemStore } = require('./filesystem-store');
const { createMongoDbStore } = require('./mongodb-store');

function getPersistenceType() {
    return (process.env.PERSISTENCE_TYPE || 'filesystem').trim().toLowerCase();
}

function createPersistenceStore() {
    const persistenceType = getPersistenceType();

    if (persistenceType === 'mongodb') {
        return createMongoDbStore();
    }

    if (persistenceType === 'filesystem') {
        return createFilesystemStore();
    }

    throw new Error(`PERSISTENCE_TYPE inválido: ${persistenceType}`);
}

module.exports = {
    createPersistenceStore,
    getPersistenceType
};
