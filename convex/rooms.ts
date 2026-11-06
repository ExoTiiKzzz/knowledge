import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { internalMutation, mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { CONTINENTS, type Continent } from '../data/countries'
import { MODES, type Mode } from '../lib/quiz'
import { randomSeed } from '../lib/random'
import {
  DEFAULT_SETTINGS,
  HEARTBEAT_MS,
  RejectionError,
  createRoom,
  pendingWake,
  reduce,
  viewFor,
  type Rejection,
  type Room,
  type RoomEvent,
  type Settings,
} from '../lib/room'

/**
 * The adapter around the room engine.
 *
 * lib/room.ts decides everything and runs nothing; this file runs what it
 * describes. A broadcast needs no code at all — `view` is a reactive query, so
 * every player re-renders as soon as the Room is written. A wake-up becomes a
 * scheduled function.
 *
 * The server stays the sole judge (ADR-0002): a browser sends raw input, never
 * a verdict.
 */

/** No I, O, 0 or 1: a code can be read out loud without being repeated. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 4

/** A player whose browser has not checked in for this long is shown as away. */
const STALE_MS = 3 * HEARTBEAT_MS

/** A Room nobody has looked at for this long is deleted. */
const ABANDONED_MS = 30 * 60_000

/** Player-facing message for each rejection. In French: it is the UI. */
const MESSAGES: Record<Rejection, string> = {
  unknown: "Ce salon n'existe pas ou n'existe plus.",
  'room-closed': 'Ce salon est fermé.',
  'room-full': 'Ce salon est complet.',
  'name-taken': 'Ce nom est déjà pris dans ce salon.',
  'not-host': "Seul l'hôte peut faire cela.",
  'game-running': 'Une partie est en cours.',
  'no-mode': 'Choisis au moins un mode.',
  'no-round': "Aucune manche n'est ouverte.",
  'already-answered': 'Tu as déjà répondu à cette manche.',
  'not-in-play': 'Tu entres en jeu à la manche suivante.',
}

function rejection(reason: Rejection) {
  return new ConvexError({ reason, message: MESSAGES[reason] })
}

async function load(ctx: QueryCtx, code: string): Promise<Doc<'rooms'> | null> {
  return await ctx.db
    .query('rooms')
    .withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
    .unique()
}

/**
 * Applies an event and carries out what the engine asks for.
 *
 * The wake-up is reconciled against the state rather than taken from the
 * `wake` effect: an answer that leaves the round open emits no `wake`, and must
 * not lose the pending deadline. A scheduled wake that the Room no longer waits
 * for is simply ignored when it fires — see `wake`.
 */
async function apply(ctx: MutationCtx, code: string, event: RoomEvent): Promise<Room | null> {
  const doc = await load(ctx, code)
  if (!doc) throw rejection('unknown')

  const before = doc.state as Room
  const now = Date.now()

  let room: Room
  try {
    room = reduce(before, event, now).room
  } catch (error) {
    if (error instanceof RejectionError) throw rejection(error.reason)
    throw error
  }

  if (room.closed) {
    await ctx.db.delete(doc._id)
    await clearPresence(ctx, room.code)
    return null
  }

  await ctx.db.patch(doc._id, { state: room, updatedAt: now })

  const wanted = pendingWake(room)
  const previous = pendingWake(before)
  if (wanted && !(previous && previous.at === wanted.at && previous.event === wanted.event)) {
    await ctx.scheduler.runAt(wanted.at, internal.rooms.wake, {
      code: room.code,
      at: wanted.at,
      event: wanted.event,
    })
  }
  return room
}

async function clearPresence(ctx: MutationCtx, code: string) {
  const rows = await ctx.db
    .query('presence')
    .withIndex('by_code', (q) => q.eq('code', code))
    .collect()
  for (const row of rows) await ctx.db.delete(row._id)
}

async function freshCode(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = Array.from(
      { length: CODE_LENGTH },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
    ).join('')
    if (!(await load(ctx, code))) return code
  }
  // 32⁴ combinations: reaching this would mean tens of thousands of rooms.
  throw new Error('could not draw a free room code')
}

function cleanName(raw: string): string {
  const name = raw.trim().slice(0, 24)
  if (!name) throw new ConvexError({ reason: 'no-name', message: 'Choisis un nom.' })
  return name
}

async function touch(ctx: MutationCtx, code: string, token: string, now: number) {
  const row = await ctx.db
    .query('presence')
    .withIndex('by_code_token', (q) => q.eq('code', code).eq('token', token))
    .unique()
  if (row) await ctx.db.patch(row._id, { lastSeenAt: now })
  else await ctx.db.insert('presence', { code, token, lastSeenAt: now })
}

// ————————————————————————————————————————————————————————————— reads

/** The Room as this player may see it, or null once it is gone. */
export const view = query({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, { code, token }) => {
    const doc = await load(ctx, code)
    return doc ? viewFor(doc.state as Room, token) : null
  },
})

// ————————————————————————————————————————————————————————————— writes

/** Creates a Room and seats its creator, who becomes the host. */
export const create = mutation({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, { token, name }) => {
    const code = await freshCode(ctx)
    const now = Date.now()
    const room = reduce(
      createRoom(code, { ...DEFAULT_SETTINGS }),
      { type: 'join', token, name: cleanName(name) },
      now,
    ).room
    await ctx.db.insert('rooms', { code, state: room, updatedAt: now })
    await touch(ctx, code, token, now)
    return code
  },
})

/** Joins a Room, or takes a seat back when the token is already known. */
export const join = mutation({
  args: { code: v.string(), token: v.string(), name: v.string() },
  handler: async (ctx, { code, token, name }) => {
    const room = await apply(ctx, code, { type: 'join', token, name: cleanName(name) })
    if (room) await touch(ctx, room.code, token, Date.now())
  },
})

/** Leaves the Room. The last one out closes it. */
export const leave = mutation({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, { code, token }) => {
    await apply(ctx, code, { type: 'leave', token })
    const row = await ctx.db
      .query('presence')
      .withIndex('by_code_token', (q) => q.eq('code', code.toUpperCase()).eq('token', token))
      .unique()
    if (row) await ctx.db.delete(row._id)
  },
})

// Derived rather than listed: a new mode is playable in a room the moment it exists.
const VALID_MODES = Object.keys(MODES) as Mode[]

/**
 * Changes the settings. Host only, and only outside a game. Values are clamped
 * here rather than trusted: a request is not a form.
 */
export const updateSettings = mutation({
  args: {
    code: v.string(),
    token: v.string(),
    modes: v.optional(v.array(v.string())),
    scope: v.optional(v.union(v.string(), v.null())),
    roundCount: v.optional(v.number()),
    roundDuration: v.optional(v.number()),
  },
  handler: async (ctx, { code, token, modes, scope, roundCount, roundDuration }) => {
    const partial: Partial<Settings> = {}
    if (modes) partial.modes = modes.filter((m): m is Mode => VALID_MODES.includes(m as Mode))
    if (scope !== undefined) {
      partial.scope = CONTINENTS.includes(scope as Continent) ? (scope as Continent) : null
    }
    if (roundCount !== undefined) {
      partial.roundCount = Math.min(194, Math.max(1, Math.round(roundCount) || 20))
    }
    if (roundDuration !== undefined) {
      partial.roundDuration = Math.min(60_000, Math.max(5_000, roundDuration || 15_000))
    }
    await apply(ctx, code, { type: 'settings', token, settings: partial })
  },
})

/** Starts a game. The seed is drawn here, never by a browser. */
export const start = mutation({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, { code, token }) => {
    await apply(ctx, code, { type: 'start', token, seed: randomSeed() })
  },
})

/**
 * Submits an answer: the raw input, and the time the browser measured, which
 * the engine clamps before keeping it (ADR-0003).
 */
export const answer = mutation({
  args: { code: v.string(), token: v.string(), input: v.string(), ms: v.number() },
  handler: async (ctx, { code, token, input, ms }) => {
    await apply(ctx, code, { type: 'answer', token, input: input.slice(0, 100), claimedMs: ms })
  },
})

/**
 * Says this player is still here, every `HEARTBEAT_MS`.
 *
 * It also does the rounds for everyone else: whoever stopped checking in is
 * marked disconnected, which may close a round they were holding up. A player
 * coming back is reconnected by their own next heartbeat.
 */
export const heartbeat = mutation({
  args: { code: v.string(), token: v.string() },
  handler: async (ctx, { code, token }) => {
    const doc = await load(ctx, code)
    if (!doc) return
    const now = Date.now()
    const room = doc.state as Room
    const me = room.players.find((p) => p.token === token)
    if (!me) return

    await touch(ctx, room.code, token, now)
    if (!me.connected) await apply(ctx, room.code, { type: 'join', token, name: me.name })
    await disconnectStale(ctx, room.code, now)
  },
})

async function disconnectStale(ctx: MutationCtx, code: string, now: number) {
  const doc = await load(ctx, code)
  if (!doc) return
  const rows = await ctx.db
    .query('presence')
    .withIndex('by_code', (q) => q.eq('code', code))
    .collect()
  const seen = new Map(rows.map((r) => [r.token, r.lastSeenAt]))

  for (const player of (doc.state as Room).players) {
    const last = seen.get(player.token) ?? 0
    if (player.connected && now - last > STALE_MS) {
      await apply(ctx, code, { type: 'disconnect', token: player.token })
    }
  }
}

// ————————————————————————————————————————————————————————————— scheduled

/** Fires a deadline or the end of a results pause, if the Room still waits for it. */
export const wake = internalMutation({
  args: { code: v.string(), at: v.number(), event: v.union(v.literal('deadline'), v.literal('resume')) },
  handler: async (ctx, { code, at, event }) => {
    const doc = await load(ctx, code)
    if (!doc) return
    const wanted = pendingWake(doc.state as Room)
    // The Room moved on since this was scheduled — an early close, a new game.
    if (!wanted || wanted.at !== at || wanted.event !== event) return
    await apply(ctx, code, { type: event })
  },
})

/**
 * Housekeeping, from convex/crons.ts. Marks away the players of Rooms where no
 * heartbeat arrives any more — nobody is left to notice — and deletes the
 * Rooms nobody has touched in half an hour.
 */
export const sweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const idle = await ctx.db
      .query('rooms')
      .withIndex('by_updated', (q) => q.lt('updatedAt', now - STALE_MS))
      .take(100)

    for (const doc of idle) {
      const rows = await ctx.db
        .query('presence')
        .withIndex('by_code', (q) => q.eq('code', doc.code))
        .collect()
      const lastSeen = Math.max(doc.updatedAt, ...rows.map((r) => r.lastSeenAt))
      if (now - lastSeen > ABANDONED_MS) {
        await ctx.db.delete(doc._id)
        await clearPresence(ctx, doc.code)
      } else {
        await disconnectStale(ctx, doc.code, now)
      }
    }
  },
})
