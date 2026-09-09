/* ============ Sauvegarde locale (portable) ============ */
var Store = (function(){
  var KEY = 'solitaire_deluxe_save_v1';
  var mem = null;      // secours si localStorage indisponible (file:// verrouillé)
  var warned = false;

  function fresh(){
    var owned = {};
    for (var k in DEFAULT_EQUIP) owned[DEFAULT_EQUIP[k]] = 1;
    return {
      v:1,
      coins: ECON.start,
      owned: owned,
      equip: JSON.parse(JSON.stringify(DEFAULT_EQUIP)),
      stats: {games:0, wins:0, bestTime:0, bestScore:0, cases:0, moves:0, bestCombo:0, earned:0},
      opts: {draw:1, juice:1, sound:true, shake:true, fastcase:false, mode:'conj', idx:1, deck4:false}
    };
  }

  function read(){
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      var d = JSON.parse(raw);
      var f = fresh();
      // fusion défensive (compatibilité montante)
      d.owned = Object.assign(f.owned, d.owned||{});
      d.equip = Object.assign(f.equip, d.equip||{});
      d.stats = Object.assign(f.stats, d.stats||{});
      d.opts  = Object.assign(f.opts,  d.opts ||{});
      if (typeof d.coins !== 'number' || !isFinite(d.coins)) d.coins = ECON.start;
      return d;
    } catch(e){
      if (!warned){ warned = true; console.warn('Sauvegarde indisponible, mode mémoire.', e); }
      return mem || fresh();
    }
  }

  var state = read();

  function save(){
    mem = state;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
  }

  return {
    get state(){ return state; },
    get coins(){ return state.coins; },
    opts: function(){ return state.opts; },
    save: save,

    addCoins: function(n){
      state.coins = Math.max(0, Math.round(state.coins + n));
      if (n > 0) state.stats.earned += Math.round(n);
      save();
      return state.coins;
    },
    spend: function(n){
      if (state.coins < n) return false;
      state.coins -= n; save(); return true;
    },
    has: function(id){ return !!state.owned[id]; },
    own: function(id){ state.owned[id] = 1; save(); },
    equipped: function(type){ return state.equip[type]; },
    equip: function(id){
      var it = ITEM_BY_ID[id]; if (!it) return false;
      state.equip[it.type] = id; save(); return true;
    },
    ownedCount: function(type){
      var n = 0;
      for (var id in state.owned) if (ITEM_BY_ID[id] && (!type || ITEM_BY_ID[id].type === type)) n++;
      return n;
    },
    setOpt: function(k,v){ state.opts[k] = v; save(); },
    bump: function(k, v){
      var s = state.stats;
      if (k === 'bestTime'){ if (!s.bestTime || v < s.bestTime) s.bestTime = v; }
      else if (k === 'bestScore' || k === 'bestCombo'){ if (v > s[k]) s[k] = v; }
      else s[k] = (s[k]||0) + (v===undefined?1:v);
      save();
    },
    exportSave: function(){
      var blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'solitaire-deluxe-save.json';
      document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    },
    importSave: function(text){
      try {
        var d = JSON.parse(text);
        if (!d || typeof d !== 'object' || typeof d.coins !== 'number') return false;
        state = d;
        var f = fresh();
        state.owned = Object.assign(f.owned, state.owned||{});
        state.equip = Object.assign(f.equip, state.equip||{});
        state.stats = Object.assign(f.stats, state.stats||{});
        state.opts  = Object.assign(f.opts,  state.opts ||{});
        save(); return true;
      } catch(e){ return false; }
    },
    reset: function(){ state = fresh(); save(); }
  };
})();
