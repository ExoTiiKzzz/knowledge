import { CONTINENTS, type Continent } from '../data/countries.ts'
import type { Verdict } from './answer.ts'
import { countriesIn, countryByCode, type Mode, type Scope } from './quiz.ts'
import { pointsFor } from './room.ts'

/**
 * A player's progress: the passport.
 *
 * Pure rules, shared by the browser — which keeps a Guest's passport in local
 * storage — and by Convex, which keeps an Account's. Neither side computes
 * anything the other could not: the same game recorded on either gives the same
 * passport.
 *
 * Only solo play and the Daily feed it. A multiplayer score is earned against a
 * clock and against other people, which makes it incomparable — see ADR-0003.
 *
 * Vocabulary (CONTEXT.md): Miles = the experience, Grade = the level, Stamp = a
 * country found in a mode, Combo = correct answers in a row, Daily = the
 * challenge of the day, Streak = consecutive days it was played.
 */

// ————————————————————————————————————————————————————————————— solo scoring

/**
 * The pace a solo answer is scored against. Solo has no deadline: past this,
 * a correct answer simply stops losing value.
 */
export const SOLO_PACE_MS = 15_000

/** Combo thresholds, highest first: correct answers in a row → multiplier. */
export const COMBO_STEPS = [
  { from: 10, multiplier: 3 },
  { from: 6, multiplier: 2 },
  { from: 3, multiplier: 1.5 },
] as const

/** The multiplier earned by `combo` correct answers in a row, the current one included. */
export function comboMultiplier(combo: number): number {
  return COMBO_STEPS.find((step) => combo >= step.from)?.multiplier ?? 1
}

/** The next combo after an answer: one more if it was right, back to zero if not. */
export function nextCombo(combo: number, verdict: Verdict): number {
  return verdict.status === 'wrong' ? 0 : combo + 1
}

/**
 * Points for a solo answer: the multiplayer decay over `SOLO_PACE_MS`, times
 * the combo the answer reaches. A wrong answer is worth nothing and breaks it.
 */
export function soloPoints(verdict: Verdict, ms: number, comboBefore: number): number {
  if (verdict.status === 'wrong') return 0
  const base = pointsFor(verdict, ms, SOLO_PACE_MS)
  return Math.round(base * comboMultiplier(comboBefore + 1))
}

// ————————————————————————————————————————————————————————————— miles & grades

/** Points to miles. A ten-question game played well is worth about a thousand. */
export const POINTS_PER_MILE = 10

/** Miles needed to reach `level`: 0, 500, 1500, 3000, 5000… */
export function milesForLevel(level: number): number {
  return 250 * level * (level - 1)
}

export function levelFor(miles: number): number {
  let level = 1
  while (milesForLevel(level + 1) <= miles) level++
  return level
}

/** The named Grades, by the level they start at. */
export const GRADES = [
  { from: 1, name: 'Touriste' },
  { from: 3, name: 'Routard' },
  { from: 6, name: 'Voyageur' },
  { from: 10, name: 'Baroudeur' },
  { from: 15, name: 'Grand voyageur' },
  { from: 21, name: 'Explorateur' },
  { from: 28, name: 'Cartographe' },
  { from: 36, name: 'Globe-trotter' },
] as const

export function gradeFor(level: number): string {
  return [...GRADES].reverse().find((grade) => level >= grade.from)!.name
}

/** Where a player stands within their level, for a progress bar. */
export function levelProgress(miles: number) {
  const level = levelFor(miles)
  const floor = milesForLevel(level)
  const ceiling = milesForLevel(level + 1)
  return {
    level,
    grade: gradeFor(level),
    into: miles - floor,
    span: ceiling - floor,
  }
}

// ————————————————————————————————————————————————————————————— stamps

/** A Stamp's key: the mode and the country, `flags:FR`. ASCII, so Convex can store it. */
export function stampKey(mode: Mode, code: string): string {
  return `${mode}:${code}`
}

export const MEDALS = [
  { medal: 'or', share: 1 },
  { medal: 'argent', share: 0.6 },
  { medal: 'bronze', share: 0.25 },
] as const

export type Medal = (typeof MEDALS)[number]['medal']

export type Mastery = {
  continent: Continent
  mode: Mode
  stamped: number
  total: number
  medal: Medal | null
}

/** How much of a continent a player has stamped in a mode, and the medal it earns. */
export function masteryOf(stamps: readonly string[], mode: Mode, continent: Continent): Mastery {
  const owned = new Set(stamps)
  const pool = countriesIn(continent, mode)
  const stamped = pool.filter((c) => owned.has(stampKey(mode, c.code))).length
  const share = pool.length ? stamped / pool.length : 0
  const medal = MEDALS.find((m) => share >= m.share)?.medal ?? null
  return { continent, mode, stamped, total: pool.length, medal }
}

export function masteryByContinent(stamps: readonly string[], mode: Mode): Mastery[] {
  return CONTINENTS.map((continent) => masteryOf(stamps, mode, continent))
}

// ————————————————————————————————————————————————————————————— daily & streak

/** The calendar day an instant belongs to, in UTC: the Daily changes for everyone at once. */
export function dayOf(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

export function previousDay(day: string): string {
  return dayOf(Date.parse(`${day}T00:00:00Z`) - 86_400_000)
}

/** Each streak day adds a tenth to the Daily's miles, up to double. */
export function dailyBonus(streak: number): number {
  return 1 + Math.min(streak, 10) / 10
}

/** The streak as it stands today: broken once a whole day has passed unplayed. */
export function liveStreak(progress: Pick<Progress, 'streak' | 'lastDailyDay'>, today: string): number {
  const last = progress.lastDailyDay
  if (last === today || last === previousDay(today)) return progress.streak
  return 0
}

// ————————————————————————————————————————————————————————————— the passport

export type Best = { mode: Mode; scope: Scope; percent: number }

export type DailyResult = { day: string; points: number; correct: number; total: number }

export type Progress = {
  miles: number
  /** Stamp keys, `mode:CODE`, each at most once. */
  stamps: string[]
  /** Best solo score per mode and scope, as a percentage. */
  best: Best[]
  streak: number
  lastDailyDay: string | null
  /** The most recent Daily played, to show its result for the rest of the day. */
  daily: DailyResult | null
}

export const EMPTY_PROGRESS: Progress = {
  miles: 0,
  stamps: [],
  best: [],
  streak: 0,
  lastDailyDay: null,
  daily: null,
}

/** One answer of a finished game, as the passport needs it. */
export type RecordedAnswer = { mode: Mode; code: string; correct: boolean; points: number }

export type GameRecord =
  /** `retry`: only the previous game's mistakes, so 3 out of 3 is no record. */
  | { kind: 'solo'; mode: Mode; scope: Scope; answers: RecordedAnswer[]; retry?: boolean }
  | { kind: 'daily'; day: string; answers: RecordedAnswer[] }

export type Earned = {
  miles: number
  /** Stamps this game added. */
  stamps: string[]
  levelBefore: number
  levelAfter: number
  /** True when a solo game beat the best score for its mode and scope. */
  newBest: boolean
  streak: number
  /** False when the game was not taken into account — a Daily played twice. */
  counted: boolean
}

export function bestOf(progress: Progress, mode: Mode, scope: Scope): number | null {
  return progress.best.find((b) => b.mode === mode && b.scope === scope)?.percent ?? null
}

/**
 * Adds a finished game to the passport.
 *
 * A Daily counts once per day: replaying it — another tab, another device on
 * the same Account — changes nothing. `today` is the recorder's own day, never
 * the game's, so a Daily kept open past midnight cannot revive a broken streak.
 */
export function recordGame(
  progress: Progress,
  game: GameRecord,
  today: string,
): { progress: Progress; earned: Earned } {
  const levelBefore = levelFor(progress.miles)
  const unchanged = {
    progress,
    earned: {
      miles: 0,
      stamps: [],
      levelBefore,
      levelAfter: levelBefore,
      newBest: false,
      streak: liveStreak(progress, today),
      counted: false,
    },
  }

  // Answers naming a country nobody knows are not stamped, nor counted.
  const answers = game.answers.filter((a) => countryByCode(a.code))
  if (answers.length === 0) return unchanged

  const points = answers.reduce((sum, a) => sum + Math.max(0, a.points), 0)
  const correct = answers.filter((a) => a.correct).length

  let { streak, lastDailyDay, daily, best } = progress
  let multiplier = 1
  let newBest = false

  if (game.kind === 'daily') {
    if (game.day !== today || progress.daily?.day === today) return unchanged
    streak = lastDailyDay === previousDay(today) ? streak + 1 : 1
    lastDailyDay = today
    multiplier = dailyBonus(streak)
    daily = { day: today, points, correct, total: answers.length }
  } else if (!game.retry) {
    const percent = Math.round((correct / answers.length) * 100)
    const previous = bestOf(progress, game.mode, game.scope)
    if (previous === null || percent > previous) {
      newBest = true
      best = [
        ...best.filter((b) => !(b.mode === game.mode && b.scope === game.scope)),
        { mode: game.mode, scope: game.scope, percent },
      ]
    }
  }

  const owned = new Set(progress.stamps)
  const added: string[] = []
  for (const a of answers) {
    const key = stampKey(a.mode, a.code)
    if (a.correct && !owned.has(key)) {
      owned.add(key)
      added.push(key)
    }
  }

  const miles = Math.round((points / POINTS_PER_MILE) * multiplier)
  const after: Progress = {
    miles: progress.miles + miles,
    stamps: [...progress.stamps, ...added],
    best,
    streak,
    lastDailyDay,
    daily,
  }

  return {
    progress: after,
    earned: {
      miles,
      stamps: added,
      levelBefore,
      levelAfter: levelFor(after.miles),
      newBest,
      streak: liveStreak(after, today),
      counted: true,
    },
  }
}

/**
 * Joins a Guest's passport into an Account's, on signing in.
 *
 * Miles add up, since both were earned; stamps and best scores keep the better
 * of the two; the streak follows whichever passport played the Daily last.
 */
export function mergeProgress(account: Progress, guest: Progress): Progress {
  const best = [...account.best]
  for (const entry of guest.best) {
    const i = best.findIndex((b) => b.mode === entry.mode && b.scope === entry.scope)
    if (i === -1) best.push(entry)
    else if (entry.percent > best[i].percent) best[i] = entry
  }

  const later = (guest.lastDailyDay ?? '') > (account.lastDailyDay ?? '') ? guest : account
  const sameDay = guest.lastDailyDay === account.lastDailyDay

  return {
    miles: account.miles + guest.miles,
    stamps: [...new Set([...account.stamps, ...guest.stamps])],
    best,
    streak: sameDay ? Math.max(account.streak, guest.streak) : later.streak,
    lastDailyDay: later.lastDailyDay,
    daily: later.daily ?? account.daily ?? guest.daily,
  }
}
