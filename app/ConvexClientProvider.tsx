'use client'

import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs'
import { ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'

// One client for the whole app. Its queries are reactive: a Room re-renders for
// every player as soon as it is written, with no polling and no broadcast code.
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>
}
