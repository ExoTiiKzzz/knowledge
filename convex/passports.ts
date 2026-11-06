import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import type { Mode, Scope } from '../lib/quiz'
import {
  EMPTY_PROGRESS,
  dayOf,
  mergeProgress,
  recordGame,
  type GameRecord,
  type Progress,
} from '../lib/progress'

/**
 * An Account's passport. The rules are lib/progress.ts, the same ones a
 * Guest's browser applies to its own: this file only stores the result.
 *
 * Anti-cheat is out of scope, as everywhere in this product (ADR-0002): a
 * forged game earns miles. What the server does guarantee is the calendar — the
 * day a Daily counts for is the server's, not the browser's.
 */

const progressFields = {
  miles: v.number(),
  stamps: v.array(v.string()),
  best: v.array(
    v.object({ mode: v.string(), scope: v.union(v.string(), v.null()), percent: v.number() }),
  ),
  streak: v.number(),
  lastDailyDay: v.union(v.string(), v.null()),
  daily: v.union(
    v.null(),
    v.object({ day: v.string(), points: v.number(), correct: v.number(), total: v.number() }),
  ),
}

const answers = v.array(
  v.object({ mode: v.string(), code: v.string(), correct: v.boolean(), points: v.number() }),
)

function toProgress(doc: Doc<'passports'> | null): Progress {
  if (!doc) return EMPTY_PROGRESS
  const { miles, stamps, best, streak, lastDailyDay, daily } = doc
  return { miles, stamps, best, streak, lastDailyDay, daily } as Progress
}

async function save(ctx: MutationCtx, userId: Id<'users'>, doc: Doc<'passports'> | null, progress: Progress) {
  if (doc) await ctx.db.patch(doc._id, progress)
  else await ctx.db.insert('passports', { userId, ...progress })
}

async function mine(ctx: MutationCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('passports')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique()
}

/** The signed-in player's passport, or null for a Guest. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const doc = await ctx.db
      .query('passports')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    return toProgress(doc)
  },
})

/** Records a finished solo game or Daily. Returns what it earned. */
export const record = mutation({
  args: {
    game: v.union(
      v.object({
        kind: v.literal('solo'),
        mode: v.string(),
        scope: v.union(v.string(), v.null()),
        answers,
        retry: v.optional(v.boolean()),
      }),
      v.object({ kind: v.literal('daily'), day: v.string(), answers }),
    ),
  },
  handler: async (ctx, { game }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('not signed in')

    const doc = await mine(ctx, userId)
    const { progress, earned } = recordGame(toProgress(doc), game as GameRecord, dayOf(Date.now()))
    if (earned.counted) await save(ctx, userId, doc, progress)
    return earned
  },
})

/**
 * Merges a Guest's passport into the Account, on signing in. The browser
 * forgets its own copy once this returns, so it is merged once.
 */
export const adopt = mutation({
  args: { progress: v.object(progressFields) },
  handler: async (ctx, { progress }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('not signed in')

    const doc = await mine(ctx, userId)
    const guest = {
      ...progress,
      best: progress.best.map((b) => ({ ...b, mode: b.mode as Mode, scope: b.scope as Scope })),
    }
    await save(ctx, userId, doc, mergeProgress(toProgress(doc), guest))
  },
})
