# Recette vérifiée : Adonis 7 + Inertia 5 + Vite 8

Obtenue empiriquement sur une sonde jetable, jusqu'à **HTTP 200 avec une page Inertia rendue**.
Le starter kit officiel (`github:adonisjs/inertia-starter-kit`) est resté en **Adonis 6 / Vite 6** :
il n'existe aucune branche v7. Le squelette v7 se construit donc à la main, et ce document existe
pour que le ticket 02 n'ait pas à redécouvrir les sept pièges ci-dessous.

## Jeu de dépendances qui résout

```
@adonisjs/core ^7.4.0        @adonisjs/inertia ^5.0.0     @adonisjs/session ^8.0.0
@adonisjs/shield ^9.0.0      @adonisjs/static ^2.0.1      @adonisjs/vite ^6.0.0
@inertiajs/react ^3.6.1      edge.js ^6.2.1               reflect-metadata

dev : @adonisjs/assembler ^8.0.0   @adonisjs/tsconfig ^2.0.0   @poppinss/ts-exec
      @swc/core   hot-hook   pino-pretty   vite ^8.2.0   @vitejs/plugin-react ^6
```

## Les sept pièges, dans l'ordre où ils se présentent

1. **`@adonisjs/static` doit être en `^2.0.1`.** La série 1.x exige `core ^6` et bloque toute
   l'installation. C'est la seule dépendance dont le rang majeur ne suit pas celui du framework.

2. **Les hooks d'assembler ont perdu leur préfixe `on`.** `onBuildStarting` devient
   `buildStarting`. Les noms valides sont `init`, `routesScanning`, `routesScanned`,
   `routesCommitted`, `buildStarting`, `buildFinished`, `devServerStarting`.

3. **Le transpileur TypeScript a changé.** `ts-node-maintained/register/esm` disparaît au profit
   de `--import=@poppinss/ts-exec` passé à Node. `ace.js` ne contient donc plus qu'un
   `await import('./bin/console.js')`, et les scripts npm portent le drapeau. Sans le tsconfig
   v2 (qui active `rewriteRelativeImportExtensions`), la résolution des imports `.ts` échoue.

4. **`config/encryption.ts` est requis et nouveau.** Son absence coupe le démarrage. La forme
   attendue est `defineConfig({ default, list: { app: drivers.aes256gcm({ id, keys: [...] }) } })` —
   ni `aes256cbc` importé depuis un sous-chemin, ni une clé nue.

5. **`@adonisjs/inertia` n'expose pas de hook `configure`.** `node ace configure @adonisjs/inertia`
   ne fait rien : `config/inertia.ts`, le gabarit Edge racine et l'entrée front sont à écrire.
   Les autres paquets, eux, se configurent bien tout seuls.

6. **Le middleware Inertia est une classe *abstraite* à étendre.** Elle fournit `init(ctx)`,
   `dispose(ctx)` et `getValidationErrors()`, mais **pas** `handle` — c'est le corps du middleware
   qui nous appartient :

   ```ts
   export default class InertiaMiddleware extends BaseInertiaMiddleware {
     async handle(ctx: HttpContext, next: NextFn) {
       await this.init(ctx)
       try {
         return await next()
       } finally {
         this.dispose(ctx)
       }
     }
   }
   ```

7. **`pino-pretty` est requis** dès que `config/logger.ts` déclare la cible `pretty`, sinon
   « unable to determine transport target ».

## Correction à apporter à l'ADR-0001

L'ADR affirme que client et serveur forment « un seul projet TypeScript ». C'est **inexact** :
`@adonisjs/tsconfig` v2 **exclut `inertia/**`** du projet serveur. Il y a deux projets
TypeScript, donc deux `tsconfig`.

La conclusion pratique tient malgré tout — aucun workspace ni paquet publié n'est nécessaire —
mais elle demande une précaution : le code partagé par les deux côtés doit vivre dans un
répertoire **inclus par les deux tsconfig**, et non sous `inertia/`. D'où un dossier `shared/`
pour la correction, le tirage et le jeu de données.

## Disposition cible pour le dépôt

```
shared/          ← importé par le serveur ET le front (pur, sans DOM ni Node)
  data/          countries.ts, map.ts
  lib/           answer.ts, quiz.ts, random.ts, salon.ts
inertia/
  app/           app.tsx, index.css
  pages/         solo.tsx, salon.tsx
  components/    l'existant, inchangé
app/ bin/ config/ start/     ← serveur
resources/views/app.edge
```

Les alias Vite doivent mapper `@/lib` et `@/data` vers `shared/`, et `@/*` vers `inertia/*`,
**dans cet ordre**. Tous les imports existants (`@/lib/quiz`, `@/components/ui/button`) restent
alors valables sans être touchés.
