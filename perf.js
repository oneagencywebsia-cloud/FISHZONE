/* FishZone — rendimiento sin quitar nada.
   1) Pausa las animaciones infinitas (brillos, olas, peces, burbujas...) de lo que está fuera
      de la pantalla y les quita will-change (cada una era una capa de GPU). Al volver a verse
      se reanudan solas.
   2) Los peces del hero se movían animando left/right (fuerza recalcular el layout en cada
      frame); ahora van con transform, que va por la GPU. Mismo movimiento y mismas duraciones. */
(function () {
  var css =
    '.fz-off,.fz-off *,.fz-off::before,.fz-off::after,.fz-off *::before,.fz-off *::after{' +
    'animation-play-state:paused !important;will-change:auto !important}' +
    '.hero-fish-swim.f1,.hero-fish-swim.f3,.hero-fish-swim.f5,.hero-fish-swim.f7{left:0}' +
    '.hero-fish-swim.f2,.hero-fish-swim.f4,.hero-fish-swim.f6{right:0}' +
    '@keyframes heroFishCrossR{0%{opacity:0;transform:translate3d(-8vw,0,0)}5%{opacity:.65}' +
    '25%{transform:translate3d(21vw,-20px,0)}50%{transform:translate3d(50vw,-8px,0)}' +
    '75%{transform:translate3d(79vw,-25px,0)}95%{opacity:.65}100%{opacity:0;transform:translate3d(108vw,0,0)}}' +
    '@keyframes heroFishCrossL{0%{opacity:0;transform:translate3d(8vw,0,0) scaleX(-1)}5%{opacity:.65}' +
    '25%{transform:translate3d(-21vw,18px,0) scaleX(-1)}50%{transform:translate3d(-50vw,6px,0) scaleX(-1)}' +
    '75%{transform:translate3d(-79vw,22px,0) scaleX(-1)}95%{opacity:.65}100%{opacity:0;transform:translate3d(-108vw,0,0) scaleX(-1)}}';
  var st = document.createElement('style');
  st.id = 'fz-perf-css';
  st.textContent = css;
  (document.body || document.documentElement).appendChild(st);

  if (!('IntersectionObserver' in window) || !document.getAnimations) return;

  var seen = new WeakSet();
  var io = new IntersectionObserver(function (es) {
    for (var i = 0; i < es.length; i++) es[i].target.classList.toggle('fz-off', !es[i].isIntersecting);
  }, { rootMargin: '120px 0px' });

  function scan() {
    var an = document.getAnimations();
    for (var i = 0; i < an.length; i++) {
      var ef = an[i].effect;
      if (!ef || !ef.target || ef.getComputedTiming().iterations !== Infinity) continue;
      /* Se observa el bloque contenedor, no el elemento: un pez que cruza fuera de pantalla
         por su propia animación se quedaría pausado para siempre. */
      var t = ef.target.closest('section,header,footer,.hero-bg-scene,.hero') || ef.target;
      if (seen.has(t)) continue;
      seen.add(t);
      io.observe(t);
    }
  }

  function idle(fn, ms) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: ms });
    else setTimeout(fn, ms);
  }

  idle(scan, 1500);
  window.addEventListener('load', function () { setTimeout(function () { idle(scan, 1500); }, 1200); });
  setTimeout(function () { idle(scan, 1500); }, 6000);
  window.addEventListener('scroll', function once() {
    window.removeEventListener('scroll', once);
    setTimeout(function () { idle(scan, 1500); }, 800);
  }, { passive: true });
})();
