# 02 — L'application existante servie par le monolithe Adonis + Inertia

**What to build:** l'application est servie par un monolithe AdonisJS via Inertia, sans qu'un
joueur s'en aperçoive. Le solo s'ouvre, se joue et se termine à l'identique, y compris **hors
ligne** : sa page monte l'application actuelle, qui ne parle plus jamais au serveur. C'est la
restructuration qui permettra au serveur d'importer la correction et le jeu de données sans
paquet partagé (ADR-0001).

**Blocked by:** 01 — Tirage reproductible par graine. Non par dépendance logique mais par
collision : 01 modifie la composition d'une série, que ce ticket déplace.

**Status:** done

- [ ] Une seule commande lance le serveur et le front en développement
- [ ] Les quatre modes solo fonctionnent à l'identique, drapeaux et carte compris
- [ ] Le thème clair/sombre, le zoom de la carte et le meilleur score en local fonctionnent encore
- [ ] Le solo se joue sans réseau une fois la page chargée
- [ ] Les 114 tests existants passent
- [ ] La construction de production aboutit et la page servie est jouable
- [ ] Le serveur peut importer la correction et le jeu de données sans workspace ni paquet partagé

## Comments

**Livré.** L'application est servie par AdonisJS 7 + Inertia 5 + Vite 8. Le solo se joue à
l'identique, la carte et son zoom fonctionnent, les 190 tests passent, les deux typecheck sont
verts et `npm run build` produit un artefact de production complet.

Trois pièges se sont ajoutés à ceux de la recette, tous dans le squelette v6 recopié :

- `assetsBundler` n'existe plus dans le fichier de configuration racine en v7.
- Le gestionnaire d'exceptions du kit rend des pages d'erreur Inertia inexistantes ici, et
  Inertia 5 type les noms de page : il refuse donc toute page non déclarée.
- Les pages se déclarent par **augmentation de module** sur `@adonisjs/inertia/types`, dans un
  fichier vu par le tsconfig serveur — donc hors de `inertia/`, qui en est exclu.

Deux autres, découverts en faisant tourner l'application :

- **`@viteReactRefresh()` est obligatoire dans le gabarit Edge**, avant `@vite()`. Le préambule
  de Fast Refresh est normalement injecté par Vite dans son propre HTML ; ici le document vient
  d'Edge. Sans lui : « can't detect preamble », et rien ne monte.
- Le code de `shared/` ne doit **pas** dépendre d'un alias de bundler. Ses imports sont relatifs
  et portent l'extension `.ts` explicite — la seule forme que Vite, Vitest et le compilateur
  Adonis acceptent tous les trois.

Disposition finale : `shared/{lib,data}` importé par les deux côtés, `inertia/{app,pages,components,lib}`
pour le client, `app/ bin/ config/ start/` pour le serveur. Les alias `@/lib` et `@/data`
pointent vers `shared/`, `@/*` vers `inertia/` — aucun import de composant n'a été touché.
