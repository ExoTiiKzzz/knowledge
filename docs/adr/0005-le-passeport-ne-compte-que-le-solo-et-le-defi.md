# Le passeport ne compte que le solo et le défi du jour

La progression — miles, niveau, tampons, records, jours d'affilée — vit dans un **passeport**
(`lib/progress.ts`). Seuls le solo et le défi du jour l'alimentent ; une partie multijoueur n'y
verse rien.

C'est le prolongement de l'ADR-0003 : les points d'un salon sont arrachés contre un chronomètre
et contre d'autres joueurs, avec un bonus de rapidité dont le serveur borne le temps annoncé. Ils
ne sont comparables ni aux points du solo, ni d'un salon à l'autre — selon qui est présent, la
même partie rapporte plus ou moins.

Le passeport d'un invité vit dans son navigateur ; celui d'un compte vit dans Convex
(`passports`). Les deux appliquent les mêmes fonctions pures, si bien qu'une partie donne le
même passeport où qu'elle soit enregistrée. À la première connexion, le passeport local est
fusionné dans le compte (miles additionnés, tampons et records réunis), puis oublié du
navigateur pour ne pas l'être deux fois.

## Considered Options

- **Rendre le compte obligatoire pour progresser.** Écarté : la connexion reste une offre,
  jamais un mur, comme dans pokefight.
- **Ne pas fusionner** et repartir de zéro à la connexion. Écarté : c'est punir le joueur qui
  a joué avant de se connecter, c'est-à-dire tout le monde.

## Consequences

- L'anti-triche reste hors périmètre (ADR-0002) : une partie forgée rapporte des miles. Le
  serveur garantit seulement le calendrier — le jour pour lequel un défi compte est le sien, pas
  celui du navigateur — et qu'un défi ne compte qu'une fois par jour.
- Le défi du jour est tiré dans le navigateur, d'une graine dérivée de la date : il reste
  jouable hors ligne, et identique pour tous sans que le serveur le connaisse.
