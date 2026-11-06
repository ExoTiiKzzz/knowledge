import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Sessions, accounts, refresh tokens and the rest of Convex Auth's bookkeeping.
  ...authTables,

  /**
   * A Room, whole, as the engine in lib/room.ts holds it.
   *
   * Stored as one value rather than spread over tables because the engine is a
   * pure reducer, `(room, event, now) → room`: a mutation loads it, reduces,
   * and writes it back, and Convex's transactions make that serial. Splitting
   * it would mean a second copy of the rules. `state` is typed by `Room`, not
   * by a validator, so the engine stays the one place that defines it.
   */
  rooms: defineTable({
    code: v.string(),
    state: v.any(),
    updatedAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_updated', ['updatedAt']),

  /**
   * When each player's browser last said it was there.
   *
   * Kept out of the Room so a heartbeat writes a row nobody subscribes to,
   * instead of rewriting the Room and re-rendering every player every few
   * seconds. A player whose heartbeat stops is marked disconnected in the Room.
   */
  presence: defineTable({
    code: v.string(),
    token: v.string(),
    lastSeenAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_code_token', ['code', 'token']),

  /**
   * An Account's passport, as lib/progress.ts defines it. A Guest's lives in
   * their browser instead, and is merged here on their first sign-in.
   */
  passports: defineTable({
    userId: v.id('users'),
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
  }).index('by_user', ['userId']),
})
