# 08 — Enchaîner la série jusqu'au classement final

**What to build:** la **partie** complète. Les manches s'enchaînent pour tout le salon, séparées
par une pause de résultats de durée fixe. Un classement se met à jour en direct entre les manches.
À la fin, un podium et un récapitulatif des manches permettent de revoir ce qu'on a raté. Le score
reste ici volontairement simple : un point par bonne réponse. Rien n'est écrit côté joueur — le
meilleur score solo n'est pas touché (ADR-0003).

**Blocked by:** 07 — Jouer une manche ensemble, corrigée par le serveur.

**Status:** done

- [ ] Le numéro de la manche et leur total sont affichés
- [ ] Les manches s'enchaînent automatiquement, avec une pause de résultats entre elles
- [ ] Le temps restant avant la manche suivante est visible
- [ ] Le classement se met à jour entre les manches
- [ ] La fin de partie affiche un podium
- [ ] Un récapitulatif liste les manches et ce que le joueur y a répondu
- [ ] Le nombre de bonnes réponses est affiché en plus du score
- [ ] Aucune écriture locale : le meilleur score solo est inchangé après une partie multijoueur
- [ ] Un joueur qui rejoint pendant une partie entre dans cette partie, sans attendre la suivante
- [ ] Il n'obtient aucun point pour les manches déjà jouées, et démarre donc avec ce retard
- [ ] Il ne devient répondant attendu qu'à la manche suivante, jamais au milieu de celle en cours
- [ ] L'arrivée d'un joueur ne réouvre ni ne rallonge la manche en cours
- [ ] Son récapitulatif distingue une manche manquée d'une réponse fausse
- [ ] Le classement signale les joueurs arrivés en cours de route
- [ ] Une partie complète à plusieurs joueurs est couverte par un test du réducteur, du lancement
      au classement final
- [ ] Un test couvre l'arrivée d'un joueur pendant une manche ouverte : la manche se clôt comme
      prévu, sans l'attendre

## Comments

Livré. Série enchaînée par minuterie serveur : cadence mesurée à 6 s de manche + 3 s de pause, manche suivante ouverte sans intervention. Classement en direct, podium, historique du salon.
