const fs = require('fs');
const path = require('path');

const DEFAULT_BOARD_ID = 1306;
const DEFAULT_BOARD_ALIAS = 'raffa';
const DEFAULT_JIRA_HOST = 'c4br.atlassian.net';
const DEMO_BOARD_ID = 'DEMO';
const DEMO_BOARD_ALIAS = 'demo';

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

function isDemoMode(baseDir = __dirname) {
    const hasBoardConfig = Boolean(process.env.BOARD || process.env.BOARD_ALIAS);
    return !hasBoardConfig;
}

function getDemoBoardId() {
    return DEMO_BOARD_ID;
}

function getDemoBoardAlias() {
    return DEMO_BOARD_ALIAS;
}

function getJiraHost() {
    return (process.env.JIRA_HOST || DEFAULT_JIRA_HOST).trim();
}

function getJiraBrowseBaseUrl() {
    const rawBaseUrl = (process.env.JIRA_BROWSE_BASE_URL || '').trim();
    if (rawBaseUrl) {
        return rawBaseUrl.replace(/\/+$/, '');
    }

    const jiraHost = getJiraHost();
    return jiraHost ? `https://${jiraHost}/browse` : '';
}

module.exports = {
    getDemoBoardAlias,
    getDemoBoardId,
    getBoardAlias,
    getBoardId,
    getCustomSprintsFile,
    getJiraSprintsFile,
    getJiraBrowseBaseUrl,
    getJiraHost,
    getReportsDir,
    getSprintDataDir,
    isDemoMode
};
