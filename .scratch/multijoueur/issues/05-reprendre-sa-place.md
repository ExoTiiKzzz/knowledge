# 05 — Reprendre sa place après un rafraîchissement

**What to build:** un joueur qui rafraîchit sa page ou traverse un tunnel retrouve sa place dans
le salon, sous le même nom, avec son score. Son navigateur conserve un jeton opaque ; se
présenter avec un jeton déjà connu du salon reprend la place au lieu d'en créer une seconde. Les
autres joueurs le voient momentanément déconnecté plutôt que parti, et rien n'attend son retour.

**Blocked by:** 04 — Créer un salon, le rejoindre depuis l'accueil, voir les joueurs en direct.

**Status:** done

- [ ] Rafraîchir la page ramène au même joueur, avec son nom et son score
- [ ] Une coupure réseau passagère se rétablit sans intervention
- [ ] Les autres joueurs distinguent un joueur déconnecté d'un joueur parti
- [ ] Un joueur déconnecté ne bloque jamais la progression des autres
- [ ] Se présenter avec un jeton inconnu crée bien un nouveau joueur
- [ ] Aucun compte, aucun mot de passe, aucune donnée personnelle conservée

## Comments

Livré. Jeton opaque en stockage local, reprise de place vérifiée. Limite inhérente : deux joueurs ne peuvent pas partager un même profil de navigateur, le jeton étant par origine.
