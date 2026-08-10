import path from 'node:path'
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const racine = import.meta.dirname

/**
 * `@/lib` et `@/data` désignent toujours `shared/`, importé aussi par le serveur.
 * Tout le reste de `@/*` désigne `inertia/` — dont `@/navigateur/*`, réservé au
 * code qui touche au navigateur (stockage local, transport) et que le serveur ne
 * doit jamais importer. L'ordre compte : le plus spécifique d'abord.
 */
export const alias = [
  { find: '@/lib', replacement: path.join(racine, 'shared/lib') },
  { find: '@/data', replacement: path.join(racine, 'shared/data') },
  { find: '@', replacement: path.join(racine, 'inertia') },
]

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    adonisjs({
      entryPoints: ['inertia/app/app.tsx'],
      reload: ['resources/views/**/*.edge'],
    }),
  ],
  resolve: { alias },
})
