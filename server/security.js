'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

let secret = null;
function loadSecret() {
  if (secret) return secret;
  if (cfg.SESSION_SECRET && cfg.SESSION_SECRET.length >= 24) { secret = Buffer.from(cfg.SESSION_SECRET); return secret; }
  const p = path.join(cfg.DATA_DIR, '.secret');
  try { secret = Buffer.from(fs.readFileSync(p, 'utf8').trim(), 'hex'); if (secret.length >= 32) return secret; } catch (e) { /* se crea abajo */ }
  secret = crypto.randomBytes(32);
  fs.writeFileSync(p, secret.toString('hex'), { mode: 0o600 });
  return secret;
}
const b64 = b => Buffer.from(b).toString('base64url');
function hmac(data) { return crypto.createHmac('sha256', loadSecret()).update(data).digest('base64url'); }
function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function sign(payload) { const p = b64(JSON.stringify(payload)); return p + '.' + hmac(p); }
function verify(token) {
  if (typeof token !== 'string' || token.length > 600) return null;
  const i = token.lastIndexOf('.'); if (i < 1) return null;
  const p = token.slice(0, i);
  if (!safeEq(token.slice(i + 1), hmac(p))) return null;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString('utf8')); } catch (e) { return null; }
}
function hashPassword(pw) { return crypto.createHash('sha256').update(String(pw)).digest(); }
function checkPassword(pw) {
  if (!cfg.ADMIN_PASSWORD) return false;
  return crypto.timingSafeEqual(hashPassword(pw), hashPassword(cfg.ADMIN_PASSWORD));
}
function ipHash(ip) { return hmac('ip:' + ip).slice(0, 22); }

/* Limitador en memoria (ventana deslizante). */
function limiter(max, windowMs) {
  const hits = new Map();
  return {
    take(key) {
      const now = Date.now(), arr = (hits.get(key) || []).filter(t => now - t < windowMs);
      if (arr.length >= max) { hits.set(key, arr); return false; }
      arr.push(now); hits.set(key, arr);
      if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
      return true;
    },
    peek(key) { const now = Date.now(); return (hits.get(key) || []).filter(t => now - t < windowMs).length; },
    clear(key) { hits.delete(key); }
  };
}

function parseCookies(h) {
  const out = {};
  String(h || '').split(';').forEach(c => { const i = c.indexOf('='); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); });
  return out;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
/* JSON seguro para incrustar en <script type="application/ld+json">. */
function jsonLd(o) { return JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028|\u2029/g, ''); }

module.exports = { loadSecret, sign, verify, checkPassword, ipHash, limiter, parseCookies, esc, jsonLd, safeEq, hmac, rand: n => crypto.randomBytes(n).toString('hex') };
