'use strict';
/* Almacén en un único JSON con escritura atómica. Para cientos/miles de capturas es más que suficiente
   y evita dependencias nativas. Imágenes:
     DATA/pending/<id>.webp, <id>-t.webp   → privadas (solo el panel de administración las sirve)
     DATA/public/<slug>-<hash>.webp, -t    → públicas (nginx las sirve en /u/) solo tras aprobar */
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

const DB = path.join(cfg.DATA_DIR, 'db.json');
const PENDING = path.join(cfg.DATA_DIR, 'pending');
const PUBLIC = path.join(cfg.DATA_DIR, 'public');
let db = { items: {} };
let writing = Promise.resolve();

function init() {
  fs.mkdirSync(cfg.DATA_DIR, { recursive: true, mode: 0o755 });
  fs.mkdirSync(PENDING, { recursive: true, mode: 0o700 });
  fs.mkdirSync(PUBLIC, { recursive: true, mode: 0o755 });
  try { db = JSON.parse(fs.readFileSync(DB, 'utf8')); if (!db.items) db.items = {}; fs.copyFileSync(DB, DB + '.bak'); }
  catch (e) { if (e.code !== 'ENOENT') { console.error('[store] db.json ilegible: no se arranca para no perder datos', e); process.exit(1); } db = { items: {} }; }
}
function save() {
  writing = writing.then(() => {
    const tmp = DB + '.' + process.pid + '.tmp';
    return fs.promises.writeFile(tmp, JSON.stringify(db), { mode: 0o600 }).then(() => fs.promises.rename(tmp, DB));
  }).catch(e => console.error('[store] error al guardar', e));
  return writing;
}
const all = () => Object.values(db.items);
const get = id => db.items[id] || null;
const put = it => { db.items[it.id] = it; return save(); };
function del(id) { delete db.items[id]; return save(); }
const byStatus = st => all().filter(i => i.status === st);
const pendingPath = (id, thumb) => path.join(PENDING, id + (thumb ? '-t' : '') + '.webp');
const publicPath = (name) => path.join(PUBLIC, name);

function rmQuiet(p) { try { fs.unlinkSync(p); } catch (e) { /* ya no existe */ } }
function removeFiles(it) {
  rmQuiet(pendingPath(it.id)); rmQuiet(pendingPath(it.id, true));
  if (it.pub) { rmQuiet(publicPath(it.pub.full)); rmQuiet(publicPath(it.pub.thumb)); }
}

/* Mantenimiento diario: borra rechazadas antiguas y anonimiza el hash de IP (minimización RGPD). */
function maintenance() {
  const now = Date.now(); let dirty = false;
  for (const it of all()) {
    const age = (now - (it.updatedAt || it.createdAt)) / 864e5;
    if (it.status === 'rejected' && age > cfg.RETAIN_REJECTED_DAYS) { removeFiles(it); delete db.items[it.id]; dirty = true; continue; }
    if (it.ipHash && (now - it.createdAt) / 864e5 > cfg.RETAIN_IPHASH_DAYS) { it.ipHash = null; dirty = true; }
  }
  if (dirty) save();
}
module.exports = { init, save, all, get, put, del, byStatus, pendingPath, publicPath, removeFiles, maintenance, PENDING, PUBLIC };
