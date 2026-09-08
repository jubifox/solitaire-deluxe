/* ============ Moteur d'effets : particules, secousses, flashs ============ */
var FX = (function(){
  var cv, cx, W=0, H=0, dpr=1, parts=[], running=false;

  function jl(){ return Store.opts().juice; }               // 0 sobre / 1 normal / 2 max
  function mul(){ return [0.35, 1, 1.9][jl()] || 1; }

  function init(){
    cv = document.getElementById('fx');
    cx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize(){
    dpr = Math.min(2, window.devicePixelRatio||1);
    W = cv.width  = Math.floor(innerWidth * dpr);
    H = cv.height = Math.floor(innerHeight * dpr);
    cv.style.width = innerWidth+'px'; cv.style.height = innerHeight+'px';
  }

  function loop(){
    if (!parts.length){ running = false; cx.clearRect(0,0,W,H); return; }
    running = true;
    cx.clearRect(0,0,W,H);
    for (var i=parts.length-1;i>=0;i--){
      var p = parts[i];
      p.vy += p.g;
      p.vx *= p.fr; p.vy *= p.fr;
      p.x += p.vx; p.y += p.vy;
      p.life -= 1;
      p.rot += p.vr;
      if (p.life <= 0 || p.y > H+60){ parts.splice(i,1); continue; }
      var a = Math.min(1, p.life / p.fade);
      cx.save();
      cx.globalAlpha = a;
      cx.translate(p.x, p.y);
      cx.rotate(p.rot);
      cx.fillStyle = p.c;
      if (p.shape === 'rect'){
        cx.fillRect(-p.s/2, -p.s/4, p.s, p.s/2);
      } else if (p.shape === 'line'){
        cx.strokeStyle = p.c; cx.lineWidth = Math.max(1,p.s*.35);
        cx.beginPath(); cx.moveTo(0,0); cx.lineTo(-p.vx*2.2, -p.vy*2.2); cx.stroke();
      } else if (p.shape === 'star'){
        star(cx, 0,0, p.s, p.s*.45, 5);
      } else {
        cx.beginPath(); cx.arc(0,0,p.s*.5,0,6.284); cx.fill();
        if (p.glow){ cx.globalAlpha = a*.35; cx.beginPath(); cx.arc(0,0,p.s*1.5,0,6.284); cx.fill(); }
      }
      cx.restore();
    }
    requestAnimationFrame(loop);
  }
  function star(c,x,y,r1,r2,n){
    c.beginPath();
    for (var i=0;i<n*2;i++){
      var r = i%2 ? r2 : r1, a = Math.PI*i/n - Math.PI/2;
      c.lineTo(x+Math.cos(a)*r, y+Math.sin(a)*r);
    }
    c.closePath(); c.fill();
  }
  function push(p){
    parts.push(p);
    if (parts.length > 1400) parts.splice(0, parts.length-1400);
    if (!running) requestAnimationFrame(loop);
  }

  var PAL = ['#ffd76e','#ff9f43','#ff5f6d','#7ee6a8','#5ef2ff','#c58cff','#ffffff'];

  function burst(x, y, opt){
    opt = opt||{};
    var n = Math.round((opt.n||18) * mul());
    var colors = opt.colors || PAL;
    for (var i=0;i<n;i++){
      var a = opt.dir!==undefined ? opt.dir + (Math.random()-.5)*(opt.spread||1.4) : Math.random()*6.284;
      var sp = (opt.speed||5) * (0.35 + Math.random()) * dpr;
      push({
        x:x*dpr, y:y*dpr, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
        g:(opt.g===undefined?0.22:opt.g)*dpr, fr:opt.fr||0.965,
        s:((opt.size||6)*(.5+Math.random()))*dpr,
        life:(opt.life||46)*(.6+Math.random()*.8), fade:opt.life||46,
        c:colors[(Math.random()*colors.length)|0], rot:Math.random()*6.28,
        vr:(Math.random()-.5)*.4, shape:opt.shape||'circle', glow:opt.glow!==false
      });
    }
  }

  function ring(x,y,color,n){
    n = Math.round((n||22)*mul());
    for (var i=0;i<n;i++){
      var a = 6.284*i/n, sp = (3.2+Math.random()*1.6)*dpr;
      push({x:x*dpr,y:y*dpr,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:0,fr:.9,
        s:(3.6+Math.random()*2)*dpr,life:30,fade:30,c:color||'#ffd76e',
        rot:0,vr:0,shape:'circle',glow:true});
    }
  }

  function confetti(n, fromTop){
    n = Math.round((n||90)*mul());
    for (var i=0;i<n;i++){
      push({
        x:Math.random()*W, y: fromTop ? -20 - Math.random()*H*.3 : H*.55 + Math.random()*H*.2,
        vx:(Math.random()-.5)*7*dpr, vy:(fromTop? 1+Math.random()*3 : -(6+Math.random()*8))*dpr,
        g:0.24*dpr, fr:.992, s:(7+Math.random()*7)*dpr,
        life:200+Math.random()*130, fade:90,
        c:PAL[(Math.random()*PAL.length)|0], rot:Math.random()*6.28,
        vr:(Math.random()-.5)*.5, shape:'rect', glow:false
      });
    }
  }

  function firework(x,y,color){
    ring(x,y,color||PAL[(Math.random()*PAL.length)|0], 30);
    burst(x,y,{n:26,speed:7,size:5,life:60,g:.16,colors:[color||'#fff','#fff','#ffd76e'],shape:'line'});
  }

  function fireworks(dur){
    var t0 = performance.now();
    (function go(){
      var t = performance.now()-t0;
      if (t > (dur||3400)) return;
      firework(innerWidth*(.12+Math.random()*.76), innerHeight*(.15+Math.random()*.5));
      if (Store.opts().sound) SFX.bounce(4);
      setTimeout(go, 220 + Math.random()*260);
    })();
  }

  /* ---------- secousse d'écran ---------- */
  var shaker;
  function shake(level){
    if (!Store.opts().shake || jl()===0) return;
    shaker = shaker || document.getElementById('shaker');
    var cls = level>=3 ? 'sh-l' : level===2 ? 'sh-m' : 'sh-s';
    shaker.classList.remove('sh-s','sh-m','sh-l');
    void shaker.offsetWidth;
    shaker.classList.add(cls);
    setTimeout(function(){ shaker.classList.remove(cls); }, 620);
  }

  var flashEl;
  function flash(gold){
    if (jl()===0) return;
    flashEl = flashEl || document.getElementById('flash');
    flashEl.classList.toggle('gold', !!gold);
    flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on');
  }

  function hot(on){
    document.getElementById('vignette').classList.toggle('hot', !!on);
    document.getElementById('hud').classList.toggle('hot', !!on);
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
    if (jl()===0) return;
    var n = 4 + jl()*3;
    for (var i=0;i<n;i++){
      var s = document.createElement('div');
      s.className = 'spark';
      s.style.setProperty('--sc', color||'#ffd76e');
      s.style.left = x+'px'; s.style.top = y+'px';
      host.appendChild(s);
      var a = Math.random()*6.284, d = 20+Math.random()*70;
      s.animate([
        {transform:'translate(-50%,-50%) scale(1)', opacity:1},
        {transform:'translate('+(Math.cos(a)*d-50)+'%,'+(Math.sin(a)*d-50)+'%) scale(0)', opacity:0}
      ], {duration:420+Math.random()*380, easing:'cubic-bezier(.2,.8,.3,1)'})
       .onfinish = function(){ this.effect.target.remove(); };
    }
  }

  /* ---------- ambiance de fond (pétales / poussière) ---------- */
  function ambient(bgId){
    var host = document.getElementById('bgfx');
    host.innerHTML = '';
    if (jl()===0) return;
    var count, mk;
    if (bgId === 'bg-sakura'){
      count = 22 * (jl()===2?1.6:1);
      mk = function(){
        var p = document.createElement('div');
        p.className = 'petal';
        p.style.left = (Math.random()*100)+'vw';
        p.style.setProperty('--pdx', ((Math.random()-.5)*260)+'px');
        p.style.animationDuration = (7+Math.random()*8)+'s';
        p.style.animationDelay = (-Math.random()*12)+'s';
        p.style.opacity = .45+Math.random()*.5;
        var sc = .6+Math.random()*1.1;
        p.style.width = p.style.height = (10*sc)+'px';
        return p;
      };
    } else {
      count = (bgId==='bg-galaxie'||bgId==='bg-aurore' ? 34 : 16) * (jl()===2?1.7:1);
      mk = function(){
        var p = document.createElement('div');
        p.className = 'dust';
        var s = 1+Math.random()*3.2;
        p.style.width = p.style.height = s+'px';
        p.style.left = (Math.random()*100)+'vw';
        p.style.setProperty('--ddx', ((Math.random()-.5)*160)+'px');
        p.style.animationDuration = (16+Math.random()*22)+'s';
        p.style.animationDelay = (-Math.random()*30)+'s';
        p.style.opacity = .2+Math.random()*.5;
        return p;
      };
    }
    for (var i=0;i<count;i++) host.appendChild(mk());
  }

  return {init:init, burst:burst, ring:ring, confetti:confetti, firework:firework, fireworks:fireworks,
          shake:shake, flash:flash, hot:hot, pop:pop, sparkAt:sparkAt, ambient:ambient,
          get palette(){ return PAL; }};
})();
