# 03 — Présentation d'une question séparée de son état

**What to build:** prefactor sans effet visible. Le rendu d'une question — l'énoncé, le champ de
réponse ou la carte, le retour d'erreur — reçoit en entrée la question courante, le verdict et le
pays identifié, au lieu de les posséder. En solo, un conteneur garde cet état localement et le
comportement ne change pas d'un pixel. En multijoueur, ce même rendu sera piloté par l'état reçu
du serveur, qui en est le seul propriétaire (ADR-0002).

**Blocked by:** 02 — L'application existante servie par le monolithe Adonis + Inertia.

**Status:** done

- [ ] Le rendu d'une question ne possède plus ni la progression, ni le verdict, ni l'historique
- [ ] Le solo se comporte à l'identique : validation au clavier, passer, abandonner, récapitulatif
- [ ] La comparaison de drapeaux et l'identification du pays cliqué s'affichent toujours
- [ ] Le zoom de la carte et la remise à zéro du cadrage entre deux questions fonctionnent encore
- [ ] Les 114 tests existants passent

## Comments

Livré. Le rendu d'une question vit à part et ne possède plus d'état ; le solo garde le sien dans son conteneur. Le salon réemploie ce rendu sans le réécrire.
