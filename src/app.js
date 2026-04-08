function safeRun(label, fn) {
    try { fn(); } catch (e) { console.error(`❌ Erro em [${label}]:`, e); }
}

const APP_CONTEXT = typeof MOMENTUM_CONTEXT === 'object' && MOMENTUM_CONTEXT !== null
    ? MOMENTUM_CONTEXT
    : { mode: 'live', syncEnabled: true, banner: '' };
const JIRA_BROWSE_BASE_URL = typeof APP_CONTEXT.jiraBrowseBaseUrl === 'string'
    ? APP_CONTEXT.jiraBrowseBaseUrl.replace(/\/+$/, '')
    : '';
const MANUAL_EDITING_ENABLED = APP_CONTEXT.manualEditingEnabled !== false;

const DEV_COLORS = {
    'VAL': '#166534',
    'WAN': '#d97706',
    'IDY': '#2563eb',
    'CHA': '#db2777',
    'GUS': '#0f766e',
    'RAF': '#7c3aed'
};

function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = ((hash << 5) - hash) + value.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash);
}

function getDevColor(devId) {
    if (DEV_COLORS[devId]) {
        return DEV_COLORS[devId];
    }

    const hash = hashString(devId || 'UNASSIGNED');
    const hue = hash % 360;
    const saturation = 62 + (hash % 12);
    const lightness = 52 + (hash % 10);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function hasSprintData() {
    return Array.isArray(MOMENTUM_SPRINTS_DATA) && MOMENTUM_SPRINTS_DATA.length > 0;
}

function getCurrentSprint(selectedSprintId) {
    if (!hasSprintData()) return null;
    return MOMENTUM_SPRINTS_DATA.find(s => s.id === selectedSprintId) || MOMENTUM_SPRINTS_DATA[MOMENTUM_SPRINTS_DATA.length - 1];
}

function parsePtBrDate(value) {
    if (!value) return null;
    const [day, month, year] = value.split('/').map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
}

function isSprintWip(sprint) {
    if (!sprint?.period) return false;
    const [, endDateRaw] = sprint.period.split(' - ');
    const endDate = parsePtBrDate(endDateRaw);
    if (!endDate) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return endDate > today;
}

function getSprintElapsedRatio(sprint) {
    if (!sprint?.period) return 1;
    const [startDateRaw, endDateRaw] = sprint.period.split(' - ');
    const startDate = parsePtBrDate(startDateRaw);
    const endDate = parsePtBrDate(endDateRaw);
    if (!startDate || !endDate || endDate < startDate) return 1;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((endDate - startDate) / dayMs) + 1;
    const elapsedDays = Math.min(Math.max(Math.floor((today - startDate) / dayMs) + 1, 0), totalDays);

    return totalDays > 0 ? elapsedDays / totalDays : 1;
}

function getPendingColumnLabel(sprint) {
    return isSprintWip(sprint) ? 'Em andamento' : 'Escaparam / Removidos';
}

function getSprintChartLabel(sprint) {
    return isSprintWip(sprint) ? `${sprint.id} (WIP)` : sprint.id;
}

function renderPerformanceCard(sprint, perf, trend) {
    const card = document.getElementById('kpi-performance-card');
    if (!card) return;

    if (!isSprintWip(sprint)) {
        card.classList.remove('card-performance-wip');
        card.innerHTML = `
            <div class="card-title">Performance</div>
            <div class="card-value" id="kpi-performance-val">0%</div>
            <div class="trend" id="kpi-performance-trend">+ 0%</div>
        `;
        return;
    }

    const elapsedPercent = Math.round(getSprintElapsedRatio(sprint) * 100);
    const safePerf = Math.max(0, Math.min(perf, 100));
    const safeElapsed = Math.max(0, Math.min(elapsedPercent, 100));

    card.classList.add('card-performance-wip');
    card.style.background = `linear-gradient(to right, #1e40af ${safePerf}%, #1d4ed8 ${safePerf}%)`;
    card.style.backgroundSize = '';
    card.style.backgroundPosition = '';
    card.style.backgroundRepeat = '';
    card.innerHTML = `
        <div class="card-title">Performance</div>
        <div class="card-value">${safePerf}%</div>
        <div class="performance-wip-footer" aria-label="Tempo consumido da sprint">
            <div class="performance-wip-time-row">
                <div class="performance-wip-time-track">
                    <div class="performance-wip-time-fill" style="width: ${safeElapsed}%;"></div>
                </div>
                <span class="performance-wip-label">tempo</span>
            </div>
            <span class="performance-wip-value">${safeElapsed}%</span>
        </div>
    `;
}

function setTrendVisibility(id, visible) {
    const el = document.getElementById(`kpi-${id}-trend`);
    if (el) {
        el.style.display = visible ? 'inline-flex' : 'none';
    }
}

function getTotalPointsBadgeClass(devPerformance, sprint) {
    if (!isSprintWip(sprint)) {
        if (devPerformance.totalPts > 13) return 'points-dark-green';
        if (devPerformance.totalPts >= 10) return 'points-light-green';
        if (devPerformance.totalPts >= 6) return 'points-orange';
        return 'points-red';
    }

    const elapsedRatio = getSprintElapsedRatio(sprint);
    const expectedPts = devPerformance.committedPts * elapsedRatio;
    if (expectedPts <= 0) return devPerformance.totalPts > 0 ? 'points-light-green' : 'points-red';

    const paceRatio = devPerformance.totalPts / expectedPts;
    if (paceRatio >= 1.15) return 'points-dark-green';
    if (paceRatio >= 0.9) return 'points-light-green';
    if (paceRatio >= 0.6) return 'points-orange';
    return 'points-red';
}

function getTaskStatusClass(ticket, sprint) {
    if (ticket.status === 'done') return 'dot-done';
    if (ticket.status === 'removed') return 'dot-removed';
    return isSprintWip(sprint) ? 'dot-wip' : 'dot-escaped';
}

function isReadOnlyMode() {
    return !MANUAL_EDITING_ENABLED;
}

function renderTicketLink(ticket) {
    const safeTitle = ticket.title || ticket.id;
    if (!JIRA_BROWSE_BASE_URL) {
        return `<span class="task-link task-link-disabled" title="${ticket.id}">${safeTitle}</span>`;
    }

    return `<a href="${JIRA_BROWSE_BASE_URL}/${ticket.id}" target="_blank" rel="noreferrer" class="task-link" title="${ticket.id}">${safeTitle}</a>`;
}

function renderEmptyState() {
    const sprintGoal = document.getElementById('sprint-goal-text');
    const sprintPeriod = document.getElementById('sprint-period-text');
    const sprintSwat = document.getElementById('sprint-swat-list');
    const sprintStar = document.getElementById('sprint-star-list');
    const epicContainer = document.getElementById('epic-list-container');
    const tableBody = document.getElementById('dev-table-body');

    if (sprintGoal) sprintGoal.innerText = 'Nenhuma sprint carregada ainda.';
    if (sprintPeriod) sprintPeriod.innerText = 'Faça um Sync Jira para buscar os dados do board ativo.';
    if (sprintSwat) sprintSwat.innerHTML = '';
    if (sprintStar) sprintStar.innerHTML = '';
    if (epicContainer) epicContainer.innerHTML = '<div class="empty-state">Sem épicos para exibir.</div>';
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="5">Sem dados de sprint para este board.</td></tr>';

    ['performance', 'planejados', 'furafilas', 'removidos'].forEach(id => {
        const valueEl = document.getElementById(`kpi-${id}-val`);
        const trendEl = document.getElementById(`kpi-${id}-trend`);
        if (valueEl) valueEl.innerText = id === 'performance' ? '0%' : '0';
        if (trendEl) {
            trendEl.innerText = '+0%';
            trendEl.className = 'trend';
            trendEl.style.backgroundColor = '#94a3b8';
        }
    });
}

function initContextUi() {
    const demoBadge = document.getElementById('demoBadge');
    const btnSync = document.getElementById('btnSync');

    if (APP_CONTEXT.mode === 'demo' && demoBadge) {
        demoBadge.innerText = 'Modo Demo';
        demoBadge.style.display = 'inline-flex';
        demoBadge.title = APP_CONTEXT.banner || 'Configure o .env para usar o board real do seu time.';
    }

    if (btnSync && APP_CONTEXT.syncEnabled === false) {
        btnSync.disabled = true;
        btnSync.innerText = 'Demo';
        btnSync.title = APP_CONTEXT.banner || 'Configure o .env para habilitar o Sync Jira.';
        btnSync.style.opacity = '0.7';
        btnSync.style.cursor = 'not-allowed';
    }
}

function getUniqueDevs() {
    const devs = new Set();
    const excluded = ['FER', 'UNASSIGNED', 'CLE', 'JES', 'RIA', 'TIA'];
    MOMENTUM_SPRINTS_DATA.forEach(s => s.tickets.forEach(t => {
        if (!excluded.includes(t.dev)) devs.add(t.dev);
    }));
    return Array.from(devs).sort();
}

let currentSort = { col: 'totalPts', dir: 'desc' };

function setSort(col) {
    if (currentSort.col === col) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.col = col;
        currentSort.dir = 'desc';
    }
    updateTableHeaders();
    safeRun('Dados (Sort)', loadData);
    safeRun('Gráficos (Sort)', renderCharts);
}

function updateTableHeaders() {
    const headers = { 'devId': 'Dev', 'pD': 'Planejados', 'fD': 'Fura Filas', 'totalPts': 'Total Pontos', 'avgPts': 'Média Pontos' };
    Object.keys(headers).forEach(id => {
        const el = document.getElementById(`th-${id}`);
        if (el) {
            const arrow = currentSort.col === id ? (currentSort.dir === 'asc' ? ' 🔼' : ' 🔽') : '';
            el.innerHTML = headers[id] + arrow;
            el.style.color = currentSort.col === id ? 'var(--primary)' : 'var(--text-muted)';
        }
    });
}

function loadData() {
    const sprintFilter = document.getElementById('filter-sprint');
    const devFilter = document.getElementById('filter-dev');
    if (!sprintFilter || !devFilter) return;
    if (!hasSprintData()) {
        renderEmptyState();
        return;
    }

    const selectedSprintId = sprintFilter.value;
    const selectedDev = devFilter.value;
    const sprint = getCurrentSprint(selectedSprintId);
    const prevSprint = MOMENTUM_SPRINTS_DATA[MOMENTUM_SPRINTS_DATA.indexOf(sprint) - 1];
    
    let tickets = sprint.tickets;
    if (selectedDev !== 'TODOS') tickets = tickets.filter(t => t.dev === selectedDev);

    document.getElementById('sprint-goal-text').innerText = sprint.goal;
    document.getElementById('sprint-period-text').innerText = `Período: ${sprint.period}`;
    document.getElementById('sprint-swat-list').innerHTML = sprint.swat.map(d => `<span class="task-dev">${d}</span>`).join('');

    // STAR calculation
    const devScores = {};
    sprint.tickets.filter(t => t.status === 'done').forEach(t => {
        const dev = t.dev || 'UNASSIGNED';
        devScores[dev] = (devScores[dev] || 0) + (Number(t.pts) || 0);
    });
    const maxScore = Math.max(...Object.values(devScores), 0);
    const stars = Object.keys(devScores).filter(d => devScores[d] === maxScore && maxScore > 0);
    document.getElementById('sprint-star-list').innerHTML = stars.map(d => `<span class="task-dev" style="background: rgba(250, 204, 21, 0.2); color: #eab308; border: 1px solid #eab308;">${d}</span>`).join('');

    const calc = (list) => {
        const pDone = list.filter(t => t.type === 'planned' && t.status === 'done').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const pTotal = list.filter(t => t.type === 'planned' && t.status !== 'removed').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const fDone = list.filter(t => t.type === 'fura-fila' && t.status === 'done').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const fTotal = list.filter(t => t.type === 'fura-fila' && t.status !== 'removed').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const removed = list.filter(t => t.status === 'removed').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const perf = (pTotal + fTotal) > 0 ? Math.round(((pDone + fDone) / (pTotal + fTotal)) * 100) : 0;
        const delivered = pDone + fDone;
        const fura = fDone;
        return { pDone, pTotal, fDone, fTotal, removed, perf, delivered, fura };
    };

    const curr = calc(tickets);
    let trends = { pDone: 0, fDone: 0, removed: 0, perf: 0 };
    if (prevSprint) {
        let pTicks = prevSprint.tickets; if (selectedDev !== 'TODOS') pTicks = pTicks.filter(t => t.dev === selectedDev);
        const prev = calc(pTicks);
        trends = {
            pDone: prev.pDone > 0 ? Math.round(((curr.pDone - prev.pDone) / prev.pDone) * 100) : 0,
            fDone: prev.fDone > 0 ? Math.round(((curr.fDone - prev.fDone) / prev.fDone) * 100) : 0,
            removed: prev.removed > 0 ? Math.round(((curr.removed - prev.removed) / prev.removed) * 100) : 0,
            perf: curr.perf - prev.perf
        };
    }

    const sprintIsWip = isSprintWip(sprint);

    renderPerformanceCard(sprint, curr.perf, trends.perf);
    ['performance', 'planejados', 'furafilas', 'removidos'].forEach(id => setTrendVisibility(id, !sprintIsWip));

    const updateKPI = (id, val, trend, rev = false) => {
        const elVal = document.getElementById(`kpi-${id}-val`);
        if(elVal) elVal.innerText = id === 'performance' ? `${val}%` : val;
        const el = document.getElementById(`kpi-${id}-trend`);
        if(el) {
            el.innerText = `${trend >= 0 ? '+' : ''}${trend}%`;
            let good = trend >= 0; if (rev) good = trend <= 0;
            el.className = trend === 0 ? 'trend' : `trend ${good ? 'trend-good' : 'trend-bad'}`;
            el.style.backgroundColor = trend === 0 ? '#94a3b8' : '';
        }
    };

    if (!sprintIsWip) {
        updateKPI('performance', curr.perf, trends.perf);
    }
    updateKPI('planejados', 0, trends.pDone);
    updateKPI('removidos', curr.removed, trends.removed, true);
    updateKPI('furafilas', 0, trends.fDone, true);

    const setCardProgress = (id, done, total, fillDark, fillLight, isPercent = false) => {
        const pct = isPercent ? done : (total > 0 ? Math.round((done / total) * 100) : 0);
        const card = document.getElementById(`kpi-${id}-card`);
        if(card) {
            card.style.background = `linear-gradient(to right, ${fillDark} ${pct}%, ${fillLight} ${pct}%)`;
        }
        const valEl = document.getElementById(`kpi-${id}-val`);
        if(valEl) valEl.innerText = isPercent ? `${done}%` : `${done} / ${total}`;
    };

    if (!sprintIsWip) {
        setCardProgress('performance', curr.perf, 100, '#1e40af', '#1d4ed8', true);
    }
    setCardProgress('planejados', curr.pDone, curr.pTotal, '#166534', '#15803d');
    setCardProgress('furafilas', curr.fDone, curr.fTotal, '#ea580c', '#f97316');


    let devPerformance = getUniqueDevs().map(devId => {
        const dTicks = sprint.tickets.filter(t => t.dev === devId);
        const pD = dTicks.filter(t => t.type === 'planned' && t.status === 'done').length;
        const pT = dTicks.filter(t => t.type === 'planned').length;
        const fD = dTicks.filter(t => t.type === 'fura-fila' && t.status === 'done').length;
        const fT = dTicks.filter(t => t.type === 'fura-fila').length;
        const totalPts = dTicks.filter(t => t.status === 'done').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const committedPts = dTicks.filter(t => t.status !== 'removed').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const historicalPts = MOMENTUM_SPRINTS_DATA.filter(s => !isSprintWip(s)).map(s => 
            s.tickets.filter(t => t.dev === devId && t.status === 'done').reduce((acc, t) => acc + (Number(t.pts) || 0), 0)
        );
        const avgPts = historicalPts.length > 0
            ? Number((historicalPts.reduce((a, b) => a + b, 0) / historicalPts.length).toFixed(1))
            : 0;
        return { devId, pD, pT, fD, fT, totalPts, committedPts, avgPts, count: dTicks.length };
    }).filter(d => d.count > 0 && (selectedDev === 'TODOS' || d.devId === selectedDev));

    devPerformance.sort((a, b) => {
        let vA = a[currentSort.col], vB = b[currentSort.col];
        if (currentSort.col === 'pD') {
            if (vA !== vB) return currentSort.dir === 'asc' ? vA - vB : vB - vA;
            vA = a.pT; vB = b.pT;
        }
        if (currentSort.col === 'fD') {
            if (vA !== vB) return currentSort.dir === 'asc' ? vA - vB : vB - vA;
            vA = a.fT; vB = b.fT;
        }
        return currentSort.dir === 'asc' ? (vA > vB ? 1 : -1) : (vB > vA ? 1 : -1);
    });

    const maxPts = Math.max(...devPerformance.map(d => d.totalPts));
    const tableBody = document.getElementById('dev-table-body');
    if (tableBody) {
        tableBody.innerHTML = devPerformance.map(d => {
            const bc = getTotalPointsBadgeClass(d, sprint);
            const trophy = (d.totalPts === maxPts && maxPts > 0) ? ' 🏆' : '';
            return `<tr>
                <td>${d.devId}${trophy}</td>
                <td>${d.pD} / ${d.pT}</td>
                <td>${d.fD} / ${d.fT}</td>
                <td><span class="badge ${bc}">${d.totalPts}</span></td>
                <td><span style="font-size: 0.85rem; opacity: 0.8;">${d.avgPts}</span></td>
            </tr>`;
        }).join('');
    }

    const epicMap = {};
    tickets.forEach(t => {
        if (!epicMap[t.epic]) epicMap[t.epic] = { title: t.epic, done: 0, total: 0, pDone: 0, pTotal: 0, fDone: 0, fTotal: 0, tasks: { e: [], s: [] } };
        epicMap[t.epic].total += (Number(t.pts) || 0);
        if (t.status === 'done') epicMap[t.epic].done += (Number(t.pts) || 0);
        if (t.type === 'planned') { epicMap[t.epic].pTotal++; if (t.status === 'done') epicMap[t.epic].pDone++; }
        else { epicMap[t.epic].fTotal++; if (t.status === 'done') epicMap[t.epic].fDone++; }
        if (t.status === 'done') epicMap[t.epic].tasks.e.push(t); else epicMap[t.epic].tasks.s.push(t);
    });

    const epics = Object.values(epicMap).sort((a, b) => {
        const totalA = a.pTotal + a.fTotal;
        const totalB = b.pTotal + b.fTotal;
        if (totalA !== totalB) return totalB - totalA;
        if (a.pTotal !== b.pTotal) return b.pTotal - a.pTotal;
        const doneA = a.pDone + a.fDone;
        const doneB = b.pDone + b.fDone;
        return doneB - doneA;
    });
    
    const openEpics = Array.from(document.querySelectorAll('.epic-item[open] summary span:first-child')).map(el => el.innerText);
    const scrollPos = window.scrollY;

    const epicContainer = document.getElementById('epic-list-container');
    if (epicContainer) {
        epicContainer.innerHTML = epics.map((e, i) => {
            const isOpen = openEpics.includes(e.title) ? 'open' : '';
            e.tasks.e.sort((a, b) => (a.dev || '').localeCompare(b.dev || ''));
            e.tasks.s.sort((a, b) => (a.dev || '').localeCompare(b.dev || ''));
            const renderTasks = (taskList, targetStatus) => {
                let lastDev = '';
                return taskList.map(t => {
                    const isNewDev = lastDev && lastDev !== t.dev;
                    lastDev = t.dev;
                    const borderStyle = isNewDev ? 'border-top: 1px dashed var(--border); margin-top: 8px; padding-top: 8px;' : '';
                    const commentHtml = t.comment ? `<span class="task-comment" id="task-comment-${t.id}">${t.comment}</span>` : `<span class="task-comment" id="task-comment-${t.id}"></span>`;
                    const commentClass = t.comment ? 'has-comment' : '';
                    const isReadOnly = isReadOnlyMode();
                    const dragAttr = isReadOnly ? 'false' : 'true';
                    const dragStart = isReadOnly ? '' : `ondragstart="handleDragStart(event, '${t.id}')"`;
                    const commentButton = isReadOnly
                        ? ''
                        : `<button class="btn-comment ${commentClass}" onclick="editComment('${t.id}')" title="Adicionar Comentário">💬</button>`;
                    return `<li id="task-li-${t.id}" style="${borderStyle}" draggable="${dragAttr}" ${dragStart}>
                        <span class="status-dot ${getTaskStatusClass(t, sprint)}"></span> 
                        <span class="task-dev">${t.dev}</span> 
                        ${renderTicketLink(t)} 
                        <span class="task-pts">${t.pts}.0 pts</span>
                        ${commentButton}
                        ${commentHtml}
                    </li>`;
                }).join('');
            };
            const dropHandlers = isReadOnlyMode()
                ? ''
                : `ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'done')"`;
            const pendingDropHandlers = isReadOnlyMode()
                ? ''
                : `ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, 'escaped')"`;
            return `
            <details class="epic-item" ${isOpen}>
                <summary>
                    <div class="epic-header-info"><span>${e.title}</span><span class="epic-progress-mini">planejados ${e.pDone}/${e.pT || e.pTotal} | fura-filas: ${e.fDone}/${e.fT || e.fTotal}</span></div>
                    <div class="epic-mini-chart"><canvas id="mini-pizza-${i}"></canvas></div>
                    <span style="margin-left: 15px;">▼</span>
                </summary>
                <div class="epic-content">
                    <div class="epic-column" ${dropHandlers}>
                        <div class="epic-col-title">Entregues</div>
                        <ul class="epic-tasks">${renderTasks(e.tasks.e, 'done')}</ul>
                    </div>
                    <div class="epic-column" ${pendingDropHandlers}>
                        <div class="epic-col-title ${isSprintWip(sprint) ? 'epic-col-title-wip' : ''}">${getPendingColumnLabel(sprint)}</div>
                        <ul class="epic-tasks">${renderTasks(e.tasks.s, 'escaped')}</ul>
                    </div>
                </div>
            </details>`;
        }).join('');
    }
    
    window.scrollTo(0, scrollPos);
    window.currentEpics = epics;
    updateTableHeaders();
}

function handleDragStart(e, ticketId) {
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.setData('sourceId', `task-li-${ticketId}`);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drop-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drop-over');
}

function handleDrop(e, newStatus) {
    e.preventDefault();
    const container = e.currentTarget;
    container.classList.remove('drop-over');
    
    const ticketId = e.dataTransfer.getData('ticketId');
    const sourceId = e.dataTransfer.getData('sourceId');
    const li = document.getElementById(sourceId);
    
    if (!li) return;

    const selectedSprintId = document.getElementById('filter-sprint').value;
    const sprint = getCurrentSprint(selectedSprintId);
    if (!sprint) return;
    const ticket = sprint.tickets.find(t => t.id === ticketId);
    
    if (ticket) {
        const sourceUl = li.parentElement;
        const targetUl = container.querySelector('ul');
        const items = Array.from(targetUl.querySelectorAll('li'));
        const droppedDev = (ticket.dev || '').toUpperCase();
        
        const referenceItem = items.find(item => {
            const itemDev = item.querySelector('.task-dev')?.innerText.toUpperCase() || '';
            return itemDev > droppedDev;
        });

        if (referenceItem) {
            targetUl.insertBefore(li, referenceItem);
        } else {
            targetUl.appendChild(li);
        }

        // Faxina de Separadores
        [sourceUl, targetUl].forEach(ul => {
            if (!ul) return;
            let lastDev = '';
            const listItems = Array.from(ul.querySelectorAll('li'));
            listItems.forEach((item, index) => {
                const devSpan = item.querySelector('.task-dev');
                const currentDev = devSpan ? devSpan.innerText.trim().toUpperCase() : '';
                
                if (index > 0 && lastDev && currentDev && lastDev !== currentDev) {
                    item.style.borderTop = '1px dashed var(--border)';
                    item.style.marginTop = '12px';
                    item.style.paddingTop = '12px';
                } else {
                    item.style.borderTop = 'none';
                    item.style.marginTop = '0';
                    item.style.paddingTop = '8px';
                }
                lastDev = currentDev;
            });
        });

        ticket.status = newStatus;
        const dot = li.querySelector('.status-dot');
        if (dot) dot.className = `status-dot ${getTaskStatusClass(ticket, sprint)}`;
        safeRun('Update Stats (Drop)', updateStatsOnly);
        fetch('/api/ticket/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sprintId: selectedSprintId, ticketId, newStatus })
        });
    }
}

function updateStatsOnly() {
    const selectedSprintId = document.getElementById('filter-sprint').value;
    const selectedDev = document.getElementById('filter-dev').value;
    const sprint = getCurrentSprint(selectedSprintId);
    if (!sprint) return;
    
    let tickets = sprint.tickets;
    if (selectedDev !== 'TODOS') tickets = tickets.filter(t => t.dev === selectedDev);

    const calc = (list) => {
        const pDone = list.filter(t => t.type === 'planned' && t.status === 'done').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const pTotal = list.filter(t => t.type === 'planned' && t.status !== 'removed').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const fDone = list.filter(t => t.type === 'fura-fila' && t.status === 'done').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const fTotal = list.filter(t => t.type === 'fura-fila' && t.status !== 'removed').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const removed = list.filter(t => t.status === 'removed').reduce((a, t) => a + (Number(t.pts) || 0), 0);
        const perf = (pTotal + fTotal) > 0 ? Math.round(((pDone + fDone) / (pTotal + fTotal)) * 100) : 0;
        return { pDone, pTotal, fDone, fTotal, removed, perf };
    };

    const curr = calc(tickets);
    
    const setCardProgress = (id, done, total, fillDark, fillLight, isPercent = false) => {
        const pct = isPercent ? done : (total > 0 ? Math.round((done / total) * 100) : 0);
        const card = document.getElementById(`kpi-${id}-card`);
        if(card) card.style.background = `linear-gradient(to right, ${fillDark} ${pct}%, ${fillLight} ${pct}%)`;
        const valEl = document.getElementById(`kpi-${id}-val`);
        if(valEl) valEl.innerText = isPercent ? `${done}%` : `${done} / ${total}`;
    };

    setCardProgress('performance', curr.perf, 100, '#1e40af', '#1d4ed8', true);
    setCardProgress('planejados', curr.pDone, curr.pTotal, '#166534', '#15803d');
    setCardProgress('furafilas', curr.fDone, curr.fTotal, '#ea580c', '#f97316');
    
    const elRemovidos = document.getElementById('kpi-removidos-val');
    if(elRemovidos) elRemovidos.innerText = curr.removed;

    safeRun('Gráficos (Drop)', renderCharts);
}

let currentEditingTicket = null;

function editComment(ticketId) {
    if (isReadOnlyMode()) return;
    const selectedSprintId = document.getElementById('filter-sprint').value;
    const sprint = getCurrentSprint(selectedSprintId);
    if (!sprint) return;
    const ticket = sprint.tickets.find(t => t.id === ticketId);
    
    currentEditingTicket = { ticket, sprintId: selectedSprintId };
    
    const modalInfo = document.getElementById('modal-ticket-info');
    const modalText = document.getElementById('modal-textarea');
    const modal = document.getElementById('commentModal');
    
    if (modalInfo && modalText && modal) {
        modalInfo.innerText = `${ticket.id} - ${ticket.title}`;
        modalText.value = ticket.comment || '';
        modal.style.display = 'flex';
        modalText.focus();
        document.getElementById('modal-save-btn').onclick = saveComment;
    }
}

function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
    currentEditingTicket = null;
}

function saveComment() {
    if (!currentEditingTicket) return;
    const { ticket, sprintId } = currentEditingTicket;
    const newComment = document.getElementById('modal-textarea').value;
    
    ticket.comment = newComment;
    const commentEl = document.getElementById(`task-comment-${ticket.id}`);
    if(commentEl) commentEl.innerText = newComment;
    
    if (commentEl && commentEl.parentElement) {
        const btn = commentEl.parentElement.querySelector('.btn-comment');
        if(newComment) btn.classList.add('has-comment'); else btn.classList.remove('has-comment');
    }

    fetch('/api/ticket/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId, ticketId: ticket.id, comment: newComment })
    });

    closeCommentModal();
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCommentModal();
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && document.activeElement.id === 'modal-textarea') saveComment();
});

function initFilters() {
    const sprintFilter = document.getElementById('filter-sprint');
    const devFilter = document.getElementById('filter-dev');
    if (!sprintFilter || !devFilter) return;
    if (!hasSprintData()) {
        sprintFilter.innerHTML = '<option>Sem dados</option>';
        devFilter.innerHTML = '<option>TODOS</option>';
        return;
    }

    sprintFilter.innerHTML = MOMENTUM_SPRINTS_DATA.map(s => `<option value="${s.id}">${getSprintChartLabel(s)}</option>`).reverse().join('');
    devFilter.innerHTML = `<option>TODOS</option>` + getUniqueDevs().map(d => `<option>${d}</option>`).join('');
    sprintFilter.addEventListener('change', () => { loadData(); renderCharts(); });
    devFilter.addEventListener('change', () => { loadData(); renderCharts(); });
}

let planningChart, devLineChart;

function renderCharts() {
    if (!hasSprintData()) {
        if (planningChart) planningChart.destroy();
        if (devLineChart) devLineChart.destroy();
        planningChart = null;
        devLineChart = null;
        return;
    }

    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const selectedDev = document.getElementById('filter-dev')?.value || 'TODOS';
    
    const sprintLabels = MOMENTUM_SPRINTS_DATA.map(getSprintChartLabel);
    
    // Filtrar dados para o gráfico de barras (Planejado vs Entregue)
    const delivered = MOMENTUM_SPRINTS_DATA.map(s => {
        let tks = s.tickets;
        if (selectedDev !== 'TODOS') tks = tks.filter(t => t.dev === selectedDev);
        return tks.filter(t => t.status === 'done').reduce((acc, t) => acc + (Number(t.pts) || 0), 0);
    });
    
    const committed = MOMENTUM_SPRINTS_DATA.map(s => {
        let tks = s.tickets;
        if (selectedDev !== 'TODOS') tks = tks.filter(t => t.dev === selectedDev);
        return tks.filter(t => t.status !== 'removed').reduce((acc, t) => acc + (Number(t.pts) || 0), 0);
    });

    const avg = delivered.length > 0 ? delivered.reduce((a, b) => a + b, 0) / delivered.length : 0;

    const ctxPlanning = document.getElementById('planningChart')?.getContext('2d');
    const ctxDevLine = document.getElementById('devLineChart')?.getContext('2d');

    if (ctxPlanning) {
        if (planningChart) planningChart.destroy();
        planningChart = new Chart(ctxPlanning, {
            type: 'bar',
            plugins: [{
                id: 'horizontalLine',
                afterDraw: (chart) => {
                    const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                    const yValue = y.getPixelForValue(avg);
                    ctx.save(); ctx.beginPath(); ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeStyle = '#3b82f6';
                    ctx.moveTo(left, yValue); ctx.lineTo(right, yValue); ctx.stroke();
                    const text = `Média (${Math.round(avg)})`;
                    const textWidth = ctx.measureText(text).width;
                    ctx.setLineDash([]); ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(right - textWidth - 10, yValue - 22, textWidth + 10, 18);
                    ctx.fillStyle = '#3b82f6'; ctx.textAlign = 'right'; ctx.fillText(text, right - 5, yValue - 8); ctx.restore();
                }
            }],
            data: {
                labels: sprintLabels,
                datasets: [
                    {
                        label: 'Entregue',
                        data: delivered,
                        backgroundColor: MOMENTUM_SPRINTS_DATA.map(sprint => isSprintWip(sprint) ? '#4ade80' : '#166534'),
                        borderRadius: 4,
                        order: 1,
                        barPercentage: 0.5,
                        categoryPercentage: 0.8
                    },
                    { label: 'Comprometido', data: committed, backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(203, 213, 225, 0.5)', borderRadius: 4, order: 2, barPercentage: 0.5, categoryPercentage: 0.8 }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { color: textColor } },
                    y: { beginAtZero: true, stacked: false, grid: { color: gridColor }, ticks: { color: textColor }, title: { display: true, text: 'Points', color: textColor } }
                },
                plugins: { legend: { position: 'top', labels: { color: textColor } } }
            }
        });
    }

    if (ctxDevLine) {
        if (devLineChart) devLineChart.destroy();
        const selectedDev = document.getElementById('filter-dev')?.value || 'TODOS';
        
        let devDatasets = getUniqueDevs().map((devId) => {
            return { 
                label: devId, 
                data: MOMENTUM_SPRINTS_DATA.map(s => s.tickets.filter(t => t.dev === devId && t.status === 'done').reduce((acc, t) => acc + (Number(t.pts) || 0), 0)), 
                borderColor: getDevColor(devId), 
                tension: 0.3, 
                borderWidth: 3 
            };
        });

        if (selectedDev !== 'TODOS') {
            devDatasets = devDatasets.filter(ds => ds.label === selectedDev);
        }

        devLineChart = new Chart(ctxDevLine, {
            type: 'line',
            data: {
                labels: sprintLabels,
                datasets: devDatasets
            },
            options: {
                responsive: true,
                plugins: { 
                    legend: { 
                        position: 'top', 
                        labels: { color: textColor },
                        onClick: (e, legendItem, legend) => {
                            const index = legendItem.datasetIndex;
                            const ci = legend.chart;
                            if (!ci._toggleStates) ci._toggleStates = {};
                            if (ci._toggleStates[index] === undefined) ci._toggleStates[index] = 0;
                            ci._toggleStates[index] = (ci._toggleStates[index] + 1) % 3;
                            const state = ci._toggleStates[index];
                            if (state === 1) ci.data.datasets.forEach((ds, i) => ds.hidden = (i !== index));
                            else if (state === 2) ci.data.datasets.forEach((ds, i) => ds.hidden = (i === index));
                            else { ci.data.datasets.forEach((ds) => ds.hidden = false); ci._toggleStates = {}; }
                            ci.update();
                        }
                    } 
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: textColor } },
                    y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor }, title: { display: true, text: 'Points', color: textColor } }
                }
            }
        });
    }

    if (window.miniCharts) {
        window.miniCharts.forEach(c => c.destroy());
    }
    window.miniCharts = [];

    if (window.currentEpics) {
        window.currentEpics.forEach((epic, index) => {
            const canvas = document.getElementById(`mini-pizza-${index}`);
            if (canvas) {
                const newChart = new Chart(canvas.getContext('2d'), {
                    type: 'pie',
                    data: { datasets: [{ data: [epic.done, epic.total - epic.done], backgroundColor: ['#166534', isDark ? '#334155' : '#e2e8f0'], borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
                });
                window.miniCharts.push(newChart);
            }
        });
    }
}

// Inicialização Global
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const mainLogo = document.getElementById('mainLogo');
    
    function updateLogo() { 
        if (mainLogo) mainLogo.src = document.body.classList.contains('dark-mode') ? 'logo-dark.png' : 'logo.jpg'; 
    }
    
    if (localStorage.getItem('theme') === 'dark') { 
        document.body.classList.add('dark-mode'); 
        updateLogo(); 
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            updateLogo(); 
            renderCharts();
        });
    }

    const btnSync = document.getElementById('btnSync');
    if (btnSync) {
        btnSync.addEventListener('click', async () => {
            if (APP_CONTEXT.syncEnabled === false) {
                alert(APP_CONTEXT.banner || 'Configure o .env para habilitar o Sync Jira.');
                return;
            }
            btnSync.innerText = 'Sincronizando...'; btnSync.disabled = true;
            try {
                const response = await fetch('/api/sync', { method: 'POST' });
                const result = await response.json();
                if (result.success) { alert(`✅ Sprint ${result.sprint} sincronizada!`); window.location.reload(); }
                else alert(`❌ Erro: ${result.error}`);
            } catch (error) { alert(`❌ Erro de conexão`); }
            finally { btnSync.innerText = 'Sync Jira'; btnSync.disabled = false; }
        });
    }

    safeRun('Contexto', initContextUi);
    safeRun('Filtros', initFilters);
    safeRun('Dados', loadData);
    safeRun('Gráficos', renderCharts);
});
