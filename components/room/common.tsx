'use client'

import { ConvexError } from 'convex/values'
import type { FunctionReturnType } from 'convex/server'
import { useSyncExternalStore } from 'react'
import type { api } from '@/convex/_generated/api'
import { token } from '@/lib/identity'
import { cn } from '@/lib/utils'

/**
 * What the salon screens share: the view they render, the browser's token, the
 * clock format, and the colour that ties a player to their marker on the map.
 */

/** The room as this player may see it. Its shape is `viewFor` in lib/room.ts. */
export type RoomView = NonNullable<FunctionReturnType<typeof api.rooms.view>>

/** How often a page says its player is still here; convex/rooms.ts reads the same value. */
export { HEARTBEAT_MS } from '@/lib/room'

/**
 * The message to show for a failed call. A rejection carries one written for
 * the player; anything else is the network, or a bug we cannot explain to them.
 */
export function rejectionMessage(error: unknown, fallback = 'Le serveur est injoignable.'): string {
  if (error instanceof ConvexError) {
    const message = (error.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

// The token lives in localStorage, which the server render cannot read. Read
// once and kept: in private browsing `token()` draws a fresh one on every call,
// and a snapshot that changes on every read would never settle.
let cachedToken: string | null = null

/** This browser's player token. Client side only, from an event or an effect. */
export function currentToken(): string {
  return (cachedToken ??= token())
}

const noSubscription = () => () => {}

/** This browser's player token, or `null` during the server render. */
export function useToken(): string | null {
  return useSyncExternalStore(noSubscription, currentToken, () => null)
}

/**
 * `0:09`, as on a departures board. Rounded up: 0:00 means the time is up.
 *
 * Deadlines are server timestamps read against the local clock: both are wall
 * clocks, and a countdown a second off is only indicative anyway — the server
 * is what closes a round.
 */
export function formatClock(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Dot fills, one per colour of the player palette, matching the map markers. */
const DOT_COLOURS: Record<string, string> = {
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  orange: 'bg-orange-500',
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
}

/**
 * Ties a player to their marker on the map.
 *
 * Never alone: colour would then be the only way to tell who aimed where, which
 * leaves out anyone who confuses two hues. The name always sits right beside it.
 */
export function PlayerDot({ colour, className }: { colour: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-3 shrink-0 rounded-full ring-2 ring-sheet',
        DOT_COLOURS[colour] ?? 'bg-ink',
        className,
      )}
    />
  )
}
