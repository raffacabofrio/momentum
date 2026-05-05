const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { createFilesystemStore } = require('../persistence/filesystem-store');
const { createMongoDbStore } = require('../persistence/mongodb-store');
const { getSprintDataDir, getTeamOptions } = require('../board-config');

const APPLY_FLAG = '--apply';

function toImportContext(team) {
    const sprintDataDir = getSprintDataDir(path.join(__dirname, '..'), team.boardAlias);
    return {
        mode: 'live',
        teamKey: team.key,
        teamLabel: team.label,
        boardId: team.boardId ? String(team.boardId) : '',
        boardAlias: team.boardAlias,
        sprintDataDir,
        jiraSprintsFile: path.join(sprintDataDir, 'sprints-jira.js'),
        customSprintsFile: path.join(sprintDataDir, 'sprints-custom.js'),
        reportsDir: path.join(sprintDataDir, 'reports'),
        syncEnabled: Boolean(team.boardId),
        manualEditingEnabled: true,
        banner: team.boardId ? '' : `Board do time ${team.label} ainda não configurado.`
    };
}

function normalizeTeamDocument(team, index) {
    return {
        key: team.key,
        label: team.label,
        boardAlias: team.boardAlias,
        boardId: team.boardId || null,
        syncEnabled: Boolean(team.boardId),
        active: true,
        order: index + 1
    };
}

async function main() {
    const apply = process.argv.includes(APPLY_FLAG);
    const filesystemStore = createFilesystemStore();
    const mongoStore = createMongoDbStore();
    const teams = getTeamOptions();
    const summary = [];

    if (apply && typeof mongoStore.init === 'function') {
        await mongoStore.init();
    }

    for (const [index, team] of teams.entries()) {
        const context = toImportContext(team);
        const sprints = await filesystemStore.loadSprints(context);
        const customSprints = await filesystemStore.loadCustomSprints(context);
        const customSprintIds = Object.keys(customSprints);

        summary.push({
            team: team.label,
            teamKey: team.key,
            snapshots: sprints.length,
            customSprints: customSprintIds.length,
            customTickets: customSprintIds.reduce((total, sprintId) => total + (customSprints[sprintId] || []).length, 0)
        });

        if (!apply) {
            continue;
        }

        await mongoStore.upsertTeam(normalizeTeamDocument(team, index));
        await mongoStore.saveSprints(context, sprints);
        await mongoStore.saveCustomSprints(context, customSprints);
    }

    console.log(JSON.stringify({
        mode: apply ? 'apply' : 'dry-run',
        database: 'momentum',
        summary
    }, null, 2));

    if (typeof mongoStore.close === 'function') {
        await mongoStore.close();
    }
}

main().catch(error => {
    console.error(JSON.stringify({ error: error.message }, null, 2));
    process.exit(1);
});
