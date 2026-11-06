'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button, Icon } from '@/components/ui'

/**
 * Sign-in is an offer, never a wall: everything is playable as a Guest. An
 * Account only carries the passport from one device to another.
 */
export function AuthButton() {
  const { signIn, signOut } = useAuthActions()
  const { isLoading, isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip')

  if (isLoading) return null

  if (!isAuthenticated) {
    return (
      <Button variant="outline" size="sm" onClick={() => void signIn('google')}>
        Connexion Google
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {me?.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- a Google avatar, served by Google.
        <img src={me.image} alt="" className="size-8 rounded-full border-2 border-navy" />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-full border-2 border-navy font-display text-navy">
          {me?.name.charAt(0) ?? '·'}
        </span>
      )}
      <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{me?.name}</span>
      <Button variant="ghost" size="icon" aria-label="Se déconnecter" onClick={() => void signOut()}>
        <Icon name="logout" />
      </Button>
    </div>
  )
}
