# Le temps de réponse est annoncé par le client, borné par le serveur

Le score multijoueur comporte un bonus de rapidité dégressif, ce qui fait du temps de réponse
une donnée qui décide du classement. Le client le chronomètre entre l'affichage de la manche et
l'envoi, puis l'annonce ; le serveur le retient s'il tombe dans l'intervalle plausible qu'il
calcule lui-même — un plancher humain, et pour plafond son propre horodatage d'arrivée.

C'est une exception délibérée à l'ADR-0002 : sur ce chiffre précis, le serveur fait
partiellement confiance au client.

## Considered Options

- **Le serveur seul chronomètre**, de l'envoi de la manche à l'arrivée de la réponse.
  Infalsifiable et trivial à écrire, mais la mesure inclut deux trajets réseau : sur un mobile
  en 4G on perd des points à chaque manche sans avoir été plus lent. Puisque le bonus de
  rapidité arbitre les parties serrées, c'est la connexion qui les aurait décidées.
- **Le client seul, sans contrôle.** Le plus loyal entre gens honnêtes, mais une requête forgée
  suffit à rafler chaque manche.

## Consequences

- Le classement multijoueur n'est **pas** comparable au meilleur score solo : celui-ci est un
  pourcentage sans contrainte de temps, celui-là des points arrachés en quinze secondes. Rien
  d'une partie multijoueur n'est donc versé dans `localStorage`, sous peine de corrompre le
  seul repère de progression existant.
- Le serveur doit retenir l'instant d'envoi de chaque manche, par joueur, pour calculer son
  plafond.
