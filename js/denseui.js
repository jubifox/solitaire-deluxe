/* ============ Mode Conjonction : interface et mise en scène ============ */
var DenseUI = (function(){
  var bar, els = {}, built = false, pending = null;

  function $(id){ return document.getElementById(id); }
  function enabled(){ return Store.opts().mode === 'conj'; }

  /* ---------------- construction du bandeau ---------------- */
  function build(){
    if (built) return;
    built = true;
    bar = $('densebar');
    bar.innerHTML =
      '<div class="db-block db-elan" id="db-elan"><i>Élan</i><div class="db-pips" id="db-pips"></div><b id="db-elanv">0</b></div>' +
      '<div class="db-block db-mult" id="db-mult"><i>Mult</i><b id="db-multv">x1</b></div>' +
      '<div class="db-block db-conj" id="db-conj"><i>Conjonction</i><div class="db-slots" id="db-slots"></div></div>' +
      '<div class="db-block db-next"><i>À venir</i><div class="chips" id="db-nextc"></div></div>' +
      '<div class="db-objs" id="db-objs" style="display:flex;gap:10px"></div>' +
      '<div class="db-actions" id="db-acts"></div>';

    els.pips = $('db-pips'); els.elanv = $('db-elanv'); els.elan = $('db-elan');
    els.mult = $('db-mult'); els.multv = $('db-multv');
    els.conj = $('db-conj'); els.slots = $('db-slots');
    els.next = $('db-nextc'); els.objs = $('db-objs'); els.acts = $('db-acts');

    var i, d;
    for (i=0;i<Dense.CFG.elanMax;i++){
      d = document.createElement('div'); d.className = 'db-pip'; els.pips.appendChild(d);
    }
    for (i=0;i<Dense.CFG.windowLen;i++){
      d = document.createElement('div'); d.className = 'db-slot'; d.textContent = '·'; els.slots.appendChild(d);
    }

    var ACTS = [
      {k:'vision',  label:'Vision',  title:'Révèle les 3 prochaines cartes du stock (savoir conservé)'},
      {k:'ordre',   label:'Ordre',   title:'Échange les deux prochaines cartes du stock'},
      {k:'gel',     label:'Gel',     title:'Met la prochaine carte de côté ; réinjecte-la quand tu veux'},
      {k:'licence', label:'Licence', title:'La prochaine pose sur le tableau ignore la couleur'}
    ];
    ACTS.forEach(function(a){
      var b = document.createElement('button');
      b.className = 'db-act'; b.dataset.k = a.k; b.title = a.title;
      b.innerHTML = a.label + ' <span class="cost">' + Dense.CFG.costs[a.k] + '</span>';
      b.addEventListener('click', function(){ act(a.k, b); });
      els.acts.appendChild(b);
    });

    /* badge de fenêtre */
    var wb = document.createElement('div');
    wb.id = 'winbadge';
    wb.innerHTML = '<span class="wb-left" id="wb-left">4</span><span id="wb-name">Flux libre</span>';
    $('table').appendChild(wb);

    /* voile + étoiles filantes */
    var fx = document.createElement('div');
    fx.id = 'conjfx';
    fx.innerHTML = '<div class="veil"></div><div class="title"><div class="big" id="conj-title"></div>' +
                   '<div class="sub" id="conj-sub"></div></div><div id="conj-stars"></div>';
    document.body.appendChild(fx);

    /* choix de la règle temporaire */
    var m = document.createElement('div');
    m.className = 'modal'; m.id = 'modal-boon';
    m.innerHTML = '<div class="modal-bd"></div><div class="modal-card" style="max-width:760px">' +
      '<h3 id="boon-title">Fenêtre d\'opportunité</h3>' +
      '<p class="vsub" id="boon-sub" style="margin-bottom:14px"></p>' +
      '<div class="boons" id="boon-list"></div></div>';
    document.body.appendChild(m);

    Dense.on('change', refresh);
    Dense.on('conjonction', onConjonction);
    Dense.on('window-open', onWindowOpen);
    Dense.on('window-close', onWindowClose);
    Dense.on('elan', onElan);
    Dense.on('suite', onSuite);
    Dense.on('bonus', onBonus);
  }

  /* ---------------- actions d'Élan ---------------- */
  function act(k, btn){
    if (!Dense.active) return;
    var G = UI.game;
    if (k === 'gel' && !G.stock.length){ App.toast('Le stock est vide'); SFX.invalid(); return; }
    if (k === 'ordre' && G.stock.length < 2){ App.toast('Il faut deux cartes dans le stock'); SFX.invalid(); return; }
    if (k === 'vision' && !G.stock.length){ App.toast('Le stock est vide'); SFX.invalid(); return; }
    if (k === 'licence' && Dense.state.licence){ App.toast('Licence déjà active'); return; }

    var r = Dense.spend(k);
    if (!r.ok){ App.toast(r.reason); SFX.invalid(); FX.shake(1); return; }

    if (k === 'vision'){
      Dense.state.vision = Math.min(G.stock.length, Math.max(Dense.state.vision, 3));
      App.toast('Vision : 3 prochaines cartes révélées');
    } else if (k === 'ordre'){
      G.swapNext();
      Dense.state.vision = Math.max(Dense.state.vision, 2);
      App.toast('Ordre : les deux prochaines cartes sont permutées');
    } else if (k === 'gel'){
      G.freezeNext();
      App.toast('Gel : carte mise de côté');
      UI.render();
    } else if (k === 'licence'){
      Dense.state.licence = true;
      Dense.applyRules();
      App.toast('Licence : la prochaine pose ignore la couleur');
      UI.render();
    }
    SFX.flip();
    var rc = btn.getBoundingClientRect();
    FX.burst(rc.left+rc.width/2, rc.top+rc.height/2,
      {n:14, speed:4, size:5, life:38, colors:['#9beeff','#ffffff','#5ef2ff']});
    refresh();
  }

  function unfreeze(id){
    UI.game.unfreeze(id);
    Dense.state.vision = Math.max(Dense.state.vision, 1);
    SFX.flip();
    App.toast('Carte réinjectée au sommet du stock');
    UI.render(); refresh();
  }

  /* ---------------- rafraîchissement ---------------- */
  function refresh(){
    if (!built || !Dense.active) return;
    var D = Dense.state, G = UI.game, i;

    /* Élan */
    var pips = els.pips.children;
    for (i=0;i<pips.length;i++){
      var on = i < D.elan;
      if (on !== pips[i].classList.contains('on')){
        pips[i].classList.toggle('on', on);
        if (on){ pips[i].classList.remove('pop'); void pips[i].offsetWidth; pips[i].classList.add('pop'); }
      }
    }
    els.elanv.textContent = D.elan;
    els.elan.classList.toggle('full', D.elan >= Dense.CFG.elanMax);

    /* multiplicateur */
    var f = Dense.totalMult();
    els.multv.textContent = 'x' + (Math.round(f*100)/100);
    els.mult.classList.toggle('hot', f >= 2);

    /* fenêtre de conjonction */
    var w = Dense.windowCards(), slots = els.slots.children;
    var hit = Dense.evaluate(w);
    for (i=0;i<slots.length;i++){
      var c = w[i - (slots.length - w.length)];
      var s = slots[i];
      s.className = 'db-slot' + (c ? ' filled' : '') + (c && isRed(c.s) ? ' red' : '') + (hit ? ' match' : '');
      s.textContent = c ? RANK_CHAR[c.r] + SUIT_CHAR[c.s] : '·';
    }
    els.conj.classList.toggle('ready', !!hit);

    /* cartes à venir + gel */
    var html = '';
    var n = Math.min(D.vision, G.stock.length);
    for (i=0;i<n;i++){
      var k = G.stock[G.stock.length-1-i];
      html += '<span class="db-chip' + (isRed(k.s)?' red':'') + '">' + RANK_CHAR[k.r] + SUIT_CHAR[k.s] + '</span>';
    }
    G.frozen.forEach(function(c){
      html += '<span class="db-chip frozen" data-fid="' + c.id + '" title="Réinjecter au sommet du stock">❄ ' +
              RANK_CHAR[c.r] + SUIT_CHAR[c.s] + '</span>';
    });
    if (!html) html = '<span class="db-empty">inconnu</span>';
    els.next.innerHTML = html;
    [].forEach.call(els.next.querySelectorAll('.db-chip.frozen'), function(ch){
      ch.addEventListener('click', function(){ unfreeze(+ch.dataset.fid); });
    });

    /* objectifs */
    els.objs.innerHTML = Dense.objectivesState().map(function(o){
      var val = o.def.decimal ? o.cur.toFixed(1) : o.cur;
      /* un objectif "au plus" nest pas validé tant que la partie nest pas finie */
      var cls = (o.done && !o.def.atMost) ? ' done' : '';
      if (o.lost) cls = ' lost';
      return '<div class="db-obj' + cls + '" title="' + o.def.desc + '">' +
             '<span class="on">' + o.def.name + '</span>' +
             '<span class="op">' + (o.def.atMost ? val + ' / ' + o.def.goal + ' max' : val + ' / ' + o.def.goal) + '</span>' +
             '<span class="bar" style="width:' + (o.pct*100).toFixed(0) + '%"></span></div>';
    }).join('');

    /* boutons */
    [].forEach.call(els.acts.children, function(b){
      var c = Dense.CFG.costs[b.dataset.k];
      b.disabled = D.elan < c;
      b.classList.toggle('armed', b.dataset.k === 'licence' && D.licence);
    });

    /* badge de fenêtre */
    var wb = $('winbadge');
    if (D.conj){
      wb.classList.add('on');
      $('wb-left').textContent = D.conj.movesLeft;
      var b = Dense.BOONS.filter(function(x){ return x.id === D.conj.boon; })[0];
      $('wb-name').textContent = b ? b.icon + ' ' + b.name : '';
    } else wb.classList.remove('on');

    markBoard();
  }

  /* surlignage : résonance, colonnes lourdes, cibles d'Ascension */
  function markBoard(){
    var D = Dense.state, G = UI.game;
    var cards = document.querySelectorAll('#cards .card');
    [].forEach.call(cards, function(el){
      el.classList.remove('reso-glow','heavy','ascendable');
    });
    var byRef = {};
    [].forEach.call(cards, function(el){
      if (!el._ref) return;
      (byRef[el._ref] = byRef[el._ref] || []).push(el);
    });
    function topOf(ref){
      var p = G.pile(ref); if (!p.length) return null;
      var list = byRef[ref] || [];
      for (var i=0;i<list.length;i++) if (list[i]._idx === p.length-1) return list[i];
      return null;
    }
    if (D.resoPair){
      var a = topOf('t'+D.resoPair[0]), b = topOf('t'+D.resoPair[1]);
      if (a) a.classList.add('reso-glow');
      if (b) b.classList.add('reso-glow');
    }
    for (var i=0;i<7;i++){
      if (G.t[i].length >= Dense.CFG.heavyColumn){
        var t = topOf('t'+i); if (t) t.classList.add('heavy');
      }
    }
    document.body.classList.toggle('ascension-armed', !!D.ascension);
    if (D.ascension){
      [].forEach.call(cards, function(el){
        if (!el._ref || el._ref[0] !== 't') return;
        var c = G.pile(el._ref)[el._idx];
        if (!c || !c.up) return;
        for (var k=0;k<4;k++) if (G.canDrop(c, 'f'+k)){ el.classList.add('ascendable'); break; }
      });
    }
  }

  /* ---------------- retours visuels ---------------- */
  function onElan(e){
    if (!e.delta) return;
    var g = UI.geo ? UI.geo() : null;
    var el = els.elan.getBoundingClientRect();
    FX.burst(el.left+el.width/2, el.top+el.height/2,
      {n:8+e.delta*4, speed:3.6, size:4.5, life:34, colors:['#9beeff','#ffffff']});
    SFX.coin(0);
    UI.popAt(e.where, '+' + e.delta + ' Élan', 'elan');
  }
  function onSuite(e){
    UI.popAt('t'+e.col, (e.resonance ? 'RÉSONANCE  ' : 'SUITE  ') + 'x' + e.mult, e.resonance ? 'big' : 'good');
    SFX.combo(e.len);
  }
  function onBonus(e){
    if (e.amount > 0) UI.popAt(e.to, '+' + e.amount, 'gold');
  }

  /* ---------------- déclenchement rare ---------------- */
  function onConjonction(ev){
    pending = ev;
    var fx = $('conjfx');
    $('conj-title').textContent = ev.info.label;
    $('conj-sub').textContent = ev.cards.map(function(c){ return RANK_CHAR[c.r] + SUIT_CHAR[c.s]; }).join('   ');
    fx.classList.add('on');
    stars(Store.opts().juice === 0 ? 8 : Store.opts().juice === 2 ? 46 : 26);
    SFX.win();
    FX.flash(true); FX.shake(3);
    FX.confetti(90, true);
    setTimeout(function(){ FX.fireworks(1400); }, 250);
    setTimeout(function(){
      fx.classList.remove('on');
      $('conj-stars').innerHTML = '';
      chooseBoon(ev);
    }, 2300);
  }

  function stars(n){
    var host = $('conj-stars');
    host.innerHTML = '';
    for (var i=0;i<n;i++){
      var s = document.createElement('div');
      s.className = 'shoot';
      s.style.left = (20 + Math.random()*110) + 'vw';
      s.style.top = (-10 + Math.random()*40) + 'vh';
      s.style.animationDuration = (0.9 + Math.random()*1.4) + 's';
      s.style.animationDelay = (Math.random()*1.5) + 's';
      host.appendChild(s);
    }
  }

  function chooseBoon(ev){
    var m = $('modal-boon');
    $('boon-sub').textContent = ev.info.label + ' — choisis la règle qui s\'appliquera pendant ' +
      ev.info.len + ' coups (multiplicateur x' + ev.info.factor + ' si Surcharge).';
    $('boon-list').innerHTML = Dense.BOONS.map(function(b, i){
      var extra = b.id === 'surcharge' ? 'x' + ev.info.factor + ' sur le score'
                : b.id === 'flux' ? ev.info.len + ' coups sans contrainte de couleur'
                : 'une carte enfouie envoyée en fondation';
      return '<button class="boon" data-b="' + b.id + '" style="animation-delay:' + (i*80) + 'ms">' +
             '<div class="bi">' + b.icon + '</div><div class="bn">' + b.name + '</div>' +
             '<div class="bd">' + b.desc + '</div><div class="bx">' + extra + '</div></button>';
    }).join('');
    [].forEach.call($('boon-list').children, function(btn){
      btn.addEventListener('click', function(){
        m.classList.remove('on');
        Dense.openWindow(btn.dataset.b, ev.info);
        SFX.foundation(6);
      });
    });
    m.classList.add('on');
  }

  function onWindowOpen(e){
    document.body.classList.add('conj-window');
    FX.hot(true);
    var bn = Dense.BOONS.filter(function(x){ return x.id === e.boon; })[0];
    App.toast('Fenêtre ouverte — ' + (bn ? bn.icon + ' ' + bn.name : e.boon));
    UI.render(); refresh();
  }
  function onWindowClose(){
    document.body.classList.remove('conj-window');
    FX.hot(false);
    App.toast('Fenêtre refermée — retour au tempo normal');
    UI.render(); refresh();
  }

  /* ---------------- cycle de vie ---------------- */
  function newGame(game, seed){
    build();
    if (!enabled()){
      bar.classList.add('off');
      Dense.reset();
      document.body.classList.remove('conj-window','ascension-armed');
      $('winbadge') && $('winbadge').classList.remove('on');
      return;
    }
    bar.classList.remove('off');
    Dense.init(game, seed);
    refresh();
  }

  return {build:build, newGame:newGame, refresh:refresh, enabled:enabled, markBoard:markBoard};
})();
