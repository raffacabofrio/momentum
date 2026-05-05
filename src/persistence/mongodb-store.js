const { MongoClient } = require('mongodb');

const DATABASE_NAME = 'momentum';
const COLLECTIONS = {
    teams: 'teams',
    jiraSprints: 'sprints-jira',
    customSprints: 'sprints-custom'
};

function createMongoDbStore() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI não configurada para PERSISTENCE_TYPE=mongodb.');
    }

    const client = new MongoClient(mongoUri);
    let dbPromise;

    async function getDb() {
        if (!dbPromise) {
            dbPromise = client.connect().then(() => client.db(DATABASE_NAME));
        }
        return dbPromise;
    }

    async function ensureIndexes() {
        const db = await getDb();
        await Promise.all([
            db.collection(COLLECTIONS.teams).createIndex({ key: 1 }, { unique: true }),
            db.collection(COLLECTIONS.jiraSprints).createIndex({ teamKey: 1, sprintId: 1 }, { unique: true }),
            db.collection(COLLECTIONS.customSprints).createIndex({ teamKey: 1, sprintId: 1 }, { unique: true })
        ]);
    }

    function normalizeSprintDocument(context, sprint) {
        const now = new Date();
        return {
            teamKey: context.teamKey,
            sprintId: sprint.id,
            jiraSprintId: sprint.jiraSprintId || null,
            goal: sprint.goal || '',
            period: sprint.period || '',
            swat: Array.isArray(sprint.swat) ? sprint.swat : [],
            tickets: Array.isArray(sprint.tickets) ? sprint.tickets : [],
            source: sprint.source || 'momentum',
            updatedAt: now
        };
    }

    function toSprintPayload(document) {
        return {
            id: document.sprintId,
            goal: document.goal,
            period: document.period,
            swat: document.swat || [],
            tickets: document.tickets || []
        };
    }

    return {
        type: 'mongodb',

        async init() {
            await ensureIndexes();
        },

        async close() {
            await client.close();
        },

        async loadSprints(context) {
            const db = await getDb();
            const documents = await db.collection(COLLECTIONS.jiraSprints)
                .find({ teamKey: context.teamKey })
                .sort({ sprintId: 1 })
                .toArray();
            return documents.map(toSprintPayload);
        },

        async saveSprints(context, sprints) {
            const db = await getDb();
            const collection = db.collection(COLLECTIONS.jiraSprints);
            const now = new Date();

            for (const sprint of sprints) {
                const document = normalizeSprintDocument(context, sprint);
                await collection.updateOne(
                    { teamKey: context.teamKey, sprintId: sprint.id },
                    {
                        $set: document,
                        $setOnInsert: { createdAt: now }
                    },
                    { upsert: true }
                );
            }
        },

        async loadCustomSprints(context) {
            const db = await getDb();
            const documents = await db.collection(COLLECTIONS.customSprints)
                .find({ teamKey: context.teamKey })
                .toArray();

            return documents.reduce((acc, document) => {
                acc[document.sprintId] = document.tickets || [];
                return acc;
            }, {});
        },

        async saveCustomSprints(context, customSprints) {
            const db = await getDb();
            const collection = db.collection(COLLECTIONS.customSprints);
            const now = new Date();

            for (const [sprintId, tickets] of Object.entries(customSprints || {})) {
                await collection.updateOne(
                    { teamKey: context.teamKey, sprintId },
                    {
                        $set: {
                            teamKey: context.teamKey,
                            sprintId,
                            tickets: Array.isArray(tickets) ? tickets : [],
                            source: 'momentum',
                            updatedAt: now
                        },
                        $setOnInsert: { createdAt: now }
                    },
                    { upsert: true }
                );
            }
        },

        async listTeams(teamOptions) {
            const db = await getDb();
            const configuredTeams = await db.collection(COLLECTIONS.teams)
                .find({ active: { $ne: false } })
                .sort({ order: 1, label: 1 })
                .toArray();

            if (configuredTeams.length === 0) {
                return teamOptions;
            }

            return configuredTeams.map(team => ({
                key: team.key,
                label: team.label,
                boardAlias: team.boardAlias,
                boardId: team.boardId || null
            }));
        },

        async upsertTeam(team) {
            const db = await getDb();
            const now = new Date();
            await db.collection(COLLECTIONS.teams).updateOne(
                { key: team.key },
                {
                    $set: {
                        ...team,
                        active: team.active !== false,
                        updatedAt: now
                    },
                    $setOnInsert: { createdAt: now }
                },
                { upsert: true }
            );
            return team;
        }
    };
}

module.exports = {
    COLLECTIONS,
    DATABASE_NAME,
    createMongoDbStore
};
