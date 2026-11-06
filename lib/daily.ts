import { randomFrom } from './random.ts'
import { MODES, type Mode, type Question } from './quiz.ts'
import { DEFAULT_SETTINGS, buildRounds } from './room.ts'

/**
 * The Daily: ten questions, the same for everyone on a given day.
 *
 * Drawn in the browser from a seed derived from the date, like a multiplayer
 * game is drawn from its seed — so it needs no server, and stays playable
 * offline. Every mode takes part, over the whole world.
 */

export const DAILY_LENGTH = 10

/** A stable 32-bit seed from a `YYYY-MM-DD` day (FNV-1a). */
export function dailySeed(day: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < day.length; i++) {
    hash ^= day.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function dailyQuestions(day: string): Array<{ mode: Mode; question: Question }> {
  const settings = {
    ...DEFAULT_SETTINGS,
    modes: Object.keys(MODES) as Mode[],
    scope: null,
    roundCount: DAILY_LENGTH,
  }
  return buildRounds(settings, randomFrom(dailySeed(day)))
}
