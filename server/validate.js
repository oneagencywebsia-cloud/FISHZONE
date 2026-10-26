'use strict';
const { SPECIES_BY_ID, PROVINCES } = require('./species');

const URLISH = /(https?:|www\.|\b[\w-]+\.(com|es|net|org|io|me|ly|info|xyz|ru|cn|tk|shop|site|online)\b|@\w|\b\d{9}\b|t\.me|wa\.me|bit\.ly)/i;
const clean = (s, max) => String(s == null ? '' : s).normalize('NFKC')
  .replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩﻿]/g, ' ')
  .replace(/\s+/g, ' ').trim().slice(0, max);
const num = (s, min, max, dec) => {
  const t = String(s == null ? '' : s).trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  if (!isFinite(n) || n < min || n > max) return NaN;
  return Math.round(n * dec) / dec;
};

/* Devuelve { ok, errors[], value }. Todo lo que llega del cliente se trata como hostil. */
function validate(f) {
  const errors = [];
  const v = {};
  v.alias = clean(f.alias, 24);
  if (!/^[\p{L}\p{N} ._-]{2,24}$/u.test(v.alias) || URLISH.test(v.alias)) errors.push('Indica un alias de 2 a 24 caracteres (letras, números, espacio, punto, guion). No uses enlaces ni contactos.');
  const sp = SPECIES_BY_ID[clean(f.especie, 30)];
  if (!sp) errors.push('Elige la especie.'); else v.species = sp.id;
  v.province = clean(f.provincia, 20);
  if (PROVINCES.indexOf(v.province) < 0) errors.push('Elige la provincia.');
  v.zone = clean(f.zona, 60);
  if (v.zone && (!/^[\p{L}\p{N} .,'()/\-ºª]{1,60}$/u.test(v.zone) || URLISH.test(v.zone) || /\d{1,2}[.,]\d{3,}/.test(v.zone))) errors.push('La zona solo admite el nombre del embalse, río o playa (sin coordenadas ni enlaces).');
  v.weightKg = num(f.peso, 0.1, 80, 10);
  if (Number.isNaN(v.weightKg)) errors.push('El peso debe estar entre 0,1 y 80 kg.');
  v.lengthCm = num(f.longitud, 5, 250, 1);
  if (Number.isNaN(v.lengthCm)) errors.push('La longitud debe estar entre 5 y 250 cm.');
  v.released = f.suelta === 'on' || f.suelta === '1';
  v.comment = clean(f.comentario, 240);
  if (v.comment && URLISH.test(v.comment)) errors.push('El comentario no puede incluir enlaces, correos ni teléfonos.');
  if (f.consent !== 'on') errors.push('Debes aceptar la publicación de la foto en FishZone.');
  if (f.legal !== 'on') errors.push('Debes confirmar que la foto es tuya y la captura es legal.');
  return { ok: errors.length === 0, errors, value: v };
}
module.exports = { validate, clean, URLISH };
