# 07 — Jouer une manche ensemble, corrigée par le serveur

**What to build:** le cœur du jeu, sur une seule **manche**. L'hôte règle un **mode** et un
**périmètre**, puis lance la partie. Tous les joueurs reçoivent la même question au même instant
et voient le temps restant. Chacun tape sa réponse et la valide ; la **saisie brute** part au
serveur, qui rend le **verdict** en réutilisant la correction existante — donc l'orthographe
approchée et les **alias** sont acceptés comme en solo (ADR-0002). On voit qui a répondu, jamais
quoi. La manche se clôt au premier des deux événements : tous ont répondu, ou l'échéance est
atteinte. La bonne réponse est alors révélée.

**Blocked by:** 03 — Présentation d'une question séparée de son état ; 04 — Créer un salon, le
rejoindre depuis l'accueil, voir les joueurs en direct.

**Status:** done

- [ ] L'hôte choisit un mode et un périmètre, et lance la partie
- [ ] Tous les joueurs voient la même question au même instant, et le temps restant
- [ ] La réponse se valide au clavier, comme en solo
- [ ] Le serveur corrige : une faute d'orthographe tolérée et un alias sont acceptés
- [ ] La correction existante est réutilisée, non dupliquée
- [ ] Chacun voit qui a déjà répondu, sans voir la réponse
- [ ] Une réponse validée est définitive
- [ ] La manche se clôt dès que tous ont répondu, sans attendre l'échéance
- [ ] La manche se clôt à l'échéance si un joueur n'a pas répondu
- [ ] Ne pas répondre à temps compte comme faux, sans exclure le joueur
- [ ] La bonne réponse est révélée à la clôture
- [ ] Les deux modes de clôture et le décompte des absents sont couverts par des tests du
      réducteur, en avançant l'instant courant plutôt qu'en attendant

## Comments

Livré. Manche synchronisée, saisie brute corrigée par le serveur (« monako » accepté en approché), indicateur « a répondu », clôture anticipée et clôture à l'échéance vérifiées.
