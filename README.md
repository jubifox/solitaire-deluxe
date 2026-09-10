# Solitaire Deluxe — Portable

Un Klondike (solitaire) **100 % offline, 100 % portable** : aucune installation, aucune dépendance,
aucun accès réseau. Un dossier, un double-clic, ça marche.

Animations partout, cosmétiques à collectionner (dos de cartes, jeux de cartes, tapis, fonds)
et **ouverture de caisses façon CS:GO** avec raretés, roulette, ticker et doublons revendus.

**▶ Jouer tout de suite : <https://jubifox.github.io/solitaire-deluxe/>**
· Télécharger : [ZIP du dépôt](https://github.com/jubifox/solitaire-deluxe/archive/refs/heads/main.zip)

---

## Lancer le jeu

**Windows** : double-clic sur `Lancer-Solitaire.bat` (ou directement sur `index.html`).

**Autre OS / autre machine** : ouvrez `index.html` dans un navigateur récent
(Chrome, Edge, Firefox, Brave…). C'est tout.

> Le jeu fonctionne en `file://` : pas de serveur, pas de build, pas de `npm install`.
> Si votre navigateur bloque le stockage local en `file://`, lancez un mini serveur :
> `python -m http.server 8777` puis ouvrez <http://127.0.0.1:8777>.
> Un raccourci est fourni : `Lancer-Serveur-Local.bat`.

---

## Contenu

### Le jeu
- Klondike complet : pioche **1 ou 3 cartes**, fondations, colonnes, recyclage du talon.
- **Glisser-déposer** avec inclinaison, traînée de particules et surbrillance de la cible.
- **Clic simple** = déplacement automatique intelligent (fondation en priorité).
- Annuler illimité, **indice**, **auto-complétion**, rejouer la même donne (numéro de donne affiché).
- Score type Klondike, chrono, compteur de coups.

### Mode Conjonction — densité stratégique
Un second mode (actif par défaut, désactivable dans les Options) qui densifie la prise de décision
**sans aucune progression entre parties** : tout est remis à zéro à chaque donne.

- **Élan** — ressource gagnée en construisant (1 toutes les 4 cartes de fondation, 1 par nouvelle suite
  ordonnée, 2 par colonne vidée), plafonnée à 8 pour que le surplus soit perdu et pousse à dépenser.
  Quatre dépenses : **Vision** (voir les 3 prochaines cartes, savoir conservé), **Ordre** (permuter
  les deux prochaines), **Gel** (mettre une carte de côté et la réinjecter au bon moment),
  **Licence** (la prochaine pose ignore la couleur).
- **Conjonction** — les 3 dernières cartes révélées forment un motif : trois rangs consécutifs (×3),
  trois figures (×4), trois fois le même rang (×6), trois figures du même rang (×8). L'événement est
  **préparable** avec Vision / Ordre / Gel : c'est là que se joue la planification.
  Il ouvre une fenêtre de 3 à 5 coups avec une règle temporaire au choix :
  **Flux libre** (couleurs ignorées), **Ascension** (une carte enfouie part directement en fondation),
  **Surcharge** (multiplicateur de score décuplé).
- **Interactions spatiales** — **Résonance** (deux colonnes voisines de rangs consécutifs : la prochaine
  suite rapporte le double) et **colonne lourde** (≥ 11 cartes : déplacer un *groupe* coûte 1 Élan ;
  déplacer une carte seule reste toujours gratuit, donc aucun blocage n'est possible).
- **Objectifs concurrents** — deux objectifs tirés en début de partie, filtrés pour ne jamais se
  contredire, visibles en permanence, payés en pièces à la victoire.
- **Chaînes** — chaque nouvelle suite ordonnée augmente le multiplicateur (+0.1 à +0.3, plafond ×3).

Mesuré sur 250 parties simulées : **3,1 conjonctions par partie**, 15 % de parties sans aucune,
6 Élan gagnés par partie pour un plafond de 8 — chaque dépense reste un arbitrage.

### Lisibilité et rendu des cartes
Les cartes sont entièrement redessinées en **vectoriel** (SVG inline + CSS), sans aucune image :
les enseignes ♠ ♥ ♦ ♣ sont des tracés maison, nettes à toute taille, identiques d'un navigateur
à l'autre — plus de glyphes Unicode qui changent de forme selon la police du système.

- **Index géant et toujours visible** : la valeur et l'enseigne sont posées **à l'horizontale**
  en haut de carte. L'étalement des colonnes est calé exactement sur la hauteur de cet index,
  donc une carte recouverte montre sa valeur **en entier** — même sur une colonne de treize cartes.
- **Taille de carte adaptative** : la largeur des cartes est recalculée en continu pour que la
  colonne la plus longue tienne à l'écran sans écraser les valeurs. Quand la place manque, ce sont
  d'abord les cartes **face cachée** qui se resserrent, jamais les valeurs qu'on doit lire.
- **Trois niveaux de lisibilité** (Options → *Lisibilité des cartes*) : Standard / Grand / Géant.
  Le plateau se réorganise pour rester lisible dans les trois cas.
- **Jeu à 4 couleurs** (Options) : ♠ noir, ♥ rouge, ♦ **bleu**, ♣ **vert** — on distingue
  l'enseigne d'un coup d'œil, sans lire le symbole.
- **Figures dessinées** : valet à la toque emplumée, dame au diadème, roi couronné et barbu,
  en cartouche miroir encadré de deux enseignes ornementales.
- **As** ornés d'une enseigne centrale sur rosace, **dos** avec médaillon guilloché,
  **emplacements vides** gravés au filigrane de leur enseigne, feutre à surpiqûre.
- Chaque jeu de cartes définit sa propre encre par enseigne, sa teinte de papier et son cadre :
  les 8 jeux restent lisibles, y compris les jeux sombres (Néon Nocturne, Cyberdeck).

### Le « juice » (animations)
- **Cartes** : distribution en cloche carte par carte, tout déplacement suit un arc avec
  rotation et changement d'échelle, retournement 3D avec éclat, oscillation permanente,
  survol qui soulève et incline en 3D, **reflet spéculaire qui suit le curseur** sur la carte,
  écrasement/étirement à l'atterrissage, secousse de refus, inclinaison selon la vitesse de glissement.
- **Décor** : **parallaxe** du fond et du tapis à la souris, particules d'ambiance propres au fond
  (pétales, poussière, étoiles), vignette qui chauffe, aura animée autour du dos quand un dos
  Mythique ou mieux est équipé.
- **Retour d'action** : étincelles, anneaux d'énergie, **ondes de choc**, **faisceaux de lumière**
  qui relient la carte à sa fondation, **particules en forme d'enseigne** (♠ ♥ ♦ ♣) aux couleurs
  du symbole joué, popups de score, compteurs qui roulent, **compteur d'enchaînement** qui monte
  et déforme le plateau, secousses d'écran progressives (3 intensités), flashs,
  **balayages lumineux plein écran** et **pulsation chromatique** sur les gros enchaînements.
- **Chaleur du plateau** : la vignette s'embrase par paliers au fil de l'enchaînement et respire
  au-delà de x6.
- **Enseigne complète** : couronne de lumière sur la fondation, gerbe d'enseignes et fanfare.
- **Colonne vidée** : l'emplacement libéré souffle une onde verte.
- **Inclinaison 3D** : au survol, la carte s'incline en suivant réellement le curseur.
- **Victoire** : confettis, feux d'artifice, **pluie d'enseignes**, balayages arc-en-ciel et
  **cascade de cartes rebondissantes** avec physique.

Trois niveaux d'intensité : **Sobre / Normal / Max** (Options).

Tous les sons sont **synthétisés à la volée** (Web Audio) : zéro fichier audio.

### Fluidité — le jeu s'adapte à la machine
Un gouverneur (`js/perf.js`) mesure les images par seconde sur une fenêtre glissante et **ajuste
le niveau de détail en direct**, en trois paliers. Trois secondes de suite sous 40 fps et la
charge retombe ; après une accalmie franche elle remonte. Le démarrage est ignoré, et deux
retrogradations bloquent le plafond pour éviter tout va-et-vient.

| Palier | Ce qui tombe |
|---|---|
| 2 — plein | rien : ambiance complète, reflets au repos, inclinaison au curseur, `devicePixelRatio` jusqu'à 2 |
| 1 — normal | moitié des particules d'ambiance, un seul voile décoratif de fond, oscillation ralentie |
| 0 — éco | plus d'ambiance ni de voiles animés, grain et reflets coupés, canvas en 1× |

Ce qui a été optimisé au passage :
- **particules en pool préalloué** : plus aucune allocation ni `splice` pendant l'animation ;
- **effacement par zone sale** : le canvas n'efface que le rectangle réellement peint à la frame
  précédente, au lieu du plein écran à chaque image ;
- **l'aurore boréale n'anime plus un `filter: blur(48px)` plein écran** — des dégradés déjà flous
  par construction, animés en transformation seule, sur une couche promue ;
- **plus de `getBoundingClientRect` par mouvement de souris** : la position des cartes est déduite
  de la géométrie connue et d'un rect de plateau mis en cache ;
- **mise en pause complète** quand l'onglet passe en arrière-plan ;
- **`prefers-reduced-motion`** respecté : animations coupées, palier éco forcé.

Deux gros postes ont été mesurés puis débranchés du palier plein :
- le **flou d'arrière-plan** (`backdrop-filter`) de la barre du haut et du HUD — magnifique, mais il
  force le navigateur à re-flouter la zone dès qu'une carte bouge dessous : **−44 % d'images par
  seconde en pleine partie**. Il n'est actif qu'au palier plein ;
- le **canvas de particules**, plein écran : au palier éco il est masqué, les popups et le flash
  restant du DOM ordinaire.

Mesuré dans le conteneur de développement (rendu logiciel, sans GPU), au repos et sur une séquence
de 30 pioches identiques, médiane de trois exécutions :

| | au repos | en partie |
|---|---|---|
| avant | 17 i/s | 10 i/s |
| après | **59 i/s** | **33 i/s** |

La bascule est désactivable (Options → *Fluidité adaptative*), et cette même ligne affiche en
direct les images par seconde et le palier courant.

### Les cosmétiques — 56 pièces
| Type | Nombre | Exemples |
|---|---|---|
| Dos de cartes | 18 | Origami, Récif, Runes Anciennes, Écailles de Dragon, Obsidienne, Œil du Cyclone, Feuille d'Or, Prisme Liquide |
| Jeux de cartes | 13 | Ardoise & Craie, Bauhaus, Herbier, Pixel 8-bit, Cyberdeck, Or Royal, Spectre Holo |
| Tapis | 12 | Sable Chaud, Cuir Cognac, Marbre Veiné, Velours Royal, Coulée de Lave, Damas d'Or |
| Fonds | 13 | Dunes, Pluie de Néons, Abysse, Voie Lactée, Feu de Camp, Vaporwave, Éclipse |

Les pièces les plus rares sont **animées** : foil qui balaie la carte (Spectre Holo), prisme
en rotation (Prisme Liquide), tourbillon (Œil du Cyclone), moire dorée (Damas d'Or),
couronne solaire (Éclipse). Chaque fond a sa propre ambiance de particules — pétales, braises,
bulles, spores, pluie, voiles de sable.

Tout est dessiné en CSS et SVG (dégradés, motifs, tracés, animations) :
**aucune image, aucune police externe**.

### Les caisses
4 caisses (Découverte, Néon, Mystique, Prestige) avec des probabilités inspirées de CS:GO :

| Rareté | Chance de base |
|---|---|
| Commun | 79,92 % |
| Peu commun | 15,98 % |
| Rare | 3,20 % |
| Mythique | 0,64 % |
| Légendaire | 0,26 % |
| Exotique | 0,05 % |

Roulette horizontale, ticks sonores, ralentissement progressif, glow de rareté, révélation.
Un doublon est automatiquement revendu (30 à 2 600 pièces selon la rareté).

**Pièces** : gagnées en terminant une partie (base + bonus de rapidité, ×1,25 en pioche 3)
et via les enchaînements de cartes envoyées aux fondations.

---

## Raccourcis clavier

| Touche | Action |
|---|---|
| `Espace` | Piocher |
| `Ctrl + Z` | Annuler |
| `H` | Indice |
| `A` | Auto-complétion |
| `Échap` | Fermer une fenêtre |

---

## Sauvegarde

La progression (pièces, collection, équipement, statistiques) est stockée dans le
`localStorage` du navigateur. Pour la déplacer d'une machine à l'autre :
**Options → Exporter** produit un `solitaire-deluxe-save.json`, **Importer** le relit.

---

## Dépôt et publication

Le dépôt est <https://github.com/jubifox/solitaire-deluxe> (branche `main`), et **GitHub Pages**
sert le jeu tel quel depuis la racine : <https://jubifox.github.io/solitaire-deluxe/>.

Pour récupérer le jeu sur une autre machine :

```bash
git clone https://github.com/jubifox/solitaire-deluxe.git
```

Puis ouvrir `index.html`. Pour publier des modifications : `git add -A && git commit -m "..." && git push`
— Pages se reconstruit tout seul en une minute.

---

## Structure

```
Solitaire-Deluxe/
├─ index.html                 # structure de l'application
├─ css/
│  ├─ base.css                # interface, barres, fenêtres
│  ├─ cards.css               # rendu des cartes (index, enseignes, figures, dos)
│  ├─ cosmetics.css           # les 36 cosmétiques
│  ├─ case.css                # caisses et roulette
│  └─ juice.css               # toutes les animations de feedback
├─ js/
│  ├─ perf.js                 # gouverneur de fluidité (FPS, paliers de détail)
│  ├─ data.js                 # raretés, items, caisses, économie
│  ├─ store.js                # sauvegarde locale + export/import
│  ├─ sfx.js                  # sons synthétisés (Web Audio)
│  ├─ fx.js                   # particules (pool), ondes, faisceaux, ambiance
│  ├─ klondike.js             # règles du jeu (pur, testable)
│  ├─ cardart.js              # enseignes SVG, faces, figures, dos
│  ├─ dense.js                # mode Conjonction (règles)
│  ├─ ui.js                   # plateau, géométrie adaptative, glisser-déposer
│  ├─ denseui.js              # bandeau et fenêtres du mode Conjonction
│  ├─ cases.js                # ouverture de caisses
│  └─ app.js                  # assemblage, onglets, options
├─ Lancer-Solitaire.bat
├─ Lancer-Serveur-Local.bat
└─ README.md
```

## Licence

MIT — voir [LICENSE](LICENSE).
