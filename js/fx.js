/* ============ Moteur d'effets : particules, ondes, faisceaux, secousses ============
   Les particules vivent dans un pool preallouee : aucune allocation ni
   splice pendant l'animation. Le canvas n'efface que la zone reellement
   sale de la frame precedente au lieu de tout le plein ecran. */
var FX = (function(){
  var cv, cx, W=0, H=0, dpr=1, scheduled=false;

  /* Une seule image programmee a la fois. Sans ce verrou, chaque particule
     creee dans la meme frame reprogrammait la boucle : une rafale de 40
     particules lancait 40 boucles paralleles, qui redessinaient toutes le
     meme jeu de particules a chaque image. */
  function schedule(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(loop);
  }

  /* ---------------- pool ---------------- */
  var POOL = [], n = 0;
  function obtain(){
    if (n < POOL.length) return POOL[n++];
    var p = {};
    POOL.push(p); n++;
    return p;
  }
  function kill(i){                        // echange-suppression : O(1), zero GC
    var last = n - 1;
    if (i !== last){ var t = POOL[i]; POOL[i] = POOL[last]; POOL[last] = t; }
    n--;
  }

  function jl(){ return Store.opts().juice; }               // 0 sobre / 1 normal / 2 max
  function mul(){ return ([0.35, 1, 1.9][jl()] || 1) * Perf.scale; }
  function on(){ return jl() > 0 && Perf.scale > 0; }
  /* Au palier eco le canvas plein ecran coute a lui seul plus de la moitie
     des images par seconde en partie : on garde les popups et le flash,
     qui sont du DOM ordinaire, mais plus de particules. */
  function canvasOn(){ return on() && Perf.tier > 0; }

  function init(){
    cv = document.getElementById('fx');
    cx = cv.getContext('2d', {alpha:true, desynchronized:true});
    resize();
    window.addEventListener('resize', resize);
    Perf.onChange(function(){ resize(); ambient(lastBg); });
  }
  function resize(){
    dpr = Math.min(Perf.maxDpr, window.devicePixelRatio||1);
    W = cv.width  = Math.floor(innerWidth * dpr);
    H = cv.height = Math.floor(innerHeight * dpr);
    cv.style.width = innerWidth+'px'; cv.style.height = innerHeight+'px';
    cv.style.display = Perf.tier > 0 ? '' : 'none';
    dirty = null;
  }

  /* ---------------- boucle ---------------- */
  var dirty = null;                        // zone sale de la frame precedente
  function loop(){
    scheduled = false;
    if (!n){
      if (dirty) cx.clearRect(dirty[0], dirty[1], dirty[2]-dirty[0], dirty[3]-dirty[1]);
      dirty = null;
      return;
    }
    if (dirty) cx.clearRect(dirty[0], dirty[1], dirty[2]-dirty[0], dirty[3]-dirty[1]);
    var x0=1e9, y0=1e9, x1=-1e9, y1=-1e9;

    for (var i=n-1;i>=0;i--){
      var p = POOL[i];
      p.life--;
      if (p.life <= 0){ kill(i); continue; }

      var a = Math.min(1, p.life / p.fade);
      if (p.type === 'wave'){
        p.r += p.vr0;
        cx.save();
        cx.globalAlpha = a * 0.9;
        cx.strokeStyle = p.c;
        cx.lineWidth = p.w * a;
        cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.2832); cx.stroke();
        cx.restore();
        if (p.x-p.r-p.w < x0) x0 = p.x-p.r-p.w;
        if (p.y-p.r-p.w < y0) y0 = p.y-p.r-p.w;
        if (p.x+p.r+p.w > x1) x1 = p.x+p.r+p.w;
        if (p.y+p.r+p.w > y1) y1 = p.y+p.r+p.w;
        continue;
      }

      p.vy += p.g;
      p.vx *= p.fr; p.vy *= p.fr;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.vr;
      if (p.y > H+80){ kill(i); continue; }

      cx.save();
      cx.globalAlpha = a;
      cx.translate(p.x, p.y);
      if (p.rot) cx.rotate(p.rot);
      cx.fillStyle = p.c;

      if (p.type === 'rect'){
        cx.fillRect(-p.s/2, -p.s/4, p.s, p.s/2);
      } else if (p.type === 'line'){
        cx.strokeStyle = p.c; cx.lineWidth = Math.max(1, p.s*.35);
        cx.beginPath(); cx.moveTo(0,0); cx.lineTo(-p.vx*2.2, -p.vy*2.2); cx.stroke();
      } else if (p.type === 'star'){
        star(cx, p.s, p.s*.45, 5);
      } else if (p.type === 'suit'){
        var path = suitPath(p.suit);
        if (path){
          var k = p.s / 100;
          cx.scale(k, k); cx.translate(-50, -50);
          cx.fill(path);
        }
      } else {
        cx.beginPath(); cx.arc(0,0,p.s*.5,0,6.2832); cx.fill();
        if (p.glow){ cx.globalAlpha = a*.35; cx.beginPath(); cx.arc(0,0,p.s*1.5,0,6.2832); cx.fill(); }
      }
      cx.restore();

      var m = p.s * (p.glow ? 1.8 : 1.1) + 2;
      if (p.x-m < x0) x0 = p.x-m;
      if (p.y-m < y0) y0 = p.y-m;
      if (p.x+m > x1) x1 = p.x+m;
      if (p.y+m > y1) y1 = p.y+m;
    }

    dirty = (x1 > x0)
      ? [Math.max(0,x0-2), Math.max(0,y0-2), Math.min(W,x1+2), Math.min(H,y1+2)]
      : null;
    schedule();
  }

  function star(c, r1, r2, k){
    c.beginPath();
    for (var i=0;i<k*2;i++){
      var r = i%2 ? r2 : r1, a = Math.PI*i/k - Math.PI/2;
      c.lineTo(Math.cos(a)*r, Math.sin(a)*r);
    }
    c.closePath(); c.fill();
  }

  /* tracés d'enseignes reutilises pour les particules (Path2D mis en cache) */
  var suitCache = [];
  function suitPath(s){
    if (suitCache[s]) return suitCache[s];
    if (typeof CardArt === 'undefined' || !CardArt.pathData) return null;
    var d = CardArt.pathData(s);
    if (!d || typeof Path2D === 'undefined') return null;
    return (suitCache[s] = new Path2D(d));
  }

  function spawn(){
    if (!canvasOn() || n >= Perf.maxParticles) return null;
    var p = obtain();
    schedule();
    return p;
  }

  var PAL = ['#ffd76e','#ff9f43','#ff5f6d','#7ee6a8','#5ef2ff','#c58cff','#ffffff'];

  /* ---------------- primitives ---------------- */
  function burst(x, y, opt){
    if (!on()) return;
    opt = opt||{};
    var k = Math.round((opt.n||18) * mul());
    var colors = opt.colors || PAL;
    for (var i=0;i<k;i++){
      var p = spawn(); if (!p) return;
      var a = opt.dir!==undefined ? opt.dir + (Math.random()-.5)*(opt.spread||1.4) : Math.random()*6.2832;
      var sp = (opt.speed||5) * (0.35 + Math.random()) * dpr;
      p.type = opt.shape || 'circle';
      p.x = x*dpr; p.y = y*dpr;
      p.vx = Math.cos(a)*sp; p.vy = Math.sin(a)*sp;
      p.g = (opt.g===undefined?0.22:opt.g)*dpr; p.fr = opt.fr||0.965;
      p.s = ((opt.size||6)*(.5+Math.random()))*dpr;
      p.fade = opt.life||46; p.life = p.fade*(.6+Math.random()*.8);
      p.c = colors[(Math.random()*colors.length)|0];
      p.rot = Math.random()*6.28; p.vr = (Math.random()-.5)*.4;
      p.glow = opt.glow!==false; p.suit = opt.suit||0;
    }
  }

  /* pluie d'enseignes : les particules prennent la forme du symbole */
  function suitBurst(x, y, suit, opt){
    opt = opt||{};
    burst(x, y, {
      n: opt.n||14, speed: opt.speed||5, size: opt.size||16, life: opt.life||54,
      g: opt.g===undefined?0.2:opt.g, colors: opt.colors||PAL,
      shape:'suit', suit:suit, glow:false
    });
  }

  function ring(x,y,color,k){
    if (!on()) return;
    k = Math.round((k||22)*mul());
    for (var i=0;i<k;i++){
      var p = spawn(); if (!p) return;
      var a = 6.2832*i/k, sp = (3.2+Math.random()*1.6)*dpr;
      p.type='circle'; p.x=x*dpr; p.y=y*dpr;
      p.vx=Math.cos(a)*sp; p.vy=Math.sin(a)*sp; p.g=0; p.fr=.9;
      p.s=(3.6+Math.random()*2)*dpr; p.fade=30; p.life=30;
      p.c=color||'#ffd76e'; p.rot=0; p.vr=0; p.glow=true;
    }
  }

  /* onde de choc : anneau qui s'ouvre et s'efface */
  function shockwave(x, y, color, opt){
    if (!on()) return;
    opt = opt||{};
    var rings = Math.min(3, Math.max(1, Math.round((opt.rings||2) * (Perf.scale>=1?1:0.6))));
    for (var i=0;i<rings;i++){
      var p = spawn(); if (!p) return;
      p.type='wave'; p.x=x*dpr; p.y=y*dpr;
      p.r=(opt.r0||6)*dpr + i*4*dpr;
      p.vr0=((opt.speed||3.4) - i*0.6)*dpr;
      p.w=(opt.w||3)*dpr; p.fade=(opt.life||34); p.life=p.fade - i*4;
      p.c=color||'#ffd76e';
    }
  }

  /* faisceau : traînee de lumiere d'un point a un autre */
  function beam(x0,y0,x1,y1,color){
    if (!on()) return;
    var dx=x1-x0, dy=y1-y0, len=Math.hypot(dx,dy);
    var k = Math.min(26, Math.round(len/14 * mul()));
    for (var i=0;i<k;i++){
      var p = spawn(); if (!p) return;
      var t=i/k;
      p.type='circle';
      p.x=(x0+dx*t)*dpr; p.y=(y0+dy*t)*dpr;
      p.vx=(Math.random()-.5)*1.2*dpr; p.vy=(Math.random()-.5)*1.2*dpr;
      p.g=0; p.fr=.94; p.s=(2.5+Math.random()*3)*dpr;
      p.fade=26; p.life=14+t*14;
      p.c=color||'#ffd76e'; p.rot=0; p.vr=0; p.glow=true;
    }
  }

  function confetti(k, fromTop){
    if (!on()) return;
    k = Math.round((k||90)*mul());
    for (var i=0;i<k;i++){
      var p = spawn(); if (!p) return;
      p.type='rect';
      p.x=Math.random()*W;
      p.y= fromTop ? -20 - Math.random()*H*.3 : H*.55 + Math.random()*H*.2;
      p.vx=(Math.random()-.5)*7*dpr;
      p.vy=(fromTop? 1+Math.random()*3 : -(6+Math.random()*8))*dpr;
      p.g=0.24*dpr; p.fr=.992; p.s=(7+Math.random()*7)*dpr;
      p.fade=90; p.life=200+Math.random()*130;
      p.c=PAL[(Math.random()*PAL.length)|0];
      p.rot=Math.random()*6.28; p.vr=(Math.random()-.5)*.5; p.glow=false;
    }
  }

  /* pluie d'enseignes plein ecran (victoire) */
  function suitRain(k){
    if (!on()) return;
    k = Math.round((k||34)*mul());
    for (var i=0;i<k;i++){
      var p = spawn(); if (!p) return;
      p.type='suit'; p.suit=(Math.random()*4)|0;
      p.x=Math.random()*W; p.y=-30-Math.random()*H*.4;
      p.vx=(Math.random()-.5)*2*dpr; p.vy=(1.4+Math.random()*2.6)*dpr;
      p.g=0.07*dpr; p.fr=.995; p.s=(15+Math.random()*20)*dpr;
      p.fade=110; p.life=230+Math.random()*140;
      p.c = p.suit===1||p.suit===2 ? '#ff5f6d' : '#5ef2ff';
      p.rot=Math.random()*6.28; p.vr=(Math.random()-.5)*.12; p.glow=false;
    }
  }

  function firework(x,y,color){
    ring(x,y,color||PAL[(Math.random()*PAL.length)|0], 30);
    shockwave(x,y,color||'#ffd76e',{speed:5,w:2.5,life:30,rings:2});
    burst(x,y,{n:26,speed:7,size:5,life:60,g:.16,colors:[color||'#fff','#fff','#ffd76e'],shape:'line'});
  }

  function fireworks(dur){
    if (!on()) return;
    var t0 = performance.now();
    (function go(){
      var t = performance.now()-t0;
      if (t > (dur||3400)) return;
      firework(innerWidth*(.12+Math.random()*.76), innerHeight*(.15+Math.random()*.5));
      if (Store.opts().sound) SFX.bounce(4);
      setTimeout(go, (220 + Math.random()*260) * (Perf.scale>=1?1:1.6));
    })();
  }

  /* ---------- secousse d'écran ---------- */
  var shaker;
  function shake(level){
    if (!Store.opts().shake || jl()===0 || Perf.reduced) return;
    if (Perf.tier === 0 && level < 2) return;
    shaker = shaker || document.getElementById('shaker');
    var cls = level>=3 ? 'sh-l' : level===2 ? 'sh-m' : 'sh-s';
    shaker.classList.remove('sh-s','sh-m','sh-l');
    void shaker.offsetWidth;
    shaker.classList.add(cls);
    setTimeout(function(){ shaker.classList.remove(cls); }, 620);
  }

  var flashEl;
  function flash(gold){
    if (jl()===0 || Perf.reduced) return;
    flashEl = flashEl || document.getElementById('flash');
    flashEl.classList.toggle('gold', !!gold);
    flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on');
  }

  /* balayage lumineux plein ecran */
  var sweepEl;
  function sweep(cls){
    if (jl()===0 || Perf.reduced || Perf.tier===0) return;
    sweepEl = sweepEl || document.getElementById('sweep');
    if (!sweepEl) return;
    sweepEl.className = cls || '';
    void sweepEl.offsetWidth;
    sweepEl.classList.add('on');
    setTimeout(function(){ sweepEl.classList.remove('on'); }, 900);
  }

  /* pulsation d'aberration chromatique sur les gros enchaînements */
  function chroma(){
    if (jl()===0 || Perf.reduced || Perf.tier < 2) return;
    var b = document.body;
    b.classList.remove('chroma'); void b.offsetWidth; b.classList.add('chroma');
    setTimeout(function(){ b.classList.remove('chroma'); }, 480);
  }

  function hot(v){
    document.getElementById('vignette').classList.toggle('hot', !!v);
    document.getElementById('hud').classList.toggle('hot', !!v);
  }
  function heatLevel(k){                    // 0..3 : chaleur ambiante du plateau
    document.body.setAttribute('data-heat', Math.max(0, Math.min(3, k|0)));
  }

  /* ---------- popups DOM ---------- */
  function pop(text, x, y, cls){
    var host = document.getElementById('popups');
    if (!host) return;
    var d = document.createElement('div');
    d.className = 'pop ' + (cls||'good');
    d.textContent = text;
    d.style.left = x+'px'; d.style.top = y+'px';
    host.appendChild(d);
    setTimeout(function(){ d.remove(); }, 1100);
  }

  /* ---------- étincelles DOM derrière une carte ---------- */
  function sparkAt(host, x, y, color){
    if (!on() || Perf.tier === 0) return;
    var k = 4 + jl()*3;
    for (var i=0;i<k;i++){
      var s = document.createElement('div');
      s.className = 'spark';
      s.style.setProperty('--sc', color||'#ffd76e');
      s.style.left = x+'px'; s.style.top = y+'px';
      host.appendChild(s);
      var a = Math.random()*6.2832, d = 20+Math.random()*70;
      s.animate([
        {transform:'translate(-50%,-50%) scale(1)', opacity:1},
        {transform:'translate('+(Math.cos(a)*d-50)+'%,'+(Math.sin(a)*d-50)+'%) scale(0)', opacity:0}
      ], {duration:420+Math.random()*380, easing:'cubic-bezier(.2,.8,.3,1)'})
       .onfinish = function(){ this.effect.target.remove(); };
    }
  }

  /* ---------- ambiance de fond ---------- */
  var lastBg = null;
  var AMB = {
    'bg-sakura':  {cls:'petal',  base:20},
    'bg-galaxie': {cls:'dust',   base:26},
    'bg-aurore':  {cls:'dust',   base:22},
    'bg-foret':   {cls:'spore',  base:16},
    'bg-braise':  {cls:'ember',  base:22},
    'bg-abysse':  {cls:'bubble', base:18},
    'bg-pluie':   {cls:'rain',   base:34},
    'bg-dune':    {cls:'sand',   base:20}
  };
  function ambient(bgId){
    lastBg = bgId;
    var host = document.getElementById('bgfx');
    if (!host) return;
    host.innerHTML = '';
    if (!on() || Perf.tier === 0) return;
    var def = AMB[bgId] || {cls:'dust', base:12};
    var count = Math.round(def.base * (jl()===2?1.5:1) * Perf.scale);
    if (!count) return;
    var frag = document.createDocumentFragment();
    for (var i=0;i<count;i++) frag.appendChild(mkAmbient(def.cls));
    host.appendChild(frag);
  }
  function mkAmbient(cls){
    var p = document.createElement('div');
    p.className = cls;
    p.style.left = (Math.random()*100)+'vw';
    p.style.setProperty('--adx', ((Math.random()-.5)*220)+'px');
    p.style.animationDelay = (-Math.random()*24)+'s';
    if (cls === 'petal'){
      p.style.animationDuration = (7+Math.random()*8)+'s';
      p.style.opacity = .45+Math.random()*.5;
      var sc = .6+Math.random()*1.1;
      p.style.width = p.style.height = (10*sc)+'px';
    } else if (cls === 'rain'){
      p.style.animationDuration = (.7+Math.random()*.7)+'s';
      p.style.height = (14+Math.random()*22)+'px';
      p.style.opacity = .18+Math.random()*.35;
    } else if (cls === 'ember'){
      p.style.animationDuration = (5+Math.random()*7)+'s';
      var e = 2+Math.random()*4;
      p.style.width = p.style.height = e+'px';
      p.style.opacity = .35+Math.random()*.5;
    } else if (cls === 'bubble'){
      p.style.animationDuration = (9+Math.random()*10)+'s';
      var bs = 3+Math.random()*9;
      p.style.width = p.style.height = bs+'px';
      p.style.opacity = .12+Math.random()*.28;
    } else if (cls === 'spore'){
      p.style.animationDuration = (12+Math.random()*14)+'s';
      var ss = 2+Math.random()*3;
      p.style.width = p.style.height = ss+'px';
      p.style.opacity = .3+Math.random()*.45;
    } else if (cls === 'sand'){
      p.style.left = '0';
      p.style.setProperty('--sy', (14+Math.random()*74)+'vh');
      p.style.animationDuration = (4+Math.random()*5)+'s';
      p.style.height = '1.5px';
      p.style.width = (10+Math.random()*26)+'px';
      p.style.opacity = .12+Math.random()*.3;
    } else {
      p.style.animationDuration = (16+Math.random()*22)+'s';
      var s = 1+Math.random()*3.2;
      p.style.width = p.style.height = s+'px';
      p.style.opacity = .2+Math.random()*.5;
    }
    return p;
  }

  return {init:init, burst:burst, suitBurst:suitBurst, ring:ring, shockwave:shockwave, beam:beam,
          confetti:confetti, suitRain:suitRain, firework:firework, fireworks:fireworks,
          shake:shake, flash:flash, sweep:sweep, chroma:chroma, hot:hot, heatLevel:heatLevel,
          pop:pop, sparkAt:sparkAt, ambient:ambient,
          get count(){ return n; },
          get palette(){ return PAL; }};
})();
