'use strict';
const sharp = require('sharp');
const cfg = require('./config');

sharp.cache(false);
sharp.concurrency(1);

let busy = 0;
const waiters = [];
async function slot() {
  if (busy >= 2) await new Promise(r => waiters.push(r));
  busy++;
}
function release() { busy--; const n = waiters.shift(); if (n) n(); }

function sniff(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

/* Valida (firma real, no la extensión ni el Content-Type), reorienta, elimina TODOS los metadatos
   (EXIF/GPS, miniaturas, perfil de cámara) y reencoda a WebP. Devuelve versión completa y miniatura. */
async function process(buf) {
  if (!sniff(buf)) { const e = new Error('Formato no válido. Sube una foto JPG, PNG o WebP.'); e.user = true; throw e; }
  await slot();
  try {
    const base = () => sharp(buf, { limitInputPixels: 40e6, failOn: 'error', animated: false });
    const meta = await base().metadata();
    if (!meta.width || !meta.height || meta.width < 400 || meta.height < 300) { const e = new Error('La foto es demasiado pequeña (mínimo 400×300 px).'); e.user = true; throw e; }
    const full = await base().rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toBuffer({ resolveWithObject: true });
    const thumb = await sharp(full.data).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 72, effort: 4 }).toBuffer({ resolveWithObject: true });
    return { full: full.data, fw: full.info.width, fh: full.info.height, thumb: thumb.data, tw: thumb.info.width, th: thumb.info.height };
  } catch (err) {
    if (err.user) throw err;
    const e = new Error('No hemos podido leer la imagen. Prueba con otra foto (JPG, PNG o WebP).'); e.user = true; throw e;
  } finally { release(); }
}
module.exports = { process, sniff };
