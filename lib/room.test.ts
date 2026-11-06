import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { COUNTRIES } from '../data/countries.ts'
import { countryByCode, isMapped } from './quiz.ts'
import { randomFrom } from './random.ts'
import {
  MAX_PLAYERS,
  MAX_POINTS,
  MIN_ELAPSED_MS,
  MIN_POINTS,
  PLAYER_COLOURS,
  RESULTS_PAUSE,
  RejectionError,
  buildRounds,
  clampElapsed,
  createRoom,
  expectedResponders,
  pendingWake,
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
  test('takes in the first player and makes them host', () => {
    const room = roomWith(['Arthur'])
    assert.equal(room.players.length, 1)
    assert.equal(room.host, 'p0')
  })

  test('takes in the next players without changing host', () => {
    const room = roomWith(['Arthur', 'Marie', 'Léo'])
    assert.deepEqual(room.players.map((p) => p.name), ['Arthur', 'Marie', 'Léo'])
    assert.equal(room.host, 'p0')
  })

  test('turns away a name already taken, whatever the case and spacing', () => {
    const room = roomWith(['Arthur'])
    assert.equal(rejection(() => reduce(room, { type: 'join', token: 'x', name: ' arthur ' }, 2000)), 'name-taken')
  })

  test('turns away players beyond the maximum', () => {
    const room = roomWith(Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i}`))
    assert.equal(rejection(() => reduce(room, { type: 'join', token: 'extra', name: 'Zoé' }, 9000)), 'room-full')
  })

  test('rejects every event on a closed room', () => {
    const alone = roomWith(['Arthur'])
    const closed = reduce(alone, { type: 'leave', token: 'p0' }, 2000).room
    assert.equal(closed.closed, true)
    assert.equal(rejection(() => reduce(closed, { type: 'join', token: 'x', name: 'Marie' }, 3000)), 'room-closed')
  })

  test('asks for a broadcast on every arrival', () => {
    const { effects } = reduce(createRoom('KP4T'), { type: 'join', token: 'p0', name: 'A' }, 0)
    assert.deepEqual(effects, [{ type: 'broadcast' }])
  })
})

describe('taking your seat back', () => {
  test('returns the same player, score and role after a refresh', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 2000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 2000 },
      4000,
    ).room

    const pointsBefore = room.players[0].points
    assert.ok(pointsBefore > 0)

    room = reduce(room, { type: 'disconnect', token: 'p0' }, 5000).room
    assert.equal(room.players[0].connected, false)

    room = reduce(room, { type: 'join', token: 'p0', name: 'Arthur' }, 6000).room
    assert.equal(room.players.length, 2)
    assert.equal(room.players[0].connected, true)
    assert.equal(room.players[0].points, pointsBefore)
    assert.equal(room.host, 'p0')
  })

  test('creates a new player for an unknown token', () => {
    const room = reduce(roomWith(['Arthur']), { type: 'join', token: 'other', name: 'Marie' }, 3000)
      .room
    assert.equal(room.players.length, 2)
  })

  test('never makes anyone wait on a disconnected player', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 2000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      3000,
    ).room
    assert.notEqual(room.game!.round, null)

    // Marie drops: the round is only waiting on her, so it closes.
    room = reduce(room, { type: 'disconnect', token: 'p1' }, 3500).room
    assert.equal(room.game!.round, null)
    assert.equal(room.game!.playedRounds.length, 1)
  })
})

describe('host role and closing', () => {
  test('passes the role to whoever has been present the longest', () => {
    let room = roomWith(['Arthur', 'Marie', 'Léo'])
    room = reduce(room, { type: 'leave', token: 'p0' }, 5000).room
    assert.equal(room.host, 'p1')
  })

  test('leaves the role alone when another player goes', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'leave', token: 'p1' }, 5000).room
    assert.equal(room.host, 'p0')
  })

  test('closes the room when the last player goes', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'leave', token: 'p0' }, 5000).room
    room = reduce(room, { type: 'leave', token: 'p1' }, 6000).room
    assert.equal(room.closed, true)
    assert.equal(room.host, null)
  })

  test('stops a non-host from changing settings or starting', () => {
    const room = roomWith(['Arthur', 'Marie'])
    assert.equal(rejection(() =>
        reduce(room, { type: 'settings', token: 'p1', settings: { roundCount: 5 } }, 3000),
      ), 'not-host')
    assert.equal(rejection(() => reduce(room, { type: 'start', token: 'p1', seed: 1 }, 3000)), 'not-host')
  })

  test('refuses settings with no mode at all', () => {
    const room = roomWith(['Arthur'])
    assert.equal(rejection(() => reduce(room, { type: 'settings', token: 'p0', settings: { modes: [] } }, 3000)), 'no-mode')
  })

  test('refuses to change settings while a game runs', () => {
    const room = reduce(roomWith(['Arthur']), { type: 'start', token: 'p0', seed: 1 }, 2000).room
    assert.equal(rejection(() =>
        reduce(room, { type: 'settings', token: 'p0', settings: { roundCount: 9 } }, 3000),
      ), 'game-running')
  })
})

describe('closing a round', () => {
  test('closes as soon as everyone answered, without waiting for the deadline', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000).room
    const deadline = room.game!.round!.deadlineAt

    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room
    assert.notEqual(room.game!.round, null)

    room = reduce(room, { type: 'answer', token: 'p1', input: 'nonsense', claimedMs: 2000 }, 3000)
      .room
    assert.equal(room.game!.round, null)
    assert.equal(room.game!.resumeAt, 3000 + RESULTS_PAUSE)
    assert.ok(3000 < deadline)
  })

  test('closes at the deadline when a player did not answer', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room
    room = reduce(room, { type: 'deadline' }, 16_000).room

    assert.equal(room.game!.playedRounds.length, 1)
    assert.equal(room.game!.playedRounds[0].answers.length, 2)
  })

  test('counts a missing answer as wrong, without dropping the player', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room

    const silent = room.game!.playedRounds[0].answers.find((a) => a.token === 'p1')!
    assert.equal(silent.input, null)
    assert.equal(silent.verdict.status, 'wrong')
    assert.equal(silent.points, 0)
    assert.equal(room.players.length, 2)
  })

  test('schedules a wake-up at the deadline, then at the end of the pause', () => {
    const room = roomWith(['Arthur'])
    const started = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000)
    assert.ok(started.effects.some((item) => isDeepStrictEqual(item, { type: 'wake', at: 16_000 })))

    const closed = reduce(started.room, { type: 'deadline' }, 16_000)
    assert.ok(closed.effects.some((item) => isDeepStrictEqual(item, { type: 'wake', at: 16_000 + RESULTS_PAUSE })))
  })

  test('refuses a second answer to the same round', () => {
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 7 }, 1000).room
    room = reduce(room, { type: 'answer', token: 'p0', input: 'one', claimedMs: 1000 }, 2000).room
    assert.equal(rejection(() =>
        reduce(room, { type: 'answer', token: 'p0', input: 'two', claimedMs: 1100 }, 2100),
      ), 'already-answered')
  })

  test('refuses an answer outside a round', () => {
    const room = roomWith(['Arthur'])
    assert.equal(rejection(() => reduce(room, { type: 'answer', token: 'p0', input: 'x', claimedMs: 500 }, 2000)), 'no-round')
  })
})

describe('scoring and the speed bonus', () => {
  test('rewards speed on a correct answer', () => {
    const quick = pointsFor({ status: 'exact' }, 1000, 15_000)
    const slow = pointsFor({ status: 'exact' }, 12_000, 15_000)
    assert.ok(quick > slow)
    assert.ok(quick <= MAX_POINTS)
    assert.ok(slow >= MIN_POINTS)
  })

  test('pays nothing for a wrong answer, however fast', () => {
    assert.equal(pointsFor({ status: 'wrong' }, 1, 15_000), 0)
  })

  test('pays a close answer exactly as much as an exact one', () => {
    assert.equal(pointsFor({ status: 'close' }, 3000, 15_000), pointsFor({ status: 'exact' }, 3000, 15_000))
  })

  test('accepts approximate spelling and counts it correct', () => {
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
    assert.ok(['exact', 'close', 'wrong'].includes(graded.verdict.status))
    if (graded.verdict.status !== 'wrong') assert.ok(graded.points > 0)
  })
})

describe('clamping the claimed elapsed time', () => {
  test('keeps a plausible duration as it is', () => {
    assert.equal(clampElapsed(2100, 0, 2380), 2100)
  })

  test('falls back to the ceiling for a claim below the human floor', () => {
    assert.equal(clampElapsed(0, 0, 2380), 2380)
    assert.equal(clampElapsed(MIN_ELAPSED_MS - 1, 0, 2380), 2380)
  })

  test('falls back to the ceiling for a claim longer than the time actually elapsed', () => {
    assert.equal(clampElapsed(9000, 0, 2380), 2380)
  })

  test('withstands an absurd claim', () => {
    assert.equal(clampElapsed(Number.NaN, 0, 2380), 2380)
    assert.equal(clampElapsed(Number.POSITIVE_INFINITY, 0, 2380), 2380)
    assert.equal(clampElapsed(-5000, 0, 2380), 2380)
  })

  test('gives a forged time no advantage, end to end', () => {
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

    assert.ok(liar.players[1].points <= honest.players[0].points)
  })
})

describe('composing the rounds', () => {
  test('gives the same rounds for the same seed', () => {
    const codes = (seed: number) =>
      buildRounds(settings({ roundCount: 20, scope: null }), randomFrom(seed)).map(
        (r) => `${r.mode}:${r.question.country.code}`,
      )
    assert.deepEqual(codes(2024), codes(2024))
    assert.notDeepEqual(codes(2024), codes(2025))
  })

  test('never repeats a country in a game, across all modes', () => {
    const rounds = buildRounds(
      settings({ modes: ['flags', 'capitals', 'mapFind'], roundCount: 60, scope: null }),
      randomFrom(9),
    )
    const codes = rounds.map((r) => r.question.country.code)
    assert.equal(new Set(codes).size, codes.length)
  })

  test('draws only mapped countries for map rounds', () => {
    const rounds = buildRounds(
      settings({ modes: ['flags', 'mapFind'], roundCount: 80, scope: null }),
      randomFrom(4),
    )
    for (const round of rounds) {
      if (round.mode === 'mapFind') assert.equal(isMapped(round.question.country), true)
    }
  })

  test('still lets a micro-state come up as a flag when a map mode is ticked', () => {
    // The pool is computed per round: ticking the map must not impoverish the
    // flag rounds.
    const unmapped = new Set(COUNTRIES.filter((c) => !isMapped(c)).map((c) => c.code))
    const rounds = buildRounds(
      settings({ modes: ['flags', 'mapFind'], roundCount: 194, scope: null }),
      randomFrom(11),
    )
    const asFlags = rounds.filter((r) => r.mode === 'flags').map((r) => r.question.country.code)
    assert.equal(asFlags.some((code) => unmapped.has(code)), true)
  })

  test('honours the scope', () => {
    const rounds = buildRounds(settings({ scope: 'Afrique', roundCount: 30 }), randomFrom(1))
    for (const round of rounds) assert.equal(round.question.country.continent, 'Afrique')
  })

  test('cuts the game short rather than repeat, when the pool is too small', () => {
    const rounds = buildRounds(
      settings({ modes: ['mapFind'], scope: 'Océanie', roundCount: 100 }),
      randomFrom(2),
    )
    const codes = rounds.map((r) => r.question.country.code)
    assert.equal(new Set(codes).size, codes.length)
    assert.ok(rounds.length < 100)
    assert.ok(rounds.length > 5)
  })

  test('uses every ticked mode', () => {
    const rounds = buildRounds(
      settings({ modes: ['flags', 'capitals'], roundCount: 20, scope: null }),
      randomFrom(6),
    )
    assert.deepEqual(new Set(rounds.map((r) => r.mode)), new Set(['flags', 'capitals']))
  })
})

describe('a full game', () => {
  test('runs the rounds through to the final standings', () => {
    let room = roomWith(['Arthur', 'Marie', 'Léo'], settings({ roundCount: 3 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 42 }, 1000).room

    let t = 2000
    for (let number = 1; number <= 3; number++) {
      assert.equal(room.game!.round!.number, number)
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

      assert.equal(room.game!.round, null)
      // Every round has a results pause, the last one included.
      assert.notEqual(room.game!.resumeAt, null)
      t = room.game!.resumeAt!
      room = reduce(room, { type: 'resume' }, t).room
    }

    assert.equal(room.game!.finished, true)
    assert.equal(room.game!.playedRounds.length, 3)

    const final = standings(room)
    assert.deepEqual(final.map((s) => s.name), ['Arthur', 'Marie', 'Léo'])
    assert.ok(final[0].points > final[1].points)
    assert.equal(final[2].points, 0)
    assert.equal(final[0].correctAnswers, 3)
    assert.equal(final[2].correctAnswers, 0)
  })

  test('files every game standings into the history', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    // The results pause of the final round comes before the standings are filed.
    assert.equal(room.history.length, 0)
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room
    assert.equal(room.history.length, 1)

    room = reduce(room, { type: 'start', token: 'p0', seed: 2 }, 40_000).room
    room = reduce(room, { type: 'deadline' }, 60_000).room
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room
    assert.equal(room.history.length, 2)
  })

  test('resets scores at every new game', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room
    assert.ok(room.players[0].points > 0)

    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room
    room = reduce(room, { type: 'start', token: 'p0', seed: 2 }, 30_000).room
    assert.equal(room.players[0].points, 0)
  })

  test('allows a game with a single player', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 2 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 800 },
      1800,
    ).room
    assert.equal(room.game!.playedRounds.length, 1)
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

  test('enters the running game rather than waiting for the next one', () => {
    let room = midGame()
    assert.equal(room.game!.round!.number, 2)

    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 6000).room
    assert.equal(room.game!.finished, false)
    assert.equal(room.players.length, 2)
  })

  test('starts behind by the rounds it missed', () => {
    const room = reduce(midGame(), { type: 'join', token: 'late', name: 'Marie' }, 6000).room

    assert.equal(room.players.find((p) => p.token === 'late')!.points, 0)
    assert.ok(room.players[0].points > 0)
  })

  test('only becomes an expected responder at the next round', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 4 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 2000).room

    assert.deepEqual(expectedResponders(room).map((p) => p.token), ['p0'])
    assert.equal(rejection(() =>
        reduce(room, { type: 'answer', token: 'late', input: 'x', claimedMs: 500 }, 2500),
      ), 'not-in-play')
  })

  test('neither reopens nor lengthens the round in progress', () => {
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
    assert.equal(room.game!.round, null)
    assert.equal(room.game!.playedRounds.length, 1)
    assert.equal(room.game!.playedRounds[0].deadlineAt, deadline)
  })

  test('joins the next game on equal footing', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 2000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room

    room = reduce(room, { type: 'start', token: 'p0', seed: 9 }, 30_000).room
    assert.deepEqual(expectedResponders(room).map((p) => p.token).sort(), ['late', 'p0'])
    assert.equal(standings(room).every((s) => !s.joinedMidGame), true)
  })

  test('flags in the standings that a player joined mid-game', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 4 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 2000).room

    assert.equal(standings(room).find((s) => s.token === 'late')!.joinedMidGame, true)
    assert.equal(standings(room).find((s) => s.token === 'p0')!.joinedMidGame, false)
  })

  test('tells a missed round apart from a wrong answer', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 3 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 8 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room

    // Marie arrives during round 2, so she is only expected from round 3.
    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 20_000).room
    assert.equal(room.players.find((p) => p.token === 'late')!.fromRound, 3)

    room = reduce(room, { type: 'deadline' }, 40_000).room
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room
    room = reduce(room, { type: 'deadline' }, 80_000).room

    // Rounds 1 and 2 were missed, so no answer stands in her name.
    assert.equal(room.game!.playedRounds[0].answers.some((a) => a.token === 'late'), false)
    assert.equal(room.game!.playedRounds[1].answers.some((a) => a.token === 'late'), false)
    // Round 3 she was in play and sent nothing, so a wrong answer.
    assert.equal(room.game!.playedRounds[2].answers.find((a) => a.token === 'late')!.verdict.status, 'wrong')
  })
})

describe('map modes', () => {
  const mapSettings = settings({ modes: ['mapFind'], roundCount: 1 })

  test('accepts the right country clicked and turns down another', () => {
    let room = roomWith(['Arthur', 'Marie'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code
    const other = COUNTRIES.find((c) => c.code !== right && isMapped(c))!.code

    const after = play(room, [
      [{ type: 'answer', token: 'p0', input: right, claimedMs: 1000 }, 2000],
      [{ type: 'answer', token: 'p1', input: other, claimedMs: 1000 }, 2000],
    ])

    const answers = after.game!.playedRounds[0].answers
    assert.equal(answers.find((a) => a.token === 'p0')!.verdict.status, 'exact')
    assert.equal(answers.find((a) => a.token === 'p1')!.verdict.status, 'wrong')
  })

  test('names the country clicked by mistake', () => {
    let room = roomWith(['Arthur'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code
    const other = COUNTRIES.find((c) => c.code !== right && isMapped(c))!

    const after = reduce(
      room,
      { type: 'answer', token: 'p0', input: other.code, claimedMs: 1000 },
      2000,
    ).room
    assert.equal(after.game!.playedRounds[0].answers[0].guess?.country.name, other.name)
  })

  test('never grants a click a close verdict', () => {
    let room = roomWith(['Arthur'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code
    const neighbour = COUNTRIES.find((c) => c.code !== right && isMapped(c))!.code

    const after = reduce(
      room,
      { type: 'answer', token: 'p0', input: neighbour, claimedMs: 1000 },
      2000,
    ).room
    assert.notEqual(after.game!.playedRounds[0].answers[0].verdict.status, 'close')
  })
})

describe('the view sent to the client', () => {
  test('does not reveal the others’ answers during the round', () => {
    let room = roomWith(['Arthur', 'Marie'], settings({ roundCount: 2 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 3 }, 1000).room
    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room

    const view = viewFor(room, 'p1')
    assert.equal(view.players.find((p) => p.token === 'p0')!.hasAnswered, true)
    assert.ok(!JSON.stringify(view).includes('"input"'))
    assert.equal(view.game!.result, null)
  })

  test('reveals the expected answer once the round closes', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 2 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 3 }, 1000).room
    const expected = room.game!.round!.accepted[0]
    room = reduce(room, { type: 'answer', token: 'p0', input: 'nonsense', claimedMs: 1000 }, 2000)
      .room

    const view = viewFor(room, 'p0')
    assert.equal(view.game!.result!.expected, expected)
    assert.equal(view.game!.result!.answers[0].input, 'nonsense')
  })

  test('withholds the label when the country name is what to find', () => {
    const room = reduce(
      roomWith(['Arthur'], settings({ modes: ['flags'], roundCount: 1 })),
      { type: 'start', token: 'p0', seed: 3 },
      1000,
    ).room
    const view = viewFor(room, 'p0')
    assert.equal(view.game!.round!.label, null)
    assert.ok(view.game!.round!.code)
  })

  test('labels the round with the country name when the location is what to find', () => {
    const room = reduce(
      roomWith(['Arthur'], settings({ modes: ['mapFind'], roundCount: 1 })),
      { type: 'start', token: 'p0', seed: 3 },
      1000,
    ).room
    const view = viewFor(room, 'p0')
    assert.equal(view.game!.round!.label, countryByCode(view.game!.round!.code)!.name)
  })

  test('labels the round with the capital in the reverse capitals mode', () => {
    const room = reduce(
      roomWith(['Arthur'], settings({ modes: ['countryFromCapital'], roundCount: 1 })),
      { type: 'start', token: 'p0', seed: 3 },
      1000,
    ).room
    const view = viewFor(room, 'p0')
    const country = countryByCode(view.game!.round!.code)!
    assert.equal(view.game!.round!.label, country.capital)
    // The country name would be the answer, so it never travels as the label.
    assert.notEqual(view.game!.round!.label, country.name)
  })

  test('points out the host and the current player', () => {
    const room = roomWith(['Arthur', 'Marie'])
    assert.equal(viewFor(room, 'p0').isHost, true)
    assert.equal(viewFor(room, 'p1').isHost, false)
    assert.equal(viewFor(room, 'p1').me, 'p1')
  })
})

describe('the wake-up a room is waiting on', () => {
  test('waits on nothing before a game starts', () => {
    assert.equal(pendingWake(roomWith(['Arthur'])), null)
  })

  test('waits on the deadline while a round is open', () => {
    const room = reduce(roomWith(['Arthur', 'Marie']), { type: 'start', token: 'p0', seed: 1 }, 1000)
      .room
    assert.deepEqual(pendingWake(room), { at: room.game!.round!.deadlineAt, event: 'deadline' })
  })

  test('still waits on the deadline after an answer that leaves the round open', () => {
    // The regression that hung a round: an answer emits only a broadcast, so an
    // adapter cancelling its timer for lack of a `wake` effect would never fire
    // the deadline, and the round would wait forever on the silent player.
    let room = roomWith(['Arthur', 'Marie'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    const deadline = room.game!.round!.deadlineAt

    room = reduce(
      room,
      { type: 'answer', token: 'p0', input: correctAnswer(room), claimedMs: 1000 },
      2000,
    ).room

    assert.notEqual(room.game!.round, null)
    assert.deepEqual(pendingWake(room), { at: deadline, event: 'deadline' })
  })

  test('waits on the resume instant during the results pause', () => {
    let room = roomWith(['Arthur'])
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    assert.deepEqual(pendingWake(room), { at: 16_000 + RESULTS_PAUSE, event: 'resume' })
  })

  test('keeps waiting on the resume instant when someone joins during the pause', () => {
    // The other half of the same regression: a join during the pause emits only a
    // broadcast, and must not strand the game between two rounds.
    let room = roomWith(['Arthur'], settings({ roundCount: 3 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    const resumeAt = room.game!.resumeAt!

    room = reduce(room, { type: 'join', token: 'late', name: 'Marie' }, 17_000).room
    assert.deepEqual(pendingWake(room), { at: resumeAt, event: 'resume' })
  })

  test('waits on the final results pause before ending the game', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room

    assert.equal(room.game!.finished, false)
    assert.deepEqual(pendingWake(room), { at: 16_000 + RESULTS_PAUSE, event: 'resume' })
  })

  test('waits on nothing once the game is over', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 1 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room

    assert.equal(room.game!.finished, true)
    assert.equal(pendingWake(room), null)
  })

  test('matches the wake effect the reducer emits, whenever it emits one', () => {
    const started = reduce(roomWith(['Arthur']), { type: 'start', token: 'p0', seed: 4 }, 1000)
    const wake = started.effects.find((e) => e.type === 'wake')
    assert.notEqual(wake, undefined)
    assert.equal(pendingWake(started.room)!.at, (wake as { at: number }).at)
  })
})

describe('player colours on the map', () => {
  test('gives every player a distinct colour', () => {
    const room = roomWith(['Arthur', 'Marie', 'Léo', 'Zoé'])
    const colours = room.players.map((p) => p.colour)
    assert.equal(new Set(colours).size, colours.length)
  })

  test('never dresses a player in red or green', () => {
    // Those two mean wrong and right everywhere else: a player wearing them
    // would be read as a verdict.
    const room = roomWith(Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i}`))
    for (const player of room.players) {
      assert.doesNotMatch(player.colour, /red|green|emerald|rose|lime/)
    }
  })

  test('has enough colours for a full room', () => {
    assert.ok(PLAYER_COLOURS.length >= MAX_PLAYERS)
    const room = roomWith(Array.from({ length: MAX_PLAYERS }, (_, i) => `Player ${i}`))
    assert.equal(new Set(room.players.map((p) => p.colour)).size, MAX_PLAYERS)
  })

  test('keeps a colour across a refresh', () => {
    let room = roomWith(['Arthur', 'Marie'])
    const before = room.players[1].colour
    room = reduce(room, { type: 'disconnect', token: 'p1' }, 3000).room
    room = reduce(room, { type: 'join', token: 'p1', name: 'Marie' }, 4000).room
    assert.equal(room.players[1].colour, before)
  })

  test('frees a colour when its player leaves', () => {
    let room = roomWith(['Arthur', 'Marie'])
    const freed = room.players[1].colour
    room = reduce(room, { type: 'leave', token: 'p1' }, 5000).room
    room = reduce(room, { type: 'join', token: 'p9', name: 'Zoé' }, 6000).room
    assert.equal(room.players.find((p) => p.token === 'p9')!.colour, freed)
  })

  test('exposes the colour in the view', () => {
    const view = viewFor(roomWith(['Arthur', 'Marie']), 'p0')
    assert.equal(view.players.every((p) => PLAYER_COLOURS.includes(p.colour)), true)
  })
})

describe('the country each player designated', () => {
  const mapSettings = settings({ modes: ['mapFind'], roundCount: 1 })

  test('reports the clicked country for a wrong answer', () => {
    let room = roomWith(['Arthur'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code
    const other = COUNTRIES.find((c) => c.code !== right && isMapped(c))!.code

    room = reduce(room, { type: 'answer', token: 'p0', input: other, claimedMs: 1000 }, 2000).room
    assert.equal(viewFor(room, 'p0').game!.result!.answers[0].pick, other)
  })

  test('reports the right country for a correct answer, which carries no guess', () => {
    let room = roomWith(['Arthur'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code

    room = reduce(room, { type: 'answer', token: 'p0', input: right, claimedMs: 1000 }, 2000).room
    const answer = viewFor(room, 'p0').game!.result!.answers[0]
    assert.equal(answer.guess, null)
    assert.equal(answer.pick, right)
  })

  test('reports nothing for a player who designated nothing', () => {
    let room = roomWith(['Arthur', 'Marie'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 20_000).room

    const answers = viewFor(room, 'p0').game!.result!.answers
    assert.equal(answers.every((a) => a.pick === null), true)
  })

  test('reports the same country for two players who picked it', () => {
    let room = roomWith(['Arthur', 'Marie'], mapSettings)
    room = reduce(room, { type: 'start', token: 'p0', seed: 12 }, 1000).room
    const right = room.game!.round!.country.code
    const same = COUNTRIES.find((c) => c.code !== right && isMapped(c))!.code

    room = reduce(room, { type: 'answer', token: 'p0', input: same, claimedMs: 1000 }, 2000).room
    room = reduce(room, { type: 'answer', token: 'p1', input: same, claimedMs: 1500 }, 2500).room

    const picks = viewFor(room, 'p0').game!.result!.answers.map((a) => a.pick)
    assert.deepEqual(picks, [same, same])
  })
})

describe('the results pause of the final round', () => {
  test('shows the last round’s results before the podium', () => {
    let room = roomWith(['Arthur', 'Marie'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 5 }, 1000).room
    const expected = room.game!.round!.accepted[0]
    room = reduce(room, { type: 'answer', token: 'p0', input: expected, claimedMs: 1000 }, 2000).room
    room = reduce(room, { type: 'answer', token: 'p1', input: 'nonsense', claimedMs: 1500 }, 2500)
      .room

    // Still in the game, paused on results — not yet on the podium.
    const view = viewFor(room, 'p0')
    assert.equal(view.game!.finished, false)
    assert.equal(view.game!.paused, true)
    assert.equal(view.game!.result!.expected, expected)
    assert.equal(view.game!.result!.answers.length, 2)
  })

  test('ends the game when that pause elapses', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 1 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 5 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room

    assert.equal(room.game!.finished, true)
    assert.equal(room.history.length, 1)
    assert.equal(viewFor(room, 'p0').game!.paused, false)
  })

  test('lasts as long as any other pause', () => {
    let room = roomWith(['Arthur'], settings({ roundCount: 2 }))
    room = reduce(room, { type: 'start', token: 'p0', seed: 5 }, 1000).room
    room = reduce(room, { type: 'deadline' }, 16_000).room
    const afterFirst = room.game!.resumeAt! - 16_000

    room = reduce(room, { type: 'resume' }, room.game!.resumeAt!).room
    const opened = room.game!.round!.openedAt
    room = reduce(room, { type: 'deadline' }, opened + 15_000).room
    const afterLast = room.game!.resumeAt! - (opened + 15_000)

    assert.equal(afterLast, afterFirst)
    assert.equal(afterLast, RESULTS_PAUSE)
  })
})
