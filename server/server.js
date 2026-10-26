'use strict';
/* FishZone · servicio de capturas de la comunidad.
   Escucha solo en 127.0.0.1; nginx es el único que le habla (y el que sirve las fotos públicas en /u/). */
const http = require('http');
const crypto = require('crypto');
const busboy = require('busboy');
const cfg = require('./config');
const sec = require('./security');
const store = require('./store');
const images = require('./images');
const render = require('./render');
const admin = require('./admin');
const { validate } = require('./validate');
const { SPECIES, SPECIES_BY_ID } = require('./species');

store.init();
sec.loadSecret();
store.maintenance();
setInterval(store.maintenance, 6 * 3600 * 1000).unref();

const submitHour = sec.limiter(3, 3600 * 1000);
const submitDay = sec.limiter(8, 24 * 3600 * 1000);
const globalDay = sec.limiter(80, 24 * 3600 * 1000);
const attempts = sec.limiter(20, 3600 * 1000); // intentos (válidos o no) que llegan a procesar imagen: acota el uso de CPU

const ipOf = req => String(req.headers['x-real-ip'] || req.socket.remoteAddress || '').trim().slice(0, 64);

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, headers || {}));
  res.end(body);
}
function json(res, code, obj, cache) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache || 'no-store', 'X-Robots-Tag': 'noindex' });
  res.end(JSON.stringify(obj));
}
function readForm(req) {
  return new Promise(resolve => {
    let size = 0; const chunks = [];
    req.on('data', d => { size += d.length; if (size > 16 * 1024) { req.destroy(); return; } chunks.push(d); });
    req.on('end', () => {
      const o = Object.create(null);
      new URLSearchParams(Buffer.concat(chunks).toString('utf8')).forEach((v, k) => { o[k] = v; });
      resolve(o);
    });
    req.on('error', () => resolve(Object.create(null)));
  });
}

/* ---------- datos de la galería ---------- */
const PIONEERS = 10;
/* Copias (no se mutan los registros guardados). Pionero = una de las 10 primeras capturas aprobadas. */
function approvedSorted() {
  const asc = store.byStatus('approved').filter(i => i.pub).sort((a, b) => a.approvedAt - b.approvedAt);
  const ids = new Set(asc.filter(i => i.pioneer).map(i => i.id));
  return asc.map(i => Object.assign({}, i, { pioneer: ids.has(i.id) })).reverse();
}
function countsBySpecies(list) { const c = {}; list.forEach(i => { c[i.species] = (c[i.species] || 0) + 1; }); return c; }
function galleryCtx(species, page, extra) {
  const all = approvedSorted();
  const counts = countsBySpecies(all);
  const list = species ? all.filter(i => i.species === species) : all;
  const pages = Math.max(1, Math.ceil(list.length / cfg.PAGE_SIZE));
  page = Math.min(Math.max(1, page), pages);
  const indexable = list.length >= cfg.MIN_INDEXABLE;
  return Object.assign({
    items: list.slice((page - 1) * cfg.PAGE_SIZE, page * cfg.PAGE_SIZE), total: list.length, approvedTotal: all.length,
    counts, page, pages, species, indexable,
    featured: all.find(i => i.featured) || null,
    pioneerLeft: Math.max(0, PIONEERS - store.all().filter(i => i.pioneer && i.status === 'approved').length),
    token: sec.sign({ t: Date.now() })
  }, extra || {});
}

function esc(s) { return sec.esc(s); }
function sitemap() {
  const all = approvedSorted();
  const counts = countsBySpecies(all);
  const urls = [];
  const addGroup = (path, list) => {
    if (list.length < cfg.MIN_INDEXABLE) return;
    const pages = Math.ceil(list.length / cfg.PAGE_SIZE);
    for (let p = 1; p <= pages; p++) {
      const chunk = list.slice((p - 1) * cfg.PAGE_SIZE, p * cfg.PAGE_SIZE);
      const loc = cfg.SITE_URL + path + (p > 1 ? '?p=' + p : '');
      const imgs = chunk.map(it => '<image:image><image:loc>' + esc(cfg.SITE_URL + '/u/' + it.pub.full) + '</image:loc><image:caption>' + esc(render.altOf(it)) + '</image:caption></image:image>').join('');
      urls.push('<url><loc>' + esc(loc) + '</loc><lastmod>' + render.isoDate(chunk[0].approvedAt) + '</lastmod>' + imgs + '</url>');
    }
  };
  addGroup('/capturas/', all);
  SPECIES.forEach(s => { if (counts[s.id]) addGroup('/capturas/' + s.id + '/', all.filter(i => i.species === s.id)); });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + urls.slice(0, 500).join('') + '</urlset>';
}

/* ---------- envío de capturas ---------- */
function notify(it) {
  if (!cfg.NOTIFY_URL) return;
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 5000).unref();
    fetch(cfg.NOTIFY_URL, { method: 'POST', body: 'Nueva captura pendiente de revisar: ' + SPECIES_BY_ID[it.species].label + ' · ' + it.alias, headers: { Title: 'FishZone: captura pendiente' }, signal: ctl.signal }).catch(() => {});
  } catch (e) { /* el aviso es opcional */ }
}

function handleUpload(req, res) {
  const ip = ipOf(req), wantsJson = /json/.test(req.headers.accept || '');
  const fail = (code, errors, values) => {
    if (wantsJson) return json(res, code, { ok: false, errors });
    send(res, code, render.gallery(galleryCtx(null, 1, { errors, values })), { 'X-Robots-Tag': 'noindex' });
  };
  const okDone = () => {
    if (wantsJson) return json(res, 200, { ok: true });
    res.writeHead(303, { Location: '/capturas/gracias/', 'Cache-Control': 'no-store' }); res.end();
  };
  if (!/^multipart\/form-data/i.test(req.headers['content-type'] || '')) return fail(400, ['Formato de envío no válido.']);
  if (store.byStatus('pending').length >= cfg.MAX_PENDING) return fail(503, ['Ahora mismo tenemos muchas capturas por revisar. Inténtalo de nuevo dentro de unos días.']);

  const fields = Object.create(null); const chunks = []; let truncated = false, gotFile = false, aborted = false;
  let bb, refund = () => {};
  try { bb = busboy({ headers: req.headers, limits: { fileSize: cfg.MAX_UPLOAD_BYTES, files: 1, fields: 16, fieldSize: 2048, parts: 24 } }); }
  catch (e) { return fail(400, ['Formato de envío no válido.']); }
  bb.on('field', (n, v) => { fields[n] = v; });
  bb.on('file', (n, file) => {
    if (n !== 'foto') { file.resume(); return; }
    gotFile = true;
    file.on('data', d => chunks.push(d));
    file.on('limit', () => { truncated = true; });
  });
  bb.on('error', () => { aborted = true; });
  bb.on('close', async () => {
    if (aborted) return fail(400, ['No hemos podido leer el envío. Inténtalo de nuevo.']);
    try {
      /* Trampas anti-bot: respuesta "correcta" sin guardar nada, para no dar pistas. */
      if (fields.web) return okDone();
      const tok = sec.verify(fields.t || '');
      if (!tok || typeof tok.t !== 'number') return fail(400, ['El formulario ha caducado. Recarga la página e inténtalo de nuevo.']);
      const age = Date.now() - tok.t;
      if (age < 3000) return okDone();
      if (age > 3 * 3600 * 1000) return fail(400, ['El formulario ha caducado. Recarga la página e inténtalo de nuevo.']);

      const v = validate(fields);
      const echo = { especie: fields.especie, provincia: fields.provincia, zona: fields.zona, peso: fields.peso, longitud: fields.longitud, alias: fields.alias, comentario: fields.comentario, suelta: fields.suelta };
      if (!gotFile || !chunks.length) v.errors.push('Adjunta la foto de la captura.');
      if (truncated) v.errors.push('La foto supera los 8 MB. Reduce su tamaño e inténtalo de nuevo.');
      if (v.errors.length) return fail(400, v.errors, echo);

      /* Límites tras validar y ANTES de la parte costosa (procesar la imagen). */
      const hash = sec.ipHash(ip);
      if (!globalDay.take('g')) return fail(429, ['Hemos recibido muchos envíos hoy. Vuelve a intentarlo mañana.'], echo);
      if (!submitHour.take(hash) || !submitDay.take(hash)) { globalDay.pop('g'); return fail(429, ['Has enviado varias capturas seguidas. Espera un poco antes de enviar otra.'], echo); }
      refund = () => { globalDay.pop('g'); submitHour.pop(hash); submitDay.pop(hash); };
      if (!attempts.take(hash)) return fail(429, ['Demasiados intentos desde tu conexión. Espera un rato e inténtalo de nuevo.'], echo);

      let img;
      try { img = await images.process(Buffer.concat(chunks)); }
      catch (e) { refund(); return fail(400, [e.user ? e.message : 'No hemos podido procesar la foto.'], echo); }

      const imgHash = crypto.createHash('sha256').update(img.full).digest('hex').slice(0, 32);
      if (store.all().some(i => i.imgHash === imgHash && i.status !== 'rejected')) { refund(); return fail(400, ['Esta foto ya está enviada. Si es otra captura, sube una foto distinta.'], echo); }
      const id = crypto.randomBytes(10).toString('hex');
      const fs = require('fs');
      fs.writeFileSync(store.pendingPath(id), img.full, { mode: 0o600 });
      fs.writeFileSync(store.pendingPath(id, true), img.thumb, { mode: 0o600 });
      const x = v.value;
      const it = { id, status: 'pending', createdAt: Date.now(), updatedAt: Date.now(), alias: x.alias, species: x.species, province: x.province, zone: x.zone, weightKg: x.weightKg, lengthCm: x.lengthCm, released: x.released, comment: x.comment, fw: img.fw, fh: img.fh, tw: img.tw, th: img.th, ipHash: hash, imgHash };
      await store.put(it);
      notify(it);
      return okDone();
    } catch (e) {
      console.error('[upload]', e);
      return fail(500, ['Ha ocurrido un error inesperado. Inténtalo de nuevo en unos minutos.']);
    }
  });
  req.pipe(bb);
}

/* ---------- servidor ---------- */
const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, 'http://x'); } catch (e) { res.writeHead(400); return res.end(); }
  const p = url.pathname;
  try {
    if (p === '/healthz') return json(res, 200, { ok: true, admin: !!cfg.ADMIN_PASSWORD, approved: store.byStatus('approved').length });

    if (p.startsWith('/admin/')) return await admin.handle(req, res, url, readForm, ipOf(req));

    if (req.method === 'POST' && p === '/capturas/enviar') return handleUpload(req, res);

    if ((req.method === 'GET' || req.method === 'HEAD') && p === '/api/capturas/ultimas') {
      const n = Math.min(12, Math.max(1, parseInt(url.searchParams.get('n') || '6', 10) || 6));
      const items = approvedSorted().slice(0, n).map(it => ({ thumb: '/u/' + it.pub.thumb, w: it.tw, h: it.th, alt: render.altOf(it), especie: SPECIES_BY_ID[it.species].label, lugar: render.placeOf(it), alias: it.alias }));
      return json(res, 200, { total: approvedSorted().length, items }, 'public, max-age=120');
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && p === '/sitemap-capturas.xml') {
      return send(res, 200, sitemap(), { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
    }

    if (req.method === 'GET' && p === '/capturas/gracias/') {
      return send(res, 200, render.simple('Gracias por tu captura', 'Gracias por tu <span class="g">captura</span>',
        '<p class="gz-lead">Hemos recibido tu foto. La revisaremos en unos días y, si cumple las normas, aparecerá en la <a href="/capturas/">galería de la comunidad</a>.</p>' +
        '<div class="cap-next"><a class="cap-btn" href="https://wa.me/?text=' + encodeURIComponent('Acabo de enviar mi captura a FishZone 🎣 ' + cfg.SITE_URL + '/capturas/') + '" target="_blank" rel="noopener">Compartir por WhatsApp</a> <a class="cap-alt" href="/capturas/">Ver capturas de otros pescadores</a></div>' +
        '<p>Mientras tanto, repasa <a href="/calendario-de-pesca-en-andalucia.html">qué pescar este mes</a> o la <a href="/normativa-pesca-continental-andalucia.html">normativa de pesca continental</a>.</p>'), { 'X-Robots-Tag': 'noindex' });
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && (p === '/capturas/' || /^\/capturas\/[a-z-]+\/$/.test(p))) {
      const sp = p === '/capturas/' ? null : p.split('/')[2];
      if (sp && !SPECIES_BY_ID[sp]) return send(res, 404, render.simple('No encontrada', 'No <span class="g">encontrada</span>', '<p>Esta página no existe. <a href="/capturas/">Ver todas las capturas</a>.</p>'), { 'X-Robots-Tag': 'noindex' });
      const page = parseInt(url.searchParams.get('p') || '1', 10) || 1;
      const pre = url.searchParams.get('e');
      const ctx = galleryCtx(sp, page, pre && SPECIES_BY_ID[pre] ? { values: { especie: pre } } : null);
      if (sp && !ctx.total) { res.writeHead(302, { Location: '/capturas/', 'Cache-Control': 'no-store' }); return res.end(); }
      return send(res, 200, render.gallery(ctx), { 'Cache-Control': 'public, max-age=60' });
    }

    return send(res, 404, 'No encontrado', { 'Content-Type': 'text/plain; charset=utf-8' });
  } catch (e) {
    console.error('[http]', e);
    if (!res.headersSent) send(res, 500, 'Error interno', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});
server.requestTimeout = 60000;
server.headersTimeout = 15000;
server.listen(cfg.PORT, cfg.HOST, () => console.log('[capturas] escuchando en ' + cfg.HOST + ':' + cfg.PORT + ' · panel ' + (cfg.ADMIN_PASSWORD ? 'activo' : 'DESACTIVADO (falta ADMIN_PASSWORD)')));
process.on('unhandledRejection', e => console.error('[unhandledRejection]', e));
