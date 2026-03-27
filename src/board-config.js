const path = require('path');

const DEFAULT_BOARD_ID = 1306;
const DEFAULT_BOARD_ALIAS = 'raffa';

function normalizeBoardAlias(alias) {
    return (alias || DEFAULT_BOARD_ALIAS).trim().toLowerCase();
}

function getBoardId() {
    const rawBoardId = process.env.BOARD;
    const boardId = Number.parseInt(rawBoardId, 10);
    return Number.isInteger(boardId) ? boardId : DEFAULT_BOARD_ID;
}

function getBoardAlias() {
    return normalizeBoardAlias(process.env.BOARD_ALIAS);
}

function getSprintDataDir(baseDir = __dirname) {
    return path.join(baseDir, `sprint-data-${getBoardAlias()}`);
}

function getJiraSprintsFile(baseDir = __dirname) {
    return path.join(getSprintDataDir(baseDir), 'sprints-jira.js');
}

function getCustomSprintsFile(baseDir = __dirname) {
    return path.join(getSprintDataDir(baseDir), 'sprints-custom.js');
}

function getReportsDir(baseDir = __dirname) {
    return path.join(getSprintDataDir(baseDir), 'reports');
}

module.exports = {
    getBoardAlias,
    getBoardId,
    getCustomSprintsFile,
    getJiraSprintsFile,
    getReportsDir,
    getSprintDataDir
};
