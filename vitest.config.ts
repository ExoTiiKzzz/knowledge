import { defineConfig } from 'vitest/config'
import { alias } from './vite.config.ts'

/**
 * Les tests portent sur `shared/` — logique pure, sans DOM. Ils tournent hors du
 * greffon Adonis, qui n'a rien à faire dans une exécution de tests.
 */
export default defineConfig({
  resolve: { alias },
  test: { include: ['shared/**/*.test.ts'] },
})
