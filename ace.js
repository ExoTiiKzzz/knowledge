/*
| Point d'entrée JavaScript des commandes ace.
| En v7, le transpileur TypeScript se charge via --import=@poppinss/ts-exec,
| passé par les scripts npm — ce fichier ne fait plus que déléguer.
*/
await import('./bin/console.js')
