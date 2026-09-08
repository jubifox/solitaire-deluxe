/* ============================================================
   MODE CONJONCTION — densité stratégique en session
   Élan, interactions spatiales, objectifs, chaînes, déclenchement rare.
   Aucune progression hors partie : tout est remis à zéro à chaque donne.
   ============================================================ */
var Dense = (function(){

  var CFG = {
    elanStart: 2,
    elanMax: 8,                /* plafond bas : le surplus est perdu, donc il faut dépenser */
    foundationsPerElan: 4,     /* 1 Élan toutes les N cartes posées en fondation */
    seqMin: 3,                 /* longueur minimale dune suite recompensee */
    emptyReward: 2,
    heavyColumn: 11,           /* colonne lourde a partir de N cartes */
    heavyCost: 1,              /* cout pour deplacer un GROUPE depuis une colonne lourde */
    multStep: [0, 0, 0, 0.1, 0.2, 0.3],  /* +mult selon la longueur de suite (3,4,5+) */
    multMax: 3,
    windowLen: 3,              /* taille de la fenetre de conjonction */
    costs: {vision:1, ordre:2, gel:2, licence:3}
  };

  var OBJECTIVES = [
    {id:'terrain', name:'Terrain dégagé', short:'3 colonnes vides', tag:'espace',
     desc:'Terminer avec au moins 3 colonnes vides',
     read:function(D,G){ var n=0; for(var i=0;i<7;i++) if(!G.t[i].length) n++; return n; }, goal:3},
    {id:'architecte', name:'Architecte', short:'5 suites', tag:'construction',
     desc:'Former 5 suites ordonnées de 3 cartes ou plus',
     read:function(D){ return D.suites; }, goal:5},
    {id:'crescendo', name:'Crescendo', short:'multiplicateur x2', tag:'construction',
     desc:'Atteindre un multiplicateur de x2.0',
     read:function(D){ return Math.round(D.multPeak*10)/10; }, goal:2, decimal:true},
    {id:'astronome', name:'Astronome', short:'2 conjonctions', tag:'elan',
     desc:'Déclencher 2 Conjonctions dans la partie',
     read:function(D){ return D.conjCount; }, goal:2},
    {id:'econome', name:'Économe', short:'1 recyclage max', tag:'tempo', atMost:true,
     desc:"Ne pas recycler le stock plus d'une fois",
     read:function(D,G){ return G.recycles; }, goal:1},
    {id:'ascete', name:'Ascète', short:'5 Élan max', tag:'elan', atMost:true,
     desc:"Dépenser au plus 5 points d'Élan",
     read:function(D){ return D.spent; }, goal:5},
    {id:'celerite', name:'Célérité', short:'150 coups max', tag:'tempo', atMost:true,
     desc:'Gagner en 150 coups ou moins',
     read:function(D,G){ return G.moves; }, goal:150}
  ];
  var OBJ_BY_ID = {}; OBJECTIVES.forEach(function(o){ OBJ_BY_ID[o.id] = o; });

  var BOONS = [
    {id:'flux', name:'Flux libre', icon:'🌊',
     desc:'Les couleurs sont ignorées sur le tableau pendant la fenêtre.'},
    {id:'ascension', name:'Ascension', icon:'🕊️',
     desc:'Envoie une carte visible, même enfouie, directement sur sa fondation.'},
    {id:'surcharge', name:'Surcharge', icon:'⚡',
     desc:'Le multiplicateur de score est décuplé pendant la fenêtre.'}
  ];

  var D = null, G = null, listeners = {};

  /* ---------------------------------------------------------- */
  function fresh(){
    return {
      elan: CFG.elanStart, spent: 0, earned: 0,
      mult: 1, multPeak: 1, suites: 0,
      seqRecord: [0,0,0,0,0,0,0],
      emptyArmed: [false,false,false,false,false,false,false],
      fCount: 0, resonance: false, resoPair: null,
      vision: 0,                       /* nb de cartes du stock connues davance */
      conjCount: 0, conjReady: false,
      conj: null,                      /* {boon, movesLeft, factor, kind} */
      ascension: false,
      licence: false,
      lastTriggerAt: -99,
      objectives: [], failed: {}
    };
  }

  function init(game, seed){
    G = game;
    D = fresh();
    pickObjectives(seed);
    G.onSnap = snapshot;
    G.onRestore = restore;
    emit('change');
    return D;
  }

  function pickObjectives(seed){
    var rnd = mulberry32((seed>>>0) ^ 0x9e3779b9);
    var pool = OBJECTIVES.slice();
    /* tirage sans conflit : jamais deux objectifs de la meme famille,
       et jamais Ascete avec Astronome (lun interdit ce que lautre exige) */
    var a = pool.splice(Math.floor(rnd()*pool.length), 1)[0];
    var ok = pool.filter(function(o){
      if (o.tag === a.tag) return false;
      if ((o.id === 'ascete' && a.id === 'astronome') ||
          (o.id === 'astronome' && a.id === 'ascete')) return false;
      return true;
    });
    var b = ok[Math.floor(rnd()*ok.length)] || pool[0];
    D.objectives = [a.id, b.id];
  }

  /* ---------------------------------------------------------- */
  function snapshot(){
    return JSON.stringify(D);
  }
  function restore(str){
    if (!str) return;
    D = JSON.parse(str);
    applyRules();
    emit('change');
  }
  function applyRules(){
    /* repercute letat sur le moteur de regles */
    G.freeColor = !!(D.conj && D.conj.boon === 'flux') || !!D.licence;
  }

  function on(evt, fn){ (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, arg){ (listeners[evt]||[]).forEach(function(f){ f(arg); }); }

  /* ---------------------------------------------------------- */
  function gain(n, why, where){
    var before = D.elan;
    D.elan = Math.min(CFG.elanMax, D.elan + n);
    var real = D.elan - before;
    if (real > 0){
      D.earned += real;
      emit('elan', {delta:real, why:why, where:where, capped:real < n});
    } else if (n > 0){
      emit('elan', {delta:0, why:why, where:where, capped:true});
    }
    emit('change');
    return real;
  }

  function spend(action){
    var cost = CFG.costs[action];
    if (cost === undefined) return {ok:false, reason:'Action inconnue'};
    if (D.elan < cost) return {ok:false, reason:'Élan insuffisant (' + cost + ' requis)'};
    D.elan -= cost; D.spent += cost;
    emit('change');
    return {ok:true, cost:cost};
  }

  /* ---------- longueur de la suite ordonnée en bas de colonne ---------- */
  function tailRun(i){
    var p = G.t[i], n = p.length;
    if (!n || !p[n-1].up) return 0;
    var len = 1;
    for (var j = n-1; j > 0; j--){
      var a = p[j-1], b = p[j];
      if (!a.up || a.r !== b.r + 1 || isRed(a.s) === isRed(b.s)) break;
      len++;
    }
    return len;
  }

  /* ---------- résonance : deux colonnes voisines consécutives ---------- */
  function scanResonance(){
    D.resonance = false; D.resoPair = null;
    for (var i=0;i<6;i++){
      var a = G.t[i][G.t[i].length-1], b = G.t[i+1][G.t[i+1].length-1];
      if (!a || !b || !a.up || !b.up) continue;
      if (Math.abs(a.r - b.r) === 1){ D.resonance = true; D.resoPair = [i, i+1]; return; }
    }
  }

  /* ---------- après chaque coup ---------- */
  function onMove(res){
    if (!D) return;
    var i, bonus = 0;

    /* 1. cartes envoyées en fondation */
    if (res.toFoundation){
      D.fCount += res.group.length;
      while (D.fCount >= CFG.foundationsPerElan){
        D.fCount -= CFG.foundationsPerElan;
        gain(1, 'Fondation', res.to);
      }
    }

    /* 2. suites ordonnées (récompense uniquement sur nouveau record de colonne) */
    for (i=0;i<7;i++){
      var run = tailRun(i);
      if (run >= CFG.seqMin && run > D.seqRecord[i]){
        var step = CFG.multStep[Math.min(run, CFG.multStep.length-1)] || 0.3;
        D.seqRecord[i] = run;
        D.suites++;
        D.mult = Math.min(CFG.multMax, Math.round((D.mult + step)*100)/100);
        if (D.mult > D.multPeak) D.multPeak = D.mult;
        gain(D.resonance ? 2 : 1, D.resonance ? 'Résonance' : 'Suite', 't'+i);
        emit('suite', {col:i, len:run, mult:D.mult, resonance:D.resonance});
      }
      if (!G.t[i].length){
        D.seqRecord[i] = 0;
        if (D.emptyArmed[i]){ D.emptyArmed[i] = false; gain(CFG.emptyReward, 'Colonne vidée', 't'+i); }
      } else if (G.t[i].length >= 2){
        D.emptyArmed[i] = true;      /* il faudra reconstruire avant de re-encaisser */
      }
    }

    /* 3. multiplicateur appliqué au gain de score */
    var f = totalMult();
    if (res.gain > 0 && f > 1){
      bonus = Math.round(res.gain * (f - 1));
      G.score += bonus;
      emit('bonus', {amount:bonus, mult:f, to:res.to});
    }

    /* 3bis. la Licence ne vaut que pour un coup */
    if (D.licence){ D.licence = false; applyRules(); }

    /* 4. fenêtre de conjonction */
    if (D.conj){
      D.conj.movesLeft--;
      if (D.conj.movesLeft <= 0) closeWindow();
      else emit('change');
    }

    scanResonance();
    emit('change');
    return bonus;
  }

  /* ---------- après chaque pioche : détection du déclenchement rare ---------- */
  function onDraw(res){
    if (!D) return;
    if (res.recycled){ emit('change'); return; }
    if (D.vision > 0) D.vision = Math.max(0, D.vision - res.cards.length);
    checkConjonction();
    emit('change');
  }

  function windowCards(){
    var r = G.reveal || [];
    return r.slice(Math.max(0, r.length - CFG.windowLen));
  }

  /* renvoie null, ou {kind, factor, len} si la fenêtre est une conjonction */
  function evaluate(cards){
    if (cards.length < CFG.windowLen) return null;
    var figures  = cards.every(function(c){ return c.r >= 11; });
    var sameRank = cards.every(function(c){ return c.r === cards[0].r; });
    var rs = cards.map(function(c){ return c.r; }).sort(function(a,b){ return a-b; });
    var run = true;
    for (var i=1;i<rs.length;i++) if (rs[i] !== rs[i-1] + 1) run = false;

    if (sameRank && figures) return {kind:'royale', label:'CONJONCTION ROYALE', factor:8, len:5};
    if (sameRank)            return {kind:'rang',   label:'CONJONCTION DE RANG', factor:6, len:5};
    if (figures)             return {kind:'cour',   label:'CONJONCTION DE COUR', factor:4, len:4};
    /* palier d'entrée : trois rangs consécutifs, dans nimporte quel ordre.
       Sans lui la mécanique phare reste invisible dans plus dune partie sur deux. */
    if (run)                 return {kind:'suite',  label:'CONJONCTION DE SUITE', factor:3, len:3};
    return null;
  }

  function checkConjonction(){
    if (D.conj) return;                       /* pas de cumul */
    var cards = windowCards();
    var hit = evaluate(cards);
    D.conjReady = !!hit;
    if (!hit) return;
    if ((G.revealCount - D.lastTriggerAt) < CFG.windowLen) return;
    D.lastTriggerAt = G.revealCount;
    D.conjCount++;
    emit('conjonction', {info:hit, cards:cards.slice()});
  }

  /* le joueur choisit sa règle temporaire */
  function openWindow(boonId, info){
    D.conj = {boon:boonId, movesLeft:info.len, factor:info.factor, kind:info.kind};
    D.ascension = (boonId === 'ascension');
    applyRules();
    emit('window-open', {boon:boonId, info:info});
    emit('change');
  }
  function closeWindow(){
    D.conj = null; D.ascension = false;
    applyRules();
    emit('window-close');
    emit('change');
  }

  function totalMult(){
    var f = D.mult;
    if (D.conj && D.conj.boon === 'surcharge') f = Math.round(f * D.conj.factor * 100)/100;
    return f;
  }

  /* ---------- contraintes spatiales ---------- */
  /* colonne lourde : deplacer un GROUPE coute de lElan.
     Le deplacement dune carte seule reste TOUJOURS gratuit -> aucun blocage possible. */
  function moveCost(fromRef, count){
    if (!D || fromRef[0] !== 't' || count < 2) return {cost:0, ok:true};
    var n = G.t[+fromRef[1]].length;
    if (n < CFG.heavyColumn) return {cost:0, ok:true};
    if (D.elan < CFG.heavyCost)
      return {cost:CFG.heavyCost, ok:false,
              reason:'Colonne lourde (' + n + ' cartes) : ' + CFG.heavyCost + ' Élan requis pour déplacer un groupe'};
    return {cost:CFG.heavyCost, ok:true, heavy:true};
  }
  function payMoveCost(c){
    if (c && c.heavy){ D.elan -= c.cost; D.spent += c.cost; emit('change'); }
  }

  /* ---------- objectifs ---------- */
  function objectiveState(id){
    var o = OBJ_BY_ID[id];
    var cur = o.read(D, G);
    var done = o.atMost ? cur <= o.goal : cur >= o.goal;
    var lost = o.atMost ? cur > o.goal : false;
    return {def:o, cur:cur, done:done, lost:lost,
            pct: Math.max(0, Math.min(1, o.atMost ? 1 - cur/(o.goal*1.6) : cur/o.goal))};
  }
  function objectivesState(){ return D ? D.objectives.map(objectiveState) : []; }

  /* ---------- accès ---------- */
  return {
    CFG: CFG, BOONS: BOONS, OBJECTIVES: OBJECTIVES,
    init: init, on: on, emit: emit,
    onMove: onMove, onDraw: onDraw,
    spend: spend, gain: gain,
    openWindow: openWindow, closeWindow: closeWindow,
    moveCost: moveCost, payMoveCost: payMoveCost, applyRules: applyRules,
    totalMult: totalMult, windowCards: windowCards, evaluate: evaluate,
    objectivesState: objectivesState,
    get state(){ return D; },
    get active(){ return !!D; },
    reset: function(){ D = null; if (G){ G.onSnap = null; G.onRestore = null; } }
  };
})();
