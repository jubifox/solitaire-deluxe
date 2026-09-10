/* ============ Gouverneur de fluidite ============
   Mesure le FPS reel et ajuste le niveau de detail en direct. Le jeu peut
   donc pousser beaucoup plus d'effets : sur une machine qui suit, tout
   tourne ; sur une machine qui peine, la charge retombe toute seule. */
var Perf = (function(){

  /* echelle appliquee aux quantites de particules et d'ambiance */
  var SCALE   = [0.32, 0.68, 1];
  var MAXPART = [220,  650,  1500];
  var MAXDPR  = [1,    1.5,  2];

  var tier = 2, fps = 60, frames = 0, winT0 = 0;
  var lowStreak = 0, highStreak = 0, demotions = 0, windows = 0;
  var reduced = false, auto = true, running = false, raf = 0;
  var listeners = [];

  function notify(){
    var b = document.body;
    if (!b) return;
    /* attribut et non classe : applyCosmetics reecrit body.className en entier
       et effacerait le palier a chaque changement de cosmetique */
    b.setAttribute('data-q', tier);
    for (var i=0;i<listeners.length;i++){
      try { listeners[i](tier); } catch(e){}
    }
  }

  function setTier(t, manual){
    t = Math.max(0, Math.min(2, t|0));
    if (t === tier) return;
    if (t < tier && !manual) demotions++;
    tier = t; lowStreak = 0; highStreak = 0;
    notify();
  }

  /* fenetre glissante d'une seconde */
  function tick(now){
    if (!running) return;
    raf = requestAnimationFrame(tick);
    frames++;
    if (!winT0){ winT0 = now; return; }
    var dt = now - winT0;
    if (dt < 1000) return;
    fps = frames * 1000 / dt;
    frames = 0; winT0 = now;
    if (!auto || reduced) return;

    /* on laisse passer le demarrage : distribution, chargement, premiere peinture */
    if (++windows <= 4) return;

    if (fps < 40){
      lowStreak++; highStreak = 0;
      /* trois secondes de suite sous 40 : ce n'est plus un a-coup passager */
      if (lowStreak >= 3) setTier(tier - 1);
    } else if (fps > 55){
      highStreak++; lowStreak = 0;
      /* on ne remonte qu'apres une accalmie franche, et jamais en boucle :
         trois retrogradations bloquent le plafond pour de bon */
      if (highStreak >= 8 && demotions < 3) setTier(tier + 1);
    } else {
      lowStreak = 0; highStreak = 0;
    }
  }

  function start(){
    if (running) return;
    running = true; frames = 0; winT0 = 0; windows = 0;
    raf = requestAnimationFrame(tick);
  }
  function stop(){
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function init(){
    try {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      reduced = !!mq.matches;
      var onMq = function(){ reduced = !!mq.matches; applyReduced(); };
      if (mq.addEventListener) mq.addEventListener('change', onMq);
      else if (mq.addListener) mq.addListener(onMq);
    } catch(e){}

    /* un appareil manifestement leger demarre deja bride */
    var cores = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    if (cores <= 2 || mem <= 2) tier = 1;

    applyReduced();
    notify();

    document.addEventListener('visibilitychange', function(){
      var hid = document.hidden;
      if (hid) document.body.setAttribute('data-paused',''); else document.body.removeAttribute('data-paused');
      if (hid) stop(); else { frames = 0; winT0 = 0; start(); }
    });
    start();
  }

  function applyReduced(){
    if (reduced) document.body.setAttribute('data-reduced',''); else document.body.removeAttribute('data-reduced');
    if (reduced) setTier(0, true);
  }

  return {
    init: init,
    onChange: function(f){ listeners.push(f); },
    get tier(){ return tier; },
    get fps(){ return Math.round(fps); },
    get scale(){ return reduced ? 0 : SCALE[tier]; },
    get maxParticles(){ return MAXPART[tier]; },
    get maxDpr(){ return MAXDPR[tier]; },
    get reduced(){ return reduced; },
    get auto(){ return auto; },
    setAuto: function(v){
      auto = !!v;
      if (!auto){ demotions = 0; setTier(2, true); }
    },
    /* remise a zero du plafond : apres un changement de decor par exemple */
    relax: function(){ demotions = 0; lowStreak = 0; highStreak = 0; windows = 0; }
  };
})();
