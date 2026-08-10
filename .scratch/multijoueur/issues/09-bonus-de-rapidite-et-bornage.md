# 09 — Bonus de rapidité et bornage du temps annoncé

**What to build:** le score cesse de compter les bonnes réponses pour récompenser la vivacité :
une bonne réponse vaut d'autant plus qu'elle arrive tôt dans la manche, une réponse fausse ne vaut
rien quelle que soit sa rapidité. Un **verdict** approché rapporte autant qu'un exact — la
tolérance orthographique est un principe du produit, pas une demi-mesure.

Le client mesure sa durée de réflexion et l'annonce ; le serveur ne la retient que si elle tombe
entre un plancher humain et le plafond qu'il calcule depuis son propre horodatage d'envoi, sinon
il la remplace par ce plafond. Ainsi la latence ne décide pas des parties serrées, et un temps
forgé ne rapporte rien de plus (ADR-0003).

**Blocked by:** 08 — Enchaîner la série jusqu'au classement final.

**Status:** done

- [ ] Une bonne réponse rapide rapporte plus qu'une bonne réponse lente
- [ ] Une réponse fausse ne rapporte rien, même très rapide
- [ ] Un verdict approché rapporte autant qu'un verdict exact
- [ ] Les points gagnés à la manche sont affichés au joueur
- [ ] Une durée annoncée sous le plancher humain est ramenée au plafond du serveur
- [ ] Une durée annoncée au-delà du plafond du serveur est ramenée à ce plafond
- [ ] Une durée plausible est retenue telle quelle, sans pénalité de latence
- [ ] Le serveur retient l'instant d'envoi de chaque manche par joueur
- [ ] Le bornage est couvert par des tests du réducteur, plancher et plafond compris

## Comments

Livré. Points dégressifs vérifiés en bout de chaîne. Le temps annoncé par le client est borné côté serveur ; un « 0 ms » forgé est ramené au plafond mesurable.
