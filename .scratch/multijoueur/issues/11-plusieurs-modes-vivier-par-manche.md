# 11 — Plusieurs modes cochés, vivier par manche

**What to build:** l'hôte coche un ou plusieurs **modes** pour une même **partie**, et voit combien
de pays son réglage rend jouables. Chaque manche tire d'abord son mode, puis un pays dans le
**vivier** de ce mode : les 194 pays pour les drapeaux et les capitales, les **pays tracés**
seulement pour la carte. Le vivier se calcule donc par manche et jamais une fois pour la partie —
cocher un mode carte ne doit pas retirer Malte des manches de drapeaux, où son drapeau s'affiche
parfaitement. Un pays n'apparaît qu'une fois par partie, tous modes confondus.

**Blocked by:** 10 — Modes carte en multijoueur.

**Status:** done

- [ ] L'hôte coche plusieurs modes, et au moins un est exigé
- [ ] La taille du vivier annoncée correspond au réglage
- [ ] Chaque manche tire son mode parmi ceux cochés
- [ ] Un micro-État sans tracé sort encore en manche de drapeaux malgré un mode carte coché
- [ ] Un micro-État sans tracé ne sort jamais en manche de carte
- [ ] Un pays n'apparaît qu'une fois par partie, quel que soit le mode
- [ ] La consigne affichée correspond au mode de la manche en cours
- [ ] La règle de vivier est couverte par des tests du réducteur, sur le jeu de données réel

## Comments

Livré. Modes cumulables, vivier calculé par manche, unicité des pays sur la partie.
