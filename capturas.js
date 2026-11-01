/* FishZone · Capturas de la comunidad: visor de fotos y envío fluido.
   Sin este script el formulario sigue funcionando (envío normal del navegador). */
(function () {
  'use strict';
  function ev(n, p) { try { if (typeof gtag === 'function') gtag('event', n, p || {}); } catch (e) {} }
  var MB = 1048576;

  /* ───────── Visor ───────── */
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

  /* ───────── Formulario ───────── */
  var f = document.querySelector('form.cap-form');
  if (!f) return;
  var $ = function (s, r) { return (r || f).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || f).querySelectorAll(s)); };
  var fileIn = $('input[type=file]'), drop = $('.cap-dz'), prev = $('.cap-preview'), pimg = $('.cap-pv-img img'), busy = $('.cap-pv-busy');
  var sendBtn = $('.cap-send'), prog = $('.cap-progress'), pbar = $('.cap-pbar'), ptxt = $('.cap-ptxt'), miss = $('.cap-missing'), other = $('.cap-other');
  var tokenIn = $('input[name=t]');
  var st = { blob: null, name: '', seq: 0, pending: null, xhr: null, sending: false, tokenAt: Date.now(), url: null };
  var MAX = 2000;

  function userErr(m) { var e = new Error(m); e.user = true; return e; }
  function fmt(b) { return b >= MB ? (b / MB).toFixed(1).replace('.', ',') + ' MB' : Math.round(b / 1024) + ' KB'; }

  /* Decodifica la foto (con la orientación EXIF correcta). */
  function viaImg(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), i = new Image();
      i.onload = function () { URL.revokeObjectURL(u); res(i); };
      i.onerror = function () { URL.revokeObjectURL(u); rej(new Error('decode')); };
      i.src = u;
    });
  }
  function loadBitmap(file) {
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return viaImg(file); });
    return viaImg(file);
  }
  /* Reduce a ≤2000 px y JPEG: una foto de móvil pasa de 6-12 MB a ~0,5-1,5 MB (la subida va mucho más rápida). */
  function prepare(file) {
    var okType = /^image\/(jpeg|png|webp)$/.test(file.type);
    if (file.type && !okType && !/^image\//.test(file.type)) return Promise.reject(userErr('Eso no parece una foto. Elige una imagen JPG, PNG o WebP.'));
    return loadBitmap(file).then(function (bm) {
      var w = bm.width || bm.naturalWidth, h = bm.height || bm.naturalHeight;
      if (w < 400 || h < 300) throw userErr('La foto es demasiado pequeña (mínimo 400×300 px).');
      var s = Math.min(1, MAX / Math.max(w, h));
      if (s === 1 && okType && file.size <= 1.5 * MB) return file;
      return new Promise(function (res) {
        var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
        c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
        c.toBlob(function (b) { res(b && (b.size < file.size || !okType) ? b : file); }, 'image/jpeg', 0.86);
      });
    }, function () {
      if (okType && file.size <= 8 * MB) return file; // el servidor decidirá
      throw userErr('No podemos leer esta foto. Si es de un iPhone, en Ajustes → Cámara → Formatos elige «Más compatible», o haz una captura de pantalla de la foto.');
    }).then(function (b) {
      if (b.size > 8 * MB) throw userErr('La foto sigue pesando demasiado (' + fmt(b.size) + '). Prueba con otra.');
      return b;
    });
  }

  /* ───────── Errores por campo y avance ───────── */
  function fieldErr(target, msg) {
    var holder = target.closest('label,fieldset,.cap-dz') || target;
    var p = holder.parentNode.querySelector(':scope > .cap-ferr[data-for="' + (target.name || 'x') + '"]');
    if (!msg) { if (p) p.remove(); holder.classList.remove('has-err'); return; }
    if (!p) { p = document.createElement('p'); p.className = 'cap-ferr'; p.setAttribute('data-for', target.name || 'x'); holder.after(p); }
    p.textContent = msg; holder.classList.add('has-err');
  }
  function checks() {
    var sp = $('input[name=especie]:checked');
    var needOther = sp && /^otra-/.test(sp.value);
    var o = $('input[name=otra]');
    return [
      { id: 'especie', ok: !!sp && (!needOther || (o.value.trim().length >= 3)), label: needOther && sp && o.value.trim().length < 3 ? 'qué especie es' : 'especie', el: needOther && sp ? o : $('input[name=especie]'), step: 1 },
      { id: 'foto', ok: !!st.blob, label: 'foto', el: fileIn, step: 2 },
      { id: 'provincia', ok: !!$('select[name=provincia]').value, label: 'provincia', el: $('select[name=provincia]'), step: 3 },
      { id: 'alias', ok: $('input[name=alias]').value.trim().length >= 2, label: 'alias', el: $('input[name=alias]'), step: 3 },
      { id: 'legal', ok: $('input[name=legal]').checked, label: 'confirmar que la captura es legal', el: $('input[name=legal]'), step: 4 },
      { id: 'consent', ok: $('input[name=consent]').checked, label: 'aceptar la publicación', el: $('input[name=consent]'), step: 4 }
    ];
  }
  function refresh() {
    var c = checks(), done = 0;
    [1, 2, 3].forEach(function (n) {
      var ok = c.filter(function (x) { return x.step === n; }).every(function (x) { return x.ok; });
      var fs = $('.cap-step[data-step="' + n + '"]'); if (fs) fs.classList.toggle('done', ok);
      if (ok) done++;
    });
    var bar = $('.cap-prog-bar i'), txt = $('.cap-prog-txt');
    if (bar) bar.style.transform = 'scaleX(' + (done / 3) + ')';
    if (txt) txt.textContent = done === 3 ? '¡Todo listo para enviar!' : done + ' de 3 pasos';
    sendBtn.classList.toggle('ready', done === 3 && c.every(function (x) { return x.ok; }));
    if (!miss.hidden && c.every(function (x) { return x.ok; })) miss.hidden = true;
  }
  function toggleOther() {
    var s = $('input[name=especie]:checked'), on = s && /^otra-/.test(s.value);
    if (other) { other.hidden = !on; var i = other.querySelector('input'); if (!on && i) i.value = ''; }
  }
  f.addEventListener('input', function (e) { if (e.target.name) fieldErr(e.target, ''); refresh(); });
  f.addEventListener('change', function (e) { if (e.target.name === 'especie') { toggleOther(); } refresh(); });
  toggleOther(); refresh();

  /* ───────── Foto: elegir, arrastrar, pegar ───────── */
  function setBusy(on) { if (busy) busy.hidden = !on; prev.classList.toggle('busy', on); }
  function clearPhoto() {
    st.seq++; st.blob = null; st.pending = null; fileIn.value = '';
    if (st.url) { URL.revokeObjectURL(st.url); st.url = null; }
    prev.hidden = true; drop.hidden = false; fieldErr(fileIn, ''); refresh();
  }
  function takeFile(file) {
    if (!file) return;
    var my = ++st.seq; st.blob = null; fieldErr(fileIn, '');
    prev.hidden = false; drop.hidden = true; setBusy(true);
    $('.cap-pv-name').textContent = file.name || 'Tu foto'; $('.cap-pv-size').textContent = 'Preparando… ' + fmt(file.size);
    pimg.removeAttribute('src');
    st.pending = prepare(file).then(function (b) {
      if (my !== st.seq) return;
      st.blob = b; st.name = (file.name || 'captura').replace(/\.[^.]+$/, '') + (b.type === 'image/jpeg' ? '.jpg' : '');
      if (st.url) URL.revokeObjectURL(st.url);
      st.url = URL.createObjectURL(b); pimg.src = st.url;
      $('.cap-pv-size').textContent = fmt(b.size) + (b.size < file.size ? ' (antes ' + fmt(file.size) + ')' : '');
      setBusy(false); refresh();
    }).catch(function (err) {
      if (my !== st.seq) return;
      clearPhoto(); fieldErr(fileIn, err && err.user ? err.message : 'No hemos podido preparar la foto. Prueba con otra.');
    });
  }
  fileIn.addEventListener('change', function () { takeFile(fileIn.files && fileIn.files[0]); });
  $('.cap-pv-clear').addEventListener('click', function () { clearPhoto(); fileIn.click(); });
  ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { var fl = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (fl) takeFile(fl); });
  document.addEventListener('paste', function (e) {
    var it = e.clipboardData && Array.prototype.slice.call(e.clipboardData.items || []).filter(function (x) { return x.kind === 'file' && /^image\//.test(x.type); })[0];
    if (it && !st.sending) takeFile(it.getAsFile());
  });
  if (/[?&]e=/.test(location.search) || /#enviar/.test(location.hash)) refresh();

  /* ───────── Envío ───────── */
  function say(msg, kind) { ptxt.textContent = msg; prog.setAttribute('data-kind', kind || ''); }
  function setProgress(p) { pbar.setAttribute('aria-valuenow', Math.round(p)); pbar.firstElementChild.style.transform = 'scaleX(' + (p / 100) + ')'; }
  function showMissing(list) {
    miss.hidden = false;
    miss.innerHTML = '<strong>Casi listo.</strong> Falta: ' + list.map(function (x) { return '<span>' + x.label + '</span>'; }).join('');
    var first = list[0];
    list.forEach(function (x) { if (x.id === 'foto') fieldErr(fileIn, 'Añade la foto de tu captura.'); else if (x.id === 'provincia' || x.id === 'alias') fieldErr(x.el, x.id === 'alias' ? 'Escribe tu alias (mín. 2 letras).' : 'Elige la provincia.'); });
    var box = first.el.closest('fieldset,label') || first.el;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    try { first.el.focus({ preventScroll: true }); } catch (e) {}
    ev('fz_captura_incompleta', { falta: list.map(function (x) { return x.id; }).join(',') });
  }
  function refreshToken() {
    return fetch('/capturas/token', { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.t) { tokenIn.value = j.t; st.tokenAt = Date.now(); } });
  }
  function done(html) {
    var sel = $('input[name=especie]:checked');
    ev('fz_captura_enviada', { especie: sel && sel.value });
    var guide = sel && sel.getAttribute('data-guide');
    var wa = 'https://wa.me/?text=' + encodeURIComponent('Acabo de enviar mi captura a FishZone 🎣 https://fishzone.es/capturas/');
    var box = document.createElement('div'); box.className = 'cap-ok'; box.setAttribute('role', 'status');
    box.innerHTML = '<div class="cap-check-ic" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l8 8 15-17"/></svg></div>' +
      '<strong>¡Captura enviada!</strong><p>La revisaremos en unos días y, si cumple las normas, aparecerá en la galería con tu alias.</p>' +
      '<div class="cap-next"><a class="cap-btn" target="_blank" rel="noopener" data-cta="share"></a><a class="cap-alt" href="/capturas/"></a>' + (guide ? '<a class="cap-alt" data-guide></a>' : '') + '</div>';
    var ws = box.querySelector('a.cap-btn'); ws.href = wa; ws.textContent = 'Compartir por WhatsApp';
    box.querySelectorAll('a.cap-alt')[0].textContent = 'Ver capturas de otros pescadores';
    var g = box.querySelector('a[data-guide]'); if (g) { g.href = guide; g.textContent = 'Leer la guía de ' + sel.getAttribute('data-label').toLowerCase(); }
    f.parentNode.replaceChild(box, f); box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {}
    try { if (window.FZ && FZ.award) FZ.award('captura', 20, '📸 ¡Captura enviada!'); } catch (e2) {}
  }
  function fail(msg, canRetry) {
    st.sending = false; sendBtn.disabled = false; sendBtn.classList.remove('busy');
    say(msg, 'err'); prog.hidden = false; $('.cap-cancel').textContent = canRetry ? 'Reintentar' : 'Cerrar';
    $('.cap-cancel').onclick = function () { prog.hidden = true; if (canRetry) f.requestSubmit ? f.requestSubmit() : send(0); };
    prog.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function send(attempt) {
    st.sending = true; sendBtn.disabled = true; sendBtn.classList.add('busy');
    miss.hidden = true; prog.hidden = false; setProgress(0); say('Preparando el envío…', '');
    var cancel = $('.cap-cancel'); cancel.textContent = 'Cancelar';
    var go = function () {
      var fd = new FormData(f);
      fd.set('foto', st.blob, st.name || 'captura.jpg');
      var x = new XMLHttpRequest(); st.xhr = x;
      x.open('POST', f.action); x.setRequestHeader('Accept', 'application/json'); x.timeout = 180000;
      x.upload.onprogress = function (e) { if (e.lengthComputable) { var p = e.loaded / e.total * 100; setProgress(p); say(p < 100 ? 'Subiendo… ' + Math.round(p) + ' %' : 'Procesando tu foto…', ''); } };
      x.upload.onload = function () { setProgress(100); say('Procesando tu foto…', ''); };
      x.onload = function () {
        var j = null; try { j = JSON.parse(x.responseText); } catch (e) {}
        if (x.status === 200 && j && j.ok) { done(); return; }
        if (j && j.errors && /caducado/.test(j.errors.join(' ')) && attempt < 1) { refreshToken().then(function () { send(attempt + 1); }); return; }
        if (j && j.errors) { fail(j.errors.join(' '), false); return; }
        if (x.status === 413) return fail('La foto es demasiado grande. Prueba con otra o hazle una captura de pantalla.', false);
        if (x.status === 429) return fail('Has enviado varias capturas seguidas. Espera un minuto e inténtalo de nuevo.', true);
        if ((x.status >= 500 || x.status === 0) && attempt < 1) { say('Reintentando…', ''); setTimeout(function () { send(attempt + 1); }, 1500); return; }
        fail('No hemos podido completar el envío. Comprueba tu conexión e inténtalo otra vez.', true);
      };
      x.onerror = function () { if (attempt < 1) { say('Conexión inestable, reintentando…', ''); setTimeout(function () { send(attempt + 1); }, 1500); } else fail('Se ha cortado la conexión. Inténtalo otra vez con mejor cobertura.', true); };
      x.ontimeout = function () { fail('La subida está tardando demasiado. Prueba con mejor cobertura o con otra foto.', true); };
      cancel.onclick = function () { try { x.abort(); } catch (e) {} st.sending = false; sendBtn.disabled = false; sendBtn.classList.remove('busy'); prog.hidden = true; };
      x.send(fd);
    };
    (Date.now() - st.tokenAt > 80 * 60 * 1000 ? refreshToken() : Promise.resolve()).then(go, go);
  }
  f.addEventListener('submit', function (e) {
    if (!window.XMLHttpRequest || !window.FormData || !window.Promise) return;
    e.preventDefault();
    if (st.sending) return;
    Promise.resolve(st.pending).then(function () {
      var bad = checks().filter(function (x) { return !x.ok; });
      if (bad.length) { showMissing(bad); return; }
      send(0);
    });
  });
})();
