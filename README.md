# Géo Quiz

Entraînement aux drapeaux, capitales et emplacements des 194 pays du monde, filtrable par
continent — en solo, au défi du jour, ou à plusieurs dans un salon. Habillage « passeport » :
chaque bonne réponse tamponne un pays dans le carnet.

Next.js 16 (App Router) + Convex + Tailwind v4, connexion Google facultative via Convex Auth —
la même pile que pokefight (ADR-0004).

```bash
pnpm install
npx convex dev --once   # pousse les fonctions Convex et vérifie leurs types
pnpm dev                # http://localhost:3000
pnpm test               # tests unitaires (node --test) de lib/
```

## Disposition

```
app/          les pages (App Router) : /, /solo, /defi, /salon, /salon/[code], /carnet
components/   le rendu ; components/ui.tsx porte les briques du thème
lib/          logique pure, importée par le navigateur ET par Convex, testée sans serveur
data/         pays et carte, générés par tools/
convex/       le backend : salons, présence, passeports, authentification
tools/        les générateurs de data/
```

Le code de `lib/` n'emploie **aucun** alias : ses imports sont relatifs avec extension `.ts`
explicite, seule forme qu'acceptent à la fois Next, Convex et `node --test` (qui retire les
types sans résoudre les extensions).

`convex/` est exclu du typage de Next : `convex/_generated/` n'existe qu'une fois un déploiement
configuré, et c'est `npx convex dev --once` qui vérifie ce dossier.

Le **solo ne parle jamais au serveur** pour un invité : une fois la page chargée, il fonctionne
hors ligne, passeport compris.

## Multijoueur

Un joueur crée un **salon**, partage son code à 4 caractères ou son lien, et les autres le
rejoignent avec un pseudonyme. Tous affrontent **la même manche au même instant** ; une bonne
réponse rapporte d'autant plus qu'elle arrive tôt.

Le **serveur est seul juge** : le client envoie la saisie brute, Convex corrige en réutilisant
la correction du solo, tient l'horloge et clôt les manches. Le client n'applique aucune règle — il
affiche la vue qu'on lui donne.

- **Moteur** — [lib/room.ts](lib/room.ts), réducteur pur
  `(état, événement, maintenant) → { état, effets }`. Ni horloge, ni aléatoire, ni réseau : c'est
  ce qui rend les tests de [room.test.ts](lib/room.test.ts) possibles sans démarrer l'application
  ni attendre un délai réel.
- **Adaptateur** — [convex/rooms.ts](convex/rooms.ts) : chaque mutation lit le salon (un seul
  document), le réduit, le réécrit, et programme le réveil qui clôt une manche à son échéance
  (`ctx.scheduler.runAt`). Un réveil que le salon n'attend plus ne fait rien à son arrivée.
- **Transport** — aucun code : `rooms.view` est une requête réactive, chaque joueur reçoit sa
  vue dès que le salon change.

Deux points d'implémentation à connaître :

- **Présence par battement.** Il n'y a plus de connexion dont la fermeture signale un départ :
  chaque page de salon appelle `rooms.heartbeat` toutes les 5 s, dans une table à part pour ne
  pas rafraîchir tout le monde. Un joueur muet depuis 15 s est marqué absent (ce qui peut clore
  la manche qu'il retenait) ; un salon que personne n'a touché depuis 30 min est supprimé par
  la tâche planifiée de [convex/crons.ts](convex/crons.ts).
- **Le jeton est l'autorité.** Il vit dans le stockage local et accompagne chaque mutation ;
  deux joueurs ne peuvent donc pas partager un même profil de navigateur.

## Passeport

Le solo et le défi du jour alimentent un **passeport** ([lib/progress.ts](lib/progress.ts)) ; une
partie multijoueur n'y verse rien (ADR-0005).

- **Points et combo** — en solo, une bonne réponse vaut de 1 000 à 200 points selon le temps mis
  (sur 15 s, sans échéance), multipliés par le combo : ×1,5 dès 3 bonnes réponses d'affilée, ×2
  dès 6, ×3 dès 10. Une erreur le remet à zéro.
- **Miles et niveaux** — les points d'une partie, divisés par dix. Le niveau *n* demande
  250·n·(n−1) miles ; chaque tranche porte un grade, de Touriste à Globe-trotter.
- **Tampons et médailles** — un pays trouvé dans un mode est tamponné une fois pour toutes. Un
  continent rapporte bronze, argent ou or à 25 %, 60 % et 100 % de ses pays tamponnés.
- **Défi du jour** — dix questions de tous les modes, tirées d'une graine dérivée de la date UTC
  ([lib/daily.ts](lib/daily.ts)) : identiques pour tous, jouables hors ligne, comptées une fois.
  Chaque jour d'affilée ajoute 10 % aux miles du défi, jusqu'au double.
- **Records** — le meilleur pourcentage par mode et continent, comme avant ; les records
  enregistrés par l'ancienne version sont repris au premier chargement.

Le passeport d'un invité vit dans `localStorage` ; à la première connexion Google il est fusionné
dans le compte, puis oublié du navigateur.

## Cinq modes

| Mode | Question | Réponse |
| --- | --- | --- |
| **Drapeaux** | un drapeau | le nom du pays, au clavier |
| **Capitales** | un pays (nom + drapeau) | sa capitale, au clavier |
| **Capitales inversées** | une capitale, seule | le pays, au clavier |
| **Placer sur la carte** | un nom de pays | un clic sur la carte |
| **Pays en surbrillance** | un pays surligné sur la carte | son nom, au clavier |

Les deux modes Capitales forment une paire autour de la même donnée, dans les deux sens.
Le mode inversé n'affiche aucun drapeau avant la réponse — il donnerait le pays.

Chaque mode se restreint à un continent (Afrique, Amérique du Nord, Amérique du Sud, Asie,
Europe, Océanie) ou couvre le monde entier, sur 10, 20, 50 questions ou la totalité du
périmètre. Le meilleur score est conservé par couple mode + continent dans le passeport.

En solo, la série s'enchaîne sans la souris : Entrée valide, puis **Entrée ou Espace** passe à la
question suivante — y compris dans les modes carte, où l'on répond à la souris mais où l'on
enchaîne au clavier. Pendant la saisie, Espace reste un espace : les réponses en contiennent
(« Corée du Sud »).

## Correction tolérante

La réponse est saisie librement, et une orthographe approchante est acceptée
([lib/answer.ts](lib/answer.ts)) :

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
  `us`, `usa`, `gb`, `gbr`, `nz`, `png`, `deu`… (dans les modes qui demandent le pays — un
  code désigne le pays, pas sa capitale). Seuls `DE` et `LA` restent inertes : ce sont aussi
  des articles français, que la normalisation retire.
- **Abréviations d'usage** déclarées à la main : `RDC`, `RCA`, `EAU`/`UAE`, `UK`,
  `Angleterre`, `Hollande`, `Myanmar`, `Swaziland`, `Zaïre`, `Türkiye`…
- **Exonymes de capitales** : `Beijing`/`Pékin`, `Kyiv`/`Kiev`, `Le Cap`, `Delhi`,
  `Dar es Salaam`, `Washington DC`…

En revanche `rome` est refusé pour le Vatican : c'est la capitale de l'Italie.
Pour ajouter un raccourci, voir [Données](#données) ci-dessous.

## Erreurs identifiées

Quand la réponse est fausse, l'app cherche ce qu'elle désignait réellement et l'affiche
(`identify()` dans [lib/quiz.ts](lib/quiz.ts)).

En **mode Drapeaux**, les deux drapeaux remplacent la question et se présentent côte à côte,
à hauteur de cadre égale pour être comparés — répondre `france` au drapeau britannique
affiche 🇬🇧 *Royaume-Uni · la réponse* à gauche et 🇫🇷 *France · ta réponse* à droite. Faute
de pays identifié, le grand drapeau seul reste en place.

En **mode Capitales**, la question n'est pas un drapeau : le retour cite la capitale
reconnue et le pays qu'elle dessert, drapeau à la même taille que celui de la question —
`vienne` pour la Suisse donne « **Vienne** est la capitale de : 🇦🇹 Autriche ».

En **mode Capitales inversées**, la réponse est un pays : les deux drapeaux se mettent en
regard comme en mode Drapeaux — `papouasie nouvelle guinee` pour Suva affiche 🇫🇯 *Fidji ·
la réponse* et 🇵🇬 *Papouasie-Nouvelle-Guinée · ta réponse*. Sans pays identifié, le drapeau
attendu apparaît seul : c'est la première fois qu'on le voit dans ce mode.

Le récapitulatif final reprend le drapeau identifié à côté de chaque réponse barrée.

Deux garde-fous, pour ne pas raconter n'importe quoi :

- **Une faute de frappe reste une faute de frappe.** L'identification n'a lieu que si la
  saisie est *strictement* plus proche d'un autre pays que de la réponse attendue.
  `mozambic` est à égale distance de Mozambique et de Zambie : rien n'est affirmé.
- **Aucune conjecture en cas d'égalité** entre deux pays, ni face à une saisie qui ne
  ressemble à aucun d'eux.

```bash
pnpm test         # dont la validation de tout le jeu de données
```

## La carte

[components/WorldMap.tsx](components/WorldMap.tsx) rend un SVG dont les chemins sont
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

**Contraste des frontières.** Une frontière de la couleur du papier ne se verrait pas : le
tracé est à l'encre adoucie (`--ink-soft`), pour viser le 3:1 d'un élément graphique porteur de
sens, et 0,9 px d'épaisseur à l'écran quel que soit le zoom.

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

[data/countries.ts](data/countries.ts) et [data/map.ts](data/map.ts) sont
**générés** — ne pas les éditer à la main :

```bash
pnpm data
```

[tools/generate-countries.mjs](tools/generate-countries.mjs) part du paquet
`world-countries` (membres de l'ONU uniquement) et y applique les corrections françaises :
les capitales n'y figurent qu'en anglais, et quelques traductions sont datées. C'est là
qu'on ajoute une capitale, un alias ou un pays.

[tools/generate-map.mjs](tools/generate-map.mjs) part de `world-atlas` (Natural Earth
110m) et joint les pays sur leur code ISO numérique. C'est là qu'on retouche une fenêtre de
cadrage ou la précision des tracés.

Les drapeaux sont servis par [flagcdn.com](https://flagcdn.com) d'après le code ISO 3166-1
alpha-2 — une connexion est donc nécessaire ; à défaut le code pays s'affiche en repli. La
carte, elle, est entièrement locale.

## Convex

```bash
npx convex dev --once   # pousse les fonctions et vérifie leurs types, sans surveiller
pnpm test:room          # un salon de bout en bout contre le déploiement (~40 s)
```

Préférer `--once` : la limite de surveillance inotify de cette machine (65 536) fait tomber les
observateurs, de `npx convex dev` comme de `next dev`, avec `ENOSPC`. Pour la relever (root) :

```bash
echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/60-inotify.conf && sudo sysctl --system
```

En attendant, `pnpm build && pnpm start` remplace `pnpm dev`.

## Connexion Google

Convex Auth, Google pour seul fournisseur. Se connecter n'est jamais requis. Les identifiants
sont lus par **le runtime Convex**, pas par Next : ils vont sur le déploiement, jamais dans
`.env.local` ni dans Vercel.

```bash
npx convex env set AUTH_GOOGLE_ID     <client-id>
npx convex env set AUTH_GOOGLE_SECRET <client-secret>
```

`SITE_URL` (http://localhost:3000 en dev), `JWT_PRIVATE_KEY` et `JWKS` sont déjà posés sur le
déploiement de dev. Dans Google Cloud Console (APIs & Services → Credentials → OAuth client ID →
Web application), l'URI de redirection autorisée est l'URL **HTTP actions** du déploiement — la
`.convex.site`, pas la `.convex.cloud` :

```
https://<deployment>.convex.site/api/auth/callback/google
```

## Déployer sur Vercel

**Variables du projet Vercel** : `CONVEX_DEPLOY_KEY` (tableau de bord Convex → Settings →
Deploy keys). `NEXT_PUBLIC_CONVEX_URL` n'est pas nécessaire : `convex deploy` l'injecte.

**Commande de build** (déjà dans `vercel.json`) : `npx convex deploy --cmd 'pnpm build'`.

**Déploiement Convex de production** (`npx convex env set --prod`) : `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET`, `SITE_URL` (le domaine Vercel — une valeur périmée casse la connexion sans
bruit), puis `JWT_PRIVATE_KEY` et `JWKS` via `npx @convex-dev/auth --prod`.
