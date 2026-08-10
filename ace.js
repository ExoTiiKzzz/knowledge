/*
|--------------------------------------------------------------------------
| Point d'entrée JavaScript des commandes ace
|--------------------------------------------------------------------------
|
| Depuis AdonisJS 7, le transpileur TypeScript se charge par le drapeau Node
| `--import=@poppinss/ts-exec`. L'importer ici plutôt que de compter sur le
| drapeau rend `node ace <commande>` utilisable tel quel — ce que supposent la
| documentation, les outils, et les images de déploiement qui appellent
| `node ace build` sans passer par npm.
|
| L'import statique est évalué avant le corps du module, donc les crochets de
| résolution sont en place quand `bin/console.ts` est chargé juste après.
*/
import '@poppinss/ts-exec'

await import('./bin/console.js')
