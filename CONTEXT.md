# Géo Quiz

Un entraînement à la géographie des pays du monde : drapeaux, capitales et emplacement sur la
carte. Se joue seul, ou à plusieurs dans un salon où tous affrontent les mêmes questions en
même temps.

Le produit s'adresse à un public francophone : l'interface, ce glossaire et la documentation
sont en français. **Le code, lui, est en anglais** — chaque terme ci-dessous donne donc son
équivalent dans le code, pour que le domaine et l'implémentation ne divergent pas. Les mots
listés sous `_Avoid_` portent sur la prose française : l'équivalent anglais n'en fait jamais
partie.

## Language

### Déroulé d'une partie

**Partie**:
Un enchaînement complet de questions, du réglage au score final. Solo ou multijoueur.
_Avoid_: série, run, session, manche (au sens de l'ensemble)
_Dans le code_ : `Game`

**Manche**:
L'épisode chronométré pendant lequel tous les joueurs d'une partie répondent à une même
question. Propre au multijoueur : en solo, une question n'a ni échéance ni concurrent.
_Avoid_: tour, épreuve
_Dans le code_ : `Round`

**Question**:
Ce qui est demandé au joueur — un drapeau à nommer, un pays dont on attend la capitale, un
pays à situer sur la carte.
_Avoid_: item, épreuve
_Dans le code_ : `Question`

**Mode**:
La nature de ce qui est demandé et de la façon d'y répondre. Il y en a quatre : drapeaux,
capitales, placer sur la carte, pays en surbrillance. Une partie multijoueur peut en combiner
plusieurs ; chaque manche n'en relève que d'un.
_Avoid_: type de jeu, catégorie
_Dans le code_ : `Mode`

**Périmètre**:
La région du monde à laquelle une partie se restreint — un continent, ou le monde entier.
_Avoid_: filtre, portée
_Dans le code_ : `Scope`

**Vivier**:
Les pays parmi lesquels une manche tire sa question : ceux du périmètre que son mode sait
poser. Il se calcule par manche, et non une fois pour la partie, afin qu'un mode exigeant
n'appauvrisse pas les autres.
_Avoid_: ensemble tirable, candidats
_Dans le code_ : `pool`

**Pays tracé**:
Un pays dont la carte dessine le contour, et qui peut donc être surligné ou cliqué. Les
autres — vingt-neuf micro-États insulaires — restent jouables en drapeaux et en capitales.
_Avoid_: pays jouable, pays supporté
_Dans le code_ : `isMapped`

### Réponses

**Verdict**:
Le jugement porté sur une réponse. Il en existe trois : exacte, approchée (acceptée malgré
une faute ou une troncature), fausse.
_Avoid_: résultat, statut, correction
_Dans le code_ : `Verdict`

**Alias**:
Une autre appellation acceptée comme bonne réponse — exonyme, abréviation d'usage ou code
ISO. `Pékin` et `Beijing` désignent la même capitale ; `RDC` le même pays.
_Avoid_: synonyme, variante
_Dans le code_ : `accepted`

### Multijoueur

**Salon**:
Le lieu, désigné par un code partageable, où les joueurs se rassemblent pour enchaîner des
parties. Il survit aux parties qu'on y joue et se ferme quand il se vide.
_Avoid_: lobby, salle, table
_Dans le code_ : `Room`

**Joueur**:
Un participant à un salon, désigné par le nom qu'il s'est choisi. Il reste le même joueur
d'une connexion à l'autre, y compris après un rafraîchissement.
_Avoid_: utilisateur, participant, compte
_Dans le code_ : `Player`

**Hôte**:
Le joueur qui règle et lance les parties d'un salon. C'est un rôle attaché au salon, pas à
une personne : il se transmet dès que son titulaire s'en va.
_Avoid_: propriétaire, créateur, admin, maître de jeu
_Dans le code_ : `host`
