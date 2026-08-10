# 04 — Créer un salon, le rejoindre depuis l'accueil, voir les joueurs en direct

**What to build:** premier chemin complet du multijoueur. Depuis l'accueil, on choisit entre solo
et multijoueur. Un joueur crée un **salon** et obtient un code court et un lien partageables ;
les autres le rejoignent en saisissant le nom sous lequel ils veulent apparaître. Tout le monde
voit la liste des **joueurs** se remplir et se vider en direct, sans rafraîchir. Aucune partie ne
se joue encore : ce ticket établit le salon, la poussée d'état du serveur vers les clients et
l'écran d'attente.

**Blocked by:** 02 — L'application existante servie par le monolithe Adonis + Inertia.

**Status:** done

- [ ] L'accueil mène au solo comme au multijoueur, et le solo reste accessible hors ligne
- [ ] Créer un salon rend un code court sans caractères ambigus, et un lien qui y conduit
- [ ] Rejoindre demande un nom, puis affiche l'écran d'attente du salon
- [ ] L'arrivée et le départ d'un joueur apparaissent chez les autres sans rafraîchissement
- [ ] Un code inconnu affiche un message explicite, distinct d'une panne
- [ ] Un salon complet refuse l'entrée en le disant
- [ ] Un nom déjà pris dans ce salon est refusé
- [ ] Rejoindre reste possible pendant qu'une partie est en cours
- [ ] Le moteur de salon est un réducteur pur : il reçoit un événement et l'instant courant, et
      rend un état et des effets, sans lire l'horloge ni le réseau
- [ ] Les cas ci-dessus sont couverts par des tests du réducteur, sans démarrer d'application

## Comments

Livré. Accueil solo/multi, création de salon avec code à 4 caractères et lien partageable, entrée par pseudonyme, liste des joueurs poussée en direct. Refus traités : code inconnu (404), salon complet (409), nom pris (409).
