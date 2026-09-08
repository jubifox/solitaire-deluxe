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

### Le « juice » (animations)
- **Cartes** : distribution en cloche carte par carte, tout déplacement suit un arc avec
  rotation et changement d'échelle, retournement 3D avec éclat, oscillation permanente,
  survol qui soulève et incline en 3D, **reflet spéculaire qui suit le curseur** sur la carte,
  écrasement/étirement à l'atterrissage, secousse de refus, inclinaison selon la vitesse de glissement.
- **Décor** : **parallaxe** du fond et du tapis à la souris, particules d'ambiance propres au fond
  (pétales, poussière, étoiles), vignette qui chauffe, aura animée autour du dos quand un dos
  Mythique ou mieux est équipé.
- **Retour d'action** : étincelles, anneaux d'énergie, popups de score, compteurs qui roulent,
  **compteur d'enchaînement** qui monte et déforme le plateau, secousses d'écran progressives
  (3 intensités), flashs, onde au clic sur les boutons.
- **Victoire** : confettis, feux d'artifice et **cascade de cartes rebondissantes** avec physique.

Trois niveaux d'intensité : **Sobre / Normal / Max** (Options).

Tous les sons sont **synthétisés à la volée** (Web Audio) : zéro fichier audio.

### Les cosmétiques — 36 pièces
| Type | Nombre | Exemples |
|---|---|---|
| Dos de cartes | 12 | Damier Azur, Nébuleuse, Écailles de Dragon, Holo Prisme, Inferno, Feuille d'Or |
| Jeux de cartes | 8 | Papier Vintage, Givre, Néon Nocturne, Sakura, Cyberdeck, Or Royal |
| Tapis | 8 | Feutre Vert, Chêne Massif, Grille Néon, Velours Royal, Coulée de Lave |
| Fonds | 8 | Aurore Boréale, Skyline Néon, Voie Lactée, Pluie de Pétales, Vaporwave |

Tout est dessiné en CSS pur (dégradés, motifs, animations) : **aucune image, aucune police externe**.

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
│  ├─ cards.css               # rendu des cartes (faces, pips, dos)
│  ├─ cosmetics.css           # les 36 cosmétiques
│  ├─ case.css                # caisses et roulette
│  └─ juice.css               # toutes les animations de feedback
├─ js/
│  ├─ data.js                 # raretés, items, caisses, économie
│  ├─ store.js                # sauvegarde locale + export/import
│  ├─ sfx.js                  # sons synthétisés (Web Audio)
│  ├─ fx.js                   # particules, secousses, flashs, ambiance
│  ├─ klondike.js             # règles du jeu (pur, testable)
│  ├─ ui.js                   # plateau, glisser-déposer, animations
│  ├─ cases.js                # ouverture de caisses
│  └─ app.js                  # assemblage, onglets, options
├─ Lancer-Solitaire.bat
├─ Lancer-Serveur-Local.bat
└─ README.md
```

## Licence

MIT — voir [LICENSE](LICENSE).
