// Zero-dependency server: serves the web app, stores data in a JSON file,
// and sends scheduled reminders through ntfy.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { dueAlerts } = require('./alerts');

const PORT = process.env.PORT || 3000;
const TZ = process.env.TZ || 'UTC';
const PASSWORD = process.env.APP_PASSWORD || '';            // optional but recommended when public
const APP_URL = process.env.APP_URL || '';                  // lets notifications open the app
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC = path.join(__dirname, 'public');

const emptyDb = () => ({
  rabbits: [], breedings: [], litters: [],
  settings: { ntfyServer: 'https://ntfy.sh', ntfyTopic: '', alertHour: 8, alertsOn: true, palpate: 14, nestBox: 28, gestation: 31, wean: 42, rebreed: 7 },
  meta: { sent: {}, lastRun: '' },
});

let db = emptyDb();
try { db = Object.assign(emptyDb(), JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch {}
db.settings = Object.assign(emptyDb().settings, db.settings);   // fill in newer settings on old data files
function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db, null, 2));
  fs.renameSync(DB_FILE + '.tmp', DB_FILE);
}

// ---- time ----
const nowParts = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
};

// ---- ntfy ----
async function publish(n, title, message, tags, priority) {
  const { ntfyServer, ntfyTopic } = db.settings;
  if (!ntfyTopic) throw new Error('No ntfy topic set');
  const body = { topic: ntfyTopic, title, message, tags: (tags || '').split(',').filter(Boolean), priority: priority || 3 };
  if (APP_URL) body.click = APP_URL;
  const res = await fetch(ntfyServer.replace(/\/+$/, ''), { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`ntfy responded ${res.status}`);
}

async function runAlerts(force) {
  const { date, hour } = nowParts();
  if (!db.settings.alertsOn || !db.settings.ntfyTopic) return;
  if (!force && (db.meta.lastRun === date || hour < db.settings.alertHour)) return;
  let ok = true;
  for (const a of dueAlerts(db, date)) {
    if (db.meta.sent[a.key]) continue;
    try { await publish(null, a.title, a.message, a.tags, a.priority); db.meta.sent[a.key] = date; }
    catch (e) { ok = false; console.error('alert failed:', e.message); }
  }
  if (ok) db.meta.lastRun = date;       // if ntfy was unreachable, try again next minute
  persist();
}
setInterval(() => runAlerts(false).catch(console.error), 60 * 1000);
setTimeout(() => runAlerts(false).catch(console.error), 3000);

// ---- photos & backup ----
const PHOTO_DIR = path.join(DATA_DIR, 'photos');
const photoFile = id => /^[a-z0-9]{6,40}$/.test(id) ? path.join(PHOTO_DIR, id + '.jpg') : null;
const newPhotoId = () => require('crypto').randomBytes(12).toString('hex');
const wipePhotos = () => { try { for (const f of fs.readdirSync(PHOTO_DIR)) fs.unlinkSync(path.join(PHOTO_DIR, f)); } catch {} };

function buildBackup() {
  const photos = {};
  try { for (const f of fs.readdirSync(PHOTO_DIR)) photos[f.replace(/\.jpg$/, '')] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(PHOTO_DIR, f)).toString('base64'); } catch {}
  return { app: 'warren', version: 2, exportedAt: new Date().toISOString(), data: { rabbits: db.rabbits, breedings: db.breedings, litters: db.litters, settings: db.settings, meta: db.meta }, photos };
}
function restoreBackup(b) {
  const d = b && (b.data || b);           // also accepts the older flat export
  if (!d || !Array.isArray(d.rabbits) || !Array.isArray(d.breedings) || !Array.isArray(d.litters)) throw new Error('That file is not a Warren backup');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, 'pre-restore.json'), JSON.stringify(buildBackup()));   // safety copy of what we are replacing
  db.rabbits = d.rabbits; db.breedings = d.breedings; db.litters = d.litters;
  db.settings = Object.assign(emptyDb().settings, d.settings || {});
  db.meta = d.meta && d.meta.sent ? d.meta : db.meta;
  if (b.photos) {
    wipePhotos(); fs.mkdirSync(PHOTO_DIR, { recursive: true });
    for (const [id, url] of Object.entries(b.photos)) {
      const f = photoFile(id), m = /^data:image\/jpeg;base64,(.+)$/.exec(url || '');
      if (f && m) fs.writeFileSync(f, Buffer.from(m[1], 'base64'));
    }
  }
  persist();
}

// ---- http ----
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const readRaw = (req, limit) => new Promise((ok, fail) => {
  const chunks = []; let n = 0;
  req.on('data', c => { n += c.length; if (n > limit) { req.destroy(); fail(new Error('too big')); } else chunks.push(c); });
  req.on('end', () => ok(Buffer.concat(chunks)));
  req.on('error', fail);
});
const readBody = async (req, limit = 5e6) => { const b = await readRaw(req, limit); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
const authed = req => !PASSWORD || req.headers.authorization === `Bearer ${PASSWORD}`;
const publicData = () => ({ rabbits: db.rabbits, breedings: db.breedings, litters: db.litters, settings: db.settings, authRequired: !!PASSWORD });

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/ping') return json(res, 200, { ok: true });
    if (url.pathname.startsWith('/api/')) {
      if (!authed(req)) return json(res, 401, { error: 'unauthorized' });
      if (url.pathname === '/api/data' && req.method === 'GET') return json(res, 200, publicData());
      if (url.pathname === '/api/data' && req.method === 'PUT') {
        const b = await readBody(req);
        for (const k of ['rabbits', 'breedings', 'litters']) if (Array.isArray(b[k])) db[k] = b[k];
        if (b.settings && typeof b.settings === 'object') db.settings = Object.assign(db.settings, b.settings);
        persist();
        runAlerts(false).catch(console.error);
        return json(res, 200, { ok: true });
      }
      if (url.pathname === '/api/backup' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="warren-backup.json"' });
        return res.end(JSON.stringify(buildBackup()));
      }
      if (url.pathname === '/api/restore' && req.method === 'POST') {
        try { restoreBackup(await readBody(req, 300e6)); return json(res, 200, { ok: true }); }
        catch (e) { return json(res, 400, { error: e.message }); }
      }
      if (url.pathname === '/api/photos' && req.method === 'POST') {
        const buf = await readRaw(req, 10e6);
        if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return json(res, 400, { error: 'Photos must be JPEG' });
        const id = newPhotoId(); fs.mkdirSync(PHOTO_DIR, { recursive: true }); fs.writeFileSync(photoFile(id), buf);
        return json(res, 200, { id });
      }
      const pm = /^\/api\/photos\/([a-z0-9]+)$/.exec(url.pathname);
      if (pm) {
        const f = photoFile(pm[1]);
        if (!f) return json(res, 400, { error: 'bad id' });
        if (req.method === 'GET') {
          if (!fs.existsSync(f)) return json(res, 404, { error: 'not found' });
          res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' });
          return fs.createReadStream(f).pipe(res);
        }
        if (req.method === 'DELETE') { try { fs.unlinkSync(f); } catch {} return json(res, 200, { ok: true }); }
      }
      if (url.pathname === '/api/test-alert' && req.method === 'POST') {
        try { await publish(null, '🐇 Rabbit Tracker', 'Alerts are working! You will get reminders for nest boxes, due dates and weaning.', 'rabbit,white_check_mark', 3); return json(res, 200, { ok: true }); }
        catch (e) { return json(res, 400, { error: e.message }); }
      }
      return json(res, 404, { error: 'not found' });
    }
    let file = path.normalize(path.join(PUBLIC, url.pathname === '/' ? 'index.html' : url.pathname));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  } catch (e) { json(res, 400, { error: e.message }); }
});

if (require.main === module) server.listen(PORT, () => console.log(`Rabbit tracker on :${PORT} (TZ ${TZ})${PASSWORD ? '' : ' — WARNING: no APP_PASSWORD set'}`));
module.exports = { server, runAlerts };
