# Next.js + Convex, et le moteur de salon reste un réducteur pur

Remplace l'ADR-0001. Nous quittons le monolithe AdonisJS + Inertia pour la pile de pokefight :
Next.js (App Router) sur Vercel, Convex pour l'état partagé et le temps réel, Convex Auth pour
une connexion Google facultative. Deux projets sur la même pile valent mieux qu'un framework de
plus à entretenir.

Le moteur de salon (`lib/room.ts`) ne change pas : `(salon, événement, maintenant) → salon`.
Un salon est stocké **en entier dans un seul document** (`rooms.state`) ; chaque mutation le lit,
le réduit et le réécrit. Les transactions de Convex rendent ces écritures sérielles, ce que le
registre en mémoire obtenait d'un seul processus.

## Considered Options

- **Éclater le salon en tables** (`rooms`, `participants`, `answers`), comme pokefight. Écarté :
  ce serait une seconde copie des règles, éparpillée dans des mutations, alors que le réducteur
  est couvert par ses tests sans serveur. pokefight n'a pas de réducteur ; il n'avait rien à
  préserver.
- **Garder Adonis à côté de Convex.** Écarté : deux serveurs pour un salon.

## Consequences

- La diffusion disparaît du code : `rooms.view` est une requête réactive, chaque joueur reçoit
  sa vue dès que le document change. Le réveil qui clôt une manche devient
  `ctx.scheduler.runAt` ; un réveil devenu sans objet (clôture anticipée, nouvelle partie) se
  reconnaît à son arrivée et ne fait rien, plutôt que d'être annulé.
- Les salons survivent à un redéploiement : la conséquence la plus gênante de l'ADR-0001
  tombe.
- Il n'y a plus de connexion dont la fermeture signale un départ. Chaque navigateur envoie un
  battement toutes les 5 s, dans une table à part (`presence`) pour ne pas réécrire le salon ni
  rafraîchir tous les joueurs ; un joueur muet depuis 15 s est marqué absent, et une tâche
  planifiée supprime les salons abandonnés depuis 30 min.
- `state` est déclaré `v.any()` : son type est `Room`, défini par le moteur. Un validateur
  Convex en ferait une seconde définition à tenir à jour.
- Le solo garde sa propriété : une fois la page chargée, il ne parle à aucun serveur pour un
  invité. Les drapeaux restent servis par flagcdn.com.
