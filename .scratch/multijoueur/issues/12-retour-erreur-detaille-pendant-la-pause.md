# 12 — Retour d'erreur détaillé pendant la pause de résultats

**What to build:** la pause de résultats devient un moment où l'on apprend, et non seulement où
l'on encaisse. Le retour d'erreur du solo y réapparaît : le drapeau du pays nommé à tort à côté du
bon, le pays cliqué à tort à côté de celui qu'il fallait, et la forme exacte lorsqu'une
orthographe approchée a été acceptée. On voit aussi ce que chaque joueur a répondu, ce qui donne
matière à commenter la partie.

**Blocked by:** 08 — Enchaîner la série jusqu'au classement final ; 10 — Modes carte en
multijoueur.

**Status:** done

- [ ] Nommer un mauvais pays affiche son drapeau à côté du bon, à taille égale
- [ ] Cliquer un mauvais pays le montre en rouge et le bon en vert sur la carte
- [ ] Une orthographe acceptée malgré une faute affiche la forme exacte
- [ ] Aucun pays n'est affirmé quand la saisie ne désigne personne avec certitude
- [ ] Les réponses de tous les joueurs de la manche sont visibles
- [ ] Ces informations n'apparaissent qu'après la clôture, jamais pendant la manche

## Comments

Livré. La pause de résultats affiche la réponse attendue, la comparaison de drapeaux, le pays cliqué à tort et la saisie de chaque joueur — jamais avant la clôture.
