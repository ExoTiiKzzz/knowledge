import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DM_Serif_Display, IBM_Plex_Mono, Inter } from 'next/font/google'
import './globals.css'
import { ConvexClientProvider } from './ConvexClientProvider'
import { PassportProvider } from '@/components/Passport'
import { SiteHeader } from '@/components/SiteHeader'

// A travel notebook: a serif for the headings, a typewriter for every label,
// and a plain sans to read.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const dmSerif = DM_Serif_Display({
  variable: '--font-dm-serif',
  weight: '400',
  subsets: ['latin'],
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  weight: ['500', '600'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Géo Quiz — drapeaux, capitales & carte',
  description: 'Quiz sur les drapeaux, les capitales et la carte des pays du monde. En solo, au défi du jour, ou à plusieurs dans un salon.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌍</text></svg>",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="fr"
        className={`${inter.variable} ${dmSerif.variable} ${plexMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col">
          <ConvexClientProvider>
            <PassportProvider>
              <SiteHeader />
              {children}
            </PassportProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  )
}
