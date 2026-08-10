import './index.css'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('../pages/**/*.tsx', { eager: true })
    return pages[`../pages/${name}.tsx`] as never
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
