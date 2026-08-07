# Géo Quiz

Entraînement aux drapeaux et aux capitales des 194 pays du monde, filtrable par continent.
React + Vite + Tailwind v4 + shadcn/ui.

```bash
npm install
npm run dev
```

## Deux modes

| Mode | Question | Réponse attendue |
| --- | --- | --- |
| **Drapeaux** | un drapeau | le nom du pays |
| **Capitales** | un pays (nom + drapeau) | sa capitale |

Chaque mode se restreint à un continent (Afrique, Amérique du Nord, Amérique du Sud, Asie,
Europe, Océanie) ou couvre le monde entier, sur 10, 20, 50 questions ou la totalité du
périmètre. Le meilleur score est conservé par couple mode + continent dans `localStorage`.

La série s'enchaîne au clavier : Entrée valide, Entrée passe à la question suivante.

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

Quand la réponse est fausse, l'app cherche ce qu'elle désignait réellement et l'affiche avec
son drapeau (`identify()` dans [src/lib/quiz.ts](src/lib/quiz.ts)) :

| Question | Réponse | Retour |
| --- | --- | --- |
| drapeau 🇬🇧 | `france` | Non, la réponse était **Royaume-Uni**. Ta réponse, c'est ce drapeau : 🇫🇷 France |
| capitale de la Suisse | `vienne` | Non, la réponse était **Berne**. **Vienne** est la capitale de : 🇦🇹 Autriche |

Le récapitulatif final reprend ce drapeau à côté de chaque réponse barrée.

Deux garde-fous, pour ne pas raconter n'importe quoi :

- **Une faute de frappe reste une faute de frappe.** L'identification n'a lieu que si la
  saisie est *strictement* plus proche d'un autre pays que de la réponse attendue.
  `mozambic` est à égale distance de Mozambique et de Zambie : rien n'est affirmé.
- **Aucune conjecture en cas d'égalité** entre deux pays, ni face à une saisie qui ne
  ressemble à aucun d'eux.

```bash
npm test          # 76 tests, dont la validation de tout le jeu de données
```

## Données

[src/data/countries.ts](src/data/countries.ts) est **généré** — ne pas l'éditer à la main :

```bash
npm run gen:countries
```

Le script [scripts/generate-countries.mjs](scripts/generate-countries.mjs) part du paquet
`world-countries` (membres de l'ONU uniquement) et y applique les corrections françaises :
les capitales n'y figurent qu'en anglais, et quelques traductions sont datées. C'est là
qu'on ajoute une capitale, un alias ou un pays.

Les drapeaux sont servis par [flagcdn.com](https://flagcdn.com) d'après le code ISO 3166-1
alpha-2 — une connexion est donc nécessaire ; à défaut le code pays s'affiche en repli.
