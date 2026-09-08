# Solitaire Deluxe — Portable

Un Klondike (solitaire) **100 % offline, 100 % portable** : aucune installation, aucune dépendance,
aucun accès réseau. Un dossier, un double-clic, ça marche.

Animations partout, cosmétiques à collectionner (dos de cartes, jeux de cartes, tapis, fonds)
et **ouverture de caisses façon CS:GO** avec raretés, roulette, ticker et doublons revendus.

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

### Le « juice » (animations)
Distribution carte par carte, retournement 3D, oscillation permanente des cartes,
survol avec inclinaison et halo, écrasement/étirement à l'atterrissage, secousse de refus,
étincelles, anneaux d'énergie, popups de score, **compteur d'enchaînement** qui monte,
secousses d'écran progressives, flashs, vignette réactive, particules d'ambiance selon le fond,
confettis, feux d'artifice et **cascade de cartes rebondissantes** à la victoire.
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

## Publier sur GitHub

Le dépôt est déjà initialisé et committé localement. Pour l'envoyer :

```bash
git remote add origin https://github.com/<votre-compte>/solitaire-deluxe.git
git branch -M main
git push -u origin main
```

Le jeu étant purement statique, **GitHub Pages** le sert tel quel :
`Settings → Pages → Branch: main / root`.

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
