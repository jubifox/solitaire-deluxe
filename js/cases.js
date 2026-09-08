/* ============ Ouverture de caisses (style CS:GO) ============ */

function itemPreviewHTML(item, extraClass){
  var cls = item.id + ' ' + (extraClass||'');
  if (item.type === 'sleeve'){
    return '<div class="prev '+cls+'"><div class="minicard"><div class="face back"></div></div></div>';
  }
  if (item.type === 'skin'){
    return '<div class="prev '+cls+'"><div class="minicard">'+
      '<div class="face front black">'+
        '<div class="corner tl"><span class="r">A</span><span class="s">&#9824;</span></div>'+
        '<div class="corner br"><span class="r">A</span><span class="s">&#9824;</span></div>'+
        '<div class="pips"><span class="pip big" style="left:50%;top:50%">&#9824;</span></div>'+
      '</div></div></div>';
  }
  if (item.type === 'mat'){
    return '<div class="prev '+cls+'"><div class="matsurface"></div></div>';
  }
  return '<div class="prev '+cls+'"><div class="bgsurface"></div></div>';
}

var Cases = (function(){
  var STEP = 150;                       // 140px + 10px de gouttière
  var current = null, lastResult = null, rolling = false;

  function caseWeights(def){
    var w = {}, boost = def.boost || 1;
    RARITY_ORDER.forEach(function(k, i){
      var has = def.pool.some(function(id){ return ITEM_BY_ID[id].rarity === k; });
      w[k] = has ? RARITY[k].weight * Math.pow(boost, i*0.55) : 0;
    });
    return w;
  }
  function odds(def){
    var w = caseWeights(def), tot = 0, out = [];
    RARITY_ORDER.forEach(function(k){ tot += w[k]; });
    RARITY_ORDER.forEach(function(k){ if (w[k]) out.push({k:k, p: w[k]/tot*100}); });
    return out;
  }
  function rollRarity(def){
    var w = caseWeights(def), tot = 0, k;
    for (k in w) tot += w[k];
    var r = Math.random()*tot, acc = 0;
    for (var i=0;i<RARITY_ORDER.length;i++){
      acc += w[RARITY_ORDER[i]];
      if (r <= acc) return RARITY_ORDER[i];
    }
    return 'common';
  }
  function rollItem(def){
    var rar = rollRarity(def);
    var idx = RARITY_ORDER.indexOf(rar);
    while (idx >= 0){
      var pool = def.pool.filter(function(id){ return ITEM_BY_ID[id].rarity === RARITY_ORDER[idx]; });
      if (pool.length) return ITEM_BY_ID[pool[(Math.random()*pool.length)|0]];
      idx--;
    }
    return ITEM_BY_ID[def.pool[0]];
  }

  /* ---------- liste des caisses ---------- */
  function renderList(){
    var host = document.getElementById('caselist');
    host.innerHTML = '';
    CASES.forEach(function(def, i){
      var d = document.createElement('div');
      d.className = 'casecard ' + def.cls;
      d.style.animationDelay = (i*70)+'ms';
      var bars = odds(def).map(function(o){
        return '<span style="background:'+RARITY[o.k].color+';flex:'+Math.max(.35, Math.sqrt(o.p))+'"></span>';
      }).join('');
      d.innerHTML =
        '<div class="casebox" style="animation-delay:'+(i*.3)+'s">'+def.icon+'</div>'+
        '<div class="casename">'+def.name+'</div>'+
        '<div class="casedesc">'+def.desc+'</div>'+
        '<div class="caserar">'+bars+'</div>'+
        '<div class="caseprice"><span class="priceTag">&#9679; '+def.price+'</span>'+
        '<button class="btn primary">Ouvrir</button></div>';
      d.addEventListener('click', function(){ open(def.id); });
      host.appendChild(d);
    });

    var ob = document.getElementById('oddsbox');
    var def = CASES[0];
    ob.innerHTML = '<b>Chances (Caisse Découverte)</b><br>' + odds(def).map(function(o){
      return '<span class="oddline"><i style="background:'+RARITY[o.k].color+'"></i>'+
             RARITY[o.k].name+' '+o.p.toFixed(o.p<1?2:1)+'%</span>';
    }).join('') + '<br><span style="opacity:.75">Les doublons sont automatiquement revendus en pièces.</span>';
  }

  /* ---------- ouverture ---------- */
  function open(caseId){
    if (rolling) return;
    var def = CASES.filter(function(c){ return c.id === caseId; })[0];
    if (!def) return;
    if (Store.coins < def.price){
      App.toast('Pas assez de pièces (' + def.price + ' requis)');
      SFX.invalid(); FX.shake(1);
      return;
    }
    Store.spend(def.price);
    App.refreshCoins(true);
    current = def;
    Store.bump('cases');

    var modal = document.getElementById('modal-open');
    document.getElementById('open-title').textContent = def.name;
    document.getElementById('open-equip').style.display = 'none';
    var reveal = document.getElementById('reveal');
    reveal.className = 'reveal'; reveal.innerHTML = '';
    modal.classList.add('on');

    var winner = rollItem(def);
    lastResult = winner;
    buildReel(def, winner);
    SFX.open();
    spin(winner);
  }

  function buildReel(def, winner){
    var reel = document.getElementById('reel');
    var total = 66, winIndex = 58;
    var html = '';
    for (var i=0;i<total;i++){
      var it = (i === winIndex) ? winner : rollItem(def);
      html += '<div class="reelitem" style="--rc:'+RARITY[it.rarity].color+'">'+
                itemPreviewHTML(it)+'<div class="rn">'+it.name+'</div></div>';
    }
    reel.innerHTML = html;
    reel._winIndex = winIndex;
  }

  function spin(winner){
    rolling = true;
    var vp = document.getElementById('reelvp');
    var reel = document.getElementById('reel');
    vp.classList.remove('won');
    vp.style.setProperty('--rc', RARITY[winner.rarity].color);

    var vw = vp.clientWidth;
    var winIndex = reel._winIndex;
    var jitter = (Math.random()-0.5) * (STEP*0.52);
    var from = -STEP*2;
    var to = -(winIndex*STEP + STEP/2 - vw/2 + jitter);
    var dur = Store.opts().fastcase ? 900 : 6400;
    var t0 = performance.now();
    var lastIdx = -1;

    function ease(t){ return 1 - Math.pow(1-t, 5); }
    function frame(now){
      var t = Math.min(1, (now - t0)/dur);
      var x = from + (to - from)*ease(t);
      reel.style.transform = 'translateX('+x+'px)';
      var idx = Math.floor((-x + vw/2)/STEP);
      if (idx !== lastIdx){
        lastIdx = idx;
        if (t < 0.995) SFX.tick(t);
      }
      if (t < 1) requestAnimationFrame(frame);
      else finish(winner);
    }
    requestAnimationFrame(frame);
  }

  function finish(item){
    rolling = false;
    var vp = document.getElementById('reelvp');
    vp.classList.add('won');
    vp.classList.remove('shake'); void vp.offsetWidth; vp.classList.add('shake');

    var rar = RARITY[item.rarity];
    var idx = RARITY_ORDER.indexOf(item.rarity);
    SFX.reveal(item.rarity);
    FX.shake(idx >= 3 ? 3 : idx >= 1 ? 2 : 1);
    if (idx >= 2){ FX.flash(idx >= 4); FX.confetti(40 + idx*45, true); }
    var r = vp.getBoundingClientRect();
    FX.ring(r.left + r.width/2, r.top + r.height/2, rar.color, 26 + idx*8);
    FX.burst(r.left + r.width/2, r.top + r.height/2,
      {n:20 + idx*14, speed:6 + idx, size:6, life:60, colors:[rar.color,'#ffffff','#ffd76e']});

    var isNew = !Store.has(item.id);
    var refund = 0;
    if (isNew) Store.own(item.id);
    else { refund = rar.refund; Store.addCoins(refund); }
    App.refreshCoins(true);

    var reveal = document.getElementById('reveal');
    reveal.style.setProperty('--rc', rar.color);
    reveal.innerHTML =
      itemPreviewHTML(item) +
      '<div class="rvinfo">'+
        '<div class="rvrar">'+rar.name+'</div>'+
        '<div class="rvname">'+item.name+'</div>'+
        '<div class="rvtype">'+TYPE_NAME[item.type]+'</div>'+
        (isNew ? '<div class="rvnew">NOUVEAU</div>'
               : '<div class="rvdupe">Doublon &#8594; +'+refund+' &#9679;</div>')+
      '</div>';
    reveal.classList.add('on');
    document.getElementById('open-equip').style.display = isNew ? '' : 'none';
    App.refreshInventory();
    App.refreshStats();
    if (idx >= 3) App.toast((idx>=5?'EXOTIQUE ! ':'') + item.name + ' — ' + rar.name);
  }

  function equipLast(){
    if (!lastResult) return;
    Store.equip(lastResult.id);
    App.applyCosmetics();
    App.refreshInventory();
    App.toast(lastResult.name + ' équipé');
    SFX.coin();
    document.getElementById('modal-open').classList.remove('on');
  }
  function again(){
    var id = current && current.id;
    document.getElementById('modal-open').classList.remove('on');
    if (id) setTimeout(function(){ open(id); }, 120);
  }

  return {renderList:renderList, open:open, equipLast:equipLast, again:again,
          get rolling(){ return rolling; }};
})();
