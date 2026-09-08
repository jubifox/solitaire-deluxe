/* ============ Rendu, interactions et animations du plateau ============ */
var UI = (function(){

  var REFS = ['stock','waste','f0','f1','f2','f3','t0','t1','t2','t3','t4','t5','t6'];
  var PIPMAP = {
    1:[[1,3]],
    2:[[1,0],[1,6]],
    3:[[1,0],[1,3],[1,6]],
    4:[[0,0],[2,0],[0,6],[2,6]],
    5:[[0,0],[2,0],[1,3],[0,6],[2,6]],
    6:[[0,0],[2,0],[0,3],[2,3],[0,6],[2,6]],
    7:[[0,0],[2,0],[1,1.5],[0,3],[2,3],[0,6],[2,6]],
    8:[[0,0],[2,0],[1,1.5],[0,3],[2,3],[1,4.5],[0,6],[2,6]],
    9:[[0,0],[2,0],[0,2],[2,2],[1,3],[0,4],[2,4],[0,6],[2,6]],
    10:[[0,0],[2,0],[1,1],[0,2],[2,2],[0,4],[2,4],[1,5],[0,6],[2,6]]
  };

  var S = {
    game:null, el:{}, cardEl:{}, slotEl:{}, geo:{}, zones:[],
    drag:null, combo:0, comboT:0, timer:null, elapsed:0, started:false,
    busy:false, won:false, onWin:null, onCoin:null, hintT:null
  };

  /* ---------------- construction ---------------- */
  function buildCardFace(c){
    var red = isRed(c.s), sc = SUIT_CHAR[c.s], rc = RANK_CHAR[c.r];
    var h = '<div class="face front '+(red?'red':'black')+'">';
    h += '<div class="corner tl"><span class="r">'+rc+'</span><span class="s">'+sc+'</span></div>';
    h += '<div class="corner br"><span class="r">'+rc+'</span><span class="s">'+sc+'</span></div>';
    if (c.r >= 11){
      h += '<div class="court"><div class="cl">'+rc+'</div><div class="cs">'+sc+'</div></div>';
    } else {
      h += '<div class="pips">';
      var map = PIPMAP[c.r] || [];
      for (var i=0;i<map.length;i++){
        var col = map[i][0], row = map[i][1];
        var x = col*50, y = row/6*100;
        var flip = row > 3 ? ' flip' : '';
        var big = c.r === 1 ? ' big' : '';
        h += '<span class="pip'+flip+big+'" style="left:'+x+'%;top:'+y+'%">'+sc+'</span>';
      }
      h += '</div>';
    }
    h += '<div class="sheen"></div><div class="glare"></div></div>';
    h += '<div class="face back"><div class="glare"></div></div>';
    return h;
  }

  function makeCards(){
    var host = S.el.cards;
    host.innerHTML = ''; S.cardEl = {};
    var ids = Object.keys(S.game.cards);
    ids.forEach(function(id){
      var c = S.game.cards[id];
      var el = document.createElement('div');
      el.className = 'card down';
      el.style.setProperty('--sway', (0.35 + Math.random()*0.9).toFixed(2)+'deg');
      el.style.setProperty('--swayd', (2.8 + Math.random()*2.4).toFixed(2)+'s');
      el.style.setProperty('--swayo', (-Math.random()*3).toFixed(2)+'s');
      el.innerHTML = '<div class="inner">' + buildCardFace(c) + '</div>';
      el._id = c.id;
      host.appendChild(el);
      S.cardEl[c.id] = el;
    });
  }

  function makeSlots(){
    var host = S.el.slots;
    host.innerHTML = ''; S.slotEl = {};
    REFS.forEach(function(ref){
      var d = document.createElement('div');
      d.className = 'slot' + (ref[0]==='f' ? ' f-ring' : '');
      d.dataset.ref = ref;
      if (ref[0] === 'f') d.innerHTML = SUIT_CHAR[+ref[1]];
      if (ref === 'stock') d.innerHTML = '↻';
      host.appendChild(d);
      S.slotEl[ref] = d;
    });
  }

  /* ---------------- géométrie ---------------- */
  function layout(){
    var t = S.el.table;
    var W = t.clientWidth, H = t.clientHeight;
    var pad = 22;                       // marge interieure du tapis
    var gap = Math.max(7, Math.min(18, W*0.013));
    var cw = (W - pad*2 - gap*6) / 7;
    cw = Math.min(cw, 140);
    if (cw*1.4*2.4 > H - pad*2) cw = (H - pad*2) / (1.4*2.4);
    cw = Math.max(48, cw);
    var ch = cw*1.4;

    var ox = (W - (7*cw + 6*gap))/2;
    var oy = Math.max(pad*0.7, Math.min(gap*1.6, (H - ch*2.3)/2));
    var y1 = oy + ch + Math.max(10, gap*1.3);

    S.geo = {W:W,H:H,cw:cw,ch:ch,gap:gap,ox:ox,oy:oy,y1:y1,
             wasteFan: cw*0.26, fanUp: ch*0.285, fanDown: ch*0.115};

    S.el.board.style.setProperty('--cw', cw+'px');
    S.el.board.style.setProperty('--ch', ch+'px');

    // placement des emplacements vides
    var g = S.geo;
    place(S.slotEl.stock, col(0), oy);
    place(S.slotEl.waste, col(1), oy);
    for (var i=0;i<4;i++) place(S.slotEl['f'+i], col(3+i), oy);
    for (i=0;i<7;i++) place(S.slotEl['t'+i], col(i), y1);
  }
  function col(i){ return S.geo.ox + i*(S.geo.cw + S.geo.gap); }
  function place(el, x, y){ el.style.transform = 'translate3d('+x+'px,'+y+'px,0)'; }

  function computeFan(){
    var g = S.geo, up = g.fanUp, dn = g.fanDown, worst = 0;
    for (var i=0;i<7;i++){
      var p = S.game.t[i], s = 0;
      for (var j=0;j<p.length-1;j++) s += p[j].up ? up : dn;
      if (s > worst) worst = s;
    }
    var avail = g.H - g.y1 - g.ch - 18;
    if (worst > avail && worst > 0){
      var k = Math.max(0.3, avail / worst);
      up *= k; dn *= k;
    }
    return {up:up, dn:dn};
  }

  /* position de chaque carte : {id:{x,y,z,ref,idx}} */
  function positions(){
    var g = S.geo, G = S.game, out = {}, i, j, p, y, f = computeFan();
    // pioche
    p = G.stock;
    for (i=0;i<p.length;i++) out[p[i].id] = {x:col(0) + Math.min(i,6)*0.6, y:g.oy - Math.min(i,6)*0.6, z:i, ref:'stock', idx:i};
    // défausse (3 dernières décalées)
    p = G.waste;
    var shown = Math.min(G.drawCount === 3 ? 3 : 1, p.length);
    for (i=0;i<p.length;i++){
      var k = i - (p.length - shown);
      var dx = k >= 0 ? k*g.wasteFan : 0;
      out[p[i].id] = {x:col(1)+dx, y:g.oy, z:100+i, ref:'waste', idx:i};
    }
    // fondations
    for (i=0;i<4;i++){
      p = G.f[i];
      for (j=0;j<p.length;j++) out[p[j].id] = {x:col(3+i), y:g.oy - Math.min(j,4)*0.5, z:200+i*20+j, ref:'f'+i, idx:j};
    }
    // tableau
    for (i=0;i<7;i++){
      p = G.t[i]; y = g.y1;
      for (j=0;j<p.length;j++){
        out[p[j].id] = {x:col(i), y:y, z:400 + i*30 + j, ref:'t'+i, idx:j};
        y += p[j].up ? f.up : f.dn;
      }
    }
    S.pos = out;
    buildZones(f);
    return out;
  }

  function buildZones(f){
    var g = S.geo, G = S.game, z = [];
    for (var i=0;i<4;i++) z.push({ref:'f'+i, x:col(3+i), y:g.oy, w:g.cw, h:g.ch});
    for (i=0;i<7;i++){
      var p = G.t[i], h = g.ch, s = 0;
      for (var j=0;j<p.length-1;j++) s += p[j].up ? f.up : f.dn;
      z.push({ref:'t'+i, x:col(i), y:g.y1, w:g.cw, h:g.ch + s});
    }
    S.zones = z;
  }

  /* ---------------- deplacements en cloche ---------------- */
  function clonePos(){
    var o = {};
    for (var k in S.pos) o[k] = {x:S.pos[k].x, y:S.pos[k].y};
    return o;
  }
  function prepArc(ids){
    ids.forEach(function(id){ S.cardEl[id].classList.add('notrans'); });
  }
  /* fait voler les cartes de leur position precedente vers la nouvelle */
  function arcMove(ids, prev, lift, stagger){
    ids.forEach(function(id, i){
      var el = S.cardEl[id], a = prev[id], b = S.pos[id];
      if (!a || !b || Math.abs(b.x-a.x) + Math.abs(b.y-a.y) < 2){
        el.classList.remove('notrans'); return;
      }
      var up = Math.max(26, S.geo.ch * (lift || 0.22));
      var mx = (a.x+b.x)/2, my = Math.min(a.y,b.y) - up;
      var rot = Math.max(-16, Math.min(16, (b.x-a.x)*0.05));
      var z = el.style.zIndex;
      el.style.zIndex = 8000 + i;
      var an = el.animate([
        {transform:'translate3d('+a.x+'px,'+a.y+'px,0) rotate(0deg)'},
        {transform:'translate3d('+mx+'px,'+my+'px,0) rotate('+rot+'deg) scale(1.08)', offset:.5},
        {transform:'translate3d('+b.x+'px,'+b.y+'px,0) rotate(0deg) scale(1)'}
      ], {duration: 300 + i*(stagger===undefined?26:stagger), easing:'cubic-bezier(.32,.92,.35,1)'});
      var done = function(){ el.classList.remove('notrans'); el.style.zIndex = z; };
      an.onfinish = done; an.oncancel = done;
    });
  }

  /* ---------------- rendu ---------------- */
  function render(){
    var pos = positions(), G = S.game;
    for (var id in S.cardEl){
      var el = S.cardEl[id], p = pos[id], c = G.cards[id];
      if (!p) continue;
      el._ref = p.ref; el._idx = p.idx;
      if (!S.drag || S.drag.ids.indexOf(+id) === -1){
        el.style.transform = 'translate3d('+p.x+'px,'+p.y+'px,0)';
        el.style.zIndex = p.z;
      }
      el.classList.toggle('down', !c.up);
      var movable = !!G.movableFrom(p.ref, p.idx) || p.ref === 'stock';
      el.classList.toggle('hoverable', movable && !S.busy);
      el.classList.toggle('nodrag', !movable);
      var isTop = (p.idx === G.pile(p.ref).length - 1);
      el.classList.toggle('idle', c.up && isTop && p.ref[0] !== 'f');
    }
    // emplacements visibles seulement s'ils sont vides
    REFS.forEach(function(ref){
      var empty = G.pile(ref).length === 0;
      S.slotEl[ref].style.opacity = empty ? 1 : 0.001;
    });
    S.slotEl.stock.style.opacity = G.stock.length ? 0.001 : 1;
    updateHUD();
  }

  function updateHUD(){
    setStat('moves', S.game.moves);
    setStat('score', S.game.score);
    S.el.seed.textContent = '#' + S.game.seed;
    S.el.auto.disabled = !S.game.canAutoComplete() || S.busy;
  }
  function setStat(k, v){
    var el = S.el[k];
    var cur = parseInt(el.textContent, 10); if (isNaN(cur)) cur = 0;
    if (cur === v) return;
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    if (el._tw) cancelAnimationFrame(el._tw);
    var t0 = performance.now(), d = Math.min(700, 200 + Math.abs(v-cur)*9);
    (function roll(now){
      var t = Math.min(1, (now-t0)/d);
      el.textContent = Math.round(cur + (v-cur)*(1-Math.pow(1-t,3)));
      if (t < 1) el._tw = requestAnimationFrame(roll);
    })(t0);
  }
  function fmtTime(s){
    var m = Math.floor(s/60), r = s%60;
    return m + ':' + (r<10?'0':'') + r;
  }

  /* ---------------- timer ---------------- */
  function startTimer(){
    if (S.timer) return;
    S.timer = setInterval(function(){
      S.elapsed++;
      S.el.time.textContent = fmtTime(S.elapsed);
    }, 1000);
  }
  function stopTimer(){ clearInterval(S.timer); S.timer = null; }

  /* ---------------- effets de coup ---------------- */
  function centerOf(ref, idx){
    var g = S.geo, p = S.pos, G = S.game, pile = G.pile(ref);
    var card = pile[idx === undefined ? pile.length-1 : idx];
    if (card && p[card.id]) return {x:p[card.id].x + g.cw/2, y:p[card.id].y + g.ch/2};
    var z = S.zones.filter(function(q){ return q.ref===ref; })[0];
    if (z) return {x:z.x+g.cw/2, y:z.y+g.ch/2};
    return {x:g.W/2, y:g.H/2};
  }
  function boardToScreen(pt){
    var r = S.el.board.getBoundingClientRect();
    return {x:r.left+pt.x, y:r.top+pt.y};
  }

  function bumpCombo(){
    S.combo++;
    clearTimeout(S.comboT);
    S.comboT = setTimeout(function(){ endCombo(); }, 6500);
    if (S.combo >= 2){
      S.el.combo.classList.add('on');
      S.el.comboN.textContent = S.combo;
      S.el.combo.classList.remove('hit'); void S.el.combo.offsetWidth; S.el.combo.classList.add('hit');
      SFX.combo(S.combo);
      if (Store.opts().juice > 0){
        S.el.table.classList.remove('warp'); void S.el.table.offsetWidth;
        S.el.table.classList.add('warp');
      }
      if (S.combo >= 4) FX.hot(true);
    }
    if (S.combo > (S.bestCombo||0)) S.bestCombo = S.combo;
  }
  function endCombo(){
    if (S.combo >= 2){
      var coins = Math.round(ECON.comboCoin * S.combo * (1 + S.combo/8));
      Store.addCoins(coins);
      if (S.onCoin) S.onCoin(coins, 'Enchaînement x'+S.combo);
    }
    S.combo = 0;
    S.el.combo.classList.remove('on');
    FX.hot(false);
  }

  function afterMove(res){
    var g = S.geo;
    // atterrissage
    res.group.forEach(function(c, i){
      var el = S.cardEl[c.id];
      el.classList.remove('land'); void el.offsetWidth; el.classList.add('land');
      setTimeout(function(){ el.classList.remove('land'); }, 420);
    });
    var dest = centerOf(res.to);
    var sc = boardToScreen(dest);

    if (res.toFoundation){
      bumpCombo();
      var lead = S.cardEl[res.group[0].id];
      lead.classList.add('fpop','glowgold','shine');
      setTimeout(function(){ lead.classList.remove('fpop','shine'); }, 500);
      setTimeout(function(){ lead.classList.remove('glowgold'); }, 900);
      S.slotEl[res.to].classList.remove('pulse'); void S.slotEl[res.to].offsetWidth;
      S.slotEl[res.to].classList.add('pulse');
      FX.ring(sc.x, sc.y, '#ffd76e', 20 + S.combo*4);
      FX.burst(sc.x, sc.y, {n:14 + S.combo*4, speed:5.5, size:6, life:48,
        colors:['#ffd76e','#fff3b0','#ff9f43']});
      FX.sparkAt(S.el.popups, dest.x, dest.y, '#ffd76e');
      FX.shake(Math.min(3, 1 + Math.floor(S.combo/3)));
      if (S.combo >= 3) FX.flash(true);
      SFX.foundation(S.game.f[+res.to[1]].length - 1);
      FX.pop('+'+Math.max(0,res.gain), dest.x, dest.y - g.ch*0.35, S.combo>=3?'big':'gold');
    } else {
      SFX.place();
      FX.burst(sc.x, sc.y + g.ch*0.35, {n:8, speed:3, size:4, life:30, g:.3,
        colors:['#ffffff','#cfd6e4'], glow:false});
      FX.shake(1);
      if (res.gain > 0) FX.pop('+'+res.gain, dest.x, dest.y - g.ch*0.3, 'good');
    }

    if (res.flipped){
      var fel = S.cardEl[res.flipped.id];
      fel.classList.remove('flipping'); void fel.offsetWidth; fel.classList.add('flipping');
      setTimeout(function(){ fel.classList.remove('flipping'); }, 520);
      SFX.flip();
      var fp = S.pos[res.flipped.id];
      if (fp){
        FX.pop('+5', fp.x + g.cw/2, fp.y + g.ch/2, 'good');
        var s2 = boardToScreen({x:fp.x+g.cw/2, y:fp.y+g.ch/2});
        FX.burst(s2.x, s2.y, {n:10, speed:3.6, size:5, life:34, colors:['#7ee6a8','#ffffff']});
      }
    }
  }

  function wiggle(ids){
    ids.forEach(function(id){
      var el = S.cardEl[id];
      el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle');
      setTimeout(function(){ el.classList.remove('wiggle'); }, 460);
    });
    SFX.invalid();
    FX.shake(1);
  }

  /* ---------------- actions ---------------- */
  function doDraw(){
    if (S.busy || S.won) return;
    var prev = clonePos();
    var res = S.game.drawStock();
    if (!res) return;
    kick();
    if (res.recycled){
      S.slotEl.stock.classList.remove('recycling'); void S.slotEl.stock.offsetWidth;
      S.slotEl.stock.classList.add('recycling');
      SFX.recycle();
      FX.shake(1);
      var c = centerOf('stock'); var sc = boardToScreen(c);
      FX.ring(sc.x, sc.y, '#5ef2ff', 18);
    } else {
      res.cards.forEach(function(c,i){ SFX.deal(i); });
      var w = centerOf('waste'); var sw = boardToScreen(w);
      FX.burst(sw.x, sw.y, {n:7, speed:3.2, size:4, life:26, colors:['#ffffff'], glow:false});
    }
    var ids = res.cards.map(function(c){ return c.id; });
    prepArc(ids);
    render();
    arcMove(ids, prev, 0.34, 55);
  }

  function tryMove(ref, idx, to, noArc){
    var prev = clonePos();
    var res = S.game.move(ref, idx, to);
    if (!res) return false;
    kick();
    var ids = res.group.map(function(c){ return c.id; });
    if (!noArc) prepArc(ids);
    render();
    if (!noArc) arcMove(ids, prev, to[0] === 'f' ? 0.32 : 0.2);
    afterMove(res);
    checkWin();
    return true;
  }

  function clickCard(ref, idx){
    if (S.busy || S.won) return;
    if (ref === 'stock'){ doDraw(); return; }
    var group = S.game.movableFrom(ref, idx);
    if (!group){ wiggle([S.game.pile(ref)[idx].id]); return; }
    var to = S.game.autoTarget(ref, idx, true);
    if (to){ tryMove(ref, idx, to); }
    else wiggle(group.map(function(c){ return c.id; }));
  }

  function kick(){
    if (!S.started){ S.started = true; startTimer(); }
    SFX.unlock();
  }

  /* ---------------- glisser-déposer ---------------- */
  function onDown(e){
    if (S.busy || S.won) return;
    if (e.button !== undefined && e.button !== 0) return;
    var slot = e.target.closest ? e.target.closest('.slot') : null;
    var cardEl = e.target.closest ? e.target.closest('.card') : null;

    if (!cardEl && slot){
      if (slot.dataset.ref === 'stock'){ doDraw(); }
      return;
    }
    if (!cardEl) return;
    var ref = cardEl._ref, idx = cardEl._idx;
    if (ref === 'stock'){ doDraw(); return; }

    var group = S.game.movableFrom(ref, idx);
    var r = S.el.board.getBoundingClientRect();
    S.drag = {
      ref:ref, idx:idx, ids: group ? group.map(function(c){ return c.id; }) : [],
      valid: !!group, sx:e.clientX, sy:e.clientY, lx:e.clientX, lt:performance.now(),
      moved:false, rect:r,
      base: group ? group.map(function(c){ return {id:c.id, x:S.pos[c.id].x, y:S.pos[c.id].y}; }) : []
    };
    if (!group){
      var pile = S.game.pile(ref);
      if (pile[idx]) wiggle([pile[idx].id]);
      S.drag = null;
      return;
    }
    try { e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch(err){}
    e.preventDefault();
  }

  function onMove(e){
    var d = S.drag; if (!d || !d.valid) return;
    var dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved){
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      d.moved = true;
      kick(); SFX.grab();
      d.ids.forEach(function(id, i){
        var el = S.cardEl[id];
        el.classList.add('lift','grabbed','notrans');
        el.style.zIndex = 9000 + i;
      });
    }
    var now = performance.now();
    var vx = (e.clientX - d.lx) / Math.max(1, now - d.lt) * 16;
    d.lx = e.clientX; d.lt = now;
    d.vx = (d.vx||0)*0.7 + vx*0.3;
    var rot = Math.max(-13, Math.min(13, d.vx*1.6));
    d.ids.forEach(function(id, i){
      var b = d.base[i], el = S.cardEl[id];
      el.style.transform = 'translate3d('+(b.x+dx)+'px,'+(b.y+dy)+'px,0) rotate('+rot+'deg) scale(1.05)';
    });
    // trainée
    if (Math.abs(d.vx) > 6 && Math.random() < 0.6 && Store.opts().juice > 0){
      FX.burst(e.clientX, e.clientY, {n:2, speed:1.4, size:3.5, life:22, g:.05,
        colors:['rgba(255,215,110,.9)','rgba(255,255,255,.8)']});
    }
    highlight(d, dx, dy);
  }

  function currentTarget(d, dx, dy){
    var g = S.geo;
    if (!d || !d.base.length) return null;
    var b = d.base[0];
    var x = b.x + dx, y = b.y + dy, w = g.cw, h = g.ch;
    var best = null, bestA = 0;
    for (var i=0;i<S.zones.length;i++){
      var z = S.zones[i];
      if (z.ref === d.ref) continue;
      var ox = Math.max(0, Math.min(x+w, z.x+z.w) - Math.max(x, z.x));
      var oy = Math.max(0, Math.min(y+h, z.y+z.h) - Math.max(y, z.y));
      var a = ox*oy;
      if (a > bestA){
        var card = S.game.pile(d.ref)[d.idx];
        if (z.ref[0]==='f' && d.ids.length > 1) continue;
        if (S.game.canDrop(card, z.ref)){ bestA = a; best = z.ref; }
      }
    }
    return bestA > (g.cw*g.ch*0.09) ? best : null;
  }

  function highlight(d, dx, dy){
    var t = currentTarget(d, dx, dy);
    REFS.forEach(function(ref){ S.slotEl[ref].classList.toggle('hot', ref === t); });
    // surligne aussi la carte du dessus de la pile ciblée
    for (var id in S.cardEl) S.cardEl[id].classList.remove('glowgold');
    if (t){
      var p = S.game.pile(t);
      if (p.length) S.cardEl[p[p.length-1].id].classList.add('glowgold');
    }
  }

  function onUp(e){
    var d = S.drag; if (!d) return;
    S.drag = null;
    REFS.forEach(function(ref){ S.slotEl[ref].classList.remove('hot'); });
    for (var id in S.cardEl) S.cardEl[id].classList.remove('glowgold');
    d.ids.forEach(function(id){
      var el = S.cardEl[id];
      el.classList.remove('lift','grabbed','notrans');
    });
    if (!d.moved){ clickCard(d.ref, d.idx); return; }
    var to = currentTarget(d, e.clientX - d.sx, e.clientY - d.sy);
    if (to && tryMove(d.ref, d.idx, to, true)) return;
    SFX.invalid();
    render();
  }

  /* ---------------- auto & indice ---------------- */
  function autoComplete(){
    if (S.busy || S.won) return;
    S.busy = true;
    S.el.auto.disabled = true;
    (function step(){
      var m = S.game.nextAuto();
      if (!m){ S.busy = false; render(); return; }
      var prev = clonePos();
      var res = S.game.move(m.from, m.idx, m.to);
      var ids = res ? res.group.map(function(c){ return c.id; }) : [];
      prepArc(ids);
      render();
      arcMove(ids, prev, 0.3);
      if (res) afterMove(res);
      if (S.game.isWon()){ S.busy = false; checkWin(); return; }
      setTimeout(step, 95);
    })();
  }

  function hint(){
    if (S.busy || S.won) return;
    var h = S.game.hint();
    if (!h){ FX.pop('Aucun coup', S.geo.W/2, S.geo.H/2, 'bad'); SFX.invalid(); return; }
    if (h.from === 'stock'){
      S.slotEl.stock.classList.add('hint');
      setTimeout(function(){ S.slotEl.stock.classList.remove('hint'); }, 2600);
      return;
    }
    var pile = S.game.pile(h.from);
    var c = pile[h.idx];
    if (c){
      var el = S.cardEl[c.id];
      el.classList.add('hint');
      setTimeout(function(){ el.classList.remove('hint'); }, 2600);
    }
    if (S.game.pile(h.to).length === 0){
      S.slotEl[h.to].classList.add('hint');
      setTimeout(function(){ S.slotEl[h.to].classList.remove('hint'); }, 2600);
    } else {
      var tp = S.game.pile(h.to);
      var te = S.cardEl[tp[tp.length-1].id];
      te.classList.add('hint');
      setTimeout(function(){ te.classList.remove('hint'); }, 2600);
    }
    SFX.hover();
  }

  function undo(){
    if (S.busy || S.won) return;
    if (!S.game.undo()){ SFX.invalid(); return; }
    endCombo();
    SFX.undo();
    render();
  }

  /* ---------------- victoire ---------------- */
  function checkWin(){
    if (!S.game.isWon() || S.won) return;
    S.won = true;
    stopTimer();
    endCombo();
    setTimeout(winSequence, 260);
  }

  function winSequence(){
    SFX.win();
    FX.flash(true);
    FX.shake(3);
    FX.confetti(140, true);
    FX.fireworks(3600);
    bounceCards();
    setTimeout(function(){
      if (S.onWin) S.onWin({time:S.elapsed, moves:S.game.moves, score:S.game.score,
                            combo:S.bestCombo||0, seed:S.game.seed});
    }, 2400);
  }

  function bounceCards(){
    var g = S.geo, list = [], i, j;
    for (i=3;i>=0;i--) for (j=S.game.f[i].length-1;j>=0;j--) list.push(S.game.f[i][j]);
    var parts = [], started = 0;
    var t0 = performance.now();

    function launch(card, k){
      var p = S.pos[card.id]; if (!p) return;
      var el = S.cardEl[card.id];
      el.classList.add('bouncing');
      parts.push({el:el, x:p.x, y:p.y, vx:(Math.random()*2+1.4)*(Math.random()<.5?-1:1)*3.2,
                  vy:-(4+Math.random()*7), rot:0, vr:(Math.random()-.5)*10, done:false});
    }
    function frame(){
      var t = performance.now() - t0;
      while (started < list.length && t > started*55){ launch(list[started], started); started++; }
      var alive = 0;
      for (var i=0;i<parts.length;i++){
        var p = parts[i];
        if (p.done) continue;
        p.vy += 0.9;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > g.H - g.ch){
          p.y = g.H - g.ch; p.vy *= -0.62; p.vx *= 0.94; p.vr *= 0.7;
          if (Math.abs(p.vy) > 2.2) SFX.bounce(Math.abs(p.vy));
          if (Math.abs(p.vy) < 1.4){ p.vy = 0; }
        }
        if (p.x < -g.cw*1.4 || p.x > g.W + g.cw*0.4){ p.done = true; p.el.style.opacity = 0; continue; }
        p.el.style.transform = 'translate3d('+p.x+'px,'+p.y+'px,0) rotate('+p.rot+'deg)';
        alive++;
      }
      if (started < list.length || alive > 0) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- distribution animée ---------------- */
  function dealAnimation(){
    var pos = positions(), g = S.geo;
    // tout empiler sur la pioche, face cachée
    for (var id in S.cardEl){
      var el = S.cardEl[id];
      el.classList.add('notrans','down');
      el.style.opacity = 1;
      el.classList.remove('bouncing');
      el.style.transform = 'translate3d('+col(0)+'px,'+g.oy+'px,0) rotate(0deg)';
      el.style.zIndex = 1;
    }
    void S.el.cards.offsetWidth;
    var order = [];
    for (var i=0;i<7;i++) for (var j=0;j<S.game.t[i].length;j++) order.push(S.game.t[i][j].id);
    for (id in S.cardEl) if (order.indexOf(+id) === -1) order.push(+id);

    order.forEach(function(cid, k){
      var el = S.cardEl[cid];
      setTimeout(function(){
        var p = S.pos[cid], ax = col(0), ay = g.oy;
        el.style.transform = 'translate3d('+p.x+'px,'+p.y+'px,0)';
        el.style.zIndex = 3000 + k;
        el.classList.toggle('down', !S.game.cards[cid].up);
        var an = el.animate([
          {transform:'translate3d('+ax+'px,'+ay+'px,0) rotate(-7deg) scale(1.02)'},
          {transform:'translate3d('+((ax+p.x)/2)+'px,'+(Math.min(ay,p.y)-g.ch*0.4)+'px,0) rotate('+((p.x-ax)*0.035)+'deg) scale(1.12)', offset:.5},
          {transform:'translate3d('+p.x+'px,'+p.y+'px,0) rotate(0deg) scale(1)'}
        ], {duration:440, easing:'cubic-bezier(.3,.92,.35,1)'});
        var fin = function(){ el.classList.remove('notrans'); el.style.zIndex = p.z; };
        an.onfinish = fin; an.oncancel = fin;
        if (k < 28){
          SFX.deal(0);
          var s = boardToScreen({x:p.x+g.cw/2, y:p.y+g.ch/2});
          FX.burst(s.x, s.y, {n:3, speed:2, size:3, life:20, colors:['#ffffff'], glow:false});
        }
      }, 26 + k*22);
    });
    setTimeout(function(){ render(); }, 26 + order.length*22 + 340);
  }

  /* ---------------- parallaxe et reflets ---------------- */
  function bindPointerShine(){
    var root = document.documentElement, queued = false, mx = 0, my = 0;
    window.addEventListener('pointermove', function(e){
      if (Store.opts().juice === 0) return;
      mx = (e.clientX/innerWidth - .5)*2; my = (e.clientY/innerHeight - .5)*2;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function(){
        queued = false;
        root.style.setProperty('--px', mx.toFixed(3));
        root.style.setProperty('--py', my.toFixed(3));
      });
    }, {passive:true});

    S.el.cards.addEventListener('pointermove', function(e){
      if (Store.opts().juice === 0) return;
      var el = e.target.closest ? e.target.closest('.card') : null;
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      el.style.setProperty('--my', ((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    }, {passive:true});
  }

  /* ---------------- cycle de vie ---------------- */
  function newGame(seed, draw){
    S.game = new Klondike(seed === undefined ? (Math.random()*1e9)|0 : seed, draw || Store.opts().draw);
    S.won = false; S.busy = false; S.started = false; S.combo = 0; S.bestCombo = 0;
    S.elapsed = 0; stopTimer();
    S.el.time.textContent = '0:00';
    S.el.combo.classList.remove('on');
    FX.hot(false);
    makeCards();
    layout();
    dealAnimation();
    updateHUD();
  }
  function restart(){ newGame(S.game.seed, S.game.drawCount); }

  function init(opts){
    S.el = {
      table: document.getElementById('table'),
      board: document.getElementById('board'),
      slots: document.getElementById('slots'),
      cards: document.getElementById('cards'),
      popups: document.getElementById('popups'),
      combo: document.getElementById('combo'),
      comboN: document.getElementById('combo-n'),
      moves: document.getElementById('hud-moves'),
      time:  document.getElementById('hud-time'),
      score: document.getElementById('hud-score'),
      seed:  document.getElementById('hud-seed'),
      auto:  document.getElementById('btn-auto')
    };
    S.onWin = opts.onWin; S.onCoin = opts.onCoin;
    makeSlots();
    bindPointerShine();
    var b = S.el.board;
    b.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, {passive:true});
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', function(){
      if (!S.game) return;
      layout(); render();
    });
    document.addEventListener('keydown', function(e){
      if (e.target.tagName === 'INPUT') return;
      if (e.ctrlKey && e.key === 'z'){ undo(); e.preventDefault(); }
      else if (e.key === ' '){ doDraw(); e.preventDefault(); }
      else if (e.key === 'h' || e.key === 'H') hint();
      else if (e.key === 'a' || e.key === 'A') autoComplete();
    });
  }

  return {
    init:init, newGame:newGame, restart:restart, render:render, layout:layout,
    undo:undo, hint:hint, autoComplete:autoComplete, draw:doDraw,
    get game(){ return S.game; },
    get elapsed(){ return S.elapsed; },
    setDraw: function(n){ if (S.game) S.game.drawCount = n; }
  };
})();
