'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { dayOf } from '@/lib/progress'

/**
 * L'horloge du navigateur, lue seulement côté client.
 *
 * Le serveur ne connaît pas l'heure du joueur : il rend `null`, et le client
 * prend le relais après l'hydratation — sans écart entre les deux rendus. La
 * valeur est arrondie au pas demandé, pour ne redessiner qu'à ce rythme.
 */
export function useClock(stepMs: number): number | null {
  // Un abonnement stable : un nouveau à chaque rendu réarmerait le minuteur.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const timer = setInterval(onChange, Math.min(stepMs, 1000))
      return () => clearInterval(timer)
    },
    [stepMs],
  )
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / stepMs) * stepMs,
    () => null,
  )
}

/** Le jour en cours (UTC), ou `null` avant l'hydratation. */
export function useToday(): string | null {
  const minute = useClock(60_000)
  return minute === null ? null : dayOf(minute)
}
