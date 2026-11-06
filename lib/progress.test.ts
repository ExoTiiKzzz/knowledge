import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { DAILY_LENGTH, dailyQuestions, dailySeed } from './daily.ts'
import {
  EMPTY_PROGRESS,
  bestOf,
  comboMultiplier,
  dailyBonus,
  dayOf,
  gradeFor,
  levelFor,
  levelProgress,
  liveStreak,
  masteryOf,
  mergeProgress,
  milesForLevel,
  nextCombo,
  previousDay,
  recordGame,
  soloPoints,
  stampKey,
  type Progress,
  type RecordedAnswer,
} from './progress.ts'
import { countriesIn } from './quiz.ts'
import { MAX_POINTS, MIN_POINTS } from './room.ts'

const right = { status: 'exact' } as const
const close = { status: 'close' } as const
const wrong = { status: 'wrong' } as const

const answer = (code: string, correct = true, points = 1000): RecordedAnswer => ({
  mode: 'flags',
  code,
  correct,
  points,
})

describe('combo', () => {
  test('climbs on a right answer, close ones included, and breaks on a wrong one', () => {
    assert.equal(nextCombo(0, right), 1)
    assert.equal(nextCombo(4, close), 5)
    assert.equal(nextCombo(9, wrong), 0)
  })

  test('multiplies from the third answer in a row', () => {
    assert.equal(comboMultiplier(1), 1)
    assert.equal(comboMultiplier(2), 1)
    assert.equal(comboMultiplier(3), 1.5)
    assert.equal(comboMultiplier(6), 2)
    assert.equal(comboMultiplier(10), 3)
    assert.equal(comboMultiplier(40), 3)
  })
})

describe('soloPoints', () => {
  test('decays with time like a multiplayer answer, then stops', () => {
    assert.equal(soloPoints(right, 0, 0), MAX_POINTS)
    assert.equal(soloPoints(right, 15_000, 0), MIN_POINTS)
    assert.equal(soloPoints(right, 120_000, 0), MIN_POINTS)
  })

  test('a close answer is worth an exact one', () => {
    assert.equal(soloPoints(close, 3000, 0), soloPoints(right, 3000, 0))
  })

  test('applies the combo the answer reaches', () => {
    // Two right before it: this one is the third, so ×1.5.
    assert.equal(soloPoints(right, 0, 2), MAX_POINTS * 1.5)
  })

  test('a wrong answer is worth nothing, however fast', () => {
    assert.equal(soloPoints(wrong, 0, 9), 0)
  })
})

describe('levels and grades', () => {
  test('thresholds grow with each level', () => {
    assert.deepEqual([1, 2, 3, 4, 5].map(milesForLevel), [0, 500, 1500, 3000, 5000])
  })

  test('levelFor is the inverse of milesForLevel', () => {
    for (let level = 1; level < 50; level++) {
      assert.equal(levelFor(milesForLevel(level)), level)
      assert.equal(levelFor(milesForLevel(level + 1) - 1), level)
    }
  })

  test('grades are named by level band', () => {
    assert.equal(gradeFor(1), 'Touriste')
    assert.equal(gradeFor(3), 'Routard')
    assert.equal(gradeFor(99), 'Globe-trotter')
  })

  test('progress within a level', () => {
    assert.deepEqual(levelProgress(700), { level: 2, grade: 'Touriste', into: 200, span: 1000 })
  })
})

describe('days and streak', () => {
  test('days are UTC calendar days', () => {
    assert.equal(dayOf(Date.parse('2026-03-01T23:59:59Z')), '2026-03-01')
    assert.equal(previousDay('2026-03-01'), '2026-02-28')
    assert.equal(previousDay('2026-01-01'), '2025-12-31')
  })

  test('a streak lives through the day after, and dies the day after that', () => {
    const p = { streak: 4, lastDailyDay: '2026-03-10' }
    assert.equal(liveStreak(p, '2026-03-10'), 4)
    assert.equal(liveStreak(p, '2026-03-11'), 4)
    assert.equal(liveStreak(p, '2026-03-12'), 0)
  })

  test('the Daily bonus is a tenth per day, capped at double', () => {
    assert.equal(dailyBonus(1), 1.1)
    assert.equal(dailyBonus(10), 2)
    assert.equal(dailyBonus(30), 2)
  })
})

describe('recordGame — solo', () => {
  const game = (answers: RecordedAnswer[]) =>
    ({ kind: 'solo', mode: 'flags', scope: 'Europe', answers }) as const

  test('turns points into miles and stamps the countries found', () => {
    const { progress, earned } = recordGame(
      EMPTY_PROGRESS,
      game([answer('FR'), answer('DE', false, 0)]),
      '2026-03-10',
    )
    assert.equal(earned.miles, 100)
    assert.equal(progress.miles, 100)
    assert.deepEqual(progress.stamps, [stampKey('flags', 'FR')])
    assert.deepEqual(earned.stamps, ['flags:FR'])
  })

  test('a country already stamped is not stamped twice', () => {
    const once = recordGame(EMPTY_PROGRESS, game([answer('FR')]), '2026-03-10').progress
    const { progress, earned } = recordGame(once, game([answer('FR')]), '2026-03-10')
    assert.deepEqual(progress.stamps, ['flags:FR'])
    assert.deepEqual(earned.stamps, [])
  })

  test('keeps the best percentage per mode and scope', () => {
    const first = recordGame(EMPTY_PROGRESS, game([answer('FR'), answer('DE', false, 0)]), '2026-03-10')
    assert.equal(first.earned.newBest, true)
    assert.equal(bestOf(first.progress, 'flags', 'Europe'), 50)

    const worse = recordGame(first.progress, game([answer('IT', false, 0)]), '2026-03-10')
    assert.equal(worse.earned.newBest, false)
    assert.equal(bestOf(worse.progress, 'flags', 'Europe'), 50)

    const better = recordGame(worse.progress, game([answer('IT')]), '2026-03-10')
    assert.equal(better.earned.newBest, true)
    assert.equal(bestOf(better.progress, 'flags', 'Europe'), 100)
    assert.equal(bestOf(better.progress, 'flags', null), null)
  })

  test('a retry of the mistakes earns miles and stamps, but sets no record', () => {
    const { progress, earned } = recordGame(
      EMPTY_PROGRESS,
      { ...game([answer('FR')]), retry: true },
      '2026-03-10',
    )
    assert.equal(earned.newBest, false)
    assert.deepEqual(progress.best, [])
    assert.deepEqual(progress.stamps, ['flags:FR'])
  })

  test('reports a level gained', () => {
    const { earned } = recordGame(EMPTY_PROGRESS, game(Array(6).fill(answer('FR'))), '2026-03-10')
    assert.equal(earned.levelBefore, 1)
    assert.equal(earned.levelAfter, 2)
  })

  test('ignores unknown countries, and an empty game changes nothing', () => {
    const { progress, earned } = recordGame(EMPTY_PROGRESS, game([answer('ZZ')]), '2026-03-10')
    assert.equal(progress, EMPTY_PROGRESS)
    assert.equal(earned.counted, false)
  })
})

describe('recordGame — daily', () => {
  const daily = (day: string, answers = [answer('FR')]) => ({ kind: 'daily', day, answers }) as const

  test('starts a streak and records the result', () => {
    const { progress, earned } = recordGame(EMPTY_PROGRESS, daily('2026-03-10'), '2026-03-10')
    assert.equal(progress.streak, 1)
    assert.equal(progress.lastDailyDay, '2026-03-10')
    assert.deepEqual(progress.daily, { day: '2026-03-10', points: 1000, correct: 1, total: 1 })
    // 100 miles, plus a tenth for a one-day streak.
    assert.equal(earned.miles, 110)
    assert.equal(earned.streak, 1)
  })

  test('extends the streak the next day, and resets it after a gap', () => {
    const day1 = recordGame(EMPTY_PROGRESS, daily('2026-03-10'), '2026-03-10').progress
    const day2 = recordGame(day1, daily('2026-03-11'), '2026-03-11').progress
    assert.equal(day2.streak, 2)
    const day4 = recordGame(day2, daily('2026-03-13'), '2026-03-13').progress
    assert.equal(day4.streak, 1)
  })

  test('counts once per day', () => {
    const once = recordGame(EMPTY_PROGRESS, daily('2026-03-10'), '2026-03-10').progress
    const { progress, earned } = recordGame(once, daily('2026-03-10'), '2026-03-10')
    assert.equal(progress, once)
    assert.equal(earned.counted, false)
  })

  test("refuses another day's Daily", () => {
    const { earned } = recordGame(EMPTY_PROGRESS, daily('2026-03-09'), '2026-03-10')
    assert.equal(earned.counted, false)
  })

  test('never touches best scores', () => {
    const { progress } = recordGame(EMPTY_PROGRESS, daily('2026-03-10'), '2026-03-10')
    assert.deepEqual(progress.best, [])
  })
})

describe('masteryOf', () => {
  test('counts stamps over the pool the mode can ask, and awards medals', () => {
    const pool = countriesIn('Europe', 'flags')
    const none = masteryOf([], 'flags', 'Europe')
    assert.equal(none.stamped, 0)
    assert.equal(none.total, pool.length)
    assert.equal(none.medal, null)

    const all = pool.map((c) => stampKey('flags', c.code))
    assert.equal(masteryOf(all, 'flags', 'Europe').medal, 'or')
    assert.equal(masteryOf(all.slice(0, Math.ceil(pool.length * 0.6)), 'flags', 'Europe').medal, 'argent')
    assert.equal(masteryOf(all.slice(0, Math.ceil(pool.length * 0.25)), 'flags', 'Europe').medal, 'bronze')
  })

  test('a stamp in another mode does not count', () => {
    const fr = masteryOf([stampKey('capitals', 'FR')], 'flags', 'Europe')
    assert.equal(fr.stamped, 0)
  })

  test('map modes are measured against mapped countries only', () => {
    assert.ok(masteryOf([], 'mapFind', 'Europe').total < masteryOf([], 'flags', 'Europe').total)
  })
})

describe('mergeProgress', () => {
  const account: Progress = {
    miles: 1000,
    stamps: ['flags:FR', 'flags:DE'],
    best: [{ mode: 'flags', scope: null, percent: 80 }],
    streak: 3,
    lastDailyDay: '2026-03-08',
    daily: { day: '2026-03-08', points: 5000, correct: 7, total: 10 },
  }
  const guest: Progress = {
    miles: 300,
    stamps: ['flags:DE', 'capitals:IT'],
    best: [
      { mode: 'flags', scope: null, percent: 90 },
      { mode: 'capitals', scope: 'Europe', percent: 40 },
    ],
    streak: 1,
    lastDailyDay: '2026-03-10',
    daily: { day: '2026-03-10', points: 6000, correct: 8, total: 10 },
  }

  test('adds miles, unions stamps, keeps the better best', () => {
    const merged = mergeProgress(account, guest)
    assert.equal(merged.miles, 1300)
    assert.deepEqual(merged.stamps, ['flags:FR', 'flags:DE', 'capitals:IT'])
    assert.deepEqual(merged.best, [
      { mode: 'flags', scope: null, percent: 90 },
      { mode: 'capitals', scope: 'Europe', percent: 40 },
    ])
  })

  test('the streak follows whoever played the Daily last', () => {
    const merged = mergeProgress(account, guest)
    assert.equal(merged.streak, 1)
    assert.equal(merged.lastDailyDay, '2026-03-10')
    assert.equal(merged.daily?.day, '2026-03-10')
  })

  test('merging an empty passport changes nothing', () => {
    assert.deepEqual(mergeProgress(account, EMPTY_PROGRESS), account)
  })
})

describe('the Daily', () => {
  test('is the same for everyone on a given day, and differs the next', () => {
    const a = dailyQuestions('2026-03-10').map((r) => `${r.mode}:${r.question.country.code}`)
    const b = dailyQuestions('2026-03-10').map((r) => `${r.mode}:${r.question.country.code}`)
    const c = dailyQuestions('2026-03-11').map((r) => `${r.mode}:${r.question.country.code}`)
    assert.deepEqual(a, b)
    assert.notDeepEqual(a, c)
  })

  test(`has ${DAILY_LENGTH} questions, drawn from several modes`, () => {
    const rounds = dailyQuestions('2026-03-10')
    assert.equal(rounds.length, DAILY_LENGTH)
    assert.ok(new Set(rounds.map((r) => r.mode)).size > 1)
  })

  test('seeds are stable', () => {
    assert.equal(dailySeed('2026-03-10'), dailySeed('2026-03-10'))
    assert.notEqual(dailySeed('2026-03-10'), dailySeed('2026-03-11'))
  })
})
