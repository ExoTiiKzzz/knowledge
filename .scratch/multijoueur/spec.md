# Salons multijoueurs temps réel

Status: ready-for-agent

Vocabulaire : ce document emploie le glossaire du projet (`CONTEXT.md`) — **partie**, **manche**,
**question**, **mode**, **périmètre**, **vivier**, **pays tracé**, **verdict**, **alias**,
**salon**, **joueur**, **hôte**. Décisions cadres : ADR-0001 (monolithe Adonis + Inertia, solo
hors ligne), ADR-0002 (serveur seul juge), ADR-0003 (temps de réponse borné).

## Problem Statement

L'application ne sait entraîner qu'une personne à la fois. Un joueur qui veut se mesurer à ses
amis n'a aucun moyen de le faire dans l'application : il doit jouer sa partie, faire une capture
d'écran de son score et la leur envoyer, en espérant qu'ils tombent sur des questions de
difficulté comparable — ce qui n'arrive jamais, puisque chaque partie tire ses questions au
hasard. Il n'existe donc aucune comparaison honnête possible, et aucun de ces moments de
compétition simultanée qui donnent envie d'enchaîner les parties.

## Solution

Un joueur crée un **salon**, en partage le code, et les autres le rejoignent en tapant leur nom.
L'**hôte** choisit les modes, le périmètre et le nombre de manches, puis lance la partie.

Tous les joueurs affrontent alors **la même manche au même instant**. Chacun voit qui a déjà
répondu, sans voir quoi. La manche se clôt dès que tout le monde a répondu, ou à l'expiration du
délai. Une pause de résultats montre la bonne réponse et le retour d'erreur habituel, puis la
manche suivante s'enchaîne pour tous.

Le score récompense la justesse **et** la rapidité : une bonne réponse vaut d'autant plus qu'elle
arrive tôt dans la manche. Un classement se met à jour en direct, et la partie se termine sur un
podium. On rejoue dans le même salon d'un clic, en changeant les réglages si on veut.

Le mode solo n'est pas touché : il continue de fonctionner sans réseau, et son meilleur score
reste comparable à lui-même.

## User Stories

### Rejoindre un salon et en partir

1. En tant que joueur, je veux créer un salon, afin de proposer une partie à mes amis.
2. En tant que joueur, je veux obtenir un code de salon court, afin de le dicter à voix haute ou
   par message sans erreur.
3. En tant que joueur, je veux obtenir un lien vers le salon, afin que mes amis le rejoignent
   sans rien recopier.
4. En tant que joueur, je veux taper le nom sous lequel je serai affiché, afin que les autres me
   reconnaissent.
5. En tant que joueur, je veux voir la liste des joueurs présents dans le salon, afin de savoir
   qui je vais affronter et si l'on peut commencer.
6. En tant que joueur, je veux être averti si le code que je saisis ne correspond à aucun salon,
   afin de comprendre que je me suis trompé plutôt que de croire à une panne.
7. En tant que joueur, je veux être averti si le salon est complet, afin de ne pas attendre en
   vain.
8. En tant que joueur, je veux être averti si le nom que je choisis est déjà pris dans ce salon,
   afin qu'on ne me confonde pas avec quelqu'un d'autre.
9. En tant que joueur, je veux pouvoir quitter un salon, afin de ne pas bloquer les autres si je
   dois partir.
10. En tant que joueur, je veux voir quand quelqu'un rejoint ou quitte le salon, afin de suivre
    qui participe.

### Reprendre sa place

11. En tant que joueur, je veux retrouver ma place et mon score après un rafraîchissement de
    page, afin qu'une fausse manœuvre ne me coûte pas la partie.
12. En tant que joueur, je veux retrouver ma place après une coupure réseau passagère, afin de
    ne pas être puni d'un tunnel ou d'un changement de réseau.
13. En tant que joueur, je veux que les autres voient que je suis momentanément déconnecté,
    afin qu'ils sachent que je ne fais pas exprès de traîner.
14. En tant que joueur, je veux que ma déconnexion ne gèle jamais la partie pour les autres,
    afin de ne pas gâcher leur soirée.

### Régler et lancer une partie

15. En tant qu'hôte, je veux choisir un ou plusieurs modes, afin d'adapter la partie à ce que
    nous voulons travailler.
16. En tant qu'hôte, je veux choisir le périmètre, afin de jouer sur un continent ou sur le
    monde entier.
17. En tant qu'hôte, je veux choisir le nombre de manches, afin de calibrer la durée de la
    partie.
18. En tant qu'hôte, je veux choisir la durée d'une manche, afin d'adapter le rythme au niveau
    des joueurs présents.
19. En tant qu'hôte, je veux voir combien de pays le vivier contient d'après mes réglages, afin
    de savoir si la partie sera variée.
20. En tant qu'hôte, je veux comprendre que cocher un mode carte n'appauvrit pas les manches de
    drapeaux, afin de ne pas croire que je perds des pays.
21. En tant que joueur, je veux voir les réglages retenus avant le lancement, afin de savoir à
    quoi je m'engage.
22. En tant que joueur non hôte, je veux comprendre que je ne peux pas modifier les réglages,
    afin de ne pas chercher un bouton inexistant.
23. En tant qu'hôte, je veux lancer la partie quand tout le monde est prêt, afin de ne pas
    démarrer sans un joueur qui arrive.

### Jouer une manche

24. En tant que joueur, je veux voir la même question que tout le monde au même moment, afin
    que la comparaison des scores ait un sens.
25. En tant que joueur, je veux voir le numéro de la manche et le total, afin de savoir où j'en
    suis.
26. En tant que joueur, je veux voir le temps restant sur la manche, afin de doser entre
    réfléchir et répondre vite.
27. En tant que joueur, je veux écrire ma réponse au clavier et la valider avec Entrée, afin de
    garder la fluidité du solo.
28. En tant que joueur, je veux que l'orthographe approchante soit acceptée comme en solo, afin
    de ne pas être puni d'un accent oublié sous la pression du chronomètre.
29. En tant que joueur, je veux que mes alias habituels soient acceptés, afin de taper `RDC`
    plutôt que le nom complet.
30. En tant que joueur, je veux cliquer le pays sur la carte quand la manche relève d'un mode
    carte, afin de répondre de la même façon qu'en solo.
31. En tant que joueur, je veux pouvoir zoomer et déplacer la carte pendant la manche, afin de
    viser un petit pays sans perdre de temps.
32. En tant que joueur, je veux voir qui a déjà répondu, afin de sentir la pression de la
    course.
33. En tant que joueur, je veux que personne ne voie ce que j'ai répondu avant la clôture de la
    manche, afin qu'on ne me copie pas.
34. En tant que joueur, je veux que ma réponse soit définitive une fois validée, afin que la
    règle soit la même pour tous.
35. En tant que joueur, je veux voir que ma réponse a bien été prise en compte, afin de ne pas
    la valider deux fois.
36. En tant que joueur, je veux que la manche se clôture dès que tout le monde a répondu, afin
    de ne pas attendre le chronomètre pour rien.
37. En tant que joueur, je veux que la manche se clôture à l'expiration du délai même si
    quelqu'un n'a pas répondu, afin que la partie avance toujours.
38. En tant que joueur, je veux que ne pas répondre à temps compte comme une réponse fausse,
    sans être exclu, afin de rester dans la partie.

### Voir les résultats d'une manche

39. En tant que joueur, je veux voir la bonne réponse après la clôture, afin d'apprendre de mon
    erreur.
40. En tant que joueur, je veux voir le drapeau du pays que j'ai nommé à tort à côté du bon,
    afin de retenir la différence.
41. En tant que joueur, je veux voir quel pays j'ai cliqué à tort et lequel il fallait cliquer,
    afin de corriger ma représentation de la carte.
42. En tant que joueur, je veux savoir quand mon orthographe a été acceptée malgré une faute et
    quelle était la forme exacte, afin de l'apprendre.
43. En tant que joueur, je veux voir ce que chaque joueur a répondu à cette manche, afin de
    commenter la partie avec eux.
44. En tant que joueur, je veux voir combien de points cette manche m'a rapporté, afin de
    comprendre l'effet de ma rapidité.
45. En tant que joueur, je veux voir le classement se mettre à jour, afin de savoir si je
    remonte ou je décroche.
46. En tant que joueur, je veux savoir combien de temps il reste avant la manche suivante, afin
    de ne pas être pris au dépourvu.

### Scores et fin de partie

47. En tant que joueur, je veux qu'une bonne réponse rapide rapporte plus qu'une bonne réponse
    lente, afin que la vivacité soit récompensée.
48. En tant que joueur, je veux qu'une réponse fausse ne rapporte rien, quelle que soit sa
    rapidité, afin que deviner au hasard ne paie pas.
49. En tant que joueur, je veux que ma connexion n'influe pas sur mes points, afin de jouer à
    armes égales depuis un mobile.
50. En tant que joueur, je veux que personne ne puisse s'attribuer un temps de réponse
    impossible, afin que le classement garde du sens.
51. En tant que joueur, je veux voir le podium à la fin de la partie, afin de savoir qui a
    gagné.
52. En tant que joueur, je veux voir mon nombre de bonnes réponses en plus de mes points, afin
    de mesurer mes connaissances indépendamment de ma vitesse.
53. En tant que joueur, je veux consulter le récapitulatif des manches de la partie, afin de
    revoir ce que j'ai raté.
54. En tant que joueur, je veux voir les parties déjà jouées dans ce salon, afin de savoir qui
    mène sur la soirée.

### Enchaîner et faire vivre le salon

55. En tant qu'hôte, je veux relancer une partie dans le même salon, afin d'enchaîner sans
    repartager de code.
56. En tant qu'hôte, je veux modifier les réglages entre deux parties, afin de changer de mode
    ou de continent.
57. En tant que joueur, je veux pouvoir rejoindre un salon entre deux parties, afin d'arriver en
    retard sans déranger.
58. En tant que joueur arrivé en cours de partie, je veux entrer dans la partie déjà lancée
    plutôt que d'attendre la suivante, afin de jouer tout de suite plutôt que de regarder.
59. En tant que joueur arrivé en cours de partie, j'accepte de démarrer avec le retard des
    manches que j'ai manquées, afin que le classement reste honnête pour ceux qui étaient là.
60. En tant que joueur arrivé en cours de partie, je veux commencer à la manche suivante et non
    au milieu de celle en cours, afin de ne pas récolter une faute sur une question à peine vue.
61. En tant que joueur déjà présent, je veux que l'arrivée de quelqu'un n'interrompe ni ne
    rallonge la manche en cours, afin que la partie garde son rythme.
62. En tant que joueur, je veux distinguer une manche que j'ai manquée d'une manche que j'ai
    ratée, afin que mon récapitulatif ne me prête pas de mauvaises réponses.
63. En tant que joueur, je veux voir dans le classement qu'un joueur est arrivé en cours de
    route, afin de lire le podium sans me tromper sur sa performance.
64. En tant que joueur, je veux que le rôle d'hôte soit repris automatiquement si l'hôte s'en
    va, afin que le salon ne meure pas avec lui.
65. En tant que joueur, je veux savoir qui est l'hôte, afin de savoir à qui demander de lancer.
66. En tant que joueur, je veux que le salon se ferme quand tout le monde est parti, afin que
    les codes ne s'accumulent pas indéfiniment.

### Ne rien casser du solo

67. En tant que joueur, je veux continuer à jouer en solo sans connexion, afin de m'entraîner
    dans le train.
68. En tant que joueur, je veux que mon meilleur score solo reste comparable à lui-même, afin
    que ma progression garde un sens.
69. En tant que joueur, je veux que le solo garde son rythme sans chronomètre, afin de pouvoir
    réfléchir.
70. En tant que joueur, je veux choisir entre solo et multijoueur depuis l'accueil, afin de ne
    pas chercher où est passé le mode que je connaissais.

## Implementation Decisions

### Le moteur de salon est un réducteur pur

Le cœur du multijoueur est un module **moteur de salon**, indépendant du transport et du
framework : il reçoit un événement et l'instant courant, et rend un nouvel état accompagné
d'effets à exécuter. Il ne lit ni l'horloge, ni l'aléatoire, ni le réseau.

```
reduire(état, événement, maintenant) → { état, effets }
```

Événements entrants : un joueur rejoint, un joueur se retire, l'hôte modifie les réglages,
l'hôte lance la partie, un joueur soumet une réponse, l'échéance de la manche est atteinte, la
pause de résultats est terminée.

Effets sortants : diffuser un état aux joueurs du salon, programmer un réveil à un instant
donné. **Aucun effet n'est exécuté par le moteur** — l'adaptateur s'en charge.

Cette forme est ce qui rend la couture de test unique possible : le temps et l'aléatoire étant
des paramètres, chaque cas limite se provoque sans attendre et sans simuler de réseau.

### Le temps et l'aléatoire sont injectés

`maintenant` est toujours un paramètre. La composition de la série d'une partie prend une
**graine**, afin qu'une même graine produise toujours la même suite de manches. Le mélange
actuel appelle l'aléatoire global directement : il faut lui ajouter une variante qui accepte un
générateur, sans changer le comportement du solo.

### Composition de la série

Pour chaque manche : tirer un mode parmi ceux cochés par l'hôte, puis un pays dans le **vivier**
de ce mode — les pays du périmètre que ce mode sait poser. Les modes carte se limitent aux
**pays tracés**, les autres non. Un pays n'apparaît qu'une fois par partie, tous modes
confondus. Le vivier se calcule donc par manche et jamais une fois pour la partie, afin qu'un
mode exigeant n'appauvrisse pas les autres.

### Progression pas à pas

Une seule manche est ouverte à la fois pour tout le salon. Elle se clôt au premier des deux
événements : tous les joueurs présents ont répondu, ou l'échéance est atteinte. Suit une pause
de résultats de durée fixe, puis la manche suivante. Un joueur déconnecté n'est pas attendu.

**La dernière manche a sa pause elle aussi**, avant le podium : sans elle, on ne verrait jamais
la réponse de la question finale ni, sur une manche carte, où les autres ont visé.

### Correction et score

Le client transmet la **saisie brute** — le texte tapé, ou le code du pays cliqué. Le serveur
rend le verdict en réutilisant la correction existante, sans la dupliquer (ADR-0002).

Le score d'une manche vaut zéro pour un verdict faux, et un montant décroissant avec le temps de
réponse pour un verdict exact ou approché. Un verdict approché rapporte autant qu'un exact : la
tolérance orthographique est un principe du produit, pas une demi-mesure.

### Bornage du temps de réponse

Le client mesure entre l'affichage de la manche et l'envoi, puis annonce cette durée. Le serveur
la retient si elle tombe entre un plancher humain et le plafond qu'il calcule depuis son propre
horodatage d'envoi de la manche ; sinon il la remplace par ce plafond. Le moteur doit donc
retenir l'instant d'envoi de chaque manche **par joueur** (ADR-0003).

### Identité et reconnexion

Un joueur est identifié par un **jeton opaque** conservé par son navigateur, et porte le nom
qu'il a choisi. Rejoindre avec un jeton déjà connu du salon reprend la place, le score et le
rôle d'hôte s'il l'avait. Aucun compte, aucun mot de passe, aucune donnée personnelle.

### Arrivée en cours de partie

Un joueur qui rejoint un salon pendant une partie **entre dans cette partie**, sans attendre la
suivante. Il ne récupère aucun point pour les manches déjà jouées : il démarre donc avec le retard
correspondant, ce qui est assumé — jouer tout de suite en étant derrière vaut mieux que regarder
les autres.

Il ne devient **répondant attendu qu'à partir de la manche suivante**, jamais au milieu de celle
en cours. Ce n'est pas un détail de confort : la clôture anticipée se déclenche quand tous les
répondants attendus ont répondu, donc ajouter quelqu'un à cet ensemble pendant qu'une manche est
ouverte réouvrirait une manche que tout le monde venait de compléter.

Les manches antérieures à son arrivée sont **manquées**, ce qui se distingue d'une réponse fausse :
son récapitulatif ne doit pas lui prêter de mauvaises réponses, et le classement signale qu'il est
arrivé en cours de route pour que le podium reste lisible.

### Rôle d'hôte

L'hôte est une propriété du salon, pas une personne. Il se transmet au joueur présent depuis le
plus longtemps dès que son titulaire quitte le salon. Seul l'hôte modifie les réglages et lance
les parties.

### Transport

Le serveur pousse l'état aux clients par **événements serveur (SSE)** ; le client envoie ses
réponses par requête HTTP. Ce choix suit le profil réel du trafic : un seul message
client→serveur par manche. C'est pour cette raison que l'affichage d'activité se limite à « a
répondu » — un indicateur de frappe en direct inverserait ce profil (ADR-0001).

### Frontière avec l'existant

Le front est servi par des pages rendues côté serveur qui montent les composants React
existants. La page solo monte l'application actuelle et **ne parle plus jamais au serveur**
(ADR-0001). Les composants de présentation déjà écrits — drapeau, carte, comparaison de
drapeaux, retour d'erreur — sont réutilisés tels quels dans le salon ; les adapter à un état
reçu du serveur plutôt que local est l'essentiel du travail côté client.

### État du salon en mémoire

Un salon vit en mémoire dans le processus et se ferme quand il se vide. Aucune base de données.
Un redémarrage du serveur perd les salons en cours, ce qui est accepté (ADR-0001).

## Testing Decisions

### Ce qu'est un bon test ici

Un test décrit un **comportement observable** : « quand tous les joueurs ont répondu, la manche
se clôt sans attendre l'échéance », jamais « le réducteur appelle telle fonction interne ». Les
tests existants en donnent le patron : ils passent par les fonctions publiques, sur le **jeu de
données réel**, sans simulacre. Les noms de test sont en français et décrivent la règle, pas la
mécanique.

### Une seule couture

Le **moteur de salon** est la seule couture nouvelle, et la seule à tester. Elle est possible
parce que le temps et l'aléatoire sont des paramètres : l'échéance, la reconnexion et le
bornage se provoquent en avançant un nombre, sans horloge réelle ni réseau.

Cas à couvrir, au minimum :

- une partie complète à plusieurs joueurs, avec vérification des points et du classement final ;
- clôture anticipée quand tous ont répondu, et clôture à l'échéance quand l'un manque ;
- absence de réponse comptée comme fausse, sans exclusion ;
- temps annoncé sous le plancher ou au-delà du plafond, ramené au plafond ;
- verdict approché rapportant autant qu'un exact ;
- rejoindre avec un jeton connu en pleine partie : même joueur, même score ;
- départ de l'hôte : rôle transmis au plus ancien présent ;
- départ du dernier joueur : salon fermé ;
- vivier par manche : un mode carte coché n'empêche pas un micro-État de sortir en drapeau ;
- un pays n'apparaît qu'une fois par partie ;
- une même graine produit deux fois la même série.

### Coutures réutilisées

La correction d'une réponse n'est **pas** retestée : elle l'est déjà exhaustivement, y compris
sur les 194 pays, les alias et les codes ISO. Le moteur consomme cette fonction ; les tests du
moteur portent sur ce qu'il en fait, pas sur ce qu'elle décide.

La géométrie de la carte et le périmètre des modes carte sont déjà couverts. Les tests du moteur
s'appuient dessus sans les redire.

### Délibérément non testés

Le canal d'événements serveur, le contrôleur HTTP et les pages rendues côté serveur. Ils ne
doivent porter aucune décision — s'ils en portent une, c'est le signe qu'elle appartenait au
moteur. Les tester exigerait une application démarrée pour une valeur faible.

## Out of Scope

- **Comptes utilisateurs**, mots de passe, identité durable entre appareils.
- **Base de données** et historique des parties au-delà de la vie du salon.
- **Anti-triche.** Explicitement hors périmètre : le jeu de données est embarqué côté client
  (ADR-0002). Ne pas investir dans le masquage des réponses.
- **Verser un résultat multijoueur dans le meilleur score solo.** Interdit : un score arraché
  sous chronomètre n'est pas comparable (ADR-0003).
- **Solo arbitré par le serveur.** Le solo reste local et hors ligne (ADR-0001).
- **Indicateur de frappe en direct**, qui exigerait un autre transport.
- **Montée en charge horizontale**, sauvegarde des salons au redémarrage.
- **Spectateurs**, discussion écrite ou vocale, émoticônes.
- **Classement entre salons**, saisons, badges.

## Further Notes

### Hypothèses retenues, non discutées point par point

À trancher à l'implémentation si elles se révèlent gênantes :

| Point | Hypothèse |
| --- | --- |
| Durée d'une manche | 15 s par défaut, réglable par l'hôte |
| Pause de résultats | 5 s, la dernière manche comprise |
| Nombre de manches | 10 / 20 / 50 / tout le vivier, comme en solo |
| Code de salon | 4 caractères, sans caractères ambigus |
| Réponses par manche | une seule, définitive |
| Bouton « Passer » | absent en multijoueur — le délai en tient lieu |
| Joueurs par salon | 8 au maximum |
| Partie à un seul joueur | autorisée |

### Points de vigilance

- Le mélange actuel appelle l'aléatoire global. Y ajouter une graine sans altérer le solo est un
  prérequis de la couture de test, pas un détail.
- `@tuyau/client` est en version 0.2.x : son interface peut bouger. Rien n'oblige à l'adopter
  d'emblée, les pages rendues côté serveur portant déjà leurs propres soumissions typées.
- Ne pas déployer pendant qu'une partie est en cours : les salons vivent en mémoire.
