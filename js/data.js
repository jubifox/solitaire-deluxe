/* ============ Données : raretés, cosmétiques, caisses ============ */
var RARITY = {
  common:    {key:'common',    name:'Commun',      color:'#5e98d9', weight:7992, refund:30},
  uncommon:  {key:'uncommon',  name:'Peu commun',  color:'#4b69ff', weight:1598, refund:80},
  rare:      {key:'rare',      name:'Rare',        color:'#8847ff', weight:320,  refund:200},
  mythic:    {key:'mythic',    name:'Mythique',    color:'#d32ce6', weight:64,   refund:500},
  legendary: {key:'legendary', name:'Légendaire',  color:'#eb4b4b', weight:26,   refund:1100},
  exotic:    {key:'exotic',    name:'Exotique',    color:'#ffd700', weight:5,    refund:2600}
};
var RARITY_ORDER = ['common','uncommon','rare','mythic','legendary','exotic'];

var TYPE_NAME = {sleeve:'Dos de cartes', skin:'Jeu de cartes', mat:'Tapis', bg:'Fond'};

var ITEMS = [
  /* ---- dos de cartes ---- */
  {id:'sleeve-rouge',     type:'sleeve', name:'Rouge Classique',   rarity:'common'},
  {id:'sleeve-azur',      type:'sleeve', name:'Damier Azur',       rarity:'common'},
  {id:'sleeve-ivy',       type:'sleeve', name:'Feuillage Émeraude',rarity:'common'},
  {id:'sleeve-tartan',    type:'sleeve', name:'Tartan Sable',      rarity:'common'},
  {id:'sleeve-encre',     type:'sleeve', name:"Vague d'Encre",     rarity:'uncommon'},
  {id:'sleeve-circuit',   type:'sleeve', name:'Circuit Néon',      rarity:'uncommon'},
  {id:'sleeve-mandala',   type:'sleeve', name:'Mandala Pourpre',   rarity:'rare'},
  {id:'sleeve-nebuleuse', type:'sleeve', name:'Nébuleuse',         rarity:'rare'},
  {id:'sleeve-dragon',    type:'sleeve', name:'Écailles de Dragon',rarity:'mythic'},
  {id:'sleeve-holo',      type:'sleeve', name:'Holo Prisme',       rarity:'mythic'},
  {id:'sleeve-inferno',   type:'sleeve', name:'Inferno',           rarity:'legendary'},
  {id:'sleeve-origami',   type:'sleeve', name:'Origami',            rarity:'common'},
  {id:'sleeve-recif',     type:'sleeve', name:'Récif',              rarity:'uncommon'},
  {id:'sleeve-runes',     type:'sleeve', name:'Runes Anciennes',    rarity:'rare'},
  {id:'sleeve-obsidienne',type:'sleeve', name:'Obsidienne',         rarity:'mythic'},
  {id:'sleeve-orage',     type:'sleeve', name:'Œil du Cyclone',     rarity:'legendary'},
  {id:'sleeve-or',        type:'sleeve', name:"Feuille d'Or",      rarity:'exotic'},
  {id:'sleeve-prisme',    type:'sleeve', name:'Prisme Liquide',     rarity:'exotic'},

  /* ---- jeux de cartes (faces) ---- */
  {id:'skin-classic', type:'skin', name:'Standard',        rarity:'common'},
  {id:'skin-papier',  type:'skin', name:'Papier Vintage',  rarity:'common'},
  {id:'skin-mono',    type:'skin', name:'Monochrome',      rarity:'uncommon'},
  {id:'skin-givre',   type:'skin', name:'Givre',           rarity:'uncommon'},
  {id:'skin-neon',    type:'skin', name:'Néon Nocturne',   rarity:'rare'},
  {id:'skin-sakura',  type:'skin', name:'Sakura',          rarity:'rare'},
  {id:'skin-cyber',   type:'skin', name:'Cyberdeck',       rarity:'mythic'},
  {id:'skin-craie',   type:'skin', name:'Ardoise & Craie', rarity:'common'},
  {id:'skin-bauhaus', type:'skin', name:'Bauhaus',         rarity:'uncommon'},
  {id:'skin-pixel',   type:'skin', name:'Pixel 8-bit',     rarity:'rare'},
  {id:'skin-botanik', type:'skin', name:'Herbier',         rarity:'rare'},
  {id:'skin-royal',   type:'skin', name:'Or Royal',        rarity:'legendary'},
  {id:'skin-spectre', type:'skin', name:'Spectre Holo',    rarity:'exotic'},

  /* ---- tapis ---- */
  {id:'mat-feutre',   type:'mat', name:'Feutre Vert',    rarity:'common'},
  {id:'mat-ardoise',  type:'mat', name:'Ardoise',        rarity:'common'},
  {id:'mat-bordeaux', type:'mat', name:'Bordeaux',       rarity:'common'},
  {id:'mat-ocean',    type:'mat', name:'Océan',          rarity:'uncommon'},
  {id:'mat-chene',    type:'mat', name:'Chêne Massif',   rarity:'uncommon'},
  {id:'mat-grille',   type:'mat', name:'Grille Néon',    rarity:'rare'},
  {id:'mat-velours',  type:'mat', name:'Velours Royal',  rarity:'mythic'},
  {id:'mat-sable',    type:'mat', name:'Sable Chaud',    rarity:'common'},
  {id:'mat-cuir',     type:'mat', name:'Cuir Cognac',     rarity:'uncommon'},
  {id:'mat-marbre',   type:'mat', name:'Marbre Veiné',    rarity:'rare'},
  {id:'mat-lave',     type:'mat', name:'Coulée de Lave', rarity:'legendary'},
  {id:'mat-aurum',    type:'mat', name:'Damas d\'Or',     rarity:'exotic'},

  /* ---- fonds ---- */
  {id:'bg-studio',     type:'bg', name:'Studio Sombre',    rarity:'common'},
  {id:'bg-crepuscule', type:'bg', name:'Crépuscule',       rarity:'common'},
  {id:'bg-foret',      type:'bg', name:'Forêt Brumeuse',   rarity:'common'},
  {id:'bg-aurore',     type:'bg', name:'Aurore Boréale',   rarity:'uncommon'},
  {id:'bg-skyline',    type:'bg', name:'Skyline Néon',     rarity:'rare'},
  {id:'bg-galaxie',    type:'bg', name:'Voie Lactée',      rarity:'rare'},
  {id:'bg-sakura',     type:'bg', name:'Pluie de Pétales', rarity:'mythic'},
  {id:'bg-dune',       type:'bg', name:'Dunes',             rarity:'common'},
  {id:'bg-pluie',      type:'bg', name:'Pluie de Néons',    rarity:'uncommon'},
  {id:'bg-abysse',     type:'bg', name:'Abysse',            rarity:'rare'},
  {id:'bg-braise',     type:'bg', name:'Feu de Camp',       rarity:'mythic'},
  {id:'bg-vapor',      type:'bg', name:'Vaporwave',        rarity:'legendary'},
  {id:'bg-eclipse',    type:'bg', name:'Éclipse',           rarity:'exotic'}
];

var ITEM_BY_ID = {};
ITEMS.forEach(function(it){ ITEM_BY_ID[it.id] = it; });

var DEFAULT_EQUIP = {sleeve:'sleeve-rouge', skin:'skin-classic', mat:'mat-feutre', bg:'bg-studio'};

var CASES = [
  {
    id:'case-decouverte', name:'Caisse Découverte', price:300, cls:'case-c1', icon:'📦',
    desc:'Le kit de départ : dos, tapis et fonds pour poser le décor.',
    pool:['sleeve-azur','sleeve-ivy','sleeve-tartan','sleeve-origami','mat-ardoise','mat-bordeaux',
          'mat-sable','bg-crepuscule','bg-foret','bg-dune','skin-craie',
          'sleeve-encre','sleeve-recif','mat-chene','mat-cuir','bg-aurore','bg-pluie',
          'skin-papier','skin-mono','skin-bauhaus',
          'sleeve-mandala','sleeve-runes','bg-galaxie','skin-sakura','skin-botanik','mat-marbre',
          'sleeve-dragon','mat-velours','bg-braise',
          'sleeve-inferno',
          'sleeve-or','mat-aurum']
  },
  {
    id:'case-neon', name:'Caisse Néon', price:750, cls:'case-c2', icon:'🎴',
    desc:'Chrome, scanlines et lumière froide. Pour jouer la nuit.',
    pool:['sleeve-azur','mat-ardoise','bg-crepuscule','skin-papier','skin-craie',
          'sleeve-circuit','sleeve-recif','skin-givre','bg-aurore','bg-pluie','skin-bauhaus',
          'skin-neon','skin-pixel','mat-grille','bg-skyline','sleeve-nebuleuse','sleeve-runes',
          'skin-cyber','sleeve-holo','sleeve-obsidienne',
          'bg-vapor','sleeve-inferno','sleeve-orage',
          'sleeve-or','sleeve-prisme','skin-spectre']
  },
  {
    id:'case-mystique', name:'Caisse Mystique', price:1500, cls:'case-c3', icon:'🔮',
    desc:'Velours, nébuleuses et pétales. Les pièces les plus rares y dorment.',
    pool:['sleeve-ivy','mat-bordeaux','bg-foret','sleeve-origami',
          'sleeve-encre','mat-ocean','skin-givre','mat-cuir',
          'sleeve-mandala','sleeve-nebuleuse','bg-galaxie','skin-sakura','skin-botanik',
          'sleeve-runes','bg-abysse','mat-marbre',
          'mat-velours','bg-sakura','sleeve-dragon','skin-cyber','sleeve-obsidienne','bg-braise',
          'mat-lave','skin-royal','sleeve-orage',
          'sleeve-or','skin-spectre','bg-eclipse']
  },
  {
    id:'case-prestige', name:'Caisse Prestige', price:3200, cls:'case-c4', icon:'👑',
    desc:'Contenu haut de gamme uniquement. Meilleures chances de Légendaire.',
    pool:['skin-mono','mat-chene',
          'sleeve-circuit','bg-aurore','mat-ocean','skin-bauhaus',
          'skin-neon','sleeve-nebuleuse','mat-grille','bg-skyline','skin-pixel','mat-marbre','bg-abysse',
          'sleeve-dragon','sleeve-holo','skin-cyber','mat-velours','bg-sakura','sleeve-obsidienne','bg-braise',
          'skin-royal','mat-lave','bg-vapor','sleeve-inferno','sleeve-orage',
          'sleeve-or','sleeve-prisme','skin-spectre','mat-aurum','bg-eclipse'],
    boost:2.6
  }
];

/* Économie */
var ECON = {
  start: 900,
  winBase: 260,
  perFoundationCard: 3,
  timeBonusMax: 220,
  comboCoin: 6,
  firstWinDaily: 150
};
