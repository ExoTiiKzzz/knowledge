import transmit from '@adonisjs/transmit/services/main'
import {
  DEFAULT_SETTINGS,
  RejectionError,
  createRoom,
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
  #timers = new Map<string, NodeJS.Timeout>()

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

    // A wake-up already scheduled no longer applies: the state has moved on.
    this.#cancelWake(room.code)

    for (const effect of effects) {
      if (effect.type === 'broadcast') this.#broadcast(room)
      if (effect.type === 'wake') this.#scheduleWake(room, effect.at, now)
    }

    if (room.closed) this.#rooms.delete(room.code)
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
   * Schedules the callback that moves the game on without a player acting: the
   * deadline of an open round, or the end of the results pause.
   */
  #scheduleWake(room: Room, at: number, now: number) {
    const wait = Math.max(0, at - now)
    const type: RoomEvent['type'] = room.game?.round ? 'deadline' : 'resume'

    const timer = setTimeout(() => {
      this.#timers.delete(room.code)
      try {
        this.apply(room.code, { type } as RoomEvent)
      } catch {
        // The room may have closed or moved on in the meantime: moot.
      }
    }, wait)

    // The process must not stay alive for a room timer.
    timer.unref?.()
    this.#timers.set(room.code, timer)
  }

  #cancelWake(code: string) {
    const timer = this.#timers.get(code)
    if (timer) {
      clearTimeout(timer)
      this.#timers.delete(code)
    }
  }
}

export const registry = new Registry()
