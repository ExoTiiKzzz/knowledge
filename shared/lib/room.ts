import type { Country } from '../data/countries.ts'
import type { Verdict } from './answer.ts'
import { randomFrom, shuffle, type Random } from './random.ts'
import {
  MODES,
  acceptedFor,
  countriesIn,
  expectedFor,
  gradeAnswer,
  gradeClick,
  identify,
  type Guess,
  type Mode,
  type Question,
  type Scope,
} from './quiz.ts'

/**
 * Multiplayer room engine, as a pure reducer.
 *
 * It reads neither the clock, nor randomness, nor the network: `now` is a
 * parameter of every transition, and composing a game's rounds takes a seed.
 * That constraint is what makes the whole of multiplayer testable without
 * booting an application or waiting on a real delay.
 *
 * No effect is executed here. The reducer *describes* what to do (broadcast,
 * schedule a wake-up) and the adapter carries it out.
 *
 * Domain vocabulary maps to the French glossary in CONTEXT.md: Room = salon,
 * Game = partie, Round = manche, Player = joueur, Host = hôte, Pool = vivier.
 */

// ————————————————————————————————————————————————————————————————— settings

export const DEFAULT_SETTINGS: Settings = {
  modes: ['flags'],
  scope: null,
  roundCount: 20,
  roundDuration: 15_000,
}

/** How long the results of a round stay on screen before the next one. */
export const RESULTS_PAUSE = 3_000

/** Beyond this, a room turns newcomers away. */
export const MAX_PLAYERS = 8

/** Points for an instant correct answer; decays down to `MIN_POINTS`. */
export const MAX_POINTS = 1000
export const MIN_POINTS = 200

/**
 * Thinking time below which no human could read the question, understand it and
 * answer. A lower claim is discarded.
 */
export const MIN_ELAPSED_MS = 250

export type Settings = {
  /** At least one. Each round draws one of them. */
  modes: Mode[]
  scope: Scope
  roundCount: number
  /** Maximum duration of a round, in milliseconds. */
  roundDuration: number
}

// ————————————————————————————————————————————————————————————————— state

export type Player = {
  /** Opaque browser token. Identifies the player across connections. */
  token: string
  name: string
  /** When they entered the room, which settles who inherits the host role. */
  joinedAt: number
  connected: boolean
  points: number
  correctAnswers: number
  /**
   * Number of the first round this player may play. Someone joining mid-game
   * only becomes an expected responder from the next round on.
   */
  fromRound: number
}

export type Answer = {
  token: string
  /** Raw input, or the code of the clicked country. `null` when the round expired. */
  input: string | null
  verdict: Verdict
  guess: Guess | null
  points: number
  /** Elapsed time retained after clamping. */
  ms: number
}

export type Round = {
  number: number
  mode: Mode
  country: Country
  accepted: string[]
  /** When it opened, which serves as the ceiling for the claimed elapsed time. */
  openedAt: number
  /** After this instant the round closes on its own. */
  deadlineAt: number
  answers: Answer[]
}

export type Game = {
  settings: Settings
  /** The rounds to play, drawn when the game starts. */
  questions: Array<{ mode: Mode; question: Question }>
  round: Round | null
  /** Rounds already closed, in order. */
  playedRounds: Round[]
  /** When play resumes after the results pause. `null` outside a pause. */
  resumeAt: number | null
  finished: boolean
}

export type Room = {
  code: string
  players: Player[]
  /** Host's token. `null` only when the room is empty. */
  host: string | null
  settings: Settings
  game: Game | null
  /** Standings of the games already played, oldest first. */
  history: Array<{ standings: Standing[] }>
  closed: boolean
}

export type Standing = {
  token: string
  name: string
  points: number
  correctAnswers: number
  /** True when the player joined after the game had started. */
  joinedMidGame: boolean
}

// ————————————————————————————————————————————————————————————————— events

export type RoomEvent =
  | { type: 'join'; token: string; name: string }
  | { type: 'leave'; token: string }
  | { type: 'disconnect'; token: string }
  | { type: 'settings'; token: string; settings: Partial<Settings> }
  | { type: 'start'; token: string; seed: number }
  | { type: 'answer'; token: string; input: string; claimedMs: number }
  | { type: 'deadline' }
  | { type: 'resume' }

export type Effect =
  | { type: 'broadcast' }
  /** Call the reducer back at this instant, with `deadline` or `resume`. */
  | { type: 'wake'; at: number }

export type Transition = { room: Room; effects: Effect[] }

/** Why a transition did not happen. */
export type Rejection =
  | 'room-closed'
  | 'room-full'
  | 'name-taken'
  | 'unknown'
  | 'not-host'
  | 'game-running'
  | 'no-mode'
  | 'no-round'
  | 'already-answered'
  | 'not-in-play'

export class RejectionError extends Error {
  reason: Rejection

  constructor(reason: Rejection) {
    super(reason)
    this.reason = reason
  }
}

// ————————————————————————————————————————————————————————————————— creation

export function createRoom(code: string, settings: Settings = DEFAULT_SETTINGS): Room {
  return {
    code,
    players: [],
    host: null,
    settings,
    game: null,
    history: [],
    closed: false,
  }
}

// ————————————————————————————————————————————————————————————————— helpers

const normalizeName = (name: string) => name.trim().toLowerCase()

function playerOf(room: Room, token: string): Player | undefined {
  return room.players.find((p) => p.token === token)
}

/** The players an answer is expected from for the open round. */
export function expectedResponders(room: Room): Player[] {
  const round = room.game?.round
  if (!round) return []
  return room.players.filter((p) => p.connected && p.fromRound <= round.number)
}

/** Current standings, best first. */
export function standings(room: Room): Standing[] {
  return [...room.players]
    .map((p) => ({
      token: p.token,
      name: p.name,
      points: p.points,
      correctAnswers: p.correctAnswers,
      joinedMidGame: p.fromRound > 1,
    }))
    .sort((a, b) => b.points - a.points || b.correctAnswers - a.correctAnswers)
}

/**
 * Composes the rounds of a game.
 *
 * The pool is computed **per round**: the mode is drawn first, then a country
 * that mode can ask about. Map modes are limited to mapped countries, the others
 * are not — ticking a map mode must therefore not remove Malta from the flag
 * rounds. A country appears at most once per game, across all modes.
 */
export function buildRounds(
  settings: Settings,
  random: Random,
): Array<{ mode: Mode; question: Question }> {
  const pools = new Map<Mode, Country[]>()
  for (const mode of settings.modes) {
    pools.set(mode, shuffle(countriesIn(settings.scope, mode), random))
  }

  const rounds: Array<{ mode: Mode; question: Question }> = []
  const used = new Set<string>()

  for (let i = 0; i < settings.roundCount; i++) {
    // Modes alternate round-robin over a shuffled order: with 20 rounds and two
    // modes, drawing independently would leave very lopsided games.
    const order = shuffle(settings.modes, random)
    let picked: { mode: Mode; country: Country } | null = null

    for (const mode of order) {
      const pool = pools.get(mode)!
      const country = pool.find((c) => !used.has(c.code))
      if (country) {
        picked = { mode, country }
        break
      }
    }

    // Every pool exhausted: the game is shorter than asked for.
    if (!picked) break

    used.add(picked.country.code)
    rounds.push({
      mode: picked.mode,
      question: { country: picked.country, accepted: acceptedFor(picked.country, picked.mode) },
    })
  }

  return rounds
}

/**
 * Points for a correct answer, decaying with thinking time.
 *
 * A close verdict is worth as much as an exact one: spelling tolerance is a
 * product principle, not a half-measure.
 */
export function pointsFor(verdict: Verdict, ms: number, roundDuration: number): number {
  if (verdict.status === 'wrong') return 0
  const share = Math.min(1, Math.max(0, ms / roundDuration))
  return Math.round(MAX_POINTS - (MAX_POINTS - MIN_POINTS) * share)
}

/**
 * Clamps the elapsed time claimed by the client.
 *
 * The server knows when it opened the round and when the answer arrived: their
 * gap is a ceiling. Below the human floor, or above that ceiling, the claim is
 * discarded and replaced by the ceiling — so lying never pays more than the
 * measurable truth.
 */
export function clampElapsed(claimedMs: number, openedAt: number, now: number): number {
  const ceiling = Math.max(0, now - openedAt)
  if (!Number.isFinite(claimedMs)) return ceiling
  if (claimedMs < MIN_ELAPSED_MS) return ceiling
  if (claimedMs > ceiling) return ceiling
  return claimedMs
}

// ————————————————————————————————————————————————————————————————— reducer

/**
 * Applies an event to the room. Returns a new state and the effects to run.
 * Throws `RejectionError` when the transition does not happen.
 */
export function reduce(room: Room, event: RoomEvent, now: number): Transition {
  if (room.closed) throw new RejectionError('room-closed')

  switch (event.type) {
    case 'join':
      return join(room, event.token, event.name, now)
    case 'leave':
      return leave(room, event.token, now)
    case 'disconnect':
      return disconnect(room, event.token, now)
    case 'settings':
      return changeSettings(room, event.token, event.settings)
    case 'start':
      return start(room, event.token, event.seed, now)
    case 'answer':
      return answer(room, event.token, event.input, event.claimedMs, now)
    case 'deadline':
      return closeRound(room, now)
    case 'resume':
      return openNextRound(room, now)
  }
}

function join(room: Room, token: string, name: string, now: number): Transition {
  const existing = playerOf(room, token)

  // Taking one's seat back: same token, so same player, score and role.
  if (existing) {
    const players = room.players.map((p) =>
      p.token === token ? { ...p, connected: true, name: name.trim() || p.name } : p,
    )
    return { room: { ...room, players }, effects: [{ type: 'broadcast' }] }
  }

  if (room.players.length >= MAX_PLAYERS) throw new RejectionError('room-full')
  if (room.players.some((p) => normalizeName(p.name) === normalizeName(name))) {
    throw new RejectionError('name-taken')
  }

  // Someone joining mid-game plays from the next round on: adding them to the
  // open round's responders would reopen a round that was about to close.
  const running = room.game && !room.game.finished
  const fromRound = running ? (room.game!.round?.number ?? 0) + 1 : 1

  const player: Player = {
    token,
    name: name.trim(),
    joinedAt: now,
    connected: true,
    points: 0,
    correctAnswers: 0,
    fromRound,
  }

  return {
    room: {
      ...room,
      players: [...room.players, player],
      host: room.host ?? token,
    },
    effects: [{ type: 'broadcast' }],
  }
}

function leave(room: Room, token: string, now: number): Transition {
  if (!playerOf(room, token)) throw new RejectionError('unknown')

  const players = room.players.filter((p) => p.token !== token)
  if (players.length === 0) {
    return {
      room: { ...room, players, host: null, closed: true },
      effects: [{ type: 'broadcast' }],
    }
  }

  // The host role belongs to the room, not to a person: it passes to whoever has
  // been present the longest.
  const host =
    room.host === token ? [...players].sort((a, b) => a.joinedAt - b.joinedAt)[0].token : room.host

  const after: Room = { ...room, players, host }

  // Their departure may complete the round: nobody should wait for them.
  if (roundComplete(after)) return closeRound(after, now)
  return { room: after, effects: [{ type: 'broadcast' }] }
}

function disconnect(room: Room, token: string, now: number): Transition {
  if (!playerOf(room, token)) throw new RejectionError('unknown')

  const players = room.players.map((p) => (p.token === token ? { ...p, connected: false } : p))
  const after: Room = { ...room, players }

  if (roundComplete(after)) return closeRound(after, now)
  return { room: after, effects: [{ type: 'broadcast' }] }
}

function changeSettings(room: Room, token: string, partial: Partial<Settings>): Transition {
  if (room.host !== token) throw new RejectionError('not-host')
  if (room.game && !room.game.finished) throw new RejectionError('game-running')

  const settings = { ...room.settings, ...partial }
  if (settings.modes.length === 0) throw new RejectionError('no-mode')

  return { room: { ...room, settings }, effects: [{ type: 'broadcast' }] }
}

function start(room: Room, token: string, seed: number, now: number): Transition {
  if (room.host !== token) throw new RejectionError('not-host')
  if (room.game && !room.game.finished) throw new RejectionError('game-running')
  if (room.settings.modes.length === 0) throw new RejectionError('no-mode')

  const questions = buildRounds(room.settings, randomFrom(seed))

  // Scores start from zero, and everyone plays from the first round.
  const players = room.players.map((p) => ({
    ...p,
    points: 0,
    correctAnswers: 0,
    fromRound: 1,
  }))

  const game: Game = {
    settings: room.settings,
    questions,
    round: null,
    playedRounds: [],
    resumeAt: null,
    finished: false,
  }

  return openRound({ ...room, players, game }, now)
}

function openRound(room: Room, now: number): Transition {
  const game = room.game!
  const next = game.questions[game.playedRounds.length]

  if (!next) return finish(room)

  const round: Round = {
    number: game.playedRounds.length + 1,
    mode: next.mode,
    country: next.question.country,
    accepted: next.question.accepted,
    openedAt: now,
    deadlineAt: now + game.settings.roundDuration,
    answers: [],
  }

  return {
    room: { ...room, game: { ...game, round, resumeAt: null } },
    effects: [{ type: 'broadcast' }, { type: 'wake', at: round.deadlineAt }],
  }
}

function openNextRound(room: Room, now: number): Transition {
  if (!room.game || room.game.finished || room.game.round) throw new RejectionError('no-round')
  return openRound(room, now)
}

/** Have all expected responders answered? */
function roundComplete(room: Room): boolean {
  const round = room.game?.round
  if (!round) return false
  const expected = expectedResponders(room)
  if (expected.length === 0) return false
  return expected.every((p) => round.answers.some((a) => a.token === p.token))
}

function answer(
  room: Room,
  token: string,
  input: string,
  claimedMs: number,
  now: number,
): Transition {
  const player = playerOf(room, token)
  if (!player) throw new RejectionError('unknown')

  const game = room.game
  const round = game?.round
  if (!game || !round) throw new RejectionError('no-round')
  if (player.fromRound > round.number) throw new RejectionError('not-in-play')
  if (round.answers.some((a) => a.token === token)) throw new RejectionError('already-answered')

  const question: Question = { country: round.country, accepted: round.accepted }

  // A click has no spelling: it is exact or wrong, and the country aimed at is
  // known outright. Typed input goes through the tolerant grader.
  const graded =
    MODES[round.mode].answer === 'click'
      ? gradeClick(input, question)
      : (() => {
          const verdict = gradeAnswer(input, question, round.mode)
          return {
            verdict,
            guess: verdict.status === 'wrong' ? identify(input, question, round.mode) : null,
          }
        })()

  const ms = clampElapsed(claimedMs, round.openedAt, now)
  const points = pointsFor(graded.verdict, ms, game.settings.roundDuration)
  const correct = graded.verdict.status !== 'wrong'

  const entry: Answer = { token, input, verdict: graded.verdict, guess: graded.guess, points, ms }

  const after: Room = {
    ...room,
    players: room.players.map((p) =>
      p.token === token
        ? {
            ...p,
            points: p.points + points,
            correctAnswers: p.correctAnswers + (correct ? 1 : 0),
          }
        : p,
    ),
    game: { ...game, round: { ...round, answers: [...round.answers, entry] } },
  }

  // Early close: no point waiting for the deadline once nobody is missing.
  if (roundComplete(after)) return closeRound(after, now)
  return { room: after, effects: [{ type: 'broadcast' }] }
}

function closeRound(room: Room, now: number): Transition {
  const game = room.game
  const round = game?.round
  if (!game || !round) throw new RejectionError('no-round')

  // Expected responders who sent nothing get a wrong answer, without being
  // dropped from the game for it.
  const silent = expectedResponders(room).filter(
    (p) => !round.answers.some((a) => a.token === p.token),
  )
  const answers = [
    ...round.answers,
    ...silent.map(
      (p): Answer => ({
        token: p.token,
        input: null,
        verdict: { status: 'wrong' },
        guess: null,
        points: 0,
        ms: game.settings.roundDuration,
      }),
    ),
  ]

  const closed: Round = { ...round, answers }
  const playedRounds = [...game.playedRounds, closed]
  const wasLast = playedRounds.length >= game.questions.length

  const after: Room = {
    ...room,
    game: {
      ...game,
      round: null,
      playedRounds,
      resumeAt: wasLast ? null : now + RESULTS_PAUSE,
    },
  }

  if (wasLast) return finish(after)

  return {
    room: after,
    effects: [{ type: 'broadcast' }, { type: 'wake', at: after.game!.resumeAt! }],
  }
}

function finish(room: Room): Transition {
  const game = room.game!
  return {
    room: {
      ...room,
      game: { ...game, round: null, resumeAt: null, finished: true },
      history: [...room.history, { standings: standings(room) }],
    },
    effects: [{ type: 'broadcast' }],
  }
}

// ————————————————————————————————————————————————————————————————— client view

/**
 * What a given player is allowed to see.
 *
 * During a round the others' answers stay hidden: only *who* answered is
 * broadcast. The expected answer is revealed only once the round closes.
 */
export function viewFor(room: Room, token: string) {
  const game = room.game
  const round = game?.round
  const lastClosed = game?.playedRounds.at(-1) ?? null
  const paused = Boolean(game && !round && game.resumeAt !== null)

  return {
    code: room.code,
    me: token,
    isHost: room.host === token,
    settings: room.settings,
    players: room.players.map((p) => ({
      token: p.token,
      name: p.name,
      connected: p.connected,
      points: p.points,
      isHost: room.host === p.token,
      hasAnswered: Boolean(round?.answers.some((a) => a.token === p.token)),
      inPlay: !round || p.fromRound <= round.number,
    })),
    standings: standings(room),
    history: room.history,
    game: game
      ? {
          roundCount: game.questions.length,
          finished: game.finished,
          paused,
          resumeAt: game.resumeAt,
          round: round
            ? {
                number: round.number,
                mode: round.mode,
                // Just enough to ask the question. The code is needed everywhere:
                // it renders the flag, highlights the map, and the client owns
                // the dataset anyway (ADR-0002). The name only goes out when the
                // mode is the one asking about a location.
                code: round.country.code,
                name:
                  MODES[round.mode].answer === 'click' || round.mode === 'capitals'
                    ? round.country.name
                    : null,
                deadlineAt: round.deadlineAt,
              }
            : null,
          result:
            !round && lastClosed
              ? {
                  number: lastClosed.number,
                  mode: lastClosed.mode,
                  code: lastClosed.country.code,
                  expected: expectedFor(lastClosed.country, lastClosed.mode),
                  answers: lastClosed.answers.map((a) => ({
                    token: a.token,
                    input: a.input,
                    status: a.verdict.status,
                    points: a.points,
                    guess: a.guess ? { code: a.guess.country.code, name: a.guess.country.name } : null,
                  })),
                }
              : null,
        }
      : null,
  }
}
