import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  rootView: 'app',
  ssr: { enabled: false, entrypoint: 'inertia/app/ssr.tsx' },
})
