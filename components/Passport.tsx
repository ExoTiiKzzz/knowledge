'use client'

import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { api } from '@/convex/_generated/api'
import {
  clearGuestPassport,
  guestPassportSnapshot,
  readGuestPassport,
  subscribeGuestPassport,
  writeGuestPassport,
} from '@/lib/passport-storage'
import {
  EMPTY_PROGRESS,
  dayOf,
  recordGame,
  type Earned,
  type GameRecord,
  type Progress,
} from '@/lib/progress'

type PassportContext = {
  /** Null while an Account's passport is loading. */
  progress: Progress | null
  signedIn: boolean
  /** Records a finished game wherever the passport lives, and says what it earned. */
  record: (game: GameRecord) => Promise<Earned>
}

const Context = createContext<PassportContext>({
  progress: EMPTY_PROGRESS,
  signedIn: false,
  record: async () => recordGame(EMPTY_PROGRESS, { kind: 'daily', day: '', answers: [] }, '').earned,
})

/**
 * The passport, wherever it lives: in this browser for a Guest, on the Account
 * once signed in. Pages ask for it here and never care which.
 *
 * On first sign-in, a Guest passport that holds anything is merged into the
 * Account and then forgotten here, so it is merged once.
 */
export function PassportProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const account = useQuery(api.passports.get, isAuthenticated ? {} : 'skip')
  const recordOnAccount = useMutation(api.passports.record)
  const adopt = useMutation(api.passports.adopt)

  // The server renders an empty passport; the browser's own takes over once hydrated.
  const guest = useSyncExternalStore(
    subscribeGuestPassport,
    guestPassportSnapshot,
    () => EMPTY_PROGRESS,
  )

  const adopting = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || adopting.current) return
    const local = readGuestPassport()
    const empty = local.miles === 0 && local.stamps.length === 0 && local.best.length === 0
    if (empty) return
    adopting.current = true
    adopt({ progress: local })
      .then(() => clearGuestPassport())
      .finally(() => {
        adopting.current = false
      })
  }, [isAuthenticated, adopt])

  const record = useCallback(
    async (game: GameRecord): Promise<Earned> => {
      if (isAuthenticated) return await recordOnAccount({ game })

      const current = readGuestPassport()
      const { progress, earned } = recordGame(current, game, dayOf(Date.now()))
      if (earned.counted) writeGuestPassport(progress)
      return earned
    },
    [isAuthenticated, recordOnAccount],
  )

  const progress = isLoading ? null : isAuthenticated ? (account ?? null) : guest

  return (
    <Context.Provider value={{ progress, signedIn: isAuthenticated, record }}>
      {children}
    </Context.Provider>
  )
}

export function usePassport(): PassportContext {
  return useContext(Context)
}
