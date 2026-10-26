#!/bin/sh
# Arranque: servicio de capturas (Node, reiniciable) + nginx en primer plano.
# Si el servicio de capturas fallara, el resto del sitio estático sigue sirviéndose.
set -eu
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR/public" "$DATA_DIR/pending"
chown -R app:app "$DATA_DIR" 2>/dev/null || echo "[fz] aviso: no se pudo cambiar el propietario de $DATA_DIR"
chmod 755 "$DATA_DIR" "$DATA_DIR/public" 2>/dev/null || true
chmod 700 "$DATA_DIR/pending" 2>/dev/null || true
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "[fz] AVISO: ADMIN_PASSWORD no está definida; el panel de moderación queda desactivado."
elif [ "${#ADMIN_PASSWORD}" -lt 12 ]; then
  echo "[fz] AVISO: ADMIN_PASSWORD tiene menos de 12 caracteres; usa una contraseña más larga."
fi
(
  while true; do
    su-exec app:app node /app/server.js || true
    echo "[fz] servicio de capturas detenido; reiniciando en 3 s"
    sleep 3
  done
) &
exec nginx -g 'daemon off;'
