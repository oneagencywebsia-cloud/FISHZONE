# Capturas de la comunidad (servicio Node)

Servicio de subida, moderación y galería de capturas. Corre dentro del mismo contenedor que nginx
(escucha en `127.0.0.1:3000`; nginx hace de proxy en `/capturas/`, `/api/`, `/admin/` y sirve las fotos públicas en `/u/`).

## Variables de entorno (EasyPanel → Entorno)
| Variable | Obligatoria | Descripción |
|---|---|---|
| `ADMIN_PASSWORD` | **Sí** | Contraseña del panel `/admin/capturas/` (mín. 12 caracteres). Sin ella el panel queda desactivado. |
| `SESSION_SECRET` | No | Secreto de sesión (≥24 caracteres). Si falta, se genera uno y se guarda en `/data/.secret`. |
| `NOTIFY_URL` | No | URL a la que se hace `POST` (texto) al llegar una captura nueva, p. ej. un tema de ntfy.sh. |
| `MIN_INDEXABLE` | No | Capturas aprobadas mínimas para que la galería sea indexable (por defecto 6). |
| `MAX_PENDING` | No | Máximo de capturas pendientes de revisar (por defecto 150). |

## Persistencia
Monta un **volumen persistente en `/data`** (EasyPanel → Montajes). Contiene `db.json`, `pending/` (privado) y `public/` (fotos aprobadas).

## Seguridad
- Moderación previa: nada se publica sin aprobación; las fotos pendientes no son accesibles públicamente.
- Las fotos se reencodan a WebP (se eliminan EXIF/GPS) con límites de tamaño y de píxeles; se valida la firma real del archivo.
- Panel sin JavaScript, CSP estricta, sesión firmada (cookie `HttpOnly`, `Secure`, `SameSite=Strict`), CSRF, límite de intentos de acceso.
- Anti-spam: honeypot, token temporal, límites por IP en nginx y en la aplicación, sin enlaces ni contactos en texto.
- RGPD: alias + foto; hash anónimo de IP durante 30 días; rechazadas se borran al momento.

## SEO / AEO
- Galería renderizada en servidor con `ImageGallery`, `FAQPage` y `BreadcrumbList`; `/sitemap-capturas.xml` con imágenes.
- Guardarraíl: `noindex` hasta tener `MIN_INDEXABLE` capturas (global y por especie). Sin AdSense en estas páginas.
