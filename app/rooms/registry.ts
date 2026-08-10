import transmit from '@adonisjs/transmit/services/main'
import {
  DEFAULT_SETTINGS,
  RejectionError,
  createRoom,
  pendingWake,
  reduce,
  viewFor,
  type Room,
  type RoomEvent,
} from '../../shared/lib/room.ts'
import { randomSeed } from '../../shared/lib/random.ts'

/**
 * Registry of live rooms, held in memory.
 *
 * The room engine is pure: it returns a state and *effects* without running
 * anything. This registry is the adapter that runs those effects — broadcasting
 * the state to players, and scheduling the wake-up that closes a round at its
 * deadline.
 *
 * Everything lives in memory: restarting the server empties the rooms in
 * progress, which is accepted (ADR-0001).
 */

/** No I, O, 0 or 1: a code can be read out loud without being repeated. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 4

/** A player's channel. Each has their own: views differ from player to player. */
export function channelFor(code: string, token: string): string {
  return `salon/${code}/${token}`
}

class Registry {
  #rooms = new Map<string, Room>()
  /** One pending wake-up per room, with the instant it was scheduled for. */
  #timers = new Map<string, { timer: NodeJS.Timeout; at: number }>()

  /** Creates a room and returns its code. */
  create(): string {
    const code = this.#freeCode()
    this.#rooms.set(code, createRoom(code, { ...DEFAULT_SETTINGS }))
    return code
  }

  find(code: string): Room | undefined {
    return this.#rooms.get(code.toUpperCase())
  }

  /**
   * Applies an event and runs its effects. Throws `RejectionError` when the
   * transition does not happen — the controller turns it into an HTTP response.
   */
  apply(code: string, event: RoomEvent, now = Date.now()): Room {
    const before = this.find(code)
    if (!before) throw new RejectionError('unknown')

    const { room, effects } = reduce(before, event, now)
    this.#rooms.set(room.code, room)

    for (const effect of effects) {
      if (effect.type === 'broadcast') this.#broadcast(room)
    }

    // The timer is reconciled against the state, never merely cancelled: an event
    // that emits no `wake` effect — an answer that leaves the round open, someone
    // joining during the results pause — must not destroy the pending deadline.
    this.#reconcileWake(room, now)

    if (room.closed) {
      this.#cancelWake(room.code)
      this.#rooms.delete(room.code)
    }
    return room
  }

  /** The state as this player is allowed to see it. */
  view(code: string, token: string) {
    const room = this.find(code)
    if (!room) throw new RejectionError('unknown')
    return viewFor(room, token)
  }

  seed(): number {
    return randomSeed()
  }

  #freeCode(): string {
    for (let attempt = 0; attempt < 50; attempt++) {
      const code = Array.from(
        { length: CODE_LENGTH },
        () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
      ).join('')
      if (!this.#rooms.has(code)) return code
    }
    // 32⁴ combinations: reaching this would mean tens of thousands of rooms.
    throw new Error('could not draw a free room code')
  }

  #broadcast(room: Room) {
    for (const player of room.players) {
      transmit.broadcast(channelFor(room.code, player.token), {
        view: viewFor(room, player.token),
      })
    }
  }

  /**
   * Brings the pending timer in line with what the room is waiting on: the
   * deadline of an open round, the end of a results pause, or nothing.
   *
   * Idempotent, and therefore self-healing: whatever the event, the room ends up
   * with exactly the timer its state calls for.
   */
  #reconcileWake(room: Room, now: number) {
    const wanted = pendingWake(room)
    const pending = this.#timers.get(room.code)

    if (!wanted) {
      this.#cancelWake(room.code)
      return
    }
    // Already waiting on that very instant: leave it alone.
    if (pending && pending.at === wanted.at) return

    this.#cancelWake(room.code)

    const timer = setTimeout(
      () => {
        this.#timers.delete(room.code)
        try {
          this.apply(room.code, { type: wanted.event } as RoomEvent)
        } catch {
          // The room may have closed or moved on in the meantime: moot.
        }
      },
      Math.max(0, wanted.at - now),
    )

    // The process must not stay alive for a room timer.
    timer.unref?.()
    this.#timers.set(room.code, { timer, at: wanted.at })
  }

  #cancelWake(code: string) {
    const pending = this.#timers.get(code)
    if (pending) {
      clearTimeout(pending.timer)
      this.#timers.delete(code)
    }
  }
}

export const registry = new Registry()
