/* iOS 27: luz especular que sigue al puntero en los cuadros de información.
   Solo punteros finos; un único listener delegado, 1 escritura de variables por frame. */
(function(){
  if(!window.matchMedia||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  var SEL='.card,.location-card,.bait-card,.tech-card,.gear-card,.sub-card,.shop-card,.rig-card,.norm-card,.level-card,.embalse-card,.quick-card,.gz-card,.gz-rel-grid a,.gz-box,.gz-author';
  var el=null,x=0,y=0,raf=0;
  function paint(){raf=0;if(!el)return;var r=el.getBoundingClientRect();el.style.setProperty('--mx',(x-r.left)+'px');el.style.setProperty('--my',(y-r.top)+'px')}
  document.addEventListener('pointermove',function(e){
    var t=e.target&&e.target.closest?e.target.closest(SEL):null;
    if(!t){el=null;return}
    el=t;x=e.clientX;y=e.clientY;
    if(!raf)raf=requestAnimationFrame(paint);
  },{passive:true});
})();
