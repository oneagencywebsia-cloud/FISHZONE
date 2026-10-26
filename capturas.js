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
  var other = f.querySelector('.cap-other');
  function toggleOther() { var c = f.querySelector('input[name=especie]:checked'); var on = c && /^otra-/.test(c.value); if (other) other.hidden = !on; }
  f.querySelectorAll('input[name=especie]').forEach(function (r) { r.addEventListener('change', toggleOther); }); toggleOther();
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
    downscale(fl).then(function (b) { if (file.files[0] === fl) blob = b; });
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
          var sel = f.querySelector('input[name=especie]:checked');
          ev('fz_captura_enviada', { especie: sel && sel.value });
          var wa = 'https://wa.me/?text=' + encodeURIComponent('Acabo de enviar mi captura a FishZone 🎣 https://fishzone.es/capturas/');
          var guide = sel && sel.getAttribute('data-guide');
          var box = document.createElement('div'); box.className = 'cap-ok'; box.setAttribute('role', 'status');
          box.innerHTML = '<strong>🎉 ¡Captura enviada!</strong> La revisaremos en unos días y, si cumple las normas, aparecerá en la galería con tu alias.' +
            '<div class="cap-next"><a class="cap-btn" target="_blank" rel="noopener" data-cta="share"></a>' +
            '<a class="cap-alt" href="/capturas/"></a>' + (guide ? '<a class="cap-alt" data-guide></a>' : '') + '</div>';
          var ws = box.querySelector('a.cap-btn'); ws.href = wa; ws.textContent = 'Compartir por WhatsApp';
          box.querySelectorAll('a.cap-alt')[0].textContent = 'Ver capturas de otros pescadores';
          var g = box.querySelector('a[data-guide]'); if (g) { g.href = guide; g.textContent = 'Leer la guía de ' + sel.getAttribute('data-label').toLowerCase(); }
          f.parentNode.replaceChild(box, f); box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try { if (window.FZ && FZ.award) FZ.award('captura', 20, '📸 ¡Captura enviada!'); } catch (e2) {}
        } else {
          var li = (j.errors || ['No se ha podido enviar.']).map(function (t) { var s = document.createElement('li'); s.textContent = t; return s.outerHTML; }).join('');
          show('<strong>Revisa esto:</strong><ul>' + li + '</ul>');
          btn.disabled = false; btn.textContent = old;
        }
      })
      .catch(function () { show('<strong>No hemos podido enviar la captura.</strong> Comprueba tu conexión e inténtalo de nuevo.'); btn.disabled = false; btn.textContent = old; });
  });
})();
