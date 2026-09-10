/* ============ Assemblage général ============ */
var App = (function(){
  var invFilter = 'all', onlyOwned = false;

  /* ---------- utilitaires ---------- */
  function $(id){ return document.getElementById(id); }
  function toast(msg){
    var host = $('toast');
    var d = document.createElement('div');
    d.className = 'toast'; d.textContent = msg;
    host.appendChild(d);
    setTimeout(function(){ d.classList.add('out'); setTimeout(function(){ d.remove(); }, 320); }, 2400);
  }
  function fmtTime(s){ var m=Math.floor(s/60), r=s%60; return m+':'+(r<10?'0':'')+r; }

  /* ---------- pièces ---------- */
  function refreshCoins(bump){
    var el = $('coinval'), box = $('coinbox');
    var from = parseInt(el.textContent||'0',10) || 0, to = Store.coins;
    if (from === to){ el.textContent = to; return; }
    var t0 = performance.now(), dur = 520;
    (function step(now){
      var t = Math.min(1,(now-t0)/dur);
      el.textContent = Math.round(from + (to-from)*(1-Math.pow(1-t,3)));
      if (t<1) requestAnimationFrame(step);
    })(t0);
    if (bump){
      box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
      if (to > from) SFX.coin();
    }
  }

  /* ---------- cosmétiques ---------- */
  function applyCosmetics(){
    var e = Store.state.equip;
    var o = Store.opts();
    var cls = [e.bg, e.mat, e.skin, e.sleeve, 'juice-'+o.juice, 'idx-'+o.idx];
    if (o.deck4) cls.push('deck4');
    var sl = ITEM_BY_ID[e.sleeve];
    if (sl && RARITY_ORDER.indexOf(sl.rarity) >= 3){
      cls.push('aura');
      document.body.style.setProperty('--aura', RARITY[sl.rarity].color);
    } else document.body.style.removeProperty('--aura');
    document.body.className = cls.join(' ');
    Perf.relax();
    UI.setIndexLevel(o.idx);
    FX.ambient(e.bg);
  }

  /* ---------- inventaire ---------- */
  function refreshInventory(){
    var host = $('invgrid');
    if (!host) return;
    host.innerHTML = '';
    var list = ITEMS.filter(function(it){
      if (invFilter !== 'all' && it.type !== invFilter) return false;
      if (onlyOwned && !Store.has(it.id)) return false;
      return true;
    });
    list.sort(function(a,b){
      var ta = ['sleeve','skin','mat','bg'].indexOf(a.type) - ['sleeve','skin','mat','bg'].indexOf(b.type);
      if (ta) return ta;
      return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    });
    list.forEach(function(it, i){
      var owned = Store.has(it.id);
      var eq = Store.equipped(it.type) === it.id;
      var d = document.createElement('div');
      d.className = 'invitem' + (owned?'':' locked') + (eq?' equipped':'');
      d.style.setProperty('--rc', RARITY[it.rarity].color);
      d.style.animationDelay = Math.min(i*22, 700)+'ms';
      d.innerHTML = itemPreviewHTML(it) +
        '<div class="invname">'+it.name+'</div>'+
        '<div class="invmeta">'+RARITY[it.rarity].name+'</div>'+
        '<div class="invtag">'+TYPE_NAME[it.type]+'</div>'+
        (eq ? '<div class="eqbadge">ÉQUIPÉ</div>' : '');
      d.addEventListener('click', function(){
        if (!owned){ toast('Verrouillé — trouvable dans les caisses'); SFX.invalid(); return; }
        Store.equip(it.id);
        applyCosmetics();
        refreshInventory();
        SFX.coin();
        var r = d.getBoundingClientRect();
        FX.burst(r.left+r.width/2, r.top+r.height/2,
          {n:18, speed:5, size:5, life:44, colors:[RARITY[it.rarity].color,'#ffffff']});
        FX.shake(1);
        toast(it.name + ' équipé');
      });
      d.addEventListener('pointerenter', function(){ SFX.hover(); });
      host.appendChild(d);
    });
  }

  /* ---------- statistiques ---------- */
  function refreshStats(){
    var s = Store.state.stats;
    var cards = [
      ['Parties', s.games], ['Victoires', s.wins],
      ['Taux de victoire', (s.games ? Math.round(s.wins/s.games*100) : 0)+'%'],
      ['Meilleur temps', s.bestTime ? fmtTime(s.bestTime) : '—'],
      ['Meilleur score', s.bestScore||0],
      ['Meilleur enchaînement', 'x'+(s.bestCombo||0)],
      ['Caisses ouvertes', s.cases||0],
      ['Pièces gagnées', s.earned||0]
    ];
    $('statgrid').innerHTML = cards.map(function(c){
      return '<div class="statcard"><i>'+c[0]+'</i><b>'+c[1]+'</b></div>';
    }).join('');

    var types = ['sleeve','skin','mat','bg'];
    $('collbars').innerHTML = types.map(function(t){
      var tot = ITEMS.filter(function(i){ return i.type===t; }).length;
      var own = Store.ownedCount(t);
      return '<div class="collbar"><span>'+TYPE_NAME[t]+'</span>'+
             '<div class="cbtrack"><div class="cbfill" style="width:'+(own/tot*100)+'%"></div></div>'+
             '<span style="width:56px;text-align:right">'+own+' / '+tot+'</span></div>';
    }).join('');
  }

  /* ---------- navigation ---------- */
  function show(view){
    var cur = document.querySelector('.view.is-active');
    var next = $('view-'+view);
    if (cur === next) return;
    document.querySelectorAll('.tab').forEach(function(t){
      t.classList.toggle('is-active', t.dataset.view === view);
    });
    if (cur) cur.classList.remove('is-active');
    next.classList.add('is-active');
    SFX.click();
    if (view === 'inv') refreshInventory();
    if (view === 'stats') refreshStats();
    if (view === 'game') { UI.layout(); UI.render(); }
  }

  /* ---------- victoire ---------- */
  function onWin(info){
    var s = Store.state.stats;
    Store.bump('wins');
    Store.bump('bestTime', info.time);
    Store.bump('bestScore', info.score);
    Store.bump('bestCombo', info.combo);

    var timeBonus = Math.max(0, Math.round(ECON.timeBonusMax * (1 - info.time/600)));
    var base = ECON.winBase + 52*ECON.perFoundationCard + timeBonus;
    if (UI.game.drawCount === 3) base = Math.round(base*1.25);

    /* mode Conjonction : les objectifs remplis paient */
    var objs = Dense.active ? Dense.objectivesState() : [];
    var okCount = objs.filter(function(o){ return o.done; }).length;
    var objBonus = okCount * 220;
    base += objBonus;

    Store.addCoins(base);
    refreshCoins(true);

    var extra = '';
    if (Dense.active){
      extra = '<div><i>Mult max</i><b>x'+Dense.state.multPeak.toFixed(1)+'</b></div>'+
              '<div><i>Conjonctions</i><b>'+Dense.state.conjCount+'</b></div>';
    }
    $('winstats').innerHTML =
      '<div><i>Temps</i><b>'+fmtTime(info.time)+'</b></div>'+
      '<div><i>Coups</i><b>'+info.moves+'</b></div>'+
      '<div><i>Score</i><b>'+info.score+'</b></div>'+
      '<div><i>Combo max</i><b>x'+info.combo+'</b></div>' + extra;

    var objHtml = '';
    if (objs.length){
      objHtml = '<div style="margin:14px 0 4px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        objs.map(function(o){
          return '<span style="padding:6px 13px;border-radius:10px;font-size:12.5px;font-weight:700;'+
                 (o.done ? 'background:rgba(126,230,168,.16);border:1px solid rgba(126,230,168,.5);color:#a9f0c6'
                         : 'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#8d97a9')+'">'+
                 (o.done?'✓ ':'✕ ')+o.def.name+'</span>';
        }).join('') + '</div>';
    }
    $('winreward').innerHTML = objHtml + '+ ' + base + ' &#9679;' +
      (objBonus ? '<div style="font-size:13px;color:#a9f0c6;font-weight:700;margin-top:4px">dont +'+objBonus+' pour '+okCount+' objectif'+(okCount>1?'s':'')+'</div>' : '');
    $('modal-win').classList.add('on');
    refreshStats();
  }

  function newGame(){
    Store.bump('games');
    UI.newGame(undefined, Store.opts().draw);
    refreshStats();
  }

  /* ---------- options ---------- */
  function syncOptions(){
    var o = Store.opts();
    document.querySelectorAll('#opt-draw button').forEach(function(b){ b.classList.toggle('on', +b.dataset.v === o.draw); });
    document.querySelectorAll('#opt-mode button').forEach(function(b){ b.classList.toggle('on', b.dataset.v === o.mode); });
    document.querySelectorAll('#opt-juice button').forEach(function(b){ b.classList.toggle('on', +b.dataset.v === o.juice); });
    document.querySelectorAll('#opt-idx button').forEach(function(b){ b.classList.toggle('on', +b.dataset.v === o.idx); });
    $('opt-deck4').checked = !!o.deck4;
    $('opt-autoq').checked = o.autoq !== false;
    $('opt-sound').checked = o.sound;
    $('opt-shake').checked = o.shake;
    $('opt-fastcase').checked = o.fastcase;
    SFX.setMuted(!o.sound);
  }

  /* ---------- démarrage ---------- */
  function init(){
    CardArt.installSprite();
    Perf.init();
    Perf.setAuto(Store.opts().autoq !== false);
    FX.init();
    applyCosmetics();
    refreshCoins(false);
    syncOptions();

    UI.init({onWin:onWin, onCoin:function(n,label){
      refreshCoins(true);
      toast(label + ' : +' + n + ' pièces');
    }});
    Cases.renderList();
    refreshInventory();
    refreshStats();
    newGame();

    document.querySelectorAll('.tab').forEach(function(t){
      t.addEventListener('click', function(){ show(t.dataset.view); });
    });

    $('btn-new').addEventListener('click', function(){ SFX.click(); newGame(); });
    $('btn-restart').addEventListener('click', function(){ SFX.click(); Store.bump('games'); UI.restart(); });
    $('btn-undo').addEventListener('click', UI.undo);
    $('btn-hint').addEventListener('click', UI.hint);
    $('btn-auto').addEventListener('click', UI.autoComplete);

    $('btn-settings').addEventListener('click', function(){ SFX.click(); $('modal-settings').classList.add('on'); });
    $('settings-close').addEventListener('click', function(){ $('modal-settings').classList.remove('on'); });

    $('win-close').addEventListener('click', function(){ $('modal-win').classList.remove('on'); });
    $('win-new').addEventListener('click', function(){ $('modal-win').classList.remove('on'); newGame(); });

    $('open-close').addEventListener('click', function(){
      if (Cases.rolling) return;
      $('modal-open').classList.remove('on');
    });
    $('open-again').addEventListener('click', function(){ if (!Cases.rolling) Cases.again(); });
    $('open-equip').addEventListener('click', Cases.equipLast);

    document.querySelectorAll('.modal-bd').forEach(function(bd){
      bd.addEventListener('click', function(){
        var m = bd.parentElement;
        if (m.id === 'modal-open' && Cases.rolling) return;
        m.classList.remove('on');
      });
    });

    document.querySelectorAll('#invfilters .chip').forEach(function(c){
      c.addEventListener('click', function(){
        document.querySelectorAll('#invfilters .chip').forEach(function(x){ x.classList.remove('is-active'); });
        c.classList.add('is-active');
        invFilter = c.dataset.f;
        SFX.click();
        refreshInventory();
      });
    });
    $('onlyowned').addEventListener('change', function(){ onlyOwned = this.checked; refreshInventory(); });

    document.querySelectorAll('#opt-draw button').forEach(function(b){
      b.addEventListener('click', function(){
        Store.setOpt('draw', +b.dataset.v); syncOptions(); SFX.click();
        toast('Pioche ' + b.dataset.v + ' — appliqué à la prochaine partie');
      });
    });
    document.querySelectorAll('#opt-mode button').forEach(function(b){
      b.addEventListener('click', function(){
        Store.setOpt('mode', b.dataset.v); syncOptions(); SFX.click();
        toast('Mode ' + (b.dataset.v === 'conj' ? 'Conjonction' : 'Classique') + ' — appliqué à la prochaine partie');
      });
    });
    document.querySelectorAll('#opt-juice button').forEach(function(b){
      b.addEventListener('click', function(){
        Store.setOpt('juice', +b.dataset.v); syncOptions(); applyCosmetics(); SFX.click();
      });
    });
    document.querySelectorAll('#opt-idx button').forEach(function(b){
      b.addEventListener('click', function(){
        Store.setOpt('idx', +b.dataset.v); syncOptions(); applyCosmetics(); refreshInventory(); SFX.click();
      });
    });
    $('opt-autoq').addEventListener('change', function(){
      Store.setOpt('autoq', this.checked);
      Perf.setAuto(this.checked);
      toast(this.checked ? 'Fluidité adaptative activée' : 'Qualité maximale forcée');
    });
    $('opt-deck4').addEventListener('change', function(){
      Store.setOpt('deck4', this.checked); applyCosmetics(); refreshInventory();
      toast(this.checked ? 'Jeu à 4 couleurs activé' : 'Jeu à 2 couleurs');
    });
    $('opt-sound').addEventListener('change', function(){ Store.setOpt('sound', this.checked); SFX.setMuted(!this.checked); });
    $('opt-shake').addEventListener('change', function(){ Store.setOpt('shake', this.checked); });
    $('opt-fastcase').addEventListener('change', function(){ Store.setOpt('fastcase', this.checked); });

    $('opt-export').addEventListener('click', function(){ Store.exportSave(); toast('Sauvegarde exportée'); });
    $('opt-import').addEventListener('click', function(){ $('importfile').click(); });
    $('importfile').addEventListener('change', function(e){
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function(){
        if (Store.importSave(r.result)){
          applyCosmetics(); refreshCoins(true); refreshInventory(); refreshStats(); syncOptions();
          toast('Sauvegarde importée');
        } else toast('Fichier invalide');
      };
      r.readAsText(f);
      e.target.value = '';
    });
    $('opt-reset').addEventListener('click', function(){
      if (!confirm('Réinitialiser la progression (pièces, collection, statistiques) ?')) return;
      Store.reset(); applyCosmetics(); refreshCoins(true); refreshInventory(); refreshStats(); syncOptions();
      newGame(); toast('Progression réinitialisée');
    });

    document.addEventListener('pointerdown', function once(){ SFX.unlock(); document.removeEventListener('pointerdown', once); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') document.querySelectorAll('.modal.on').forEach(function(m){
        if (m.id === 'modal-open' && Cases.rolling) return;
        m.classList.remove('on');
      });
    });
  }

  return {init:init, toast:toast, refreshCoins:refreshCoins, refreshInventory:refreshInventory,
          refreshStats:refreshStats, applyCosmetics:applyCosmetics, show:show};
})();

document.addEventListener('DOMContentLoaded', App.init);
