# Monolithe Adonis + Inertia, avec un solo qui reste hors ligne

L'ajout de salons multijoueurs temps réel imposait un serveur à une application qui n'en avait
aucun. Nous servons désormais le front React existant depuis un monolithe AdonisJS 7 via
Inertia, et le mode solo reste **entièrement côté client** : sa page Inertia monte
l'application actuelle, qui ne reparle plus jamais au serveur.

## Considered Options

- **Un objet durable par salon** (Cloudflare Durable Objects / PartyKit). La correspondance
  technique était la plus exacte — un acteur isolé, avec état, WebSockets et réveils
  programmés, par salon — et ne demandait aucun processus à maintenir. Écarté au profit d'un
  framework que nous maîtrisons, contre l'acceptation d'un processus à exploiter.
- **SPA séparé + API.** Écarté parce qu'Inertia supprime la frontière : client et serveur
  forment un seul projet TypeScript, donc `answer.ts` et `data/countries.ts` sont importés des
  deux côtés **sans paquet partagé ni workspace**. C'est ce qui rend l'ADR-0002 bon marché.
- **Pair-à-pair, le navigateur de l'hôte arbitrant.** Écarté par l'ADR-0002 (le juge ne peut
  pas être un client) et parce qu'un hôte qui ferme son onglet emporterait la partie.
- **Service de diffusion hébergé** (Supabase, Ably, Pusher). Écarté : ces services relaient
  sans arbitrer, or il faut une horloge qui clôt les manches — le serveur revenait de toute
  façon.

## Consequences

- L'état des salons vit en mémoire dans un processus : **tout redémarrage vide les salons en
  cours**. Acceptable pour des parties entre amis, à condition de ne pas déployer en pleine
  soirée.
- Un seul processus, donc pas de montée en charge horizontale sans état partagé.
- Nous n'utilisons qu'une petite part du framework : ni ORM, ni migrations, ni
  authentification, ni mailer. Poids assumé en échange de la structure et de la CLI.
- Le transport est SSE (`@adonisjs/transmit`), pas WebSocket, parce que le trafic est
  asymétrique : un seul message client→serveur par manche. C'est la raison pour laquelle
  l'affichage d'activité se limite à « a répondu » — un indicateur de frappe en direct
  inverserait ce profil et exigerait des WebSockets.
- Le solo conserve une propriété qu'on aurait perdue par uniformité : il fonctionne sans
  réseau et sans serveur.
