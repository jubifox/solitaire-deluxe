/* ============ Règles du Klondike ============ */
var SUIT_CHAR = ['♠','♥','♦','♣'];   /* pique coeur carreau trefle */
var RANK_CHAR = ['','A','2','3','4','5','6','7','8','9','10','V','D','R'];

function isRed(s){ return s === 1 || s === 2; }

function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function Klondike(seed, draw){
  this.seed = seed >>> 0;
  this.drawCount = draw || 1;
  this.deal();
}

Klondike.prototype.deal = function(){
  var rnd = mulberry32(this.seed), deck = [], s, r, i, j;
  for (s=0; s<4; s++) for (r=1; r<=13; r++) deck.push({id: s*13 + r, r:r, s:s, up:false});
  for (i=deck.length-1; i>0; i--){ j = (rnd()*(i+1))|0; var tmp=deck[i]; deck[i]=deck[j]; deck[j]=tmp; }

  this.cards = {};
  deck.forEach(function(c){ this.cards[c.id] = c; }, this);

  this.t = [[],[],[],[],[],[],[]];
  for (i=0; i<7; i++) for (j=i; j<7; j++){
    var c = deck.pop(); c.up = (i === j); this.t[j].push(c);
  }
  this.stock = deck;
  this.stock.forEach(function(c){ c.up = false; });
  this.waste = [];
  this.f = [[],[],[],[]];
  this.score = 0; this.moves = 0; this.recycles = 0;
  this.history = [];
};

Klondike.prototype.pile = function(ref){
  if (ref === 'stock') return this.stock;
  if (ref === 'waste') return this.waste;
  if (ref[0] === 'f') return this.f[+ref[1]];
  return this.t[+ref[1]];
};
Klondike.prototype.top = function(ref){
  var p = this.pile(ref); return p.length ? p[p.length-1] : null;
};

/* ---------- snapshots pour l'annulation ---------- */
Klondike.prototype.snap = function(){
  var enc = function(p){ return p.map(function(c){ return c.id*2 + (c.up?1:0); }); };
  return {t:this.t.map(enc), s:enc(this.stock), w:enc(this.waste), f:this.f.map(enc),
          sc:this.score, mv:this.moves, rc:this.recycles};
};
Klondike.prototype.restore = function(sn){
  var self = this;
  var dec = function(a){ return a.map(function(v){
    var c = self.cards[v>>1]; c.up = !!(v & 1); return c; }); };
  this.t = sn.t.map(dec); this.stock = dec(sn.s); this.waste = dec(sn.w);
  this.f = sn.f.map(dec);
  this.score = sn.sc; this.moves = sn.mv; this.recycles = sn.rc;
};
Klondike.prototype.push = function(){
  this.history.push(this.snap());
  if (this.history.length > 400) this.history.shift();
};
Klondike.prototype.undo = function(){
  if (!this.history.length) return false;
  this.restore(this.history.pop());
  return true;
};

/* ---------- validité ---------- */
Klondike.prototype.canDrop = function(card, ref){
  var p = this.pile(ref), t = p.length ? p[p.length-1] : null;
  if (ref[0] === 'f'){
    if (!t) return card.r === 1 && +ref[1] === card.s;   /* une fondation par couleur */
    return t.s === card.s && t.r === card.r - 1;
  }
  if (ref[0] === 't'){
    if (!t) return card.r === 13;
    return t.up && isRed(t.s) !== isRed(card.s) && t.r === card.r + 1;
  }
  return false;
};

/* une séquence déplaçable : cartes face visible, alternées et décroissantes */
Klondike.prototype.movableFrom = function(ref, idx){
  var p = this.pile(ref);
  if (ref[0] === 't'){
    if (idx < 0 || idx >= p.length || !p[idx].up) return null;
    for (var i=idx; i<p.length-1; i++){
      var a = p[i], b = p[i+1];
      if (!b.up || a.r !== b.r + 1 || isRed(a.s) === isRed(b.s)) return null;
    }
    return p.slice(idx);
  }
  if (idx !== p.length-1) return null;
  return p.length ? [p[p.length-1]] : null;
};

/* ---------- actions ---------- */
Klondike.prototype.drawStock = function(){
  if (!this.stock.length && !this.waste.length) return null;
  this.push();
  var res = {type:'draw', cards:[], recycled:false};
  if (!this.stock.length){
    while (this.waste.length){ var c = this.waste.pop(); c.up = false; this.stock.push(c); }
    this.recycles++;
    if (this.drawCount === 1) this.score = Math.max(0, this.score - 100);
    else this.score = Math.max(0, this.score - 20);
    res.recycled = true;
    this.moves++;
    return res;
  }
  var n = Math.min(this.drawCount, this.stock.length);
  for (var i=0;i<n;i++){ var k = this.stock.pop(); k.up = true; this.waste.push(k); res.cards.push(k); }
  this.moves++;
  return res;
};

Klondike.prototype.move = function(fromRef, idx, toRef){
  var group = this.movableFrom(fromRef, idx);
  if (!group || !group.length) return null;
  if (toRef[0] === 'f' && group.length > 1) return null;
  if (!this.canDrop(group[0], toRef)) return null;
  if (fromRef === toRef) return null;

  this.push();
  var from = this.pile(fromRef), to = this.pile(toRef);
  from.splice(from.length - group.length, group.length);
  group.forEach(function(c){ to.push(c); });

  var gain = 0;
  if (toRef[0] === 'f') gain += 10;
  else if (fromRef === 'waste') gain += 5;
  if (fromRef[0] === 'f' && toRef[0] === 't') gain -= 15;

  var flipped = null;
  if (fromRef[0] === 't' && from.length && !from[from.length-1].up){
    from[from.length-1].up = true;
    flipped = from[from.length-1];
    gain += 5;
  }
  this.score = Math.max(0, this.score + gain);
  this.moves++;
  return {group:group, flipped:flipped, gain:gain, toFoundation: toRef[0]==='f',
          from:fromRef, to:toRef};
};

/* meilleure destination automatique pour une carte cliquée */
Klondike.prototype.autoTarget = function(ref, idx, foundationFirst){
  var group = this.movableFrom(ref, idx);
  if (!group) return null;
  var i, r;
  if (group.length === 1 && foundationFirst !== false){
    for (i=0;i<4;i++){ r='f'+i; if (r!==ref && this.canDrop(group[0], r)) return r; }
  }
  // priorité : pile non vide qui accepte, puis case vide (seulement si utile)
  var empty = null;
  for (i=0;i<7;i++){
    r = 't'+i;
    if (r === ref) continue;
    if (!this.canDrop(group[0], r)) continue;
    if (this.t[i].length === 0){ if (empty === null) empty = r; continue; }
    return r;
  }
  if (group.length === 1 && foundationFirst === false){
    for (i=0;i<4;i++){ r='f'+i; if (r!==ref && this.canDrop(group[0], r)) return r; }
  }
  // ne pas vider une colonne pour la remplir aussitôt
  if (empty !== null && !(ref[0]==='t' && idx === 0)) return empty;
  return null;
};

Klondike.prototype.isWon = function(){
  return this.f[0].length + this.f[1].length + this.f[2].length + this.f[3].length === 52;
};
Klondike.prototype.allUp = function(){
  for (var i=0;i<7;i++) for (var j=0;j<this.t[i].length;j++) if (!this.t[i][j].up) return false;
  return true;
};
Klondike.prototype.canAutoComplete = function(){
  if (this.isWon()) return false;
  return this.allUp();
};
/* prochain coup automatique vers une fondation (pour le bouton Auto) */
Klondike.prototype.nextAuto = function(){
  var i, r, c;
  for (i=0;i<7;i++){
    c = this.top('t'+i);
    if (c) for (var k=0;k<4;k++){ r='f'+k; if (this.canDrop(c, r)) return {from:'t'+i, idx:this.t[i].length-1, to:r}; }
  }
  c = this.top('waste');
  if (c) for (i=0;i<4;i++){ r='f'+i; if (this.canDrop(c, r)) return {from:'waste', idx:this.waste.length-1, to:r}; }
  return null;
};

/* indice : renvoie {from, idx, to} */
Klondike.prototype.hint = function(){
  var i, j, k, c, r;
  // 1) vers une fondation
  var a = this.nextAuto();
  if (a) return a;
  // 2) déplacement qui retourne une carte cachée
  for (i=0;i<7;i++){
    var p = this.t[i];
    for (j=0;j<p.length;j++){
      if (!p[j].up) continue;
      if (j === 0) break;
      if (!p[j-1].up){
        for (k=0;k<7;k++){
          if (k===i) continue;
          if (this.t[k].length && this.canDrop(p[j], 't'+k) && this.movableFrom('t'+i, j))
            return {from:'t'+i, idx:j, to:'t'+k};
        }
      }
      break;
    }
  }
  // 3) depuis la défausse
  c = this.top('waste');
  if (c) for (k=0;k<7;k++) if (this.canDrop(c,'t'+k)) return {from:'waste', idx:this.waste.length-1, to:'t'+k};
  // 4) un roi vers une colonne vide
  for (i=0;i<7;i++){
    if (this.t[i].length) continue;
    for (k=0;k<7;k++){
      if (k===i || !this.t[k].length) continue;
      for (j=0;j<this.t[k].length;j++){
        if (this.t[k][j].up && this.t[k][j].r === 13 && j > 0 && this.movableFrom('t'+k, j))
          return {from:'t'+k, idx:j, to:'t'+i};
      }
    }
  }
  // 5) piocher
  if (this.stock.length || this.waste.length) return {from:'stock', idx:-1, to:'stock'};
  return null;
};
