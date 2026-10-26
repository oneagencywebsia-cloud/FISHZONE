'use strict';
/* Configuración del servicio de capturas. Todo se controla por variables de entorno. */
const path = require('path');

const env = process.env;
module.exports = {
  PORT: parseInt(env.PORT || '3000', 10),
  HOST: env.HOST || '127.0.0.1',
  DATA_DIR: env.DATA_DIR || path.join(__dirname, 'data'),
  SITE_URL: (env.SITE_URL || 'https://fishzone.es').replace(/\/$/, ''),
  ADMIN_PASSWORD: env.ADMIN_PASSWORD || '',
  SESSION_SECRET: env.SESSION_SECRET || '',
  NOTIFY_URL: env.NOTIFY_URL || '',           // opcional: aviso (POST text/plain) al llegar una captura (p. ej. ntfy)
  MIN_INDEXABLE: parseInt(env.MIN_INDEXABLE || '6', 10), // mínimo de capturas aprobadas para indexar la galería
  PAGE_SIZE: 24,
  MAX_PENDING: parseInt(env.MAX_PENDING || '150', 10),
  MAX_UPLOAD_BYTES: 8 * 1024 * 1024,
  RETAIN_REJECTED_DAYS: 30,
  RETAIN_IPHASH_DAYS: 30
};
