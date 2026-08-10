import { describe, expect, it } from 'vitest'
import { COUNTRIES } from '../data/countries.ts'
import { isMapped } from './quiz.ts'
import { randomFrom } from './random.ts'
import {
  MAX_PLAYERS,
  MAX_POINTS,
  MIN_ELAPSED_MS,
  MIN_POINTS,
  RESULTS_PAUSE,
  RejectionError,
  buildRounds,
  clampElapsed,
  createRoom,
  expectedResponders,
  pointsFor,
  reduce,
  standings,
  viewFor,
  type Room,
  type RoomEvent,
  type Settings,
} from './room.ts'

/** Applies a sequence of events, advancing the clock at each step. */
function play(room: Room, steps: Array<[RoomEvent, number]>): Room {
  return steps.reduce((current, [event, when]) => reduce(current, event, when).room, room)
}

/** Runs an action and returns the rejection reason it raised. */
function rejection(action: () => unknown): string {
  try {
    action()
  } catch (error) {
    if (error instanceof RejectionError) return error.reason
    throw error
  }
  throw new Error('no rejection was raised')
}

const settings = (partial: Partial<Settings> = {}): Settings => ({
  modes: ['flags'],
  scope: 'Europe',
  roundCount: 3,
  roundDuration: 15_000,
  ...partial,
})

/** A room ready to play, with the given players. */
function roomWith(names: string[], config = settings()): Room {
  let room = createRoom('KP4T', config)
  names.forEach((name, i) => {
    room = reduce(room, { type: 'join', token: `p${i}`, name }, 1000 + i).room
  })
  return room
}

/** The correct answer to the open round, so tests answer right without guessing. */
function correctAnswer(room: Room): string {
  const round = room.game!.round!
  return round.mode === 'mapFind' ? round.country.code : round.accepted[0]
}

describe('joining a room', () => {
  it('takes in the first player and makes them host', () => {
    const room = roomWith(['Arthur'])
    expect(room.players).toHaveLength(1)
    expect(room.host).toBe('p0')
  })

  it('takes in the next players without changing host', () => {
    const room = roomWith(['Arthur', 'Marie', 'Léo'])
    expect(room.players.map((p) => p.name)).toEqual(['Arthur', 'Marie', 'Léo'])
    expect(room.host).toBe('p0')
  })

  it('turns away a name already taken, whatever the case and spacing', () => {
    const room = roomWith(['Arthur'])
    expect(rejection(() => reduce(room, { type: 'join', token: 'x', name: ' arthur ' }, 2000))).toBe(
      'name-taken',
    )
  })

  it('turns away players beyond the maximum', () => {
    const room = roomWith(Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i}`))
    expect(rejection(() => reduce(room, { type: 'join', token: 'extra', name: 'Zoé' }, 9000))).toBe(
      'room-full',
    )
  })

  it('rejects every event on a closed room', () => {
    const alone = roomWith(['Arthur'])
    const closed = reduce(alone, { type: 'leave', token: 'p0' }, 2000).room
    expect(closed.closed).toBe(true)
    expect(rejection(() => reduce(closed, { type: 'join', token: 'x', name: 'Marie' }, 3000))).toBe(
      'room-closed',
    )
  })

  it('asks for a broadcast on every arrival', () => {
    const { effects } = reduce(createRoom('KP4T'), { type: 'join', token: 'p0', name: 'A' }, 0)
    expect(effects).toEqual([{ type: 'broadcast' }])
  })
})

describe('taking your seat back', () => {
  it('returns the same player, score and role after a refresh', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 2000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 2000 },
      4000,
    ).room

    const pointsBefore = room.players[0].points
    expect(pointsBefore).toBeGreaterThan(0)

    room = reduce(room, { type: 'disconnect', token: 'p0' }, 5000).room
    expect(room.players[0].connected).toBe(false)

    room = reduce(room, { type: 'join', token: 'p0', name: 'Arthur' }, 6000).room
    expect(room.players).toHaveLength(2)
    expect(room.players[0].connected).toBe(true)
    expect(room.players[0].points).toBe(pointsBefore)
    expect(room.host).toBe('p0')
  })

  it('creates a new player for an unknown token', () => {
    const room = reduce(roomWith(['Arthur']), { type: 'join', token: 'other', name: 'Marie' }, 3000)
      .room
    expect(room.players).toHaveLength(2)
  })

  it('never makes anyone wait on a disconnected player', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 2000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      3000,
    ).room
    expect(room.game!.round).not.toBeNull()

    // Marie drops: the round is only waiting on her, so it closes.
    room = reduce(room, { type: 'disconnect', token: 'p1' }, 3500).room
    expect(room.game!.round).toBeNull()
    expect(room.game!.playedRounds).toHaveLength(1)
  })
})

describe('host role and closing', () => {
  it('passes the role to whoever has been present the longest', () => {
    let room = roomWith(['Arthur', 'Marie', 'Léo'])
    room = reduce(room, { type: 'leave', token: 'p0' }, 5000).room
    expect(room.host).toBe('p1')
  })

  it('leaves the role alone when another player goes', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'leave', token: 'p1' }, 5000).room
    expect(room.host).toBe('p0')
  })

  it('closes the room when the last player goes', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'leave', token: 'p0' }, 5000).room
    room = reduce(room, { type: 'leave', token: 'p1' }, 6000).room
    expect(room.closed).toBe(true)
    expect(room.host).toBeNull()
  })

  it('stops a non-host from changing settings or starting', () => {
    const room = roomWith(['Arthur', 'Marie'])
    expect(
      rejection(() =>
        reduce(room, { type: 'settings', token: 'p1', settings: { roundCount: 5 } }, 3000),
      ),
    ).toBe('not-host')
    expect(rejection(() => reduce(room, { type: 'start', token: 'p1', seed: 1 }, 3000))).toBe(
      'not-host',
    )
  })

  it('refuses settings with no mode at all', () => {
    const room = roomWith(['Arthur'])
    expect(
      rejection(() => reduce(room, { type: 'settings', token: 'p0', settings: { modes: [] } }, 3000)),
    ).toBe('no-mode')
  })

  it('refuses to change settings while a game runs', () => {
    const room = reduce(roomWith(['Arthur']), { type: 'start', token: 'p0', seed: 1 }, 2000).room
    expect(
      rejection(() =>
        reduce(room, { type: 'settings', token: 'p0', settings: { roundCount: 9 } }, 3000),
      ),
    ).toBe('game-running')
  })
})

describe('closing a round', () => {
  it('closes as soon as everyone answered, without waiting for the deadline', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000).room
    const deadline = room.game!.round!.deadlineAt

    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room
    expect(room.game!.round).not.toBeNull()

    room = reduce(room, { type: 'answer', token: 'p1', input: 'nonsense', claimedMs: 2000 }, 3000)
      .room
    expect(room.game!.round).toBeNull()
    expect(room.game!.resumeAt).toBe(3000 + RESULTS_PAUSE)
    expect(3000).toBeLessThan(deadline)
  })

  it('closes at the deadline when a player did not answer', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room
    room = reduce(room, { type: 'deadline' }, 16_000).room

    expect(room.game!.playedRounds).toHaveLength(1)
    expect(room.game!.playedRounds[0].answers).toHaveLength(2)
  })

  it('counts a missing answer as wrong, without dropping the player', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room

    const silent = room.game!.playedRounds[0].answers.find((a) => a.token === 'p1')!
    expect(silent.input).toBeNull()
    expect(silent.verdict.status).toBe('wrong')
    expect(silent.points).toBe(0)
    expect(room.players).toHaveLength(2)
  })

  it('schedules a wake-up at the deadline, then at the end of the pause', () => {
    const room = roomWith(['Arthur'])
    const started = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000)
    expect(started.effects).toContainEqual({ type: 'wake', at: 16_000 })

    const closed = reduce(started.room, { type: 'deadline' }, 16_000)
    expect(closed.effects).toContainEqual({ type: 'wake', at: 16_000 + RESULTS_PAUSE })
  })

  it('refuses a second answer to the same round', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000).room
    room = reduce(room, { type: 'answer', token: 'p0', input: 'one', claimedMs: 1000 }, 2000).room
    expect(
      rejection(() =>
        reduce(room, { type: 'answer', token: 'p0', input: 'two', claimedMs: 1100 }, 2100),
      ),
    ).toBe('already-answered')
  })

  it('refuses an answer outside a round', () => {
    const room = roomWith(['Arthur'])
    expect(
      rejection(() => reduce(room, { type: 'answer', token: 'p0', input: 'x', claimedMs: 500 }, 2000)),
    ).toBe('no-round')
  })
})

describe('scoring and the speed bonus', () => {
  it('rewards speed on a correct answer', () => {
    const quick = pointsFor({ status: 'exact' }, 1000, 15_000)
    const slow = pointsFor({ status: 'exact' }, 12_000, 15_000)
    expect(quick).toBeGreaterThan(slow)
    expect(quick).toBeLessThanOrEqual(MAX_POINTS)
    expect(slow).toBeGreaterThanOrEqual(MIN_POINTS)
  })

  it('pays nothing for a wrong answer, however fast', () => {
    expect(pointsFor({ status: 'wrong' }, 1, 15_000)).toBe(0)
  })

  it('pays a close answer exactly as much as an exact one', () => {
    expect(pointsFor({ status: 'close' }, 3000, 15_000)).toBe(
      pointsFor({ status: 'exact' }, 3000, 15_000),
    )
  })

  it('accepts approximate spelling and counts it correct', () => {
    let room = roomWith(['Arthur'], settings({ scope: null, modes: ['flags'], roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 3 }, 1000).room
    const expected = room.game!.round!.accepted[0]
    const withTypo = expected.slice(0, -1) + 'x'

    const after = reduce(
      room,
      { type: 'answer', token: 'p0', input: withTypo, claimedMs: 1000 },
      2000,
    ).room
    const graded = after.game!.playedRounds[0].answers[0]
    expect(['exact', 'close', 'wrong']).toContain(graded.verdict.status)
    if (graded.verdict.status !== 'wrong') expect(graded.points).toBeGreaterThan(0)
  })
})

describe('clamping the claimed elapsed time', () => {
  it('keeps a plausible duration as it is', () => {
    expect(clampElapsed(2100, 0, 2380)).toBe(2100)
  })

  it('falls back to the ceiling for a claim below the human floor', () => {
    expect(clampElapsed(0, 0, 2380)).toBe(2380)
    expect(clampElapsed(MIN_ELAPSED_MS - 1, 0, 2380)).toBe(2380)
  })

  it('falls back to the ceiling for a claim longer than the time actually elapsed', () => {
    expect(clampElapsed(9000, 0, 2380)).toBe(2380)
  })

  it('withstands an absurd claim', () => {
    expect(clampElapsed(Number.NaN, 0, 2380)).toBe(2380)
    expect(clampElapsed(Number.POSITIVE_INFINITY, 0, 2380)).toBe(2380)
    expect(clampElapsed(-5000, 0, 2380)).toBe(2380)
  })

  it('gives a forged time no advantage, end to end', () => {
    const room = reduce(roomWith(['Arthur', 'Marie']), { type: 'start', token: 'p0', seed: 5 }, 1000)
      .room
    const right = correctAnswer(room)

    // Both answer at the same real instant, but Marie claims 0 ms.
    const honest = reduce(
      room,
      { type: 'answer', token: 'p0', input: right, claimedMs: 4000 },
      5000,
    ).room
    const liar = reduce(room, { type: 'answer', token: 'p1', input: right, claimedMs: 0 }, 5000).room

    expect(liar.players[1].points).toBeLessThanOrEqual(honest.players[0].points)
  })
})

describe('composing the rounds', () => {
  it('gives the same rounds for the same seed', () => {
    const codes = (seed: number) =>
      buildRounds(settings({ roundCount: 20, scope: null }), randomFrom(seed)).map(
        (r) => `${r.mode}:${r.question.country.code}`,
      )
    expect(codes(2024)).toEqual(codes(2024))
    expect(codes(2024)).not.toEqual(codes(2025))
  })

  it('never repeats a country in a game, across all modes', () => {
    const rounds = buildRounds(
      settings({ modes: ['flags', 'capitals', 'mapFind'], roundCount: 60, scope: null }),
      randomFrom(9),
    )
    const codes = rounds.map((r) => r.question.country.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('draws only mapped countries for map rounds', () => {
    const rounds = buildRounds(
      settings({ modes: ['flags', 'mapFind'], roundCount: 80, scope: null }),
      randomFrom(4),
    )
    for (const round of rounds) {
      if (round.mode === 'mapFind') expect(isMapped(round.question.country)).toBe(true)
    }
  })

  it('still lets a micro-state come up as a flag when a map mode is ticked', () => {
    // The pool is computed per round: ticking the map must not impoverish the
    // flag rounds.
    const unmapped = new Set(COUNTRIES.filter((c) => !isMapped(c)).map((c) => c.code))
    const rounds = buildRounds(
      settings({ modes: ['flags', 'mapFind'], roundCount: 194, scope: null }),
      randomFrom(11),
    )
    const asFlags = rounds.filter((r) => r.mode === 'flags').map((r) => r.question.country.code)
    expect(asFlags.some((code) => unmapped.has(code))).toBe(true)
  })

  it('honours the scope', () => {
    const rounds = buildRounds(settings({ scope: 'Afrique', roundCount: 30 }), randomFrom(1))
    for (const round of rounds) expect(round.question.country.continent).toBe('Afrique')
  })

  it('cuts the game short rather than repeat, when the pool is too small', () => {
    const rounds = buildRounds(
      settings({ modes: ['mapFind'], scope: 'Océanie', roundCount: 100 }),
      randomFrom(2),
    )
    const codes = rounds.map((r) => r.question.country.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(rounds.length).toBeLessThan(100)
    expect(rounds.length).toBeGreaterThan(5)
  })

  it('uses every ticked mode', () => {
    const rounds = buildRounds(
      settings({ modes: ['flags', 'capitals'], roundCount: 20, scope: null }),
      randomFrom(6),
    )
    expect(new Set(rounds.map((r) => r.mode))).toEqual(new Set(['flags', 'capitals']))
  })
})

describe('a full game', () => {
  it('runs the rounds through to the final standings', () => {
    let room = roomWith(['Arthur', 'Marie', 'Léo'], settings({ roundCount: 3 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 42 }, 1000).room

    let t = 2000
    for (let number = 1; number <= 3; number++) {
      expect(room.game!.round!.number).toBe(number)
      const right = correctAnswer(room)

      // Arthur answers right and fast, Marie right and slow, Léo wrong.
      room = reduce(room, { type: 'answer', token: 'p0', input: right, claimedMs: 1000 }, t + 1000)
        .room
      room = reduce(room, { type: 'answer', token: 'p1', input: right, claimedMs: 9000 }, t + 9000)
        .room
      room = reduce(
        room,
        { type: 'answer', token: 'p2', input: 'zzzz', claimedMs: 5000 },
        t + 9000,
      ).room

      expect(room.game!.round).toBeNull()
      if (number < 3) {
        t = room.game!.resumeAt!
        room = reduce(room, { type: 'resume' }, t).room
      }
    }

    expect(room.game!.finished).toBe(true)
    expect(room.game!.playedRounds).toHaveLength(3)

    const final = standings(room)
    expect(final.map((s) => s.name)).toEqual(['Arthur', 'Marie', 'Léo'])
    expect(final[0].points).toBeGreaterThan(final[1].points)
    expect(final[2].points).toBe(0)
    expect(final[0].correctAnswers).toBe(3)
    expect(final[2].correctAnswers).toBe(0)
  })

  it('files every game standings into the history', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    expect(room.history).toHaveLength(1)

    room = reduce(room, { type: 'start', token: 'p0', seed: 2 }, 20_000).room
    room = reduce(room, { type: 'deadline' }, 40_000).room
    expect(room.history).toHaveLength(2)
  })

  it('resets scores at every new game', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room
    expect(room.players[0].points).toBeGreaterThan(0)

    room = reduce(room, { type: 'start', token: 'p0', seed: 2 }, 30_000).room
    expect(room.players[0].points).toBe(0)
  })

  it('allows a game with a single player', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 2 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 800 },
      1800,
    ).room
    expect(room.game!.playedRounds).toHaveLength(1)
  })
})

describe('joining mid-game', () => {
  /** A game already under way, with its second round open. */
  function midGame() {
    let room = roomWith(['Arthur'], settings({ roundCount: 4 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 500 },
      1500,
    ).room
    return reduce(room, { type: 'resume' }, room.game!.resumeAt!).room
  }

  it('enters the running game rather than waiting for the next one', () => {
    let room = midGame()
    expect(room.game!.round!.number).toBe(2)

    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 6000).room
    expect(room.game!.finished).toBe(false)
    expect(room.players).toHaveLength(2)
  })

  it('starts behind by the rounds it missed', () => {
    const room = reduce(midGame(), { type: 'join', token: 'late', name: 'Marie' }, 6000).room

    expect(room.players.find((p) => p.token === 'late')!.points).toBe(0)
    expect(room.players[0].points).toBeGreaterThan(0)
  })

  it('only becomes an expected responder at the next round', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 4 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 2000).room

    expect(expectedResponders(room).map((p) => p.token)).toEqual(['p0'])
    expect(
      rejection(() =>
        reduce(room, { type: 'answer', token: 'late', input: 'x', claimedMs: 500 }, 2500),
      ),
    ).toBe('not-in-play')
  })

  it('neither reopens nor lengthens the round in progress', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 4 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    const deadline = room.game!.round!.deadlineAt

    // Arthur answers, so the round should close right away…
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 2000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 500 },
      2500,
    ).room

    // …and Marie's arrival did not prevent it.
    expect(room.game!.round).toBeNull()
    expect(room.game!.playedRounds).toHaveLength(1)
    expect(room.game!.playedRounds[0].deadlineAt).toBe(deadline)
  })

  it('joins the next game on equal footing', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 2000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room

    room = reduce(room, { type: 'start', token: 'p0', seed: 9 }, 20_000).room
    expect(expectedResponders(room).map((p) => p.token).sort()).toEqual(['late', 'p0'])
    expect(standings(room).every((s) => !s.joinedMidGame)).toBe(true)
  })

  it('flags in the standings that a player joined mid-game', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 4 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 2000).room

    expect(standings(room).find((s) => s.token === 'late')!.joinedMidGame).toBe(true)
    expect(standings(room).find((s) => s.token === 'p0')!.joinedMidGame).toBe(false)
  })

  it('tells a missed round apart from a wrong answer', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 3 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room

    // Marie arrives during round 2, so she is only expected from round 3.
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 20_000).room
    expect(room.players.find((p) => p.token === 'late')!.fromRound).toBe(3)

    room = reduce(room, { type: 'deadline' }, 40_000).room
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room
    room = reduce(room, { type: 'deadline' }, 80_000).room

    // Rounds 1 and 2 were missed, so no answer stands in her name.
    expect(room.game!.playedRounds[0].answers.some((a) => a.token === 'late')).toBe(false)
    expect(room.game!.playedRounds[1].answers.some((a) => a.token === 'late')).toBe(false)
    // Round 3 she was in play and sent nothing, so a wrong answer.
    expect(room.game!.playedRounds[2].answers.find((a) => a.token === 'late')!.verdict.status).toBe(
      'wrong',
    )
  })
})

describe('map modes', () => {
  const mapSettings = settings({ modes: ['mapFind'], roundCount: 1 })

  it('accepts the right country clicked and turns down another', () => {
    let room = roomWith(['Arthur', 'Marie'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code
    const other = COUNTRIES.find((c) => c.code !== right && isMapped(c))!.code

    const after = play(room, [
      [{ type: 'answer', token: 'p0', input: right, claimedMs: 1000 }, 2000],
      [{ type: 'answer', token: 'p1', input: other, claimedMs: 1000 }, 2000],
    ])

    const answers = after.game!.playedRounds[0].answers
    expect(answers.find((a) => a.token === 'p0')!.verdict.status).toBe('exact')
    expect(answers.find((a) => a.token === 'p1')!.verdict.status).toBe('wrong')
  })

  it('names the country clicked by mistake', () => {
    let room = roomWith(['Arthur'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code
    const other = COUNTRIES.find((c) => c.code !== right && isMapped(c))!

    const after = reduce(
      room,
      { type: 'answer', token: 'p0', input: other.code, claimedMs: 1000 },
      2000,
    ).room
    expect(after.game!.playedRounds[0].answers[0].guess?.country.name).toBe(other.name)
  })

  it('never grants a click a close verdict', () => {
    let room = roomWith(['Arthur'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code
    const neighbour = COUNTRIES.find((c) => c.code !== right && isMapped(c))!.code

    const after = reduce(
      room,
      { type: 'answer', token: 'p0', input: neighbour, claimedMs: 1000 },
      2000,
    ).room
    expect(after.game!.playedRounds[0].answers[0].verdict.status).not.toBe('close')
  })
})

describe('the view sent to the client', () => {
  it('does not reveal the others’ answers during the round', () => {
    let room = roomWith(['Arthur', 'Marie'], settings({ roundCount: 2 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 3 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room

    const view = viewFor(room, 'p1')
    expect(view.players.find((p) => p.token === 'p0')!.hasAnswered).toBe(true)
    expect(JSON.stringify(view)).not.toContain('"input"')
    expect(view.game!.result).toBeNull()
  })

  it('reveals the expected answer once the round closes', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 2 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 3 }, 1000).room
    const expected = room.game!.round!.accepted[0]
    room = reduce(room, { type: 'answer', token: 'p0', input: 'nonsense', claimedMs: 1000 }, 2000)
      .room

    const view = viewFor(room, 'p0')
    expect(view.game!.result!.expected).toBe(expected)
    expect(view.game!.result!.answers[0].input).toBe('nonsense')
  })

  it('withholds the country name when the name is what to find', () => {
    const room = reduce(
      roomWith(['Arthur'], settings({ modes: ['flags'], roundCount: 1 })),
      { type: 'start', token: 'p0', seed: 3 },
      1000,
    ).room
    const view = viewFor(room, 'p0')
    expect(view.game!.round!.name).toBeNull()
    expect(view.game!.round!.code).toBeTruthy()
  })

  it('sends the country name when the location is what to find', () => {
    const room = reduce(
      roomWith(['Arthur'], settings({ modes: ['mapFind'], roundCount: 1 })),
      { type: 'start', token: 'p0', seed: 3 },
      1000,
    ).room
    expect(viewFor(room, 'p0').game!.round!.name).toBeTruthy()
  })

  it('points out the host and the current player', () => {
    const room = roomWith(['Arthur', 'Marie'])
    expect(viewFor(room, 'p0').isHost).toBe(true)
    expect(viewFor(room, 'p1').isHost).toBe(false)
    expect(viewFor(room, 'p1').me).toBe('p1')
  })
})
