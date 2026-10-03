/* iOS 27: luz especular que sigue al puntero en los cuadros de información.
   Solo punteros finos; un único listener delegado, 1 escritura de variables por frame. */
(function(){
  if(!window.matchMedia||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  var SEL='.card,.location-card,.bait-card,.tech-card,.gear-card,.sub-card,.shop-card,.rig-card,.norm-card,.level-card,.embalse-card,.quick-card,.gz-card,.gz-rel-grid a,.gz-box,.gz-author';
  var el=null,x=0,y=0,raf=0;
  function paint(){raf=0;if(!el)return;var r=el.getBoundingClientRect();el.style.setProperty('--mx',(x-r.left)+'px');el.style.setProperty('--my',(y-r.top)+'px')}
  document.addEventListener('pointermove',function(e){
    if(document.documentElement.classList.contains('fz-fast'))return;
    var t=e.target&&e.target.closest?e.target.closest(SEL):null;
    if(!t){el=null;return}
    el=t;x=e.clientX;y=e.clientY;
    if(!raf)raf=requestAnimationFrame(paint);
  },{passive:true});
})();

/* Scroll muy rápido: se marca .fz-fast (velocidad > ~1,6 px/ms) y, mientras dura, se pausan los
   bucles decorativos (.fz-moving) y las transiciones de entrada se resuelven al instante, para que
   el hilo principal solo pinte lo esencial. A los 150 ms de calma todo vuelve a la normalidad.
   No elimina ninguna animación: solo evita apilar cientos a la vez. */
(function(){
  var root=document.documentElement,lastY=window.pageYOffset||0,lastT=performance.now(),tm=0,fast=false;
  /* Barrido al terminar un scroll rápido: lo que quedó por encima/dentro del viewport sin revelar se muestra ya */
  function sweep(){var n=document.querySelectorAll('.fade-in:not(.visible)'),h=innerHeight;for(var i=0;i<n.length;i++){if(n[i].getBoundingClientRect().top<h)n[i].classList.add('visible');}}
  window.addEventListener('scroll',function(){
    var y=window.pageYOffset||0,t=performance.now(),dt=t-lastT;
    if(dt>0){
      var v=Math.abs(y-lastY)/dt;
      if(v>1.6&&!fast){fast=true;root.classList.add('fz-fast','fz-moving');}
    }
    lastY=y;lastT=t;
    if(fast){clearTimeout(tm);tm=setTimeout(function(){fast=false;root.classList.remove('fz-fast');sweep();if(!root.classList.contains('perf-low'))root.classList.remove('fz-moving');},150);}
  },{passive:true});
  /* Imágenes diferidas: decodificar fuera del hilo principal */
  function dec(){var im=document.querySelectorAll('img[loading="lazy"]:not([decoding])');for(var i=0;i<im.length;i++)im[i].decoding='async';}
  if('requestIdleCallback' in window)requestIdleCallback(dec,{timeout:2000});else setTimeout(dec,1200);
})();
