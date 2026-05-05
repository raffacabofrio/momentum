const fs = require('fs');
const path = require('path');

function parseSprintDataScript(content) {
    return JSON.parse(
        content
            .replace(/^const MOMENTUM_SPRINTS_DATA = /, '')
            .replace(/;\s*$/, '')
    );
}

function loadModuleFresh(filePath, fallback) {
    if (!fs.existsSync(filePath)) {
        return fallback;
    }

    delete require.cache[require.resolve(filePath)];
    return require(filePath);
}

function ensureDirectory(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createFilesystemStore() {
    return {
        type: 'filesystem',

        async loadSprints(context) {
            if (!fs.existsSync(context.jiraSprintsFile)) {
                return [];
            }

            const content = fs.readFileSync(context.jiraSprintsFile, 'utf8');
            return parseSprintDataScript(content);
        },

        async saveSprints(context, sprints) {
            ensureDirectory(context.jiraSprintsFile);
            const content = `const MOMENTUM_SPRINTS_DATA = ${JSON.stringify(sprints, null, 4)};`;
            fs.writeFileSync(context.jiraSprintsFile, content, 'utf8');
        },

        async loadCustomSprints(context) {
            return loadModuleFresh(context.customSprintsFile, {});
        },

        async saveCustomSprints(context, customSprints) {
            ensureDirectory(context.customSprintsFile);
            const content = `module.exports = ${JSON.stringify(customSprints, null, 4)};`;
            fs.writeFileSync(context.customSprintsFile, content, 'utf8');
        },

        async listTeams(teamOptions) {
            return teamOptions;
        },

        async upsertTeam(team) {
            return team;
        }
    };
}

module.exports = {
    createFilesystemStore,
    parseSprintDataScript
};
