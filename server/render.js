'use strict';
/* Plantillas públicas. HTML renderizado en servidor (indexable) con el mismo esqueleto que el resto del sitio. */
const fs = require('fs');
const path = require('path');
const cfg = require('./config');
const { esc, jsonLd } = require('./security');
const { SPECIES, SPECIES_BY_ID, PROVINCES } = require('./species');

const HEAD = fs.readFileSync(path.join(__dirname, 'shell-head.html'), 'utf8');
const TAIL = fs.readFileSync(path.join(__dirname, 'shell-tail.html'), 'utf8');
const CSS_V = { guia: '20261026', ios: '20261012', scenes: '20261011', capturas: '20261026' };
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fmtDate = t => { const d = new Date(t); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
const isoDate = t => new Date(t).toISOString().slice(0, 10);
const num = n => (Math.round(Number(n) * 10) / 10).toString().replace('.', ',');
const url = p => cfg.SITE_URL + p;

function slugify(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'captura';
}
function placeOf(it) { return (it.zone ? it.zone + ' (' + it.province + ')' : it.province); }
/* alt generado SOLO con campos controlados (especie, peso, zona saneada): nunca con el comentario libre. */
function altOf(it) {
  const sp = SPECIES_BY_ID[it.species];
  const f = !!sp.f;
  return sp.label + (it.weightKg ? ' de ' + num(it.weightKg) + ' kg' : '') + (f ? ' capturada en ' : ' capturado en ') + placeOf(it) + (it.released ? (f ? ', devuelta al agua' : ', devuelto al agua') : '');
}

function layout(o) {
  const robots = o.robots || 'index, follow, max-image-preview:large';
  const canonical = o.canonical ? '<link rel="canonical" href="' + esc(o.canonical) + '" />\n' : '';
  const og = o.canonical ? (
    '<meta property="og:type" content="website" />\n<meta property="og:title" content="' + esc(o.ogTitle || o.title) + '" />\n' +
    '<meta property="og:description" content="' + esc(o.desc) + '" />\n<meta property="og:url" content="' + esc(o.canonical) + '" />\n' +
    '<meta property="og:image" content="' + esc(o.ogImage || url('/og-image.jpg')) + '" />\n<meta property="og:locale" content="es_ES" />\n') : '';
  return HEAD +
    '<title>' + esc(o.title) + '</title>\n' +
    '<meta name="description" content="' + esc(o.desc) + '" />\n' +
    '<meta name="robots" content="' + robots + '" />\n' + canonical +
    '<meta name="theme-color" content="#0a0f1e" />\n<link rel="icon" href="/favicon.ico" sizes="any" />\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n' + og +
    '<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />\n' +
    '<link rel="stylesheet" href="/guia.css?v=' + CSS_V.guia + '" /><link rel="stylesheet" href="/capturas.css?v=' + CSS_V.capturas + '" /><link rel="stylesheet" href="/ios.css?v=' + CSS_V.ios + '" /><script src="/ios.js?v=20261009" defer></script><script src="/engage.js?v=20261026b" defer></script>\n' +
    (o.ld ? '<script type="application/ld+json">\n' + jsonLd(o.ld) + '\n</script>\n' : '') +
    '<link rel="stylesheet" href="/scenes.css?v=' + CSS_V.scenes + '" />\n</head>\n<body>\n' +
    '<div class="fz-scene" aria-hidden="true"><div class="sc on" data-scene="zona"></div></div>\n' +
    '<nav class="gz-nav">\n  <img src="/logotipo-150-v3.webp" alt="FishZone" width="36" height="36" />\n  <span class="brand">Fish<span>Zone</span></span>\n  <a class="home" href="/">← Inicio</a>\n</nav>\n' +
    o.body + '\n' + TAIL;
}

const FAQ = [
  ['¿Puedo subir una foto de mi captura a FishZone?', 'Sí. Cualquier pescador puede enviar la foto de una captura hecha en Andalucía con el formulario de esta página. Cada envío lo revisa la redacción antes de publicarse, así que no aparece al momento.'],
  ['¿Cuánto tarda en aprobarse una captura?', 'Normalmente unos días. Revisamos que la foto sea tuya, que se vea bien la captura y que la especie y la forma de pescarla respeten la normativa vigente. Si no se publica, no guardamos la imagen.'],
  ['¿Se publica el lugar exacto donde pesqué?', 'No. Solo mostramos la provincia y, si tú lo indicas, el nombre del embalse, río o playa. Eliminamos de la foto todos los metadatos, incluidas las coordenadas GPS, y no admitimos coordenadas en el texto.'],
  ['¿Qué capturas no se publican?', 'Las de especies prohibidas, las que incumplen la veda, la talla o el periodo hábil, los peces maltratados, las fotos con personas reconocibles sin su permiso y cualquier imagen con enlaces, publicidad o datos de contacto.'],
  ['¿Qué datos personales guardáis?', 'El alias que elijas, la foto y los datos de la captura. Para evitar abusos guardamos un código anónimo de tu conexión durante 30 días, sin tu dirección IP. Puedes pedir que retiremos tu foto escribiendo a contacto@fishzone.es.']
];

function speciesChips(counts, active) {
  const chips = ['<a class="cap-chip' + (active ? '' : ' on') + '" href="/capturas/">Todas</a>'];
  SPECIES.forEach(s => { if (counts[s.id]) chips.push('<a class="cap-chip' + (active === s.id ? ' on' : '') + '" href="/capturas/' + s.id + '/">' + esc(s.label) + ' <span>' + counts[s.id] + '</span></a>'); });
  return '<div class="cap-chips" role="navigation" aria-label="Filtrar por especie">' + chips.join('') + '</div>';
}

function card(it, eager) {
  const sp = SPECIES_BY_ID[it.species];
  const full = '/u/' + it.pub.full, thumb = '/u/' + it.pub.thumb;
  const bits = [];
  if (it.weightKg) bits.push(num(it.weightKg) + ' kg');
  if (it.lengthCm) bits.push(num(it.lengthCm) + ' cm');
  return '<figure class="cap-card"><a href="' + esc(full) + '" class="cap-open" data-full="' + esc(full) + '" data-alt="' + esc(altOf(it)) + '">' +
    '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' ' + it.tw + 'w, ' + esc(full) + ' ' + it.fw + 'w" sizes="(max-width:640px) 92vw, 360px" width="' + it.tw + '" height="' + it.th + '" alt="' + esc(altOf(it)) + '" ' +
    (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" /></a>' +
    '<figcaption><strong>' + esc(sp.label) + '</strong>' + (bits.length ? ' · ' + bits.join(' · ') : '') +
    '<span class="cap-where">' + esc(placeOf(it)) + '</span>' +
    (it.pioneer ? '<span class="cap-tag cap-tag-gold">🏅 Pionero</span> ' : '') + (it.released ? '<span class="cap-tag">Devuelta al agua</span>' : '') +
    (it.comment ? '<p class="cap-note">' + esc(it.comment) + '</p>' : '') +
    '<span class="cap-by">Foto de ' + esc(it.alias) + ' · ' + fmtDate(it.approvedAt) + '</span>' +
    ' <a class="cap-guide" href="' + esc(sp.guide) + '">Guía: ' + esc(sp.label.toLowerCase()) + '</a></figcaption></figure>';
}

function formHtml(token, errors, values, pioneerLeft) {
  values = values || {};
  const v = k => esc(values[k] || '');
  const prov = PROVINCES.map(x => '<option value="' + esc(x) + '"' + (x === values.provincia ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
  const chips = SPECIES.map(s => '<label class="cap-sp-opt"><input type="radio" name="especie" value="' + s.id + '" data-guide="' + esc(s.guide) + '" data-label="' + esc(s.label) + '"' + (values.especie === s.id ? ' checked' : '') + ' required /><span>' + esc(s.label) + '</span></label>').join('');
  return '<section id="enviar" class="cap-form-wrap" aria-labelledby="enviar-h">\n<h2 id="enviar-h">📸 Envía tu captura</h2>\n' +
    '<p class="cap-lead">Tarda unos <strong>30 segundos</strong>. Sin registro, sin enlaces y sin coordenadas: nunca publicamos tu ubicación exacta.</p>\n' +
    (pioneerLeft > 0 ? '<p class="cap-pioneer">🏅 <strong>Quedan ' + pioneerLeft + ' insignias Pionero</strong> para las primeras capturas aprobadas de la comunidad.</p>\n' : '') +
    (errors && errors.length ? '<div class="cap-errors" role="alert"><strong>Revisa esto:</strong><ul>' + errors.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul></div>\n' : '') +
    '<form class="cap-form" method="post" action="/capturas/enviar" enctype="multipart/form-data" novalidate>\n' +
    '<input type="hidden" name="t" value="' + esc(token) + '" />\n' +
    '<div class="cap-hp" aria-hidden="true"><label>No rellenar este campo<input type="text" name="web" tabindex="-1" autocomplete="off" /></label></div>\n' +
    '<fieldset class="cap-step"><legend><span class="n">1</span> ¿Qué has pescado?</legend><div class="cap-sp-grid">' + chips + '</div></fieldset>\n' +
    '<fieldset class="cap-step"><legend><span class="n">2</span> Tu foto</legend>' +
    '<label class="cap-file"><span class="cap-drop">📷 Elegir o hacer una foto <small>(JPG, PNG o WebP · máx. 8 MB)</small></span><input type="file" name="foto" accept="image/jpeg,image/png,image/webp" required /></label>\n' +
    '<div class="cap-preview" hidden><img alt="Vista previa de tu foto" /><p>Así se verá tu captura. Eliminamos la ubicación GPS de la foto.</p></div></fieldset>\n' +
    '<fieldset class="cap-step"><legend><span class="n">3</span> Cuéntanos un poco</legend>' +
    '<div class="cap-row"><label>Provincia<select name="provincia" required><option value="">Elige…</option>' + prov + '</select></label>' +
    '<label>Tu alias <small>(se publica con la foto)</small><input type="text" name="alias" required minlength="2" maxlength="24" value="' + v('alias') + '" autocomplete="nickname" /></label></div>\n' +
    '<label>Embalse, río o playa <small>(opcional, sin coordenadas)</small><input type="text" name="zona" maxlength="60" value="' + v('zona') + '" placeholder="Ej.: Embalse de Iznájar" /></label>\n' +
    '<div class="cap-row"><label>Peso (kg) <small>(opcional)</small><input type="text" inputmode="decimal" name="peso" maxlength="5" value="' + v('peso') + '" /></label>' +
    '<label>Longitud (cm) <small>(opcional)</small><input type="text" inputmode="decimal" name="longitud" maxlength="5" value="' + v('longitud') + '" /></label></div>\n' +
    '<label>Comentario <small>(opcional · máx. 240 caracteres · sin enlaces)</small><textarea name="comentario" rows="3" maxlength="240" placeholder="Cebo, montaje, cómo fue la pelea…">' + v('comentario') + '</textarea></label>\n' +
    '<label class="cap-check"><input type="checkbox" name="suelta" value="on"' + (values.suelta === 'on' ? ' checked' : '') + ' /> La devolví al agua</label></fieldset>\n' +
    '<label class="cap-check"><input type="checkbox" name="legal" value="on" required /> La foto es mía, la captura es legal (especie, talla y periodo) y no aparecen personas reconocibles sin su permiso.</label>\n' +
    '<label class="cap-check"><input type="checkbox" name="consent" value="on" required /> Acepto que FishZone publique la foto y mi alias en esta web. He leído la <a href="/privacidad.html">política de privacidad</a>.</label>\n' +
    '<button type="submit" class="cap-btn cap-btn-lg">📸 Enviar mi captura</button>\n' +
    '<ul class="cap-trust"><li>✔ Sin registro</li><li>✔ Revisión humana en pocos días</li><li>✔ Tu ubicación exacta nunca se publica</li></ul>\n' +
    '<p class="cap-fine">Tratamiento: FishZone. Finalidad: publicar tu captura previa revisión. Base legal: tu consentimiento. Conservamos la foto mientras esté publicada; puedes pedir su retirada en <a href="mailto:contacto@fishzone.es">contacto@fishzone.es</a>.</p>\n' +
    '</form>\n</section>';
}

function featuredBlock(it) {
  const sp = SPECIES_BY_ID[it.species];
  const full = '/u/' + it.pub.full, thumb = '/u/' + it.pub.thumb;
  return '<section class="cap-featured" aria-labelledby="destacada-h"><h2 id="destacada-h">⭐ Captura de la semana</h2><figure class="cap-card cap-card-big"><a href="' + esc(full) + '" class="cap-open" data-full="' + esc(full) + '" data-alt="' + esc(altOf(it)) + '">' +
    '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' ' + it.tw + 'w, ' + esc(full) + ' ' + it.fw + 'w" sizes="(max-width:760px) 92vw, 640px" width="' + it.tw + '" height="' + it.th + '" alt="' + esc(altOf(it)) + '" fetchpriority="high" decoding="async" /></a>' +
    '<figcaption><strong>' + esc(altOf(it)) + '</strong><span class="cap-by">Foto de ' + esc(it.alias) + ' · elegida por la redacción de FishZone</span>' +
    (it.comment ? '<p class="cap-note">' + esc(it.comment) + '</p>' : '') + '<a class="cap-guide" href="' + esc(sp.guide) + '">Guía: ' + esc(sp.label.toLowerCase()) + '</a></figcaption></figure></section>';
}

function gallery(ctx) {
  const { items, total, counts, page, pages, species, indexable, token, errors, values, approvedTotal, featured, pioneerLeft } = ctx;
  const sp = species ? SPECIES_BY_ID[species] : null;
  const path_ = sp ? '/capturas/' + sp.id + '/' : '/capturas/';
  const canonical = url(path_ + (page > 1 ? '?p=' + page : ''));
  const title = sp ? 'Capturas de ' + sp.label.toLowerCase() + ' en Andalucía: fotos de la comunidad' : 'Capturas de pesca en Andalucía: galería de la comunidad';
  const desc = sp
    ? 'Fotos reales de ' + sp.label.toLowerCase() + (sp.f ? ' capturadas' : ' capturados') + ' en Andalucía por pescadores de FishZone, con zona y datos. Revisadas por la redacción. Sube la tuya.'
    : 'Galería de capturas reales de pescadores en Andalucía: black bass, carpa, barbo, lubina y más. Fotos revisadas por la redacción. Sube la tuya.';
  const robots = (indexable && !(sp && /^otra-/.test(sp.id))) ? 'index, follow, max-image-preview:large' : 'noindex, follow';
  const first = items[0];
  const crumbLd = { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: url('/') }, { '@type': 'ListItem', position: 2, name: 'Capturas de la comunidad', item: url('/capturas/') }].concat(sp ? [{ '@type': 'ListItem', position: 3, name: sp.label, item: canonical }] : []) };
  const graph = [crumbLd];
  if (indexable && items.length) {
    graph.push({
      '@type': 'ImageGallery', '@id': canonical + '#galeria', name: title, description: desc, url: canonical, inLanguage: 'es-ES',
      isPartOf: { '@type': 'WebSite', name: 'FishZone', url: url('/') },
      image: items.map(it => ({
        '@type': 'ImageObject', contentUrl: url('/u/' + it.pub.full), thumbnailUrl: url('/u/' + it.pub.thumb), width: it.fw, height: it.fh,
        name: altOf(it), caption: altOf(it), uploadDate: isoDate(it.approvedAt), creditText: 'Foto de ' + it.alias + ' · FishZone',
        creator: { '@type': 'Person', name: it.alias }, contentLocation: { '@type': 'Place', name: placeOf(it) }
      }))
    });
  }
  if (!sp && page === 1) graph.push({ '@type': 'FAQPage', mainEntity: FAQ.map(q => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } })) });

  const topSpecies = SPECIES.filter(s => counts[s.id]).sort((a, b) => counts[b.id] - counts[a.id]).slice(0, 3).map(s => s.label.toLowerCase());
  const intro = sp
    ? '<p class="gz-lead">Estas son las capturas de ' + esc(sp.label.toLowerCase()) + ' que los pescadores de la comunidad han enviado desde Andalucía. ' + esc(sp.note) + ' Antes de salir, repasa la <a href="' + esc(sp.guide) + '">guía de ' + esc(sp.label.toLowerCase()) + '</a> y la <a href="/normativa-pesca-continental-andalucia.html">normativa vigente</a>.</p>'
    : '<p class="gz-lead">Aquí se reúnen las capturas reales que envían los pescadores de la comunidad FishZone: ' + (topSpecies.length ? esc(topSpecies.join(', ')) + ' y más, ' : '') + 'con la provincia, el embalse, río o playa y los datos que cada uno quiere compartir. Todas las fotos pasan por la revisión de la redacción antes de publicarse y no mostramos ubicaciones exactas.</p>' +
      '<div class="gz-answer"><strong>Respuesta rápida</strong><p>Para publicar tu captura, sube una foto, elige especie y provincia y envíala con el formulario de esta página. La revisamos en unos días: solo se aprueban capturas legales y sin datos de contacto, y nunca se publica la ubicación exacta.</p></div>';

  const empty = '<p class="cap-empty">Estamos reuniendo las primeras capturas de la comunidad. <strong>Sé el primero:</strong> <a href="#enviar">envía la tuya</a>.</p>';
  const grid = items.length ? '<div class="cap-grid">' + items.map((it, i) => card(it, i === 0 && page === 1)).join('') + '</div>' : empty;
  const pager = pages > 1 ? '<nav class="cap-pager" aria-label="Paginación">' +
    (page > 1 ? '<a rel="prev" href="' + path_ + (page > 2 ? '?p=' + (page - 1) : '') + '">← Anteriores</a>' : '') +
    '<span>Página ' + page + ' de ' + pages + '</span>' +
    (page < pages ? '<a rel="next" href="' + path_ + '?p=' + (page + 1) + '">Siguientes →</a>' : '') + '</nav>' : '';
  const stats = approvedTotal ? '<p class="cap-stats"><strong>' + approvedTotal + '</strong> captura' + (approvedTotal === 1 ? '' : 's') + ' publicada' + (approvedTotal === 1 ? '' : 's') + ' por la comunidad' + (sp ? ' · ' + total + ' de ' + esc(sp.label.toLowerCase()) : '') + '</p>' : '';
  const faq = (sp || page > 1) ? '' : '<section class="gz-faq">\n<h2 id="preguntas-frecuentes">Preguntas frecuentes</h2>\n' + FAQ.map(q => '<details><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>').join('\n') + '\n</section>';
  const rules = '<h2 id="normas">Qué capturas publicamos</h2>\n<ul class="cap-rules"><li><strong>Legales:</strong> especie, talla y periodo conformes a la <a href="/normativa-pesca-continental-andalucia.html">Orden de 13 de enero de 2023</a> (agua dulce) o al Decreto 205/2023 (mar).</li><li><strong>Respetuosas con el pez:</strong> manipulación cuidadosa y, cuando proceda, captura y suelta.</li><li><strong>Sin datos sensibles:</strong> sin coordenadas, enlaces, matrículas ni teléfonos, y sin personas reconocibles sin su permiso.</li><li><strong>Tuyas:</strong> solo fotos que hayas hecho tú.</li></ul>' +
    '<p>¿Dudas sobre qué puedes pescar? Consulta la <a href="/licencia-de-pesca-en-andalucia.html">guía de la licencia</a> y el <a href="/calendario-de-pesca-en-andalucia.html">calendario de pesca</a>.</p>';

  const body = '<header class="gz-hero"><div class="wrap"><div class="gz-eyebrow">Comunidad</div><h1>' + (sp ? 'Capturas de <span class="g">' + esc(sp.label.toLowerCase()) + '</span>' : 'Capturas de la <span class="g">comunidad</span>') + '</h1>' +
    '<p class="sub">Fotos reales de pescadores en Andalucía, revisadas por la redacción.</p>' +
    '<p class="cap-hero-cta"><a class="cap-btn cap-btn-lg" href="/capturas/#enviar" data-cta="gallery-hero">📸 Subir mi captura</a> <a class="cap-alt" href="#galeria">Ver capturas ↓</a></p>' +
    (pioneerLeft > 0 ? '<p class="cap-pioneer cap-pioneer-hero">🏅 Quedan <strong>' + pioneerLeft + '</strong> insignias Pionero para las primeras capturas aprobadas</p>' : '') +
    '<div class="gz-gold-line"></div></div></header>\n' +
    '<nav class="gz-crumb"><a href="/">Inicio</a> › ' + (sp ? '<a href="/capturas/">Capturas</a> › ' + esc(sp.label) : 'Capturas de la comunidad') + '</nav>\n' +
    '<main class="gz-wrap">\n' + intro + '\n' + stats + (featured && !sp && page === 1 ? featuredBlock(featured) : '') + '<span id="galeria"></span>' + speciesChips(counts, species) + '\n' + grid + '\n' + pager + '\n' +
    '<p class="cap-cta"><a class="cap-btn" href="#enviar">Subir mi captura</a></p>\n' + (sp ? '' : formHtml(token, errors, values, pioneerLeft)) + '\n' + rules + '\n' + faq + '\n' +
    (sp ? '<p class="cap-cta"><a class="cap-btn" href="/capturas/#enviar">Subir mi captura de ' + esc(sp.label.toLowerCase()) + '</a></p>' : '') +
    '<section class="gz-related"><h2 id="sigue-leyendo">Sigue leyendo</h2><div class="gz-rel-grid">' +
    '<a href="/guia-principiantes-pesca.html"><span class="k">Cómo empezar a pescar</span><span class="d">Guía para principiantes</span></a>' +
    '<a href="/licencia-de-pesca-en-andalucia.html"><span class="k">Licencia de pesca</span><span class="d">Tasas 2026 y trámite</span></a>' +
    '<a href="/calendario-de-pesca-en-andalucia.html"><span class="k">Calendario de pesca</span><span class="d">Qué pescar cada mes</span></a>' +
    '<a href="/embalses-de-andalucia.html"><span class="k">Embalses de Andalucía</span><span class="d">Normas y tramos</span></a></div></section>\n</main>\n' +
    '<script src="/capturas.js?v=' + CSS_V.capturas + '" defer></script>\n';
  return layout({ title, desc, robots, canonical, ogImage: first ? url('/u/' + first.pub.full) : null, ld: { '@context': 'https://schema.org', '@graph': graph }, body });
}

function simple(title, heading, htmlBody, robots) {
  const body = '<header class="gz-hero"><div class="wrap"><div class="gz-eyebrow">Comunidad</div><h1>' + heading + '</h1><div class="gz-gold-line"></div></div></header>\n<main class="gz-wrap">' + htmlBody + '</main>\n';
  return layout({ title, desc: title, robots: robots || 'noindex, follow', body });
}

module.exports = { gallery, simple, formHtml, layout, slugify, altOf, placeOf, isoDate, url, SPECIES };
