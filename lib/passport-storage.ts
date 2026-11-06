import { EMPTY_PROGRESS, type Best, type Progress } from './progress.ts'
import type { Mode } from './quiz.ts'

/**
 * A Guest's passport, kept in this browser. Browser-only: never import it from
 * Convex code.
 *
 * Unreadable storage — private browsing, a quota — means playing without a
 * passport rather than not playing.
 */

const KEY = 'geoquiz.passport'
/** Where best scores lived before the passport existed. Read once, then folded in. */
const LEGACY_BEST_KEY = 'geoquiz.best-scores'

/**
 * The passport as a store React can subscribe to (`useSyncExternalStore`): one
 * snapshot, kept until a write replaces it, so every read between two writes
 * returns the same object.
 */
let snapshot: Progress | null = null
const listeners = new Set<() => void>()

export function subscribeGuestPassport(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function guestPassportSnapshot(): Progress {
  snapshot ??= readGuestPassport()
  return snapshot
}

function changed(progress: Progress) {
  snapshot = progress
  for (const listener of listeners) listener()
}

export function readGuestPassport(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...EMPTY_PROGRESS, ...(JSON.parse(raw) as Partial<Progress>) }
    return { ...EMPTY_PROGRESS, best: readLegacyBest() }
  } catch {
    return EMPTY_PROGRESS
  }
}

export function writeGuestPassport(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
    localStorage.removeItem(LEGACY_BEST_KEY)
  } catch {
    // Without storage the passport lasts as long as the tab: no harm done.
  }
  changed(progress)
}

export function clearGuestPassport() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(LEGACY_BEST_KEY)
  } catch {
    // Nothing to clear.
  }
  changed(EMPTY_PROGRESS)
}

/** `{ "flags:Europe": 80, "capitals:monde": 55 }` → best entries. */
function readLegacyBest(): Best[] {
  const raw = localStorage.getItem(LEGACY_BEST_KEY)
  if (!raw) return []
  const scores = JSON.parse(raw) as Record<string, number>
  return Object.entries(scores).map(([key, percent]) => {
    const [mode, scope] = key.split(':')
    return { mode: mode as Mode, scope: scope === 'monde' ? null : (scope as Best['scope']), percent }
  })
}
