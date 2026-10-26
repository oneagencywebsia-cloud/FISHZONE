/* FishZone · Capturas de la comunidad: visor de fotos y envío mejorado.
   Sin este script el formulario sigue funcionando (envío normal del navegador). */
(function () {
  'use strict';
  function ev(n, p) { try { if (typeof gtag === 'function') gtag('event', n, p || {}); } catch (e) {} }

  /* Visor */
  var dlg = null;
  function open(a) {
    if (!window.HTMLDialogElement) return false;
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'cap-lb'; dlg.setAttribute('aria-label', 'Foto ampliada');
      dlg.innerHTML = '<button type="button" aria-label="Cerrar">Cerrar ✕</button><img alt="" /><p></p>';
      dlg.querySelector('button').onclick = function () { dlg.close(); };
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      document.body.appendChild(dlg);
    }
    var img = dlg.querySelector('img'); img.src = a.getAttribute('data-full'); img.alt = a.getAttribute('data-alt') || '';
    dlg.querySelector('p').textContent = a.getAttribute('data-alt') || '';
    dlg.showModal(); ev('fz_captura_ver');
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.cap-open');
    if (a && open(a)) e.preventDefault();
  });

  /* Formulario */
  var f = document.querySelector('form.cap-form');
  if (!f) return;
  var file = f.querySelector('input[type=file]'), prev = f.querySelector('.cap-preview'), pimg = prev && prev.querySelector('img');
  var btn = f.querySelector('button[type=submit]'), blob = null, MAX = 2000;

  function downscale(fl) {
    return new Promise(function (res) {
      if (!window.createImageBitmap || fl.size < 1.6 * 1024 * 1024) return res(null);
      createImageBitmap(fl, { imageOrientation: 'from-image' }).then(function (bm) {
        var s = Math.min(1, MAX / Math.max(bm.width, bm.height));
        var c = document.createElement('canvas'); c.width = Math.round(bm.width * s); c.height = Math.round(bm.height * s);
        c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
        c.toBlob(function (b) { res(b && b.size < fl.size ? b : null); }, 'image/jpeg', 0.86);
      }).catch(function () { res(null); });
    });
  }
  file.addEventListener('change', function () {
    blob = null; var fl = file.files && file.files[0];
    if (!fl) { if (prev) prev.hidden = true; return; }
    if (prev && pimg) { pimg.src = URL.createObjectURL(fl); prev.hidden = false; }
    downscale(fl).then(function (b) { blob = b; });
  });

  function show(html, cls) {
    var box = f.querySelector('.cap-msg');
    if (!box) { box = document.createElement('div'); box.className = 'cap-msg'; box.setAttribute('role', 'alert'); f.insertBefore(box, f.firstChild); }
    box.className = 'cap-msg ' + (cls || 'cap-errors'); box.innerHTML = html; box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  f.addEventListener('submit', function (e) {
    if (!window.fetch || !window.FormData) return;
    e.preventDefault();
    var fd = new FormData(f);
    if (blob) fd.set('foto', blob, 'captura.jpg');
    btn.disabled = true; var old = btn.textContent; btn.textContent = 'Enviando…';
    fetch(f.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, errors: ['Error de red. Inténtalo de nuevo.'] }; }); })
      .then(function (j) {
        if (j.ok) {
          ev('fz_captura_enviada', { especie: f.especie && f.especie.value });
          f.outerHTML = '<div class="cap-ok" role="status"><strong>¡Gracias!</strong> Hemos recibido tu captura. La revisaremos en unos días y, si cumple las normas, aparecerá en la galería.</div>';
        } else {
          var li = (j.errors || ['No se ha podido enviar.']).map(function (t) { var s = document.createElement('li'); s.textContent = t; return s.outerHTML; }).join('');
          show('<strong>Revisa esto:</strong><ul>' + li + '</ul>');
          btn.disabled = false; btn.textContent = old;
        }
      })
      .catch(function () { show('<strong>No hemos podido enviar la captura.</strong> Comprueba tu conexión e inténtalo de nuevo.'); btn.disabled = false; btn.textContent = old; });
  });
})();
