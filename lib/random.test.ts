import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { pick, randomFrom, randomSeed, shuffle } from './random.ts'
import { buildQuiz, retryQuiz, type Answered } from './quiz.ts'

describe('générateur ensemençable', () => {
  test('rend toujours la même suite pour une même graine', () => {
    const suite = (graine: number) => Array.from({ length: 20 }, randomFrom(graine))
    assert.deepEqual(suite(1234), suite(1234))
  })

  test('rend des suites différentes pour des graines différentes', () => {
    const suite = (graine: number) => Array.from({ length: 20 }, randomFrom(graine))
    assert.notDeepEqual(suite(1234), suite(1235))
  })

  test('ne dégénère pas sur une graine de zéro', () => {
    const valeurs = Array.from({ length: 20 }, randomFrom(0))
    assert.ok(new Set(valeurs).size > 15)
  })

  test('reste dans [0, 1)', () => {
    const random = randomFrom(99)
    for (let i = 0; i < 5000; i++) {
      const valeur = random()
      assert.ok(valeur >= 0)
      assert.ok(valeur < 1)
    }
  })

  test('distribue sans biais grossier', () => {
    // Dix paniers sur cinq mille tirages : chacun devrait en recevoir ~500.
    const random = randomFrom(7)
    const paniers = new Array(10).fill(0)
    for (let i = 0; i < 5000; i++) paniers[Math.floor(random() * 10)]++
    for (const compte of paniers) assert.ok(compte > 350)
  })

  test('produit des graines exploitables', () => {
    const graine = randomSeed()
    assert.equal(Number.isInteger(graine), true)
    assert.ok(graine >= 0)
  })
})

describe('mélange', () => {
  const items = Array.from({ length: 50 }, (_, i) => i)

  test('conserve tous les éléments', () => {
    assert.deepEqual([...shuffle(items, randomFrom(3))].sort((a, b) => a - b), items)
  })

  test('ne modifie pas le tableau reçu', () => {
    const original = [...items]
    shuffle(items, randomFrom(3))
    assert.deepEqual(items, original)
  })

  test('rend le même ordre pour une même graine', () => {
    assert.deepEqual(shuffle(items, randomFrom(42)), shuffle(items, randomFrom(42)))
  })

  test('rend un ordre différent pour une autre graine', () => {
    assert.notDeepEqual(shuffle(items, randomFrom(42)), shuffle(items, randomFrom(43)))
  })

  test('mélange vraiment', () => {
    assert.notDeepEqual(shuffle(items, randomFrom(42)), items)
  })
})

describe('tirage d’un élément', () => {
  test('rend le même élément pour une même graine', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    assert.equal(pick(items, randomFrom(8)), pick(items, randomFrom(8)))
  })

  test('rend undefined sur une liste vide', () => {
    assert.equal(pick([], randomFrom(1)), undefined)
  })

  test('ne rend jamais autre chose qu’un élément de la liste', () => {
    const items = ['a', 'b', 'c']
    const random = randomFrom(5)
    for (let i = 0; i < 200; i++) assert.ok(items.includes(pick(items, random)!))
  })
})

describe('série reproductible', () => {
  const codes = (questions: ReturnType<typeof buildQuiz>) => questions.map((q) => q.country.code)

  test('rend la même série pour une même graine', () => {
    assert.deepEqual(codes(buildQuiz('flags', 'Europe', 20, randomFrom(2024))), codes(buildQuiz('flags', 'Europe', 20, randomFrom(2024))))
  })

  test('rend une série différente pour une autre graine', () => {
    assert.notDeepEqual(codes(buildQuiz('flags', 'Europe', 20, randomFrom(2024))), codes(buildQuiz('flags', 'Europe', 20, randomFrom(2025))))
  })

  test('respecte le périmètre et le mode malgré la graine', () => {
    const questions = buildQuiz('mapFind', 'Afrique', 15, randomFrom(1))
    assert.equal(questions.length, 15)
    for (const q of questions) assert.equal(q.country.continent, 'Afrique')
  })

  test('ne répète jamais un pays dans une même série', () => {
    const tirés = codes(buildQuiz('flags', null, 50, randomFrom(9)))
    assert.equal(new Set(tirés).size, 50)
  })

  test('sans graine, deux séries diffèrent', () => {
    // Le solo garde un tirage imprévisible : sur 194 pays, deux séries de 50
    // identiques seraient un évènement d'une improbabilité astronomique.
    assert.notDeepEqual(codes(buildQuiz('flags', null, 50)), codes(buildQuiz('flags', null, 50)))
  })

  test('rejoue les erreurs dans un ordre reproductible', () => {
    const ratées = buildQuiz('flags', 'Europe', 10, randomFrom(4)).map(
      (q): Answered => ({ ...q, input: 'faux', verdict: { status: 'wrong' }, guess: null }),
    )
    const a = retryQuiz(ratées, randomFrom(11)).map((q) => q.country.code)
    const b = retryQuiz(ratées, randomFrom(11)).map((q) => q.country.code)
    assert.deepEqual(a, b)
    assert.equal(a.length, 10)
  })
})
