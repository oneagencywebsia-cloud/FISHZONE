'use strict';
/* Panel de moderación. Sin JavaScript en el cliente (formularios POST), CSP estricta, sesión firmada,
   CSRF por token ligado a la sesión, límite de intentos de acceso y cabeceras no-store/noindex. */
const fs = require('fs');
const cfg = require('./config');
const sec = require('./security');
const store = require('./store');
const { SPECIES, SPECIES_BY_ID, PROVINCES } = require('./species');
const { validate } = require('./validate');
const { slugify, altOf, placeOf } = require('./render');
const esc = sec.esc;

const BASE = '/admin/capturas';
const SESSION_MS = 12 * 3600 * 1000;
const loginLimit = sec.limiter(5, 15 * 60 * 1000);
const loginGlobal = sec.limiter(30, 3600 * 1000); // fuerza bruta distribuida
const sessions = new Set(); // sesiones activas: permite revocar al salir
const SECURE = process.env.NODE_ENV === 'production';
const COOKIE = SECURE ? '__Host-fz_adm' : 'fz_adm';

function shell(title, inner, flash) {
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow, noarchive"><title>' + esc(title) + '</title><link rel="stylesheet" href="/capturas.css?v=20261026"></head>' +
    '<body class="adm"><header class="adm-top"><strong>FishZone · Moderación de capturas</strong></header><main class="adm-main">' +
    (flash ? '<p class="adm-flash" role="status">' + esc(flash) + '</p>' : '') + inner + '</main></body></html>';
}

function session(req) {
  const c = sec.parseCookies(req.headers.cookie)[COOKIE];
  const s = sec.verify(c);
  if (!s || s.k !== 'adm' || typeof s.exp !== 'number' || s.exp < Date.now() || !sessions.has(s.n)) return null;
  return s;
}
const csrfOf = s => sec.hmac('csrf:' + s.n).slice(0, 32);
function sameOrigin(req) {
  const o = req.headers.origin, r = req.headers.referer;
  const host = req.headers.host;
  const ok = x => { try { return new URL(x).host === host; } catch (e) { return false; } };
  if (o) return ok(o);
  if (r) return ok(r);
  return false;
}

function loginPage(msg) {
  if (!cfg.ADMIN_PASSWORD) return shell('Acceso', '<h1>Panel desactivado</h1><p>Define la variable de entorno <code>ADMIN_PASSWORD</code> (mín. 12 caracteres) en EasyPanel y reinicia la aplicación para activarlo.</p>');
  return shell('Acceso', '<h1>Acceso de administrador</h1>' + (msg ? '<p class="adm-err" role="alert">' + esc(msg) + '</p>' : '') +
    '<form method="post" action="' + BASE + '/login" class="adm-login"><label>Contraseña<input type="password" name="password" autocomplete="current-password" required autofocus></label><button type="submit">Entrar</button></form>');
}

function itemCard(it, csrf, tab) {
  const sp = SPECIES_BY_ID[it.species] || { label: it.species, note: '' };
  const img = BASE + '/img/' + it.id + '.webp';
  const speciesOpts = SPECIES.map(s => '<option value="' + s.id + '"' + (s.id === it.species ? ' selected' : '') + '>' + esc(s.label) + '</option>').join('');
  const provOpts = PROVINCES.map(p => '<option' + (p === it.province ? ' selected' : '') + '>' + esc(p) + '</option>').join('');
  const edit = '<form method="post" action="' + BASE + '/accion" class="adm-edit"><input type="hidden" name="csrf" value="' + csrf + '"><input type="hidden" name="id" value="' + it.id + '">' +
    '<div class="adm-grid"><label>Alias<input name="alias" value="' + esc(it.alias) + '" maxlength="24"></label>' +
    '<label>Especie<select name="especie">' + speciesOpts + '</select></label>' +
    '<label>Si es «otra»: ¿cuál?<input name="otra" value="' + esc(it.speciesOther || '') + '" maxlength="40"></label><label>Provincia<select name="provincia">' + provOpts + '</select></label>' +
    '<label>Zona<input name="zona" value="' + esc(it.zone) + '" maxlength="60"></label>' +
    '<label>Peso kg<input name="peso" value="' + esc(it.weightKg || '') + '" maxlength="5"></label>' +
    '<label>Longitud cm<input name="longitud" value="' + esc(it.lengthCm || '') + '" maxlength="5"></label></div>' +
    '<label>Comentario<textarea name="comentario" rows="2" maxlength="240">' + esc(it.comment) + '</textarea></label>' +
    '<label class="adm-chk"><input type="checkbox" name="suelta" value="on"' + (it.released ? ' checked' : '') + '> Devuelta al agua</label>' +
    (it.status === 'pending' ? '<fieldset class="adm-check"><legend>Lista de comprobación</legend>' +
      '<label><input type="checkbox" name="c1" value="1"> La especie y el periodo/talla son legales (' + esc(sp.note) + ')</label>' +
      '<label><input type="checkbox" name="c2" value="1"> No hay personas reconocibles, menores, matrículas ni lugares sensibles</label>' +
      '<label><input type="checkbox" name="c3" value="1"> Trato correcto del pez y foto de calidad</label></fieldset>' : '') +
    '<div class="adm-actions">' +
    (it.status === 'pending' ? '<button name="op" value="approve" class="ok">Aprobar y publicar</button><input name="reason" placeholder="Motivo (opcional)" maxlength="120"><button name="op" value="reject" class="no">Rechazar y borrar foto</button>' : '') +
    (it.status === 'approved' ? '<button name="op" value="save" class="ok">Guardar cambios</button><button name="op" value="' + (it.featured ? 'unfeature' : 'feature') + '">' + (it.featured ? '★ Quitar destacada' : '☆ Destacar (captura de la semana)') + '</button><button name="op" value="remove" class="no">Retirar de la web</button>' : '') +
    (it.status === 'rejected' ? '<span class="adm-muted">Rechazada: ' + esc(it.reason || 'sin motivo') + '</span>' : '') +
    '</div></form>';
  return '<article class="adm-card' + (it.status !== 'pending' ? ' adm-done' : '') + '"><div class="adm-media">' +
    (it.status === 'rejected' ? '<div class="adm-noimg">Foto eliminada</div>' : '<a href="' + img + '" target="_blank" rel="noopener"><img src="' + img + '?t=1" alt="' + esc(altOf(it)) + '" width="' + (it.tw || 480) + '" height="' + (it.th || 320) + '" loading="lazy"></a>') +
    '</div><div class="adm-body"><p class="adm-meta">' + new Date(it.createdAt).toISOString().replace('T', ' ').slice(0, 16) + ' UTC · ' + esc(placeOf(it)) + '</p>' + edit + '</div></article>';
}

function list(s, tab, flash) {
  const csrf = csrfOf(s);
  const counts = { pending: store.byStatus('pending').length, approved: store.byStatus('approved').length, rejected: store.byStatus('rejected').length };
  const label = { pending: 'Pendientes', approved: 'Aprobadas', rejected: 'Rechazadas' };
  const tabs = Object.keys(label).map(k => '<a class="adm-tab' + (k === tab ? ' on' : '') + '" href="' + BASE + '/?tab=' + k + '">' + label[k] + ' (' + counts[k] + ')</a>').join('');
  const items = store.byStatus(tab).sort((a, b) => (tab === 'pending' ? a.createdAt - b.createdAt : (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))).slice(0, 60);
  const warn = '<p class="adm-warn">Las fotos y la base de datos se guardan en <code>' + esc(cfg.DATA_DIR) + '</code>. Comprueba en EasyPanel que ese directorio es un <strong>volumen persistente</strong>; si no, se perderán al redesplegar.</p>';
  return shell('Moderación', '<nav class="adm-tabs">' + tabs + '<form method="post" action="' + BASE + '/logout" class="adm-logout"><input type="hidden" name="csrf" value="' + csrf + '"><button>Salir</button></form></nav>' + warn +
    (items.length ? items.map(i => itemCard(i, csrf, tab)).join('') : '<p class="adm-muted">No hay capturas en esta pestaña.</p>'), flash);
}

function redirect(res, to, extra) { res.writeHead(303, Object.assign({ Location: to, 'Cache-Control': 'no-store' }, extra || {})); res.end(); }
function cookieHeader(value, maxAge) { return COOKIE + '=' + encodeURIComponent(value) + '; Path=/; HttpOnly' + (SECURE ? '; Secure' : '') + '; SameSite=Strict; Max-Age=' + maxAge; }

function adminHeaders(extra) {
  return Object.assign({
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
  }, extra || {});
}
function send(res, code, html, extra) { res.writeHead(code, adminHeaders(extra)); res.end(html); }

/* Aprobación: copia las imágenes procesadas a la carpeta pública con nombre descriptivo (SEO de imagen). */
function approve(it) {
  const sp = SPECIES_BY_ID[it.species];
  const slug = slugify(sp.label + '-' + (it.zone || it.province)) + '-' + it.id.slice(0, 6);
  const full = slug + '.webp', thumb = slug + '-t.webp';
  fs.copyFileSync(store.pendingPath(it.id), store.publicPath(full));
  fs.copyFileSync(store.pendingPath(it.id, true), store.publicPath(thumb));
  fs.chmodSync(store.publicPath(full), 0o644); fs.chmodSync(store.publicPath(thumb), 0o644);
  it.pub = { full, thumb };
  it.status = 'approved'; it.approvedAt = Date.now(); it.updatedAt = Date.now();
  it.pioneer = store.all().filter(x => x.status === 'approved' && x.pioneer).length < 10; // se fija al aprobar
  fs.unlinkSync(store.pendingPath(it.id)); fs.unlinkSync(store.pendingPath(it.id, true));
}

async function handle(req, res, url, readForm, ip) {
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const s = session(req);

  if (p === BASE + '/login' && req.method === 'POST') {
    if (!cfg.ADMIN_PASSWORD) return send(res, 503, loginPage());
    if (!sameOrigin(req)) return send(res, 403, loginPage('Solicitud no válida.'));
    if (!loginLimit.take(ip)) return send(res, 429, loginPage('Demasiados intentos. Espera 15 minutos.'));
    const f = await readForm(req);
    // Fuerza bruta distribuida: retardo creciente (nunca bloquea una contraseña correcta).
    await new Promise(r => setTimeout(r, 400 + Math.min(4000, loginGlobal.peek('g') * 150)));
    if (!sec.checkPassword(f.password || '')) { loginGlobal.take('g'); return send(res, 401, loginPage('Contraseña incorrecta.')); }
    loginLimit.clear(ip);
    const nonce = sec.rand(8);
    sessions.add(nonce); if (sessions.size > 20) sessions.delete(sessions.values().next().value);
    const tok = sec.sign({ k: 'adm', exp: Date.now() + SESSION_MS, n: nonce });
    return redirect(res, BASE + '/', { 'Set-Cookie': cookieHeader(tok, SESSION_MS / 1000) });
  }

  if (!s) {
    if (req.method === 'GET' && (p === BASE || p === BASE + '/')) return send(res, 200, loginPage());
    return redirect(res, BASE + '/');
  }

  if (p === BASE + '/logout' && req.method === 'POST') {
    const f = await readForm(req);
    if (!sameOrigin(req) || !sec.safeEq(f.csrf || '', csrfOf(s))) return send(res, 403, shell('Error', '<p>Solicitud no válida.</p>'));
    sessions.delete(s.n);
    return redirect(res, BASE + '/', { 'Set-Cookie': cookieHeader('', 0) });
  }

  if (req.method === 'GET' && p.startsWith(BASE + '/img/')) {
    const id = p.slice((BASE + '/img/').length).replace(/\.webp$/, '');
    const it = /^[a-f0-9]{20}$/.test(id) ? store.get(id) : null;
    if (!it || it.status === 'rejected') return send(res, 404, shell('No encontrada', '<p>No encontrada.</p>'));
    const th = url.searchParams.get('t') === '1';
    const file = it.status === 'approved' ? store.publicPath(th ? it.pub.thumb : it.pub.full) : store.pendingPath(it.id, th);
    fs.readFile(file, (err, buf) => {
      if (err) return send(res, 404, shell('No encontrada', '<p>No encontrada.</p>'));
      res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex', 'Content-Security-Policy': "default-src 'none'" });
      res.end(buf);
    });
    return;
  }

  if (req.method === 'GET' && (p === BASE)) {
    const tab = ['pending', 'approved', 'rejected'].includes(url.searchParams.get('tab')) ? url.searchParams.get('tab') : 'pending';
    return send(res, 200, list(s, tab, url.searchParams.get('ok') ? 'Hecho: ' + url.searchParams.get('ok') : ''));
  }

  if (req.method === 'POST' && p === BASE + '/accion') {
    const f = await readForm(req);
    if (!sameOrigin(req) || !sec.safeEq(f.csrf || '', csrfOf(s))) return send(res, 403, shell('Error', '<p>Solicitud no válida (CSRF).</p>'));
    const it = /^[a-f0-9]{20}$/.test(f.id || '') ? store.get(f.id) : null;
    if (!it) return send(res, 404, shell('Error', '<p>Captura no encontrada.</p>'));
    const op = f.op;
    if (op === 'reject' && it.status === 'pending') {
      store.removeFiles(it); it.status = 'rejected'; it.reason = require('./validate').clean(f.reason, 120); it.updatedAt = Date.now();
      await store.put(it); return redirect(res, BASE + '/?tab=pending&ok=rechazada');
    }
    if ((op === 'feature' || op === 'unfeature') && it.status === 'approved') {
      store.all().forEach(x => { if (x.featured && x.id !== it.id) { x.featured = false; } });
      it.featured = op === 'feature'; it.updatedAt = Date.now();
      await store.put(it); return redirect(res, BASE + '/?tab=approved&ok=' + (op === 'feature' ? 'destacada' : 'destacada quitada'));
    }
    if (op === 'remove' && it.status === 'approved') {
      store.removeFiles(it); it.status = 'rejected'; it.reason = 'retirada'; it.updatedAt = Date.now(); it.pub = null;
      await store.put(it); return redirect(res, BASE + '/?tab=approved&ok=retirada');
    }
    if ((op === 'approve' && it.status === 'pending') || (op === 'save' && it.status === 'approved')) {
      const v = validate({ alias: f.alias, especie: f.especie, provincia: f.provincia, zona: f.zona, peso: f.peso, longitud: f.longitud, suelta: f.suelta, comentario: f.comentario, otra: f.otra, consent: 'on', legal: 'on' });
      if (!v.ok) return send(res, 400, shell('Error', '<h1>Datos no válidos</h1><ul>' + v.errors.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul><p><a href="' + BASE + '/">Volver</a></p>'));
      if (op === 'approve' && !(f.c1 && f.c2 && f.c3)) return send(res, 400, shell('Error', '<h1>Falta la comprobación</h1><p>Marca los tres puntos de la lista antes de aprobar.</p><p><a href="' + BASE + '/">Volver</a></p>'));
      const x = v.value;
      Object.assign(it, { alias: x.alias, species: x.species, speciesOther: x.other, province: x.province, zone: x.zone, weightKg: x.weightKg, lengthCm: x.lengthCm, released: x.released, comment: x.comment, updatedAt: Date.now() });
      if (op === 'approve') approve(it);
      await store.put(it);
      return redirect(res, BASE + '/?tab=' + (op === 'approve' ? 'pending' : 'approved') + '&ok=' + (op === 'approve' ? 'aprobada y publicada' : 'guardada'));
    }
    return send(res, 400, shell('Error', '<p>Operación no válida para el estado actual.</p>'));
  }
  return send(res, 404, shell('No encontrada', '<p>No encontrada.</p>'));
}
module.exports = { handle, BASE, adminHeaders };
