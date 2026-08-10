# 06 — Rôle d'hôte transmis, salon vide fermé

**What to build:** le salon survit au départ de celui qui l'a créé. L'**hôte** est une propriété
du salon, pas une personne : quand son titulaire s'en va, le rôle passe au joueur présent depuis
le plus longtemps, et chacun voit qui l'exerce. Quand le dernier joueur part, le salon se ferme et
son code cesse d'être valable.

**Blocked by:** 04 — Créer un salon, le rejoindre depuis l'accueil, voir les joueurs en direct.

**Status:** done

- [ ] Le salon affiche qui est l'hôte
- [ ] Le départ de l'hôte transmet le rôle au joueur présent depuis le plus longtemps
- [ ] Un joueur non hôte ne voit pas les commandes réservées à l'hôte
- [ ] Le départ du dernier joueur ferme le salon
- [ ] Un code de salon fermé n'est plus rejoignable
- [ ] La transmission et la fermeture sont couvertes par des tests du réducteur

## Comments

Livré. Rôle d'hôte affiché et transmis, commandes réservées, salon fermé quand il se vide. Refus « pas-hote » vérifié de bout en bout.
