# 10 — Modes carte en multijoueur

**What to build:** les deux modes carte deviennent jouables en salon. Une **manche** peut demander
de placer un pays sur la carte — la réponse est alors le pays cliqué — ou de nommer le pays en
surbrillance. Le zoom, le déplacement et le cerclage des pays minuscules restent disponibles
pendant la manche, sans quoi les petits pays seraient inatteignables sous chronomètre. Le
**vivier** de ces manches se limite aux **pays tracés**.

**Blocked by:** 08 — Enchaîner la série jusqu'au classement final.

**Status:** done

- [ ] L'hôte peut régler une partie sur « placer sur la carte » ou « pays en surbrillance »
- [ ] En mode placer, le pays cliqué est envoyé comme réponse et corrigé par le serveur
- [ ] En mode surbrillance, tous voient le même pays surligné au même instant
- [ ] Le zoom, le déplacement et le cerclage fonctionnent pendant la manche
- [ ] Un glissement de carte ne vaut jamais réponse
- [ ] La carte cesse d'être une surface de réponse dès la clôture de la manche
- [ ] Ces manches ne tirent que des pays tracés
- [ ] Un clic est exact ou faux, jamais approché

## Comments

Livré. Les manches carte se jouent au clic, le pays cliqué à tort est nommé, la carte cesse d'être une surface de réponse après clôture.
