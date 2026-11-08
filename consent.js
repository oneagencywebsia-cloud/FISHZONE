/* FishZone — consentimiento de analítica (Consent Mode v2).
   Solo se muestra si el Mensaje de consentimiento de Google (Funding Choices) está
   inactivo; cuando Google lo active, este banner cede y no aparece.
   Solo concede analytics_storage. ad_storage / ad_user_data / ad_personalization
   siguen denegados. La elección se guarda 12 meses en localStorage. */
(function () {
  var KEY = 'fz_consent', DAYS = 365, bar = null;

  function gtag() { (window.dataLayer = window.dataLayer || []).push(arguments); }

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && (v.v === 'granted' || v.v === 'denied') && Date.now() - v.t < DAYS * 864e5) return v.v;
    } catch (e) {}
    return null;
  }
  function save(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }
  function apply(v) {
    gtag('consent', 'update', { analytics_storage: v });
  }

  var stored = read();
  if (stored) apply(stored);

  function cmpActive() { return !!document.querySelector('.fc-consent-root, .fc-dialog-container'); }
  function cmpInactive() { return !!document.querySelector('iframe[name="googlefcInactive"]'); }

  function style() {
    if (document.getElementById('fz-consent-css')) return;
    var s = document.createElement('style');
    s.id = 'fz-consent-css';
    s.textContent =
      '#fz-consent{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:640px;margin:0 auto;' +
      'background:rgba(6,12,24,.97);color:#e8ecf3;border:1px solid rgba(201,168,76,.45);border-radius:14px;' +
      'padding:16px 18px;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.55)}' +
      '#fz-consent p{margin:0 0 12px}' +
      '#fz-consent a{color:#e2c97e;text-decoration:underline}' +
      '#fz-consent .fz-c-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '#fz-consent button{flex:1 1 140px;min-height:44px;padding:10px 16px;border-radius:10px;font:600 14px system-ui,sans-serif;cursor:pointer;' +
      'background:transparent;color:#e2c97e;border:1px solid rgba(201,168,76,.7)}' +
      '#fz-consent button:hover,#fz-consent button:focus-visible{background:rgba(201,168,76,.14);outline:none}' +
      '@media(min-width:700px){#fz-consent{bottom:20px}}';
    document.head.appendChild(s);
  }

  function close() { if (bar) { bar.remove(); bar = null; } }

  function open() {
    if (bar) return;
    style();
    bar = document.createElement('div');
    bar.id = 'fz-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Consentimiento de cookies');
    bar.innerHTML =
      '<p>Usamos cookies de analítica (Google Analytics) para saber qué guías son útiles y mejorar FishZone. ' +
      'Solo se activan si aceptas; sin tu permiso no se guarda nada en tu dispositivo. ' +
      '<a href="/cookies.html">Más información</a></p>' +
      '<div class="fz-c-btns"><button type="button" data-v="denied">Rechazar</button>' +
      '<button type="button" data-v="granted">Aceptar analítica</button></div>';
    bar.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-v');
      if (!v) return;
      save(v); apply(v); close();
    });
    document.body.appendChild(bar);
  }

  function decide() {
    if (read() || cmpActive()) return;
    var tries = 0, t = setInterval(function () {
      tries++;
      if (cmpActive()) { clearInterval(t); close(); return; }
      if (cmpInactive() || tries >= 24) { clearInterval(t); if (!read() && !cmpActive()) open(); }
    }, 500);
  }

  window.fzConsent = {
    manage: function () {
      if (cmpActive() || !cmpInactive()) { try { googlefc.showRevocationMessage(); return; } catch (e) {} }
      close(); open();
    }
  };

  // El tercero (Funding Choices) se carga al primer gesto o a los 3,5 s: esperamos a que se resuelva.
  function start() { setTimeout(decide, 3500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
