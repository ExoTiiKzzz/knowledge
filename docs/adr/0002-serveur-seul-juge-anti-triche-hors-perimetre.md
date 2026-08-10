# Le serveur est seul juge, et l'anti-triche est hors périmètre

En multijoueur, le client envoie la saisie brute (« afganistan ») et le serveur rend le
verdict : `answer.ts` est donc importé côté serveur, où il tourne inchangé. Le gain visé n'est
pas l'anti-triche mais l'**unicité du juge** — si chaque client corrige, deux clients peuvent
diverger sur une faute d'orthographe limite et le classement devient incohérent.

Nous actons explicitement que **la triche déterminée reste possible** : le paquet client
embarque `data/countries.ts`, donc les 194 noms et capitales. Dans tous les modes, il faut de
toute façon transmettre au client de quoi afficher la question — le code du pays pour son
drapeau, sa surbrillance sur la carte — c'est-à-dire de quoi connaître la réponse. Faire
corriger le serveur n'arrête que la falsification triviale du score.

## Consequences

- Le solo, lui, corrige toujours côté client (ADR-0001) : la même fonction sert de deux
  façons, et c'est voulu.
- Le client ne connaît plus le verdict avant un aller-retour. C'est le coût accepté.
- Ne pas investir dans le masquage des réponses : ce serait une dépense sans effet tant que le
  jeu de données est embarqué, et l'embarquer est ce qui rend le solo hors ligne possible.
