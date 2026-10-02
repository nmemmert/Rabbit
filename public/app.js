// ---------- config & helpers ----------
const GEST = 31, BOX = 28, PALP = 14, WEAN = 42;
const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => iso(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const diff = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
const fmt = s => s ? parse(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
const fmtY = s => s ? parse(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const rel = n => n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 0 ? `In ${n} days` : `${-n} days ago`;

const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.6a5.2 5.2 0 00-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 00-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 000-7.4z"/></svg>',
  baby: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-3 2-5 5-5h8c3 0 5 2 5 5"/></svg>',
  rabbit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3c-1.5 0-2 2-2 4s1 4 2.5 5M16 3c1.500 0 2 2 2 4s-1 4-2.500 5"/><ellipse cx="12" cy="16" rx="6" ry="5"/><path d="M10 15.500h.01M14 15.500h.01"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 00.3 1.800l.1.1a2 2 0 11-2.800 2.800l-.1-.1a1.700 1.700 0 00-1.800-.3 1.700 1.700 0 00-1 1.500V21a2 2 0 11-4 0v-.1a1.700 1.700 0 00-1.100-1.500 1.700 1.700 0 00-1.800.3l-.1.1a2 2 0 11-2.800-2.800l.1-.1a1.700 1.700 0 00.3-1.800 1.700 1.700 0 00-1.500-1H3a2 2 0 110-4h.1a1.700 1.700 0 001.500-1.100 1.700 1.700 0 00-.3-1.800l-.1-.1a2 2 0 112.800-2.800l.1.1a1.700 1.700 0 001.800.3H9a1.700 1.700 0 001-1.500V3a2 2 0 114 0v.1a1.700 1.700 0 001 1.500 1.700 1.700 0 001.800-.3l.1-.1a2 2 0 112.800 2.800l-.1.1a1.700 1.700 0 00-.3 1.800V9a1.700 1.700 0 001.500 1H21a2 2 0 110 4h-.1a1.700 1.700 0 00-1.500 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.500" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.700 21a2 2 0 01-3.400 0"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.300-4.300"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.300 3.900L1.800 18a2 2 0 001.700 3h17a2 2 0 001.700-3L13.700 3.900a2 2 0 00-3.400 0z"/></svg>',
};

// ---------- state & sync ----------
let S = { rabbits: [], breedings: [], litters: [], settings: {} };
let tab = 'today', token = localStorage.getItem('warren.token') || '', needLogin = false, loaded = false;
const api = (path, opt = {}) => fetch(path, { ...opt, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) } });

async function load() {
  try {
    const r = await api('/api/data');
    if (r.status === 401) { needLogin = true; return render(); }
    S = await r.json(); needLogin = false; loaded = true;
    try { localStorage.setItem('warren.cache', JSON.stringify(S)); } catch {}
  } catch {
    try { S = JSON.parse(localStorage.getItem('warren.cache')) || S; loaded = true; toast('Offline — showing saved data'); } catch {}
  }
  render();
}
async function save() {
  try { localStorage.setItem('warren.cache', JSON.stringify(S)); } catch {}
  try {
    const r = await api('/api/data', { method: 'PUT', body: JSON.stringify(S) });
    if (!r.ok) throw 0;
  } catch { toast("Couldn't reach the server — change not saved"); }
  render();
}

// ---------- derived ----------
const byId = (list, id) => list.find(x => x.id === id);
const nm = id => (byId(S.rabbits, id) || { name: 'Unknown' }).name;
const pending = () => S.breedings.filter(b => b.status === 'pending');
function events() {
  const t = today(), out = [];
  pending().forEach(b => {
    const who = `${nm(b.doe)} × ${nm(b.buck)}`;
    const add = (n, kind, label, icon) => out.push({ date: addDays(b.date, n), kind, label, who, icon, b });
    if (!b.checked && diff(t, b.date) <= PALP + 2) add(PALP, 'check', 'Palpate', I.search);
    if (!b.boxIn) add(BOX, 'box', 'Nest box in', I.box);
    add(GEST, 'due', 'Kindling due', I.baby);
  });
  S.litters.forEach(l => { const d = addDays(l.date, WEAN); if (diff(t, d) <= 3 && !l.weaned) out.push({ date: d, kind: 'wean', label: 'Wean litter', who: nm(l.doe), icon: I.rabbit, l }); });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
const chipFor = d => { const n = diff(d, today()); return `<span class="chip ${n < 0 ? 'red' : n <= 2 ? 'amber' : ''}">${rel(n)}</span>`; };

// ---------- views ----------
function render() {
  const app = $('#app');
  if (needLogin) return app.innerHTML = loginView();
  if (!loaded) return app.innerHTML = '<div class="empty">Loading…</div>';
  const view = { today: todayView, breeding: breedingView, litters: littersView, rabbits: rabbitsView, settings: settingsView }[tab]();
  const fab = { breeding: 'newBreeding', rabbits: 'rabbitSheet' }[tab];
  app.innerHTML = view + (fab ? `<button class="fab" onclick="${fab}()" aria-label="Add">${I.plus}</button>` : '') + tabBar();
}
const tabBar = () => `<nav class="tabs"><div class="tabs-inner">${[
  ['today', 'Today', I.home], ['breeding', 'Breeding', I.heart], ['litters', 'Litters', I.baby], ['rabbits', 'Rabbits', I.rabbit], ['settings', 'Alerts', I.bell],
].map(([k, l, i]) => `<button class="tab ${tab === k ? 'on' : ''}" onclick="go('${k}')">${i}${l}</button>`).join('')}</div></nav>`;
function go(t) { tab = t; render(); scrollTo(0, 0); }

const empty = (icon, text) => `<div class="empty">${icon}<div>${text}</div></div>`;

function todayView() {
  const t = today(), ev = events();
  const kits = S.litters.reduce((s, l) => s + l.males + l.females + l.unknown, 0);
  const hour = new Date().getHours();
  let h = `<div class="title">${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}</div><p class="subtitle">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
  <div class="stats"><div class="stat"><b>${pending().length}</b><span>Expecting</span></div><div class="stat"><b>${S.litters.length}</b><span>Litters</span></div><div class="stat"><b>${kits}</b><span>Live kits</span></div></div>`;
  h += '<div class="section">Up next</div>';
  h += ev.length ? ev.slice(0, 12).map(e => {
    const late = diff(e.date, t) < 0;
    return `<div class="card"><div class="row"><div class="avatar bg-${late ? 'late' : e.kind}">${e.icon}</div>
      <div class="grow"><div class="name">${e.label}</div><div class="sub">${esc(e.who)} · ${fmt(e.date)}</div></div>
      <div class="right">${chipFor(e.date)}</div></div></div>`;
  }).join('') : empty(I.heart, 'Nothing scheduled.<br>Log a breeding to start the countdown.');
  const exp = pending().sort((a, b) => a.date.localeCompare(b.date));
  if (exp.length) h += '<div class="section">Pregnancies</div>' + exp.map(breedingCard).join('');
  return h;
}

function breedingCard(b) {
  const t = today(), age = Math.max(0, diff(t, b.date)), pct = Math.min(100, age / GEST * 100);
  const due = addDays(b.date, GEST), box = addDays(b.date, BOX);
  const over = diff(t, due) > 0;
  let h = `<div class="card"><div class="row"><div class="avatar bg-doe">${I.rabbit}</div>
    <div class="grow"><div class="name">${esc(nm(b.doe))} × ${esc(nm(b.buck))}</div><div class="sub">Bred ${fmt(b.date)} · day ${age}</div></div>
    <div class="right">${b.status === 'pending' ? `<span class="chip ${over ? 'red' : 'green'}">${over ? 'Overdue' : 'Expecting'}</span>` : b.status === 'kindled' ? '<span class="chip green">Kindled</span>' : '<span class="chip">Not pregnant</span>'}</div></div>`;
  if (b.status === 'pending') {
    h += `<div class="bar"><i style="width:${pct}%"></i><u style="left:${BOX / GEST * 100}%"></u></div>
      <div class="bar-labels"><span>Bred</span><span>Box day ${BOX} · ${fmt(box)}${b.boxIn ? ' ✓' : ''}</span><span>Due ${fmt(due)}</span></div>
      <div class="actions">${b.boxIn ? '' : `<button class="btn soft sm" onclick="setFlag('${b.id}','boxIn')">${I.box.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px;margin-right:4px"')}Nest box in</button>`}
      ${b.checked ? '' : `<button class="btn gray sm" onclick="setFlag('${b.id}','checked')">Palpated</button>`}
      <button class="btn sm" onclick="litterSheet(null,'${b.id}')">Kindled</button>
      <button class="btn danger sm" onclick="notPregnant('${b.id}')">Not pregnant</button></div>`;
  }
  return h + '</div>';
}

function breedingView() {
  const list = [...S.breedings].sort((a, b) => b.date.localeCompare(a.date));
  const act = list.filter(b => b.status === 'pending'), past = list.filter(b => b.status !== 'pending');
  let h = '<div class="title">Breeding</div><p class="subtitle">Pairings and due dates</p>';
  if (!list.length) return h + empty(I.heart, 'No breedings yet.<br>Tap + to log your first pairing.');
  if (act.length) h += '<div class="section">Active</div>' + act.map(breedingCard).join('');
  if (past.length) h += '<div class="section">History</div>' + past.map(b => breedingCard(b) + '').join('');
  return h;
}

function littersView() {
  const list = [...S.litters].sort((a, b) => b.date.localeCompare(a.date));
  const m = list.reduce((s, l) => s + l.males, 0), f = list.reduce((s, l) => s + l.females, 0), u = list.reduce((s, l) => s + l.unknown, 0), d = list.reduce((s, l) => s + l.dead, 0);
  let h = '<div class="title">Litters</div><p class="subtitle">Births by date and gender</p>';
  if (!list.length) return h + empty(I.baby, 'No litters yet.<br>Tap “Kindled” on a pregnancy to record one.');
  h += `<div class="card"><div class="sub">All time</div><div class="kit"><span class="m"><b>${m}</b>Bucks</span><span class="f"><b>${f}</b>Does</span><span><b>${u}</b>Unsexed</span><span><b>${d}</b>Lost</span></div></div>`;
  h += list.map(l => {
    const b = byId(S.breedings, l.breeding), age = diff(today(), l.date), live = l.males + l.females + l.unknown;
    return `<div class="card" onclick="litterSheet('${l.id}')"><div class="row"><div class="avatar bg-due">${I.baby}</div>
      <div class="grow"><div class="name">${esc(nm(l.doe))}${b ? ' × ' + esc(nm(b.buck)) : ''}</div><div class="sub">Born ${fmtY(l.date)} · ${age} days old</div></div>
      <div class="right"><span class="chip green">${live} kits</span></div></div>
      <div class="kit"><span class="m"><b>${l.males}</b>Bucks</span><span class="f"><b>${l.females}</b>Does</span>${l.unknown ? `<span><b>${l.unknown}</b>Unsexed</span>` : ''}${l.dead ? `<span><b>${l.dead}</b>Lost</span>` : ''}</div>
      ${l.notes ? `<div class="sub" style="margin-top:10px">${esc(l.notes)}</div>` : ''}</div>`;
  }).join('');
  return h;
}

function rabbitsView() {
  const list = [...S.rabbits].sort((a, b) => a.name.localeCompare(b.name));
  let h = '<div class="title">Rabbits</div><p class="subtitle">Your herd</p>';
  if (!list.length) return h + empty(I.rabbit, 'No rabbits yet.<br>Tap + to add your does and bucks.');
  [['doe', 'Does'], ['buck', 'Bucks']].forEach(([sex, label]) => {
    const g = list.filter(r => r.sex === sex);
    if (g.length) h += `<div class="section">${label}</div>` + g.map(r => {
      const n = S.litters.filter(l => l.doe === r.id).length, bred = S.breedings.filter(b => b[sex] === r.id).length;
      return `<div class="card" onclick="rabbitSheet('${r.id}')"><div class="row"><div class="avatar bg-${sex}">${I.rabbit}</div>
        <div class="grow"><div class="name">${esc(r.name)}</div><div class="sub">${esc(r.breed || (sex === 'doe' ? 'Doe' : 'Buck'))}${r.dob ? ' · ' + ageStr(r.dob) : ''}</div></div>
        <div class="right sub">${bred} breeding${bred === 1 ? '' : 's'}${sex === 'doe' ? `<br>${n} litter${n === 1 ? '' : 's'}` : ''}</div></div></div>`;
    }).join('');
  });
  return h;
}
function ageStr(dob) {
  const d = diff(today(), dob); if (d < 0) return '';
  return d < 60 ? `${Math.floor(d / 7)} wk` : d < 730 ? `${Math.floor(d / 30.4)} mo` : `${(d / 365).toFixed(1)} yr`;
}

function settingsView() {
  const s = S.settings;
  return `<div class="title">Alerts</div><p class="subtitle">Reminders sent to your phone with ntfy</p>
  <div class="group">
    <div class="field"><label>Alerts on</label><div class="seg" style="flex:0 0 120px"><button class="${s.alertsOn ? 'on' : ''}" onclick="setSetting('alertsOn',true)">On</button><button class="${!s.alertsOn ? 'on' : ''}" onclick="setSetting('alertsOn',false)">Off</button></div></div>
    <div class="field"><label>Topic</label><input id="s-topic" value="${esc(s.ntfyTopic)}" placeholder="my-rabbits-x7k2q" autocapitalize="off" autocorrect="off" onchange="setSetting('ntfyTopic',this.value.trim())"></div>
    <div class="field"><label>Server</label><input id="s-server" value="${esc(s.ntfyServer)}" autocapitalize="off" autocorrect="off" onchange="setSetting('ntfyServer',this.value.trim())"></div>
    <div class="field"><label>Send at</label><select onchange="setSetting('alertHour',+this.value)">${Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${h === s.alertHour ? 'selected' : ''}>${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}</option>`).join('')}</select></div>
  </div>
  <button class="btn block" onclick="testAlert()">Send test notification</button>
  <div class="section">Set up on iPhone</div>
  <div class="card sub" style="line-height:1.6">1. Install the <b>ntfy</b> app from the App Store.<br>2. Tap <b>+</b> and subscribe to the same topic you entered above.<br>3. Pick a long, random topic name — anyone who knows it can read your alerts.<br>4. Tap “Send test notification” to confirm.</div>
  <div class="section">You'll be notified</div>
  <div class="card sub" style="line-height:1.7">Day ${PALP} · palpate<br>Day ${BOX - 2} · nest box coming up<br>Day ${BOX} · put the nest box in<br>Day ${GEST} · kindling due<br>Day ${GEST + 2} · overdue warning<br>Week ${WEAN / 7} after birth · time to wean</div>
  <div class="section">Data</div>
  <div class="actions" style="margin-top:0"><button class="btn gray" onclick="exportData()">Export backup</button>${token ? '<button class="btn danger" onclick="logout()">Sign out</button>' : ''}</div>`;
}

function loginView() {
  return `<div class="login"><div><img src="/icon-180.png" alt=""><div class="title" style="margin-top:0">Warren</div><p class="subtitle">Enter your password to continue</p>
  <div class="group"><div class="field"><label>Password</label><input id="pw" type="password" onkeydown="if(event.key==='Enter')login()"></div></div>
  <button class="btn block" onclick="login()">Sign in</button></div></div>`;
}
function login() { token = $('#pw').value; localStorage.setItem('warren.token', token); load(); }
function logout() { localStorage.removeItem('warren.token'); token = ''; needLogin = true; loaded = false; render(); }

// ---------- sheets ----------
function openSheet(title, body) {
  $('#sheet-root').innerHTML = `<div class="scrim" onclick="closeSheet()"></div><div class="sheet"><div class="grab"></div><h2>${title}</h2>${body}</div>`;
}
function closeSheet() { $('#sheet-root').innerHTML = ''; }
const val = id => $('#' + id).value;
const stepper = (id, v) => `<div class="stepper"><button type="button" onclick="step('${id}',-1)">−</button><output id="${id}">${v}</output><button type="button" onclick="step('${id}',1)">+</button></div>`;
function step(id, d) { const o = $('#' + id); o.textContent = Math.max(0, +o.textContent + d); }
const rabbitOpts = (sex, sel) => S.rabbits.filter(r => r.sex === sex).map(r => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.name)}</option>`).join('');

function newBreeding() {
  if (!S.rabbits.some(r => r.sex === 'doe') || !S.rabbits.some(r => r.sex === 'buck')) {
    toast('Add at least one doe and one buck first'); return go('rabbits');
  }
  openSheet('New breeding', `<div class="group">
    <div class="field"><label>Doe</label><select id="b-doe">${rabbitOpts('doe')}</select></div>
    <div class="field"><label>Buck</label><select id="b-buck">${rabbitOpts('buck')}</select></div>
    <div class="field"><label>Date bred</label><input id="b-date" type="date" value="${today()}" oninput="previewDates()"></div></div>
    <div class="hint" id="b-prev"></div><button class="btn block" onclick="saveBreeding()">Save breeding</button>`);
  previewDates();
}
function previewDates() {
  const d = val('b-date'); if (!d) return;
  $('#b-prev').textContent = `Nest box on ${fmtY(addDays(d, BOX))} · due ${fmtY(addDays(d, GEST))}`;
}
function saveBreeding() {
  if (!val('b-date')) return;
  S.breedings.push({ id: uid(), doe: val('b-doe'), buck: val('b-buck'), date: val('b-date'), status: 'pending', boxIn: false, checked: false });
  closeSheet(); save(); toast('Breeding saved');
}
function setFlag(id, flag) { byId(S.breedings, id)[flag] = true; save(); }
function notPregnant(id) { if (confirm('Mark as not pregnant? Reminders for this breeding will stop.')) { byId(S.breedings, id).status = 'failed'; save(); } }

function litterSheet(id, breedingId) {
  const l = id ? byId(S.litters, id) : { date: today(), males: 0, females: 0, unknown: 0, dead: 0, notes: '', breeding: breedingId, doe: byId(S.breedings, breedingId).doe };
  openSheet(`${id ? 'Edit' : 'New'} litter · ${esc(nm(l.doe))}`, `<div class="group">
    <div class="field"><label>Born</label><input id="l-date" type="date" value="${l.date}"></div>
    <div class="field"><label>Bucks ♂</label>${stepper('l-m', l.males)}</div>
    <div class="field"><label>Does ♀</label>${stepper('l-f', l.females)}</div>
    <div class="field"><label>Unsexed</label>${stepper('l-u', l.unknown)}</div>
    <div class="field"><label>Stillborn / lost</label>${stepper('l-d', l.dead)}</div>
    <div class="field"><textarea id="l-n" rows="2" placeholder="Notes">${esc(l.notes)}</textarea></div></div>
    <button class="btn block" onclick="saveLitter('${id || ''}','${l.breeding || ''}','${l.doe}')">Save litter</button>
    ${id ? `<div class="actions"><button class="btn danger block" onclick="delLitter('${id}')">Delete litter</button></div>` : ''}`);
}
function saveLitter(id, breeding, doe) {
  const data = { date: val('l-date'), males: +$('#l-m').textContent, females: +$('#l-f').textContent, unknown: +$('#l-u').textContent, dead: +$('#l-d').textContent, notes: val('l-n').trim() };
  if (!data.date) return;
  if (id) Object.assign(byId(S.litters, id), data);
  else { S.litters.push({ id: uid(), breeding, doe, ...data }); const b = byId(S.breedings, breeding); if (b) b.status = 'kindled'; }
  closeSheet(); tab = 'litters'; save(); toast('Litter saved');
}
function delLitter(id) { if (confirm('Delete this litter?')) { S.litters = S.litters.filter(l => l.id !== id); closeSheet(); save(); } }

function rabbitSheet(id) {
  const r = id ? byId(S.rabbits, id) : { name: '', sex: 'doe', breed: '', dob: '', notes: '' };
  openSheet(id ? 'Edit rabbit' : 'New rabbit', `<div class="group">
    <div class="field"><label>Name / ID</label><input id="r-name" value="${esc(r.name)}" placeholder="Clover"></div>
    <div class="field"><label>Sex</label><div class="seg"><button id="r-doe" class="${r.sex === 'doe' ? 'on' : ''}" onclick="pickSex('doe')">Doe</button><button id="r-buck" class="${r.sex === 'buck' ? 'on' : ''}" onclick="pickSex('buck')">Buck</button></div></div>
    <div class="field"><label>Breed</label><input id="r-breed" value="${esc(r.breed)}" placeholder="Optional"></div>
    <div class="field"><label>Born</label><input id="r-dob" type="date" value="${r.dob || ''}"></div></div>
    <button class="btn block" onclick="saveRabbit('${id || ''}')">Save</button>
    ${id ? `<div class="actions"><button class="btn danger block" onclick="delRabbit('${id}')">Delete rabbit</button></div>` : ''}`);
}
function pickSex(s) { $('#r-doe').classList.toggle('on', s === 'doe'); $('#r-buck').classList.toggle('on', s === 'buck'); }
function saveRabbit(id) {
  const name = val('r-name').trim(); if (!name) return toast('Give the rabbit a name');
  const data = { name, sex: $('#r-buck').classList.contains('on') ? 'buck' : 'doe', breed: val('r-breed').trim(), dob: val('r-dob') };
  if (id) Object.assign(byId(S.rabbits, id), data); else S.rabbits.push({ id: uid(), ...data });
  closeSheet(); save();
}
function delRabbit(id) {
  const used = S.breedings.some(b => b.doe === id || b.buck === id);
  if (!confirm(used ? 'This rabbit appears in breeding records. Delete anyway?' : 'Delete this rabbit?')) return;
  S.rabbits = S.rabbits.filter(r => r.id !== id); closeSheet(); save();
}

// ---------- settings actions ----------
async function setSetting(k, v) {
  S.settings[k] = v;
  try { await api('/api/data', { method: 'PUT', body: JSON.stringify({ settings: S.settings }) }); toast('Saved'); } catch { toast("Couldn't save"); }
  render();
}
async function testAlert() {
  const r = await api('/api/test-alert', { method: 'POST' }).catch(() => null);
  if (r && r.ok) toast('Sent — check your phone'); else toast(r ? ((await r.json()).error || 'Failed') : 'Server unreachable');
}
function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
  a.download = `warren-${today()}.json`; a.click();
}

let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); }

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
document.addEventListener('visibilitychange', () => { if (!document.hidden && loaded) load(); });
load();
