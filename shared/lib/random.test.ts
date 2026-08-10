import { describe, expect, it } from 'vitest'
import { pick, randomFrom, randomSeed, shuffle } from './random.ts'
import { buildQuiz, retryQuiz, type Answered } from './quiz.ts'

describe('générateur ensemençable', () => {
  it('rend toujours la même suite pour une même graine', () => {
    const suite = (graine: number) => Array.from({ length: 20 }, randomFrom(graine))
    expect(suite(1234)).toEqual(suite(1234))
  })

  it('rend des suites différentes pour des graines différentes', () => {
    const suite = (graine: number) => Array.from({ length: 20 }, randomFrom(graine))
    expect(suite(1234)).not.toEqual(suite(1235))
  })

  it('ne dégénère pas sur une graine de zéro', () => {
    const valeurs = Array.from({ length: 20 }, randomFrom(0))
    expect(new Set(valeurs).size).toBeGreaterThan(15)
  })

  it('reste dans [0, 1)', () => {
    const random = randomFrom(99)
    for (let i = 0; i < 5000; i++) {
      const valeur = random()
      expect(valeur).toBeGreaterThanOrEqual(0)
      expect(valeur).toBeLessThan(1)
    }
  })

  it('distribue sans biais grossier', () => {
    // Dix paniers sur cinq mille tirages : chacun devrait en recevoir ~500.
    const random = randomFrom(7)
    const paniers = new Array(10).fill(0)
    for (let i = 0; i < 5000; i++) paniers[Math.floor(random() * 10)]++
    for (const compte of paniers) expect(compte).toBeGreaterThan(350)
  })

  it('produit des graines exploitables', () => {
    const graine = randomSeed()
    expect(Number.isInteger(graine)).toBe(true)
    expect(graine).toBeGreaterThanOrEqual(0)
  })
})

describe('mélange', () => {
  const items = Array.from({ length: 50 }, (_, i) => i)

  it('conserve tous les éléments', () => {
    expect([...shuffle(items, randomFrom(3))].sort((a, b) => a - b)).toEqual(items)
  })

  it('ne modifie pas le tableau reçu', () => {
    const original = [...items]
    shuffle(items, randomFrom(3))
    expect(items).toEqual(original)
  })

  it('rend le même ordre pour une même graine', () => {
    expect(shuffle(items, randomFrom(42))).toEqual(shuffle(items, randomFrom(42)))
  })

  it('rend un ordre différent pour une autre graine', () => {
    expect(shuffle(items, randomFrom(42))).not.toEqual(shuffle(items, randomFrom(43)))
  })

  it('mélange vraiment', () => {
    expect(shuffle(items, randomFrom(42))).not.toEqual(items)
  })
})

describe('tirage d’un élément', () => {
  it('rend le même élément pour une même graine', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    expect(pick(items, randomFrom(8))).toBe(pick(items, randomFrom(8)))
  })

  it('rend undefined sur une liste vide', () => {
    expect(pick([], randomFrom(1))).toBeUndefined()
  })

  it('ne rend jamais autre chose qu’un élément de la liste', () => {
    const items = ['a', 'b', 'c']
    const random = randomFrom(5)
    for (let i = 0; i < 200; i++) expect(items).toContain(pick(items, random))
  })
})

describe('série reproductible', () => {
  const codes = (questions: ReturnType<typeof buildQuiz>) => questions.map((q) => q.country.code)

  it('rend la même série pour une même graine', () => {
    expect(codes(buildQuiz('flags', 'Europe', 20, randomFrom(2024)))).toEqual(
      codes(buildQuiz('flags', 'Europe', 20, randomFrom(2024))),
    )
  })

  it('rend une série différente pour une autre graine', () => {
    expect(codes(buildQuiz('flags', 'Europe', 20, randomFrom(2024)))).not.toEqual(
      codes(buildQuiz('flags', 'Europe', 20, randomFrom(2025)))
    )
  })

  it('respecte le périmètre et le mode malgré la graine', () => {
    const questions = buildQuiz('mapFind', 'Afrique', 15, randomFrom(1))
    expect(questions).toHaveLength(15)
    for (const q of questions) expect(q.country.continent).toBe('Afrique')
  })

  it('ne répète jamais un pays dans une même série', () => {
    const tirés = codes(buildQuiz('flags', null, 50, randomFrom(9)))
    expect(new Set(tirés).size).toBe(50)
  })

  it('sans graine, deux séries diffèrent', () => {
    // Le solo garde un tirage imprévisible : sur 194 pays, deux séries de 50
    // identiques seraient un évènement d'une improbabilité astronomique.
    expect(codes(buildQuiz('flags', null, 50))).not.toEqual(codes(buildQuiz('flags', null, 50)))
  })

  it('rejoue les erreurs dans un ordre reproductible', () => {
    const ratées = buildQuiz('flags', 'Europe', 10, randomFrom(4)).map(
      (q): Answered => ({ ...q, input: 'faux', verdict: { status: 'wrong' }, guess: null }),
    )
    const a = retryQuiz(ratées, randomFrom(11)).map((q) => q.country.code)
    const b = retryQuiz(ratées, randomFrom(11)).map((q) => q.country.code)
    expect(a).toEqual(b)
    expect(a).toHaveLength(10)
  })
})
