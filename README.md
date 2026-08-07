# Géo Quiz

Entraînement aux drapeaux, capitales et emplacements des 194 pays du monde, filtrable par
continent.
React + Vite + Tailwind v4 + shadcn/ui.

```bash
npm install
npm run dev
```

## Quatre modes

| Mode | Question | Réponse |
| --- | --- | --- |
| **Drapeaux** | un drapeau | le nom du pays, au clavier |
| **Capitales** | un pays (nom + drapeau) | sa capitale, au clavier |
| **Placer sur la carte** | un nom de pays | un clic sur la carte |
| **Pays en surbrillance** | un pays surligné sur la carte | son nom, au clavier |

Chaque mode se restreint à un continent (Afrique, Amérique du Nord, Amérique du Sud, Asie,
Europe, Océanie) ou couvre le monde entier, sur 10, 20, 50 questions ou la totalité du
périmètre. Le meilleur score est conservé par couple mode + continent dans `localStorage`.

Les modes au clavier s'enchaînent sans la souris : Entrée valide, Entrée passe à la suite.

## Correction tolérante

La réponse est saisie librement, et une orthographe approchante est acceptée
([src/lib/answer.ts](src/lib/answer.ts)) :

1. **Normalisation** — minuscules, accents, ponctuation, articles et espaces retirés.
   `N'Djaména` = `ndjamena`, `Le Caire` = `caire`.
2. **Lever d'ambiguïté** — une réponse qui désigne exactement un *autre* pays est refusée
   d'emblée : `gambie` ne passe pas pour la Zambie, `niger` ne passe pas pour le Nigéria,
   `coree du sud` ne passe pas pour la Corée du Nord.
3. **Troncature** — une abréviation de 5 caractères ou plus qui ne tronque qu'un seul pays
   est acceptée : `bosnie`, `papouasie`, `arabie`, `emirats`, `trinite`, `antigua`.
   `coree`, `saint` et `republique` en tronquent plusieurs : refusés.
4. **Distance d'édition** — 1 faute tolérée jusqu'à 7 caractères, 2 jusqu'à 12, 3 au-delà,
   et toujours sous réserve de la règle 2. `afganistan`, `helsinky`, `bengladesh` passent.

### Raccourcis acceptés

- **Codes ISO** alpha-2 et alpha-3, ajoutés automatiquement pour les 194 pays :
  `us`, `usa`, `gb`, `gbr`, `nz`, `png`, `deu`… (mode Drapeaux uniquement — un code désigne
  le pays, pas sa capitale). Seuls `DE` et `LA` restent inertes : ce sont aussi des articles
  français, que la normalisation retire.
- **Abréviations d'usage** déclarées à la main : `RDC`, `RCA`, `EAU`/`UAE`, `UK`,
  `Angleterre`, `Hollande`, `Myanmar`, `Swaziland`, `Zaïre`, `Türkiye`…
- **Exonymes de capitales** : `Beijing`/`Pékin`, `Kyiv`/`Kiev`, `Le Cap`, `Delhi`,
  `Dar es Salaam`, `Washington DC`…

En revanche `rome` est refusé pour le Vatican : c'est la capitale de l'Italie.
Pour ajouter un raccourci, voir [Données](#données) ci-dessous.

## Erreurs identifiées

Quand la réponse est fausse, l'app cherche ce qu'elle désignait réellement et l'affiche
(`identify()` dans [src/lib/quiz.ts](src/lib/quiz.ts)).

En **mode Drapeaux**, les deux drapeaux remplacent la question et se présentent côte à côte,
à hauteur de cadre égale pour être comparés — répondre `france` au drapeau britannique
affiche 🇬🇧 *Royaume-Uni · la réponse* à gauche et 🇫🇷 *France · ta réponse* à droite. Faute
de pays identifié, le grand drapeau seul reste en place.

En **mode Capitales**, la question n'est pas un drapeau : le retour cite la capitale
reconnue et le pays qu'elle dessert, drapeau à la même taille que celui de la question —
`vienne` pour la Suisse donne « **Vienne** est la capitale de : 🇦🇹 Autriche ».

Le récapitulatif final reprend le drapeau identifié à côté de chaque réponse barrée.

Deux garde-fous, pour ne pas raconter n'importe quoi :

- **Une faute de frappe reste une faute de frappe.** L'identification n'a lieu que si la
  saisie est *strictement* plus proche d'un autre pays que de la réponse attendue.
  `mozambic` est à égale distance de Mozambique et de Zambie : rien n'est affirmé.
- **Aucune conjecture en cas d'égalité** entre deux pays, ni face à une saisie qui ne
  ressemble à aucun d'eux.

```bash
npm test          # 114 tests, dont la validation de tout le jeu de données
```

## La carte

[src/components/WorldMap.tsx](src/components/WorldMap.tsx) rend un SVG dont les chemins sont
**projetés à la génération** (projection Natural Earth) : le navigateur ne reçoit que des
chaînes `d`, sans `d3-geo` ni `topojson` dans le bundle.

**Zoom et déplacement.** Molette, pincement à deux doigts, glissé, et trois boutons
(zoomer / dézoomer / recadrer), jusqu'à ×24. Tout passe par le `viewBox` : le tracé reste
vectoriel à n'importe quel grossissement et les bordures gardent leur épaisseur à l'écran
(`vector-effect="non-scaling-stroke"`). Sans zoom, le Luxembourg mesure 1×2 px en vue monde —
introuvable et inclickable ; à ×24 il fait 32×48 px.

Trois détails d'implémentation valent d'être connus :

- Le zoom est **ancré sous le curseur** : le point visé ne bouge pas. Après bornage, le
  recentrage suit le facteur *effectivement* appliqué, sans quoi la carte dériverait en butée.
- La sélection se résout au **`pointerup`, par la position du pointeur** (`countryAt`), et non
  par un `onClick` sur chaque tracé : la capture de pointeur, nécessaire au glissé, réachemine
  les événements souris vers l'élément capteur — le `<svg>` — si bien que le `click` n'atteint
  jamais le `<path>` visé et qu'aucun pays n'était plus cliquable.
- Un **glissé ou un pincement qui s'achève sur un pays n'est pas un clic** (seuil de 4 px),
  sinon déplacer la carte répondrait à la question.
- Le déplacement est borné pour que la vue reste **entièrement dans le tracé** : au dézoom
  maximal la marge tombe à zéro et le glissé se bloque de lui-même.
- Le listener de molette est **natif et non passif** : un `onWheel` React ne peut pas empêcher
  le défilement de la page, et la molette zoomerait *et* ferait défiler. De même,
  `touch-action: none` évite qu'un glissé au doigt fasse défiler la page.

Le cadrage repart de zéro à chaque question : rester zoomé sur l'Europe alors que la question
suivante porte sur le Brésil donnerait l'impression que le pays est introuvable.

Quatre points de données et de lisibilité méritent aussi une explication.

**165 pays sur 194.** Natural Earth 110m ne trace pas les 29 micro-États insulaires (Malte,
Singapour, Monaco, Vatican, Nauru…). Les modes carte les écartent — les surligner ou les
cliquer serait impossible de toute façon — et l'écran de réglages l'annonce.

**Cadrages posés à la main.** Les fenêtres par continent sont déclarées en longitude/latitude
dans le générateur, et non déduites de l'emprise des pays : la Russie étirerait l'Europe sur
tout l'hémisphère nord, la Guyane rattacherait la France à l'Amérique du Sud, et les Fidji
font franchir l'antiméridien à l'Océanie. Le cadrage d'un continent est un choix de lecture.

**Contraste des frontières.** `--border` étant presque de la couleur de `--muted`, les
frontières n'offraient qu'un contraste de 1,16:1 — autant dire aucune. Le tracé dérive
désormais de `--muted-foreground`, à 3,3:1 en thème clair et 3,0:1 en sombre (mesuré au
canvas, composition alpha comprise), pour 0,9 px d'épaisseur à l'écran quel que soit le zoom.

**Cerclage des pays minuscules.** Même avec le zoom, il faut d'abord *trouver* le pays
surligné. En deçà de 1,3 % de la largeur affichée, il est donc cerclé. Le seuil étant relatif
au cadrage courant, zoomer fait disparaître les cercles devenus inutiles.

Deux subtilités sur ces cercles :

- La taille se mesure à l'**aire dessinée**, pas à la boîte englobante. Les Fidji et la Russie
  franchissant l'antiméridien, leur boîte couvre toute la largeur de la carte, ce qui ferait
  passer les Fidji pour un pays immense.
- Le centre est celui de la **partie la plus étendue** du pays, pas celui de l'ensemble. Pour
  les Fidji, dont les deux moitiés se retrouvent aux bords opposés de la carte, un centre
  pondéré tombait à 37 unités de toute terre — le cercle désignait le Pacifique. Un test
  vérifie que chaque cercle tombe sur les terres de son pays.

## Données

[src/data/countries.ts](src/data/countries.ts) et [src/data/map.ts](src/data/map.ts) sont
**générés** — ne pas les éditer à la main :

```bash
npm run gen:countries && npm run gen:map
```

[scripts/generate-countries.mjs](scripts/generate-countries.mjs) part du paquet
`world-countries` (membres de l'ONU uniquement) et y applique les corrections françaises :
les capitales n'y figurent qu'en anglais, et quelques traductions sont datées. C'est là
qu'on ajoute une capitale, un alias ou un pays.

[scripts/generate-map.mjs](scripts/generate-map.mjs) part de `world-atlas` (Natural Earth
110m) et joint les pays sur leur code ISO numérique. C'est là qu'on retouche une fenêtre de
cadrage ou la précision des tracés.

Les drapeaux sont servis par [flagcdn.com](https://flagcdn.com) d'après le code ISO 3166-1
alpha-2 — une connexion est donc nécessaire ; à défaut le code pays s'affiche en repli. La
carte, elle, est entièrement locale.
