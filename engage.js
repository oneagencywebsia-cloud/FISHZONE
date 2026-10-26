/* FishZone · Pasaporte del pescador
   Capa de engagement ligera: barra de lectura, niveles por guías leídas, reto diario con datos
   verificados y eventos GA4. No altera el contenido indexable. El progreso solo se guarda en el
   navegador (localStorage) y únicamente después de que la persona active el pasaporte. */
(function(){
  'use strict';
  var KEY='fz_pasaporte_v1';
  var CAT=[
    ['/guia-principiantes-pesca.html','Cómo empezar a pescar','Empezar'],
    ['/licencia-de-pesca-en-andalucia.html','Licencia de pesca 2026','Empezar'],
    ['/equipo-basico-para-empezar-a-pescar.html','Equipo básico','Empezar'],
    ['/primera-salida-de-pesca-checklist.html','Primera salida: checklist','Empezar'],
    ['/nudos-de-pesca.html','Los 6 nudos que necesitas','Empezar'],
    ['/canas-y-carretes-guia.html','Cañas y carretes','Empezar'],
    ['/normativa-pesca-continental-andalucia.html','Normativa continental (Orden 2023)','Normativa'],
    ['/especies-invasoras-pesca-andalucia.html','Especies invasoras','Normativa'],
    ['/calendario-de-pesca-en-andalucia.html','Calendario mes a mes','Normativa'],
    ['/carpfishing-andalucia.html','Carpfishing en Andalucía','Carpa'],
    ['/montajes-carpfishing.html','Montajes de carpfishing','Carpa'],
    ['/cebos-y-boilies-carpa.html','Cebos para carpa','Carpa'],
    ['/canas-para-carpfishing.html','Cañas para carpfishing','Carpa'],
    ['/pesca-black-bass-andalucia.html','Black bass','Río y embalse'],
    ['/pesca-del-lucio-en-andalucia.html','Lucio','Río y embalse'],
    ['/pesca-del-siluro-en-andalucia.html','Siluro: normativa','Río y embalse'],
    ['/pesca-del-barbo-iberico.html','Barbo ibérico','Río y embalse'],
    ['/pesca-a-mosca-truchas-andalucia.html','Trucha a mosca','Río y embalse'],
    ['/pesca-a-spinning.html','Pesca a spinning','Río y embalse'],
    ['/que-comprar-para-pesca-a-spinning.html','Qué comprar para spinning','Río y embalse'],
    ['/pesca-lubina-andalucia.html','Lubina','Mar'],
    ['/pesca-dorada-andalucia.html','Dorada','Mar'],
    ['/surfcasting-costa-andalucia.html','Surfcasting','Mar'],
    ['/que-comprar-para-surfcasting.html','Qué comprar para surfcasting','Mar'],
    ['/pesca-submarina-andalucia.html','Pesca submarina','Mar'],
    ['/embalses-de-andalucia.html','Embalses de Andalucía','Dónde pescar'],
    ['/pesca-en-cordoba.html','Pescar en Córdoba','Dónde pescar'],
    ['/pesca-en-sevilla.html','Pescar en Sevilla','Dónde pescar'],
    ['/tiendas-de-pesca-en-cordoba.html','Tiendas de pesca en Córdoba','Dónde pescar'],
    ['/blog/que-pescar-en-octubre-en-andalucia.html','Qué pescar en octubre','Blog'],
    ['/blog/que-pescar-en-noviembre-en-andalucia.html','Qué pescar en noviembre','Blog'],
    ['/blog/que-pescar-en-diciembre-en-andalucia.html','Qué pescar en diciembre','Blog'],
    ['/blog/que-hacer-si-pescas-un-siluro.html','Si pescas un siluro','Blog']
  ];
  var LV=[['Curioso',0],['Aprendiz',30],['Pescador',80],['Veterano',160],['Maestro del agua',280]];
  /* Preguntas con datos comprobados en la Orden de 13/01/2023, el Decreto 205/2023 y el portal de la Junta. */
  var QS=[
    ['¿Qué periodo hábil tiene la trucha común en Andalucía?',['Del 1 de mayo al 15 de octubre','Todo el año','Del 1 de julio al 25 de febrero'],0,'Solo en cotos y aguas trucheras, con captura y suelta (Orden de 13 de enero de 2023).','/pesca-a-mosca-truchas-andalucia.html','Normativa'],
    ['El barbo ibérico en Andalucía es de…',['Cupo de 5 piezas','Captura y suelta obligatoria','Pesca libre sin límites'],1,'Su periodo hábil va del 1 de julio al 25 de febrero y siempre se devuelve al agua.','/pesca-del-barbo-iberico.html','Río y embalse'],
    ['¿Cuánto cuesta la licencia de pesca continental básica en 2026?',['8,14 € al año','23,50 € al año','Es gratuita'],0,'Y puede expedirse por 1, 3 o 5 años (tasas 2026 de la Junta de Andalucía).','/licencia-de-pesca-en-andalucia.html','Empezar'],
    ['¿Cuánto dura la licencia continental desde que se expide?',['Hasta el 31 de diciembre','1, 3 o 5 años según elijas','Siempre 10 años'],1,'No caduca por año natural: la validez cuenta desde la fecha de expedición.','/licencia-de-pesca-en-andalucia.html','Empezar'],
    ['¿Qué necesitas antes de sacar la licencia continental?',['Un examen','El NIR (Número de Inscripción Registral)','Un seguro obligatorio'],1,'La Junta no pide examen: te asigna el NIR y con él tramitas la licencia.','/licencia-de-pesca-en-andalucia.html','Empezar'],
    ['¿Se puede cebar las aguas en la pesca continental andaluza?',['Sí, con boilies','Sí, pero solo de noche','No, el artículo 9.4 lo prohíbe'],2,'Solo se permite en entrenamientos y competiciones oficiales de la Federación Andaluza.','/normativa-pesca-continental-andalucia.html','Normativa'],
    ['¿Cuántas cañas puedes usar en aguas no trucheras?',['Una','Dos, separadas como máximo 10 m','Cuatro'],1,'En aguas trucheras solo se permite una caña.','/normativa-pesca-continental-andalucia.html','Normativa'],
    ['¿Cuál de estos cebos está en la lista oficial de cebos naturales?',['La masilla','El boilie','El pellet'],0,'Los cereales, las leguminosas, la patata cocida, la lombriz, el asticot y la masilla; boilies y pellets no figuran.','/cebos-y-boilies-carpa.html','Carpa'],
    ['¿Qué talla mínima tiene el black bass en Andalucía?',['30 cm','Ninguna, pero solo en áreas autorizadas','45 cm'],1,'Las exóticas no tienen tallas ni cupos, pero solo se pescan donde la Junta lo permite y no pueden devolverse vivas fuera de esas áreas.','/pesca-black-bass-andalucia.html','Río y embalse'],
    ['Si pescas un siluro por accidente, ¿qué debes hacer?',['Devolverlo vivo al agua','Sacrificarlo y no devolverlo al agua','Hacerle una foto y soltarlo'],1,'Está prohibido pescarlo: se sacrifica y nunca se devuelve al agua.','/pesca-del-siluro-en-andalucia.html','Río y embalse'],
    ['¿Cuántos tramos habilitados tiene el embalse de Iznájar para pescar?',['3','7','Todo el perímetro'],1,'Iznájar es el mayor embalse de Andalucía y en él están prohibidos boilies, pellets y cebado.','/embalses-de-andalucia.html','Dónde pescar'],
    ['En cotos de trucha, ¿qué artes se permiten?',['Cebos artificiales sin muerte y un solo anzuelo sin arponcillo','Gusano y masilla','Cualquier señuelo con triple'],0,'Es captura y suelta con cebo artificial sin muerte.','/pesca-a-mosca-truchas-andalucia.html','Río y embalse'],
    ['En pesca submarina, ¿a qué distancia mínima de bañistas debes mantenerte?',['50 m','100 m','250 m'],2,'También 250 m de puertos, canales de navegación y artes de pesca profesional (Decreto 205/2023).','/pesca-submarina-andalucia.html','Mar'],
    ['¿Cómo debe señalizarse la pesca submarina?',['Con una boya roja o naranja con bandera Alfa','Con linterna','No hace falta'],0,'La boya con la bandera «Alfa» es obligatoria durante toda la actividad.','/pesca-submarina-andalucia.html','Mar'],
    ['¿Se puede capturar pulpo en las aguas interiores andaluzas?',['Sí, con fusil corto','No, está prohibido','Solo de noche'],1,'El pulpo, los erizos y los moluscos bivalvos están prohibidos (Decreto 205/2023, Anexo I).','/pesca-submarina-andalucia.html','Mar'],
    ['Pescando desde la orilla en el mar, ¿cuántos anzuelos puedes usar?',['Hasta 6 repartidos en 2 cañas','Los que quieras','12 en 4 cañas'],0,'Por licencia y día; el cómputo de señuelos artificiales y dobles/triples sigue reglas propias.','/surfcasting-costa-andalucia.html','Mar'],
    ['¿Cuál es el tope de captura marítima recreativa por licencia y día?',['5 kg (más una pieza mayor)','20 kg','Sin límite'],0,'Con carácter general: 5 kg en peso vivo o 4 kg eviscerado.','/pesca-lubina-andalucia.html','Mar'],
    ['¿Cómo se marcan las capturas marinas?',['Cortando parte del lóbulo inferior de la aleta caudal','Con una anilla','No se marcan'],0,'Hay que marcarlas al capturarlas, sin dañar la medición de la talla.','/pesca-dorada-andalucia.html','Mar'],
    ['¿Qué bonificación tiene la tasa de licencia para menores de 16 años?',['50 %','Ninguna','Es gratis'],0,'La bonificación no exime de solicitar la licencia; menores de 14 años necesitan además autorización del tutor.','/licencia-de-pesca-en-andalucia.html','Empezar'],
    ['¿Para qué sirve la «cola de rata» en surfcasting?',['Para atraer peces','Para evitar roturas al lanzar con plomos pesados','Para medir la profundidad'],1,'Es una línea de choque cónica que absorbe el tirón del lance.','/surfcasting-costa-andalucia.html','Mar'],
    ['¿Qué especie es el barbo comizo?',['Luciobarbus comizo, autóctono del Guadalquivir','Una carpa exótica','Un híbrido de siluro'],0,'Vive en corriente moderada sobre grava y piedra.','/pesca-del-barbo-iberico.html','Río y embalse'],
    ['¿Quién puede pescar en el mar con licencia marítima recreativa?',['Mayores de 14 años con licencia en vigor','Cualquiera sin licencia','Solo mayores de 65'],0,'Los menores de 14 pueden pescar en superficie acompañados de un adulto con licencia y con autorización escrita.','/surfcasting-costa-andalucia.html','Mar']
  ];
  var BASE=location.pathname.replace(/\/index\.html$/,'/');
  var HOME=BASE==='/';
  var CUR=-1,i;
  for(i=0;i<CAT.length;i++){if(CAT[i][0]===BASE){CUR=i;break;}}
  if(!HOME&&CUR<0&&BASE!=='/blog/')return;

  function today(d){d=d||new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
  function load(){try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on)return s}catch(e){}return{on:false,read:{},ok:{},streak:0,last:''}}
  var S=load(), MEM={read:{},ok:{}};
  function save(){if(!S.on)return;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
  function ev(n,p){try{if(typeof gtag==='function')gtag('event',n,p||{})}catch(e){}}
  function cnt(o){var n=0,k;for(k in o)if(o.hasOwnProperty(k))n++;return n}
  function readN(){return cnt(S.on?S.read:MEM.read)}
  function xp(){return cnt(S.read)*10+cnt(S.ok)*5}
  function lvl(x){var l=0,j;for(j=0;j<LV.length;j++)if(x>=LV[j][1])l=j;return l}
  function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}

  function streak(){
    if(!S.on)return;var t=today();if(S.last===t)return;
    var y=new Date();y.setDate(y.getDate()-1);
    S.streak=(S.last===today(y))?(S.streak||0)+1:1;S.last=t;save();
  }
  streak();

  var css='.fz-bar{position:fixed;top:0;left:0;right:0;height:3px;z-index:60;pointer-events:none;background:transparent}.fz-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#1a9b8a,#c9a84c);transform:scaleX(0);transform-origin:0 50%}'+
  '.fz-chip{position:fixed;right:1rem;bottom:1.4rem;z-index:40;display:flex;align-items:center;gap:.5rem;padding:.55rem .95rem;border-radius:999px;border:1px solid rgba(201,168,76,.45);background:rgba(10,15,30,.92);color:#f5f8fc;font:600 .82rem/1 "DM Sans",system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.4);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}.fz-chip:focus-visible,.fz-pan button:focus-visible,.fz-pan a:focus-visible{outline:2px solid #3fd0ba;outline-offset:2px}.fz-chip b{color:#e2c97e}.fz-chip.pulse{animation:fzp 1.6s ease 2}@keyframes fzp{50%{box-shadow:0 0 0 7px rgba(201,168,76,.18)}}'+
  '.fz-pan{position:fixed;right:1rem;bottom:4.4rem;z-index:41;width:min(92vw,350px);max-height:72vh;overflow:auto;background:#0d1426;border:1px solid #1e2c47;border-radius:16px;padding:1.05rem 1.1rem;color:#cdd9e8;font:400 .9rem/1.5 "DM Sans",system-ui,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.55);display:none}.fz-pan.on{display:block}.fz-pan h3{margin:0 0 .15rem;font:400 1.5rem/1.1 "Bebas Neue",Impact,sans-serif;letter-spacing:.03em;color:#f5f8fc}.fz-pan p{margin:.25rem 0}.fz-pan small{color:#8aa0bb}'+
  '.fz-meter{height:7px;border-radius:99px;background:#16223c;margin:.55rem 0 .3rem;overflow:hidden}.fz-meter i{display:block;height:100%;background:linear-gradient(90deg,#1a9b8a,#c9a84c);border-radius:99px}.fz-pan button,.fz-reto button{font:inherit}.fz-btn{background:#c9a84c;color:#0a0f1e;border:0;border-radius:999px;padding:.5rem 1.05rem;font-weight:700;cursor:pointer}.fz-ghost{background:transparent;border:1px solid #1e2c47;color:#cdd9e8;border-radius:999px;padding:.4rem .85rem;cursor:pointer}'+
  '.fz-sec{margin-top:.9rem;padding-top:.8rem;border-top:1px solid #1e2c47}.fz-sec h4{margin:0 0 .35rem;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#e2c97e}.fz-list{list-style:none;margin:0;padding:0}.fz-list li{margin:.3rem 0}.fz-list a{color:#e2c97e}.fz-list .d a{color:#8aa0bb}.fz-pan details summary{cursor:pointer;color:#8aa0bb}'+
  '.fz-q{margin-top:.2rem}.fz-q strong{display:block;color:#f5f8fc;margin-bottom:.45rem}.fz-q .o{display:block;width:100%;text-align:left;margin:.3rem 0;padding:.55rem .75rem;border-radius:10px;border:1px solid #1e2c47;background:#111a30;color:#cdd9e8;cursor:pointer}.fz-q .o:hover{border-color:#c9a84c}.fz-q .o.ok{border-color:#3fd0ba;background:rgba(26,155,138,.18);color:#f5f8fc}.fz-q .o.no{border-color:#a8584a;background:rgba(168,88,74,.15)}.fz-q .ex{margin-top:.55rem}'+
  '.fz-reto{background:#111a30;border:1px solid #1e2c47;border-radius:14px;padding:1.1rem 1.25rem;margin:1.8rem 0;color:#cdd9e8}.fz-reto h3{margin:0 0 .5rem;font:400 1.5rem/1.1 "Bebas Neue",Impact,sans-serif;letter-spacing:.03em;color:#f5f8fc}'+
  '.fz-toast{position:fixed;left:50%;bottom:5.2rem;transform:translateX(-50%);z-index:70;max-width:min(92vw,420px);background:#0d1426;border:1px solid #c9a84c;border-radius:14px;padding:.75rem 1rem;color:#f5f8fc;font:500 .9rem/1.4 "DM Sans",system-ui,sans-serif;box-shadow:0 12px 36px rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .25s}.fz-toast.on{opacity:1;pointer-events:auto}.fz-toast button{margin-left:.6rem}'+
  '@media(prefers-reduced-motion:reduce){.fz-chip.pulse{animation:none}.fz-toast{transition:none}}body.fz-home .fz-chip{bottom:5.6rem}body.fz-home .fz-pan{bottom:8.8rem}body.fz-home .fz-toast{bottom:9rem}@media print{.fz-bar,.fz-chip,.fz-pan,.fz-toast,.fz-reto{display:none}}'+
  '@media(max-width:640px){.fz-chip{bottom:5.2rem;right:.75rem}.fz-pan{right:.75rem;bottom:8.4rem}.fz-toast{bottom:9rem}}';
  var st=el('style');st.id='fz-eng-css';st.textContent=css;document.head.appendChild(st);

  /* barra de lectura (solo en guías y artículos) */
  var bar=null,bi=null;
  if(!HOME&&CUR>=0){bar=el('div','fz-bar','<i></i>');bar.setAttribute('aria-hidden','true');bi=bar.firstChild;document.body.appendChild(bar);}

  if(HOME)document.body.classList.add('fz-home');
  var chip=el('button','fz-chip');chip.type='button';chip.setAttribute('aria-expanded','false');chip.setAttribute('aria-controls','fz-pan');
  var pan=el('div','fz-pan');pan.id='fz-pan';pan.setAttribute('role','dialog');pan.setAttribute('aria-label','Pasaporte del pescador');
  var toast=el('div','fz-toast');toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
  document.body.appendChild(chip);document.body.appendChild(pan);document.body.appendChild(toast);

  var tt=0;
  function say(h,keep){toast.innerHTML=h;toast.classList.add('on');clearTimeout(tt);if(!keep)tt=setTimeout(function(){toast.classList.remove('on')},5200);var b=toast.querySelector('button');if(b)b.onclick=function(){toast.classList.remove('on');activate()}}

  function paintChip(){
    var l=LV[lvl(xp())][0];
    chip.innerHTML=S.on?'🎣 <span>'+l+'</span> <b>'+readN()+'/'+CAT.length+'</b>':'🎣 <span>Mi pasaporte</span> <b>'+readN()+'/'+CAT.length+'</b>';
    chip.setAttribute('aria-label',S.on?'Pasaporte del pescador: nivel '+l+', '+readN()+' de '+CAT.length+' guías':'Abrir pasaporte del pescador');
  }

  /* reto */
  function pickQ(){
    var d=new Date(),n=Math.floor((d-new Date(d.getFullYear(),0,0))/864e5),seen=S.on?S.ok:MEM.ok,grp=CUR>=0?CAT[CUR][2]:null,pool=[],j;
    for(j=0;j<QS.length;j++)if(!seen['q'+j]&&QS[j][4]===BASE)pool.push(j);
    if(!pool.length)for(j=0;j<QS.length;j++)if(!seen['q'+j]&&(!grp||QS[j][5]===grp))pool.push(j);
    if(!pool.length)for(j=0;j<QS.length;j++)if(!seen['q'+j])pool.push(j);
    if(!pool.length)for(j=0;j<QS.length;j++)pool.push(j);
    return pool[n%pool.length];
  }
  function nextQ(cur){var j=(cur+1)%QS.length,g=0;while(g++<QS.length){if(!(S.on?S.ok:MEM.ok)['q'+j])return j;j=(j+1)%QS.length}return (cur+1)%QS.length}
  function renderQ(box,idx){
    var q=QS[idx];box.innerHTML='';
    var w=el('div','fz-q');w.appendChild(el('strong','',q[0]));
    var out=el('div','ex');out.setAttribute('aria-live','polite');
    q[1].forEach(function(t,k){
      var b=el('button','o',t);b.type='button';
      b.onclick=function(){
        if(w.getAttribute('data-done'))return;w.setAttribute('data-done','1');
        var good=k===q[2];b.classList.add(good?'ok':'no');
        if(!good)w.querySelectorAll('.o')[q[2]].classList.add('ok');
        var gain='';
        if(good){var store=S.on?S.ok:MEM.ok;if(!store['q'+idx]){store['q'+idx]=1;if(S.on){var before=lvl(xp()-5);save();gain=' <b>+5 XP</b>';lvlCheck(before)}else gain=' <small>Activa tu pasaporte para guardar los puntos.</small>'}}
        ev('fz_reto',{pregunta:idx+1,acierto:good?1:0});paintChip();
        out.innerHTML=(good?'✅ ¡Correcto!':'❌ Casi.')+gain+'<p>'+q[3]+'</p><p><a href="'+q[4]+'">Leer la guía</a> · <button type="button" class="fz-ghost">Otra pregunta</button></p>';
        out.querySelector('button').onclick=function(){renderQ(box,nextQ(idx))};
      };
      w.appendChild(b);
    });
    w.appendChild(out);box.appendChild(w);
  }
  function lvlCheck(before){var now=lvl(xp());if(now>before){say('🏆 <b>¡Subes a '+LV[now][0]+'!</b> Sigue explorando.');ev('fz_nivel',{nivel:LV[now][0]})}paintChip()}

  /* activar */
  function activate(){
    if(S.on)return;
    S={on:true,read:{},ok:{},streak:0,last:''};var k;
    for(k in MEM.read)S.read[k]=MEM.read[k];for(k in MEM.ok)S.ok[k]=MEM.ok[k];
    streak();save();ev('fz_pasaporte_activar');paintChip();if(pan.classList.contains('on'))paintPanel();
    say('🎣 Pasaporte activado. Llevas <b>'+readN()+'</b> guía(s) y <b>'+xp()+' XP</b>.');
  }
  function reset(){try{localStorage.removeItem(KEY)}catch(e){}S={on:false,read:{},ok:{},streak:0,last:''};MEM={read:{},ok:{}};paintChip();paintPanel()}

  /* panel */
  function paintPanel(){
    var x=xp(),l=lvl(x),nx=LV[l+1],h='',j,c;
    h+='<h3>'+(S.on?LV[l][0]:'Pasaporte del pescador')+'</h3>';
    if(S.on){
      var pct=nx?Math.round((x-LV[l][1])/(nx[1]-LV[l][1])*100):100;
      h+='<p><small>'+x+' XP'+(nx?' · faltan '+(nx[1]-x)+' para '+nx[0]:' · nivel máximo')+(S.streak>1?' · racha de '+S.streak+' días':'')+'</small></p><div class="fz-meter"><i style="width:'+pct+'%"></i></div>';
    }else{
      h+='<p>Sube de nivel leyendo guías y respondiendo retos. <small>Guardamos tu progreso solo en este navegador, sin datos personales (<a href="/cookies.html">más info</a>).</small></p><p><button type="button" class="fz-btn" id="fz-act">Activar mi pasaporte</button></p>';
    }
    h+='<div class="fz-sec"><h4>Reto del día</h4><div id="fz-pq"></div></div>';
    var un=[],rd=S.on?S.read:MEM.read;
    for(j=0;j<CAT.length;j++)if(!rd[CAT[j][0]]&&j!==CUR)un.push(j);
    if(CUR>=0){un.sort(function(a,b){return (CAT[b][2]===CAT[CUR][2])-(CAT[a][2]===CAT[CUR][2])||a-b})}
    h+='<div class="fz-sec"><h4>Tu próxima lectura</h4>';
    if(un.length){h+='<ul class="fz-list">';for(j=0;j<Math.min(3,un.length);j++)h+='<li><a href="'+CAT[un[j]][0]+'">'+CAT[un[j]][1]+'</a> <small>+10 XP</small></li>';h+='</ul>'}else h+='<p>¡Las has leído todas! Vuelve pronto: publicamos guías nuevas.</p>';
    h+='</div><details class="fz-sec"><summary>Todas las guías ('+readN()+'/'+CAT.length+')</summary><ul class="fz-list">';
    for(j=0;j<CAT.length;j++)h+='<li class="'+(rd[CAT[j][0]]?'d':'')+'">'+(rd[CAT[j][0]]?'✓ ':'· ')+'<a href="'+CAT[j][0]+'">'+CAT[j][1]+'</a></li>';
    h+='</ul></details>';
    if(S.on)h+='<p style="margin-top:.8rem"><button type="button" class="fz-ghost" id="fz-rst">Borrar mi progreso</button></p>';
    pan.innerHTML=h;
    var a=pan.querySelector('#fz-act');if(a)a.onclick=activate;
    var r=pan.querySelector('#fz-rst');if(r)r.onclick=reset;
    renderQ(pan.querySelector('#fz-pq'),pickQ());
  }
  function openPan(o){
    pan.classList.toggle('on',o);chip.setAttribute('aria-expanded',o?'true':'false');
    if(o){paintPanel();ev('fz_pasaporte_abrir',{nivel:LV[lvl(xp())][0]})}
  }
  chip.onclick=function(){openPan(!pan.classList.contains('on'))};
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pan.classList.contains('on')){openPan(false);chip.focus()}});
  document.addEventListener('click',function(e){if(pan.classList.contains('on')&&e.target.isConnected&&!pan.contains(e.target)&&!chip.contains(e.target))openPan(false)});

  /* reto al final del artículo */
  if(!HOME&&CUR>=0){
    var anchor=document.querySelector('.gz-next')||document.querySelector('footer');
    if(anchor&&anchor.parentNode){
      var sec=el('section','fz-reto','<h3>Reto rápido</h3><div></div>');sec.setAttribute('aria-label','Reto rápido');
      anchor.parentNode.insertBefore(sec,anchor);renderQ(sec.lastChild,pickQ());
    }
  }

  /* guía leída: 60 % de scroll y 25 s con la pestaña visible */
  var act=0,done=(CUR<0),tick=0,mx=0;
  function onScroll(){
    if(tick)return;tick=requestAnimationFrame(function(){
      tick=0;var h=document.documentElement,max=h.scrollHeight-h.clientHeight,p=max>0?Math.min(1,(window.pageYOffset||h.scrollTop)/max):0;
      if(p>mx)mx=p;if(bi)bi.style.transform='scaleX('+p+')';
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  var iv=setInterval(function(){
    if(done){clearInterval(iv);return}
    if(document.hidden)return;act++;
    if(act>=25&&mx>=.6){
      done=true;clearInterval(iv);var u=CAT[CUR][0],store=S.on?S.read:MEM.read;
      if(!store[u]){
        var before=lvl(xp());store[u]=Date.now();ev('fz_guia_leida',{pagina:u,total:readN()});
        if(S.on){save();say('📖 <b>Guía descubierta</b> · '+readN()+'/'+CAT.length+' · +10 XP');var n=lvl(xp());if(n>before)setTimeout(function(){lvlCheck(before)},1800)}
        else if(!flag('fz_prompt')){say('📖 Has terminado esta guía. <button type="button" class="fz-btn">Activar pasaporte</button>',true);setTimeout(function(){toast.classList.remove('on')},9000)}
        paintChip();
      }
    }
  },1000);
  function flag(k){try{if(sessionStorage.getItem(k))return true;sessionStorage.setItem(k,'1')}catch(e){}return false}

  /* Home: últimas capturas aprobadas (solo si hay suficientes; si no, no se muestra nada) */
  if(HOME&&window.fetch){
    var tz=document.getElementById('fz-cap-teaser'),tg=document.getElementById('fz-cap-teaser-grid');
    if(tz&&tg){fetch('/api/capturas/ultimas?n=6',{credentials:'same-origin'}).then(function(r){return r.ok?r.json():null}).then(function(j){
      if(!j||!j.items||j.items.length<4)return;
      j.items.forEach(function(it){var a=document.createElement('a');a.href='/capturas/';var im=document.createElement('img');im.src=it.thumb;im.alt=it.alt;im.width=it.w;im.height=it.h;im.loading='lazy';im.decoding='async';a.appendChild(im);tg.appendChild(a)});
      tz.hidden=false}).catch(function(){})}
  }
  paintChip();
  if(!S.on&&!flag('fz_pulse')){chip.classList.add('pulse')}
})();
