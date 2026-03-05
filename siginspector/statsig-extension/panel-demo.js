// Demo mode — no Chrome APIs required
document.documentElement.dataset.theme = 'light';
(function () {
'use strict';

// ─── State ────────────────────────────────────────────────────────────────
let allEvents = [];
let filtered = [];
let paused = false;
let pauseQueue = [];
let currentFilter = 'all';
let searchQuery = '';
let selectedIndex = -1;
let selectedEvent = null;
let autoScroll = true;
let port = null;
let clearTime = 0;
let preserveOnNav = localStorage.getItem('statsig-preserve-nav') !== 'false';

// ─── Render tracking ──────────────────────────────────────────────────────
let renderedIds = new Set();
let topGroupId = null;
let _eid = 0;
// ─── Connect to background ────────────────────────────────────────────────
function connectBackground() {
  // Demo mode: listen for postMessage events from parent page
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || msg.source !== 'siginspector-demo') return;
    if (msg.type === 'buffered_events') {
      clearTime = 0;
      allEvents = [];
      filtered = [];
      renderedIds.clear();
      topGroupId = null;
      _eid = 0;
      msg.events.forEach(ev => addEvent(ev, false));
      render();
    } else if (msg.type === 'statsig_event') {
      addEvent(msg.event, true);
    } else if (msg.type === 'select_default') {
      // Click the first selectable event card in the list
      const first = document.querySelector('#event-list .event-card:not(.event-card-multi), #event-list .card-sub-row');
      if (first) first.click();
    } else if (msg.type === 'page_navigated') {
      allEvents = [];
      filtered = [];
      pauseQueue = [];
      renderedIds.clear();
      topGroupId = null;
      _eid = 0;
      selectedEvent = null;
      selectedIndex = -1;
      render();
    }
  });
}

connectBackground();

// ─── Event classification ─────────────────────────────────────────────────
function classifySubEvent(eventName) {
  if (!eventName) return { badge: 'EVENT', filterGroup: 'events' };
  if (eventName === 'statsig::gate_exposure')       return { badge: 'GATE',   filterGroup: 'exposures' };
  if (eventName === 'statsig::experiment_exposure') return { badge: 'EXP',    filterGroup: 'exposures' };
  if (eventName === 'statsig::config_exposure')     return { badge: 'CONFIG', filterGroup: 'exposures' };
  if (eventName === 'statsig::layer_exposure')      return { badge: 'LAYER',  filterGroup: 'exposures' };
  if (eventName.startsWith('statsig::'))            return { badge: 'SDK',    filterGroup: 'exposures' };
  return { badge: 'EVENT', filterGroup: 'events' };
}

function toDisplayRows(ev) {
  if (ev.requestType === 'initialize') {
    const gateCount = (ev.gates || []).length;
    return [{
      id: 'e' + (++_eid),
      badge: 'INIT',
      filterGroup: 'init',
      timestamp: ev.timestamp,
      summary: '/v1/initialize \xb7 ' + (ev.user ? 'user:' + (ev.user.userID || '?') : 'anon') + ' \xb7 ' + gateCount + ' gates',
      valuePreview: null,
      raw: ev,
    }];
  }

  if (ev.requestType === 'log_event') {
    const events = ev.events || [];
    if (events.length === 0) {
      return [{
        id: 'e' + (++_eid),
        badge: 'EVENT',
        filterGroup: 'events',
        timestamp: ev.timestamp,
        summary: '/v1/log_event (empty)',
        valuePreview: null,
        raw: ev,
      }];
    }
    const rows = [];
    for (const e of events) {
      // Skip sub-events whose SDK timestamp predates the last clear
      if (clearTime > 0 && e.time && e.time < clearTime) continue;
      const { badge, filterGroup } = classifySubEvent(e.eventName || e.event);
      const name = e.eventName || e.event || '(unknown)';
      let valuePreview = null;
      const val = e.value;
      if (val !== undefined && val !== null && val !== '') {
        if ((typeof val === 'string' || typeof val === 'number') && String(val).length <= 30) {
          valuePreview = '\u201c' + val + '\u201d';
        }
      }
      rows.push({
        id: 'e' + (++_eid),
        badge,
        filterGroup,
        timestamp: e.time || ev.timestamp,
        summary: name,
        valuePreview,
        subEvent: e,
        raw: ev,
      });
    }
    return rows;
  }

  return [{
    id: 'e' + (++_eid),
    badge: 'EVENT',
    filterGroup: 'events',
    timestamp: ev.timestamp,
    summary: ev.url || '(unknown)',
    valuePreview: null,
    raw: ev,
  }];
}

function addEvent(ev, live) {
  if (paused && live) {
    pauseQueue.push(ev);
    return;
  }
  const rows = toDisplayRows(ev);
  allEvents.push(...rows);
  applyFilter();
  if (live) renderRows(true);
}

// ─── Filtering ────────────────────────────────────────────────────────────
function applyFilter() {
  filtered = allEvents.filter(row => {
    if (currentFilter !== 'all' && row.filterGroup !== currentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!row.summary.toLowerCase().includes(q) && !row.badge.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  // Sort by timestamp so buildGroups always receives time-ordered rows,
  // even when log_event batches arrive out of order (async emit after fetch).
  filtered.sort((a, b) => a.timestamp - b.timestamp);
}

// ─── DOM refs ─────────────────────────────────────────────────────────────
const listEl = document.getElementById('event-list');
const emptyEl = document.getElementById('empty-state');
const countEl = document.getElementById('count-badge');
const listContainer = document.getElementById('list-container');

function render() {
  applyFilter();
  renderRows(false);
}

// ─── Time grouping ────────────────────────────────────────────────────────
// Group rows (oldest-first) into time buckets.
// Rule: split on >5s gap UNLESS both events are within the 60s "Latest" window
// (so all recent events collapse under one "Latest" header).
function buildGroups(rows) {
  const now = Date.now();
  const groups = [];
  let currentGroup = null;
  let lastTs = 0;
  for (const row of rows) {
    const rowRecent  = (now - row.timestamp) < 60000;
    const lastRecent = lastTs > 0 && (now - lastTs) < 60000;
    const gapBig     = row.timestamp - lastTs > 5000;
    const needsNew   = currentGroup === null || (gapBig && !(rowRecent && lastRecent));
    if (needsNew) {
      currentGroup = { id: String(row.timestamp), ts: row.timestamp, rows: [] };
      groups.push(currentGroup);
    }
    currentGroup.rows.push(row);
    lastTs = row.timestamp;
  }
  return groups;
}

// Within a time group, sub-group consecutive same-summary rows into one card
function buildNameGroups(rows) {
  const nameGroups = [];
  let current = null;
  for (const row of rows) {
    if (!current || current[0].summary !== row.summary) {
      current = [row];
      nameGroups.push(current);
    } else {
      current.push(row);
    }
  }
  return nameGroups;
}

// ─── Time label helpers ───────────────────────────────────────────────────
function formatGroupLabel(ts) {
  const age = Date.now() - ts;
  if (age < 60000) return 'Latest';
  const mins = Math.floor(age / 60000);
  if (mins < 60) return mins + (mins === 1 ? ' min ago' : ' mins ago');
  const hours = Math.floor(age / 3600000);
  if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
  const d = new Date(ts);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate();
}

// Returns { hms, ms } spans for the detail header timestamp
function buildDetailTs(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  const hms = d.toTimeString().slice(0, 8);
  const ms  = '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
  return { hms, ms };
}

// ─── DOM element builders ─────────────────────────────────────────────────
function buildTimeEl(ts) {
  const wrap = document.createElement('div');
  wrap.className = 'event-time';
  if (!ts) return wrap;
  const d = new Date(ts);
  const hms = d.toTimeString().slice(0, 8); // 'HH:MM:SS'
  const ms = '.' + String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
  const hmsSpan = document.createElement('span');
  hmsSpan.className = 'time-hms';
  hmsSpan.textContent = hms;
  const msSpan = document.createElement('span');
  msSpan.className = 'time-ms';
  msSpan.textContent = ms;
  wrap.appendChild(hmsSpan);
  wrap.appendChild(msSpan);
  return wrap;
}

function getEventDocInfo(badge) {
  if (badge === 'INIT') return {
    description: 'SDK initialization — fetches feature gate, experiment, and config values for the current user from Statsig servers.',
    url: 'https://docs.statsig.com/client/javascript-sdk#initialize',
  };
  if (badge === 'GATE') return {
    description: 'Auto-captured when a feature gate is evaluated (checkGate). Records the gate name, pass/fail result, and the rule matched.',
    url: 'https://docs.statsig.com/feature-flags/feature-gate-evaluation-events',
  };
  if (badge === 'EXP') return {
    description: 'Auto-captured when an experiment is accessed (getExperiment). Records the experiment name, assigned group, and rule ID.',
    url: 'https://docs.statsig.com/experiments-plus/experiment-events',
  };
  if (badge === 'CONFIG') return {
    description: 'Auto-captured when a dynamic config is read (getConfig). Records the config name and matching rule.',
    url: 'https://docs.statsig.com/dynamic-config',
  };
  if (badge === 'LAYER') return {
    description: 'Auto-captured when a layer parameter is accessed (getLayer). Records the layer name, parameter, and rule.',
    url: 'https://docs.statsig.com/layers',
  };
  if (badge === 'SDK') return {
    description: 'Internal Statsig SDK diagnostic event (statsig:: prefix). Auto-captured by the SDK for observability.',
    url: 'https://docs.statsig.com/client/javascript-sdk',
  };
  return null;
}

function buildBadgeEl(badge, summary) {
  const wrap = document.createElement('div');
  wrap.className = 'badge-wrap';
  const el = document.createElement('span');
  el.className = 'badge badge-' + badge;
  el.textContent = badge;
  wrap.appendChild(el);

  const info = getEventDocInfo(badge);
  if (info) {
    const btn = document.createElement('button');
    btn.className = 'info-btn';
    btn.title = 'About this event';

    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('width', '12');
    iconSvg.setAttribute('height', '12');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('aria-hidden', 'true');
    const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useEl.setAttribute('href', '#ico-info');
    iconSvg.appendChild(useEl);
    btn.appendChild(iconSvg);

    const tip = document.createElement('div');
    tip.className = 'info-tip';

    const name = document.createElement('div');
    name.className = 'info-tip-name';
    name.textContent = badge + ' event';
    tip.appendChild(name);

    const desc = document.createElement('p');
    desc.className = 'info-tip-desc';
    desc.textContent = info.description;
    tip.appendChild(desc);

    const link = document.createElement('a');
    link.className = 'info-tip-link';
    link.textContent = 'View Statsig docs \u2197';
    link.href = '#';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(info.url, '_blank');
    });
    tip.appendChild(link);
    btn.appendChild(tip);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = btn.classList.contains('open');
      document.querySelectorAll('.info-btn.open').forEach(b => b.classList.remove('open'));
      if (!isOpen) {
        btn.classList.toggle('tip-below', btn.getBoundingClientRect().top < 160);
        btn.classList.add('open');
      }
    });

    wrap.appendChild(btn);
  }

  return wrap;
}

function buildBlockedChip(reason) {
  const chip = document.createElement('span');
  chip.className = 'blocked-chip';
  chip.textContent = 'blocked';

  const tip = document.createElement('div');
  tip.className = 'blocked-tip';

  const title = document.createElement('div');
  title.className = 'blocked-tip-title';
  title.textContent = 'Not sent to Statsig';
  tip.appendChild(title);

  const body = document.createElement('div');
  body.className = 'blocked-tip-body';
  body.textContent = 'SigInspector captured this event, but it never reached Statsig servers. Likely blocked by an ad blocker, extension, or CSP.';
  tip.appendChild(body);

  if (reason) {
    const reasonEl = document.createElement('div');
    reasonEl.className = 'blocked-tip-reason';
    reasonEl.textContent = reason;
    tip.appendChild(reasonEl);
  }

  chip.appendChild(tip);

  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = chip.classList.contains('open');
    document.querySelectorAll('.blocked-chip.open').forEach(c => c.classList.remove('open'));
    if (!wasOpen) {
      chip.classList.toggle('tip-below', chip.getBoundingClientRect().top < 150);
      chip.classList.add('open');
    }
  });

  return chip;
}

function getSubRowDetail(row) {
  const m = (row.subEvent && row.subEvent.metadata) || {};
  if (row.badge === 'GATE') {
    return { name: m.gate || row.summary, value: m.gateValue !== undefined ? String(m.gateValue) : '' };
  }
  if (row.badge === 'EXP') {
    return { name: m.config || m.experiment || row.summary, value: m.ruleID || '' };
  }
  if (row.badge === 'CONFIG') {
    return { name: m.config || row.summary, value: m.ruleID || '' };
  }
  if (row.badge === 'LAYER') {
    return { name: m.layer || row.summary, value: m.ruleID || '' };
  }
  return { name: row.summary, value: row.valuePreview || '' };
}

function buildGroupHeader(group) {
  const div = document.createElement('div');
  div.className = 'group-header';
  div.dataset.groupId = group.id;
  div.dataset.ts = group.ts;
  const pill = document.createElement('span');
  pill.className = 'group-pill';
  pill.textContent = formatGroupLabel(group.ts);
  div.appendChild(pill);
  return div;
}

function buildCard(nameGroup, animIndex) {
  const div = document.createElement('div');
  div.className = 'event-card';
  div.dataset.badge = nameGroup[0].badge;
  if (nameGroup[0].raw?.blocked) div.dataset.blocked = 'true';
  div.style.animationDelay = Math.min(animIndex * 20, 200) + 'ms';

  if (nameGroup.length === 1) {
    // Single-event card: [time] [summary] [badge]
    const row = nameGroup[0];
    div.dataset.id = row.id;
    if (selectedEvent && selectedEvent.id === row.id) div.classList.add('selected');

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'event-summary';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'event-name';
    nameSpan.textContent = row.summary;
    if (row.raw?.blocked) summaryDiv.appendChild(buildBlockedChip(row.raw?.blockedReason));
    summaryDiv.appendChild(nameSpan);
    if (row.valuePreview) {
      const valSpan = document.createElement('span');
      valSpan.className = 'val-preview';
      valSpan.textContent = row.valuePreview;
      summaryDiv.appendChild(valSpan);
    }

    div.appendChild(buildTimeEl(row.timestamp));
    div.appendChild(summaryDiv);
    const badgeWrap = buildBadgeEl(row.badge, row.summary);
    div.appendChild(badgeWrap);

    div.addEventListener('click', () => {
      if (selectedEvent && selectedEvent.id === row.id) { closeDetail(); return; }
      selectedIndex = filtered.indexOf(row);
      selectRow(row, getSiblings(row));
    });

  } else {
    // Multi-event card: shared header + sub-rows for each event
    div.classList.add('event-card-multi');

    const header = document.createElement('div');
    header.className = 'card-multi-header';
    const titleEl = document.createElement('div');
    titleEl.className = 'card-multi-title';
    const namePart = document.createElement('span');
    namePart.className = 'name-text';
    namePart.textContent = nameGroup[0].summary;
    if (nameGroup[0].raw?.blocked) titleEl.appendChild(buildBlockedChip(nameGroup[0].raw?.blockedReason));
    titleEl.appendChild(namePart);
    header.appendChild(titleEl);

    const headerBadgeWrap = document.createElement('div');
    headerBadgeWrap.className = 'badge-wrap';
    const headerBadge = document.createElement('span');
    headerBadge.className = 'badge badge-EVENT';
    headerBadge.textContent = nameGroup.length + ' EVENTS';
    headerBadgeWrap.appendChild(headerBadge);
    header.appendChild(headerBadgeWrap);

    const chevron = document.createElement('span');
    chevron.className = 'card-collapse-chevron';
    chevron.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    header.appendChild(chevron);

    header.addEventListener('click', () => div.classList.toggle('collapsed'));
    div.appendChild(header);

    const subRowsEl = document.createElement('div');
    subRowsEl.className = 'card-sub-rows';
    const subRowsInner = document.createElement('div');
    subRowsInner.className = 'card-sub-rows-inner';

    // Newest sub-row first
    for (let i = nameGroup.length - 1; i >= 0; i--) {
      const row = nameGroup[i];
      const subRow = document.createElement('div');
      subRow.className = 'card-sub-row' + (selectedEvent && selectedEvent.id === row.id ? ' selected' : '');
      subRow.dataset.id = row.id;

      subRow.appendChild(buildTimeEl(row.timestamp));

      const d = getSubRowDetail(row);
      // Prefer the first piece of content that differs across the group as the label
      const diff = getPrimaryDiff(row, nameGroup);
      const detailEl = document.createElement('div');
      detailEl.className = 'card-sub-detail' + (diff ? ' card-sub-diff' : '');
      detailEl.title = diff ? diff : d.name;
      detailEl.textContent = diff ? diff : d.name;
      subRow.appendChild(detailEl);

      if (!diff && d.value) {
        const valEl = document.createElement('span');
        valEl.className = 'card-sub-value' +
          (d.value === 'true' ? ' val-true' : d.value === 'false' ? ' val-false' : '');
        valEl.textContent = d.value;
        subRow.appendChild(valEl);
      }

      subRow.addEventListener('click', (ev) => {
        ev.stopPropagation();
        document.querySelectorAll('.blocked-chip.open').forEach(c => c.classList.remove('open'));
        if (selectedEvent && selectedEvent.id === row.id) { closeDetail(); return; }
        selectedIndex = filtered.indexOf(row);
        selectRow(row, nameGroup);
      });

      subRowsInner.appendChild(subRow);
    }

    subRowsEl.appendChild(subRowsInner);
    div.appendChild(subRowsEl);
  }

  return div;
}

// Build a full group (header + cards) into a DocumentFragment
function renderGroupToFrag(group, startAnimIndex) {
  const frag = document.createDocumentFragment();
  frag.appendChild(buildGroupHeader(group));

  const nameGroups = buildNameGroups(group.rows);
  let animIndex = startAnimIndex;
  for (let s = nameGroups.length - 1; s >= 0; s--) {
    const card = buildCard(nameGroups[s], animIndex++);
    card.dataset.groupId = group.id;
    nameGroups[s].forEach(r => renderedIds.add(r.id));
    frag.appendChild(card);
  }

  return { frag, animIndex };
}

// ─── Rendering ────────────────────────────────────────────────────────────
function renderRows(live) {
  const count = filtered.length;
  countEl.textContent = count;

  if (allEvents.length === 0) {
    emptyEl.style.display = 'flex';
    listEl.style.display = 'none';
    renderedIds.clear();
    topGroupId = null;
    return;
  }
  emptyEl.style.display = 'none';
  listEl.style.display = 'block';

  // Live path: incremental append — don't rebuild the whole list
  if (live && renderedIds.size > 0) {
    incrementalUpdate();
    return;
  }

  // Full re-render (filter change, clear, initial load)
  renderedIds.clear();
  topGroupId = null;
  listEl.innerHTML = '';

  const groups = buildGroups(filtered);
  const frag = document.createDocumentFragment();
  let animIndex = 0;

  for (let g = groups.length - 1; g >= 0; g--) {
    const group = groups[g];
    const result = renderGroupToFrag(group, animIndex);
    animIndex = result.animIndex;
    frag.appendChild(result.frag);
  }

  if (groups.length > 0) topGroupId = groups[groups.length - 1].id;

  listEl.appendChild(frag);

  if (autoScroll && !paused) listContainer.scrollTop = 0;
}

// Incremental: only touch the top group or prepend new groups
function incrementalUpdate() {
  const newRows = filtered.filter(r => !renderedIds.has(r.id));
  if (newRows.length === 0) return;

  const allGroups = buildGroups(filtered);
  if (allGroups.length === 0) return;

  const newTopGroup = allGroups[allGroups.length - 1];

  if (newTopGroup.id === topGroupId) {
    // Verify all new rows belong to the top group. A late-arriving old batch
    // (log_event whose fetch resolved slowly) will have rows in a non-top group
    // even though topGroupId still matches — fall back to a full re-render so
    // those rows land in their correct position rather than being skipped.
    const topIds = new Set(newTopGroup.rows.map(r => r.id));
    if (newRows.some(r => !topIds.has(r.id))) {
      renderRows(false);
      return;
    }
    // New events extend the existing top group — re-render just that group
    listEl.querySelectorAll(`[data-group-id="${topGroupId}"]`).forEach(el => el.remove());
    const result = renderGroupToFrag(newTopGroup, 0);
    listEl.insertBefore(result.frag, listEl.firstChild);
  } else {
    // New group(s) started — refresh old top group header label and prepend new groups
    const oldTopHeader = listEl.querySelector(`.group-header[data-group-id="${topGroupId}"]`);
    if (oldTopHeader) {
      const pill = oldTopHeader.querySelector('.group-pill');
      if (pill) pill.textContent = formatGroupLabel(parseInt(oldTopHeader.dataset.ts));
    }

    // All groups that have any unrendered rows
    const newGroupsToRender = allGroups.filter(g => g.rows.some(r => !renderedIds.has(r.id)));
    const frag = document.createDocumentFragment();
    let animIndex = 0;
    for (let g = newGroupsToRender.length - 1; g >= 0; g--) {
      const result = renderGroupToFrag(newGroupsToRender[g], animIndex);
      animIndex = result.animIndex;
      frag.appendChild(result.frag);
    }
    listEl.insertBefore(frag, listEl.firstChild);
    topGroupId = newTopGroup.id;
  }

  if (autoScroll && !paused) listContainer.scrollTop = 0;
}

// ─── Detail panel ─────────────────────────────────────────────────────────
const detailPanel  = document.getElementById('detail-panel');
const detailTitle  = document.getElementById('detail-title');
const detailTsEl   = document.getElementById('detail-ts');
const detailBody   = document.getElementById('detail-body');
const detailSearch = document.getElementById('detail-search');

let detailSearchQuery = '';

function highlightInDetail(query) {
  // Unwrap any existing highlights first
  detailBody.querySelectorAll('.detail-search-hit').forEach(el => {
    el.replaceWith(document.createTextNode(el.textContent));
  });
  detailBody.normalize();
  if (!query) return;

  const q = query.toLowerCase();
  const walker = document.createTreeWalker(detailBody, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  for (const textNode of nodes) {
    const text = textNode.textContent;
    const lower = text.toLowerCase();
    let pos = lower.indexOf(q);
    if (pos === -1) continue;

    const frag = document.createDocumentFragment();
    let last = 0;
    while (pos !== -1) {
      if (pos > last) frag.appendChild(document.createTextNode(text.slice(last, pos)));
      const mark = document.createElement('mark');
      mark.className = 'detail-search-hit';
      mark.textContent = text.slice(pos, pos + q.length);
      frag.appendChild(mark);
      last = pos + q.length;
      pos = lower.indexOf(q, last);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(frag, textNode);
  }
}

// Find the name-group (array of sibling rows with the same summary in the same
// time bucket) that a given row belongs to. Used to supply diff context.
function getSiblings(row) {
  const groups = buildGroups(filtered);
  for (const group of groups) {
    const nameGroups = buildNameGroups(group.rows);
    for (const ng of nameGroups) {
      if (ng.includes(row)) return ng;
    }
  }
  return [row];
}

function selectRow(row, siblings) {
  selectedEvent = row;
  // Update selection in-place — no re-render
  listEl.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  const el = listEl.querySelector('[data-id="' + row.id + '"]');
  if (el) {
    el.classList.add('selected');
    el.scrollIntoView({ block: 'nearest' });
  }
  showDetail(row, siblings || []);
  detailPanel.classList.add('open');
}

function closeDetail() {
  detailPanel.classList.remove('open');
  listEl.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  selectedEvent = null;
  selectedIndex = -1;
  detailSearchQuery = '';
  detailSearch.value = '';
}

function showDetail(row, siblings) {
  // Title: "event name [BLOCKED] · BADGE"
  detailTitle.innerHTML = '';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'detail-name';
  nameSpan.textContent = row.summary;
  if (row.raw?.blocked) detailTitle.appendChild(buildBlockedChip(row.raw?.blockedReason));
  detailTitle.appendChild(nameSpan);

  // Timestamp: HH:MM:SS.ms on the right
  detailTsEl.innerHTML = '';
  const tsData = buildDetailTs(row.timestamp);
  if (tsData) {
    const hmsSpan = document.createElement('span');
    hmsSpan.textContent = tsData.hms;
    const msSpan = document.createElement('span');
    msSpan.className = 'ts-ms';
    msSpan.textContent = tsData.ms;
    detailTsEl.appendChild(hmsSpan);
    detailTsEl.appendChild(msSpan);
  }

  detailBody.innerHTML = '';

  if (row.badge === 'INIT') {
    renderInitDetail(row.raw);
  } else if (['GATE', 'EXP', 'CONFIG', 'LAYER', 'SDK'].includes(row.badge)) {
    renderExposureDetail(row, siblings || []);
  } else {
    renderEventDetail(row, siblings || []);
  }

  highlightInDetail(detailSearchQuery);
}

// Returns the first value that varies across the name group, for use as sub-row label.
// Priority: top-level value → metadata fields (in order).
// Returns the first *primitive* value that varies across the name group,
// used as the sub-row identifier label. Object/array values are skipped
// to avoid "[object Object]" output.
function getPrimaryDiff(row, nameGroup) {
  if (!nameGroup || nameGroup.length <= 1) return null;

  const isPrimitive = v => v !== null && v !== undefined && typeof v !== 'object';

  const e = row.subEvent || {};

  // Check top-level value (primitives only)
  const vals = nameGroup.map(r => {
    const ev = r.subEvent || {};
    return isPrimitive(ev.value) ? String(ev.value) : null;
  }).filter(v => v !== null);
  if (vals.length > 0 && new Set(vals).size > 1) {
    return isPrimitive(e.value) ? String(e.value) : null;
  }

  // Check metadata fields (primitives only, in order)
  const allMeta = nameGroup.map(r => (r.subEvent && r.subEvent.metadata) || {});
  const metaKeys = new Set(allMeta.flatMap(m => Object.keys(m)));
  for (const k of metaKeys) {
    // skip this key if any sibling has a non-primitive value for it
    if (allMeta.some(m => m[k] !== undefined && !isPrimitive(m[k]))) continue;
    const vs = allMeta.map(m => m[k] !== undefined ? String(m[k]) : '\x00');
    if (new Set(vs).size > 1) {
      const md = e.metadata || {};
      return isPrimitive(md[k]) ? String(md[k]) : null;
    }
  }

  return null;
}

// Returns a set of field keys that differ between this row and the previous sibling.
// 'meta:<key>' for metadata, 'value' for top-level value, 'exp:<field>' for exposure metadata.
function computeChangedFields(row, siblings) {
  const changed = new Set();
  if (!siblings || siblings.length <= 1) return changed;

  const idx = siblings.indexOf(row);
  if (idx <= 0) return changed; // oldest event — no previous to compare against

  const prevRow = siblings[idx - 1];
  const e    = row.subEvent     || {};
  const prevE = prevRow.subEvent || {};

  // top-level value
  const cv = e.value     !== undefined ? JSON.stringify(e.value)     : '\x00';
  const pv = prevE.value !== undefined ? JSON.stringify(prevE.value) : '\x00';
  if (cv !== pv) changed.add('value');

  // metadata fields
  const currMeta = e.metadata     || {};
  const prevMeta = prevE.metadata || {};
  const metaKeys = new Set([...Object.keys(currMeta), ...Object.keys(prevMeta)]);
  for (const k of metaKeys) {
    const a = currMeta[k] !== undefined ? JSON.stringify(currMeta[k]) : '\x00';
    const b = prevMeta[k] !== undefined ? JSON.stringify(prevMeta[k]) : '\x00';
    if (a !== b) changed.add('meta:' + k);
  }

  // exposure-specific scalar fields
  for (const f of ['gateValue', 'ruleID', 'reason', 'configVersion']) {
    const a = currMeta[f] !== undefined ? String(currMeta[f]) : '\x00';
    const b = prevMeta[f] !== undefined ? String(prevMeta[f]) : '\x00';
    if (a !== b) changed.add('exp:' + f);
  }

  return changed;
}

// Character-level diff: find common prefix/suffix, mark middle as changed.
// Returns [{text, changed}, ...] tokens.
function tokenDiff(prevStr, currStr) {
  const prev = String(prevStr);
  const curr = String(currStr);
  if (prev === curr) return [{ text: curr, changed: false }];

  let lo = 0;
  const minLen = Math.min(prev.length, curr.length);
  while (lo < minLen && prev[lo] === curr[lo]) lo++;

  let pe = prev.length, ce = curr.length;
  while (pe > lo && ce > lo && prev[pe - 1] === curr[ce - 1]) { pe--; ce--; }

  const parts = [];
  if (lo > 0)          parts.push({ text: curr.slice(0, lo), changed: false });
  if (ce > lo)         parts.push({ text: curr.slice(lo, ce), changed: true  });
  if (ce < curr.length) parts.push({ text: curr.slice(ce),   changed: false });
  return parts.length ? parts : [{ text: curr, changed: true }];
}

function renderInitDetail(ev) {
  const user = ev.user || {};
  const gates = ev.gates || [];
  const experiments = ev.experiments || [];
  const configs = ev.configs || [];

  const frag = document.createDocumentFragment();

  const userSec = makeSection('User');
  if (user.userID)    userSec.appendChild(makeKV('userID', user.userID));
  if (user.email)     userSec.appendChild(makeKV('email', user.email));
  if (user.country)   userSec.appendChild(makeKV('country', user.country));
  if (user.customIDs) userSec.appendChild(makeKV('customIDs', user.customIDs));
  frag.appendChild(userSec);

  if (gates.length > 0) {
    const sec = makeSection('Feature Gates (' + gates.length + ')');
    gates.forEach(g => {
      const item = document.createElement('div');
      item.className = 'gate-item';

      const icon = document.createElement('span');
      icon.className = 'gate-icon';
      icon.textContent = g.value ? '\u2713' : '\u2717';

      const name = document.createElement('span');
      name.className = 'gate-name';
      name.title = g.name;
      name.textContent = g.name;

      const val = document.createElement('span');
      val.className = 'gate-val ' + (g.value ? 'true' : 'false');
      val.textContent = g.value ? 'true' : 'false';

      const rule = document.createElement('span');
      rule.className = 'gate-rule';
      rule.title = g.ruleID;
      rule.textContent = g.ruleID;

      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(val);
      item.appendChild(rule);
      sec.appendChild(item);
    });
    frag.appendChild(sec);
  }

  const allExps = [...experiments, ...configs];
  if (allExps.length > 0) {
    const sec = makeSection('Experiments / Configs (' + allExps.length + ')');
    allExps.forEach(e => {
      const item = document.createElement('div');
      item.className = 'exp-item';

      const name = document.createElement('span');
      name.className = 'exp-name';
      name.title = e.name;
      name.textContent = e.name;

      const group = document.createElement('span');
      group.className = 'exp-group';
      group.textContent = e.group || e.ruleID || '';

      item.appendChild(name);
      item.appendChild(group);
      sec.appendChild(item);
    });
    frag.appendChild(sec);
  }

  detailBody.appendChild(frag);
}

function renderExposureDetail(row, siblings) {
  const e = row.subEvent || {};
  const metadata = e.metadata || {};
  const secondary = e.secondaryExposures;
  const changed = computeChangedFields(row, siblings);

  const idx = siblings ? siblings.indexOf(row) : -1;
  const prevE = idx > 0 ? (siblings[idx - 1].subEvent || {}) : null;
  const prevMeta = prevE ? (prevE.metadata || {}) : {};

  const frag = document.createDocumentFragment();
  const sec = makeSection('Exposure');

  const name = metadata.gate || metadata.config || metadata.experiment || metadata.layer || e.eventName || '\u2014';
  sec.appendChild(makeKV('name', name));
  if (metadata.gateValue !== undefined) sec.appendChild(makeKV('value', String(metadata.gateValue), changed.has('exp:gateValue'), prevMeta.gateValue !== undefined ? String(prevMeta.gateValue) : undefined));
  if (metadata.ruleID)    sec.appendChild(makeKV('ruleID', metadata.ruleID, changed.has('exp:ruleID'), prevMeta.ruleID));
  if (metadata.reason)    sec.appendChild(makeKV('reason', metadata.reason, changed.has('exp:reason'), prevMeta.reason));
  if (metadata.configVersion !== undefined) sec.appendChild(makeKV('configVersion', String(metadata.configVersion), changed.has('exp:configVersion'), prevMeta.configVersion !== undefined ? String(prevMeta.configVersion) : undefined));
  if (e.value !== undefined && e.value !== null) sec.appendChild(makeKV('value', e.value, changed.has('value'), prevE && prevE.value !== undefined ? prevE.value : undefined));
  frag.appendChild(sec);

  const user = row.raw.user || e.user || {};
  if (Object.keys(user).length > 0) {
    const userSec = makeSection('User');
    if (user.userID)    userSec.appendChild(makeKV('userID', user.userID));
    if (user.email)     userSec.appendChild(makeKV('email', user.email));
    if (user.customIDs) userSec.appendChild(makeKV('customIDs', user.customIDs));
    frag.appendChild(userSec);
  }

  if (Array.isArray(secondary) && secondary.length > 0) {
    const secSec = makeSection('Secondary Exposures (' + secondary.length + ')');
    secondary.forEach(se => {
      secSec.appendChild(makeKV(se.gate || '?', se.gateValue !== undefined ? String(se.gateValue) : '?'));
    });
    frag.appendChild(secSec);
  }

  detailBody.appendChild(frag);
}

function renderEventDetail(row, siblings) {
  const e = row.subEvent || {};
  const changed = computeChangedFields(row, siblings);

  const idx = siblings ? siblings.indexOf(row) : -1;
  const prevE = idx > 0 ? (siblings[idx - 1].subEvent || {}) : null;
  const prevMeta = prevE ? (prevE.metadata || {}) : {};

  const frag = document.createDocumentFragment();

  const sec = makeSection('Event');
  sec.appendChild(makeKV('name', e.eventName || e.event || row.summary));
  if (e.value !== undefined && e.value !== null) {
    sec.appendChild(makeKV('value', e.value, changed.has('value'),
      prevE && prevE.value !== undefined ? prevE.value : undefined));
  }
  frag.appendChild(sec);

  if (e.metadata && Object.keys(e.metadata).length > 0) {
    const metaSec = makeSection('Metadata');
    Object.entries(e.metadata).forEach(([k, v]) => {
      metaSec.appendChild(makeKV(k, v, changed.has('meta:' + k), prevMeta[k]));
    });
    frag.appendChild(metaSec);
  }

  const user = row.raw.user || e.user || {};
  if (Object.keys(user).length > 0) {
    const userSec = makeSection('User');
    if (user.userID)    userSec.appendChild(makeKV('userID', user.userID));
    if (user.email)     userSec.appendChild(makeKV('email', user.email));
    if (user.customIDs) userSec.appendChild(makeKV('customIDs', user.customIDs));
    frag.appendChild(userSec);
  }

  detailBody.appendChild(frag);
}

function makeSection(title) {
  const sec = document.createElement('div');
  sec.className = 'detail-section';
  const h = document.createElement('div');
  h.className = 'detail-section-title';
  h.textContent = title;
  sec.appendChild(h);
  return sec;
}

function makeKV(key, rawVal, changed, prevVal) {
  const rowEl = document.createElement('div');
  rowEl.className = changed ? 'kv-row kv-changed' : 'kv-row';

  const k = document.createElement('span');
  k.className = 'kv-key';
  k.textContent = key;
  rowEl.appendChild(k);

  let parsed = rawVal;
  let isObjectLike = false;

  if (typeof rawVal === 'object' && rawVal !== null) {
    isObjectLike = true;
  } else if (typeof rawVal === 'string') {
    try {
      const p = JSON.parse(rawVal);
      if (typeof p === 'object' && p !== null) { parsed = p; isObjectLike = true; }
    } catch (_) {}
  }

  if (isObjectLike) {
    const v = document.createElement('pre');
    v.className = 'kv-val kv-val-json';
    v.textContent = JSON.stringify(parsed, null, 2);
    rowEl.appendChild(v);
  } else if (changed && prevVal !== undefined && prevVal !== null &&
             typeof rawVal !== 'object' && typeof prevVal !== 'object') {
    // Inline character-level diff against previous value
    const parts = tokenDiff(String(prevVal), String(rawVal));
    const v = document.createElement('span');
    v.className = 'kv-val';
    parts.forEach(p => {
      if (p.changed) {
        const s = document.createElement('span');
        s.className = 'kv-diff-changed';
        s.textContent = p.text;
        v.appendChild(s);
      } else {
        v.appendChild(document.createTextNode(p.text));
      }
    });
    rowEl.appendChild(v);
  } else {
    const v = document.createElement('span');
    v.className = 'kv-val';
    v.textContent = String(rawVal);
    rowEl.appendChild(v);
  }

  return rowEl;
}

// ─── Controls ─────────────────────────────────────────────────────────────
document.getElementById('detail-close').addEventListener('click', closeDetail);

document.getElementById('btn-pause').addEventListener('click', function () {
  paused = !paused;
  const use = this.querySelector('use');
  if (use) use.setAttribute('href', paused ? '#ico-play' : '#ico-pause');
  this.title = paused ? 'Resume capture' : 'Pause capture';
  this.classList.toggle('active', paused);
  if (!paused) {
    pauseQueue.forEach(ev => addEvent(ev, false));
    pauseQueue = [];
    render();
  }
});

// ─── Three-dot menu ───────────────────────────────────────────────────────
const menuWrap = document.getElementById('menu-wrap');

document.getElementById('btn-menu').addEventListener('click', (e) => {
  e.stopPropagation();
  menuWrap.classList.toggle('open');
});

document.addEventListener('click', () => {
  menuWrap.classList.remove('open');
  document.querySelectorAll('.blocked-chip.open').forEach(c => c.classList.remove('open'));
});

function executeClear() {
  clearTime = Date.now();
  allEvents = [];
  filtered = [];
  pauseQueue = [];
  selectedEvent = null;
  selectedIndex = -1;
  renderedIds.clear();
  topGroupId = null;
  _eid = 0;
  detailPanel.classList.remove('open');
  render();
  if (port) try { port.postMessage({ type: 'clear_events' }); } catch {}
  window.parent.postMessage({ source: 'siginspector-panel', type: 'cleared' }, '*');
}

const btnClear = document.getElementById('btn-clear');
const clearBackdrop = document.getElementById('clear-modal-backdrop');
const clearModal = document.getElementById('clear-modal');
const clearBtnPortal = document.getElementById('clear-btn-portal');

function openClearModal() {
  const rect = btnClear.getBoundingClientRect();
  clearModal.style.top   = (rect.bottom + 6) + 'px';
  clearModal.style.right = (window.innerWidth - rect.right) + 'px';
  // Focal point for the radial blur — button's bottom-centre
  const fx = ((rect.left + rect.width / 2) / window.innerWidth  * 100).toFixed(1) + '%';
  const fy = (rect.bottom                  / window.innerHeight * 100).toFixed(1) + '%';
  clearBackdrop.style.setProperty('--fx', fx);
  clearBackdrop.style.setProperty('--fy', fy);
  // Show ghost button via portal — lives outside the backdrop's compositing layer
  clearBtnPortal.style.top  = rect.top  + 'px';
  clearBtnPortal.style.left = rect.left + 'px';
  clearBtnPortal.classList.add('open');
  clearBackdrop.classList.add('open');
}
function closeClearModal() {
  clearBtnPortal.classList.remove('open');
  clearBackdrop.classList.remove('open');
}

btnClear.addEventListener('click', (e) => {
  e.stopPropagation();
  openClearModal();
});

document.getElementById('btn-clear-ghost').addEventListener('click', closeClearModal);

document.getElementById('clear-modal-confirm').addEventListener('click', () => {
  closeClearModal();
  const cards = listEl.querySelectorAll('.event-card');
  if (cards.length === 0) { executeClear(); return; }
  let maxDelay = 0;
  cards.forEach((card, i) => {
    const delay = Math.min(i * 18, 120);
    card.style.animationDelay = delay + 'ms';
    card.classList.add('vanishing');
    maxDelay = delay;
  });
  setTimeout(executeClear, maxDelay + 200);
});

clearBackdrop.addEventListener('click', (e) => {
  if (e.target === clearBackdrop) closeClearModal();
});

// ─── Detail panel resize ──────────────────────────────────────────────────
const DETAIL_DEFAULT_WIDTH = 300;
const resizeHandle = document.getElementById('detail-resize-handle');

resizeHandle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  const startX     = e.clientX;
  const startWidth = detailPanel.offsetWidth;
  resizeHandle.classList.add('dragging');
  document.body.style.cursor    = 'col-resize';
  document.body.style.userSelect = 'none';

  const onMove = (e) => {
    const delta    = startX - e.clientX; // left = wider, right = narrower
    const newWidth = Math.max(220, Math.min(startWidth + delta, window.innerWidth * 0.70));
    detailPanel.style.width = newWidth + 'px';
  };

  const onUp = () => {
    resizeHandle.classList.remove('dragging');
    document.body.style.cursor    = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onUp);
});

resizeHandle.addEventListener('dblclick', () => {
  detailPanel.style.width = DETAIL_DEFAULT_WIDTH + 'px';
});

// ─── Theme management ─────────────────────────────────────────────────────
let themePref = localStorage.getItem('statsig-theme') || 'auto';

function isDarkEffective() {
  if (themePref === 'dark') return true;
  if (themePref === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme() {
  const html = document.documentElement;
  html.classList.add('theme-switching');

  if (themePref === 'auto') {
    html.removeAttribute('data-theme');
  } else {
    html.dataset.theme = themePref;
  }

  const dark      = isDarkEffective();
  const themeItem = document.getElementById('menu-theme');
  const themeIcon = document.getElementById('menu-theme-icon').querySelector('use');
  document.getElementById('menu-theme-label').textContent = 'Dark mode';
  if (dark) {
    themeItem.classList.add('theme-dark');
    themeIcon.setAttribute('href', '#ico-moon');
  } else {
    themeItem.classList.remove('theme-dark');
    themeIcon.setAttribute('href', '#ico-sun');
  }

  setTimeout(() => html.classList.remove('theme-switching'), 350);
}

applyTheme();

document.getElementById('menu-theme').addEventListener('click', (e) => {
  e.stopPropagation(); // keep the dropdown open
  themePref = isDarkEffective() ? 'light' : 'dark';
  localStorage.setItem('statsig-theme', themePref);
  applyTheme();
});

// ─── Preserve-on-reload toggle ────────────────────────────────────────────
const preserveNavItem = document.getElementById('menu-preserve-nav');
if (preserveOnNav) preserveNavItem.classList.add('preserve-on');

preserveNavItem.addEventListener('click', (e) => {
  e.stopPropagation(); // keep the dropdown open
  preserveOnNav = !preserveOnNav;
  localStorage.setItem('statsig-preserve-nav', String(preserveOnNav));
  preserveNavItem.classList.toggle('preserve-on', preserveOnNav);
  if (port) try { port.postMessage({ type: 'set_preserve_nav', value: preserveOnNav }); } catch {}
});
preserveNavItem.querySelector('.mem-help').addEventListener('click', e => e.stopPropagation());

document.getElementById('menu-export').addEventListener('click', () => {
  menuWrap.classList.remove('open');
  const data = JSON.stringify(allEvents.map(r => r.raw), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'statsig-events-' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
});

detailSearch.addEventListener('input', function () {
  detailSearchQuery = this.value;
  highlightInDetail(detailSearchQuery);
});

document.getElementById('btn-copy-json').addEventListener('click', () => {
  if (!selectedEvent) return;
  const json = JSON.stringify(selectedEvent.raw, null, 2);
  const doToast = () => {
    const toast = document.getElementById('copy-toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  };
  navigator.clipboard.writeText(json).then(doToast).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = json;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    doToast();
  });
});

// Filter tabs — toggle card visibility in-place instead of full re-render
const FILTER_BADGES = {
  events:    ['EVENT'],
  exposures: ['GATE', 'EXP', 'CONFIG', 'LAYER', 'SDK'],
  init:      ['INIT'],
};

function applyFilterVisual() {
  const allowed = FILTER_BADGES[currentFilter]; // undefined = all
  listEl.querySelectorAll('.event-card').forEach(card => {
    card.style.display = (!allowed || allowed.includes(card.dataset.badge)) ? '' : 'none';
  });
  // Hide group headers whose entire group is hidden
  listEl.querySelectorAll('.group-header').forEach(header => {
    const gid = header.dataset.groupId;
    const cards = listEl.querySelectorAll(`.event-card[data-group-id="${gid}"]`);
    const anyVisible = !allowed || Array.from(cards).some(c => c.style.display !== 'none');
    header.style.display = anyVisible ? '' : 'none';
  });
}

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    if (this.dataset.filter === currentFilter) return;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;
    applyFilter(); // keep filtered[] in sync for keyboard nav
    if (searchQuery) {
      renderRows(false); // search + filter combined needs a full rebuild
    } else {
      applyFilterVisual();
    }
  });
});

document.getElementById('search').addEventListener('input', function () {
  searchQuery = this.value.trim();
  render();
});

listContainer.addEventListener('scroll', () => {
  autoScroll = listContainer.scrollTop < 20;
});

// ─── Periodic label refresh ───────────────────────────────────────────────
// Keep group header pills accurate as time passes (e.g. "Latest" → "2 mins ago")
setInterval(() => {
  listEl.querySelectorAll('.group-header[data-ts]').forEach(header => {
    const pill = header.querySelector('.group-pill');
    if (pill) pill.textContent = formatGroupLabel(parseInt(header.dataset.ts, 10));
  });
}, 20000);

// ─── Keyboard navigation ──────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (detailPanel.classList.contains('open')) closeDetail();
    return;
  }

  if (filtered.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    const r = filtered[selectedIndex];
    selectRow(r, getSiblings(r));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (selectedIndex === -1) selectedIndex = filtered.length - 1;
    else selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
    const r = filtered[selectedIndex];
    selectRow(r, getSiblings(r));
  }
});

})();
