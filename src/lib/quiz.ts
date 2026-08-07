import { COUNTRIES, type Continent, type Country } from '@/data/countries'
import { checkAnswer, closestMatch, withinTolerance, type Verdict } from '@/lib/answer'

/** Ce que le quiz demande de deviner. */
export type Mode = 'flags' | 'capitals'

export const MODES: Record<Mode, { label: string; short: string; description: string; prompt: string }> = {
  flags: {
    label: 'Drapeaux',
    short: 'Drapeaux',
    description: 'On te montre un drapeau, tu écris le pays.',
    prompt: 'Quel est ce pays ?',
  },
  capitals: {
    label: 'Capitales',
    short: 'Capitales',
    description: 'On te donne un pays, tu écris sa capitale.',
    prompt: 'Quelle est sa capitale ?',
  },
}

/** `null` = tous les continents. */
export type Scope = Continent | null

/** `null` = tout le périmètre choisi. */
export const QUESTION_COUNTS = [10, 20, 50, null] as const
export type QuestionCount = (typeof QUESTION_COUNTS)[number]

export type Question = {
  country: Country
  /** Orthographes acceptées pour cette question. */
  accepted: string[]
}

export type Answered = Question & {
  /** Saisie de l'utilisateur, `null` si la question a été passée. */
  input: string | null
  verdict: Verdict
  /** En cas d'erreur, le pays que la saisie désignait réellement. */
  guess: Guess | null
}

export function acceptedFor(country: Country, mode: Mode): string[] {
  // Les codes ISO abrègent le pays, pas sa capitale.
  return mode === 'flags'
    ? [country.name, ...country.nameAliases, ...country.codes]
    : [country.capital, ...country.capitalAliases]
}

export function expectedFor(country: Country, mode: Mode): string {
  return mode === 'flags' ? country.name : country.capital
}

export function countriesIn(scope: Scope): Country[] {
  return scope ? COUNTRIES.filter((c) => c.continent === scope) : COUNTRIES
}

export function flagUrl(code: string, width: 320 | 640 = 640): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Tire une série de questions. `count` à `null` pour prendre tout le périmètre. */
export function buildQuiz(mode: Mode, scope: Scope, count: number | null): Question[] {
  const pool = countriesIn(scope)
  const picked = count === null ? shuffle(pool) : shuffle(pool).slice(0, count)
  return picked.map((country) => ({ country, accepted: acceptedFor(country, mode) }))
}

/** Rejoue uniquement les questions ratées, dans un ordre neuf. */
export function retryQuiz(answered: Answered[]): Question[] {
  return shuffle(
    answered
      .filter((a) => a.verdict.status === 'wrong')
      .map(({ country, accepted }) => ({ country, accepted })),
  )
}

/** Le pays qu'une réponse fausse désigne réellement. */
export type Guess = {
  country: Country
  /** L'orthographe reconnue — le nom du pays, ou la capitale en mode Capitales. */
  label: string
}

/**
 * Retrouve ce que l'utilisateur a nommé quand il s'est trompé : « france » pour
 * le drapeau britannique désigne la France, « berlin » pour la Belgique désigne
 * l'Allemagne.
 *
 * Une simple faute de frappe sur la bonne réponse ne doit pas être présentée
 * comme un autre pays : on n'identifie que si la saisie est *strictement* plus
 * proche d'un autre pays que de la réponse attendue. « mozambic » reste donc une
 * faute sur le Mozambique, et non une réponse « Zambie ».
 */
export function identify(input: string, question: Question, mode: Mode): Guess | null {
  const target = closestMatch(input, question.accepted)

  let best: (Guess & { distance: number }) | null = null
  let ambiguous = false

  for (const candidate of COUNTRIES) {
    if (candidate.code === question.country.code) continue

    const match = closestMatch(input, acceptedFor(candidate, mode))
    if (!match.candidate) continue
    if (match.distance >= target.distance) continue
    if (!withinTolerance(input, match)) continue

    if (!best || match.distance < best.distance) {
      best = { country: candidate, label: match.candidate, distance: match.distance }
      ambiguous = false
    } else if (match.distance === best.distance) {
      ambiguous = true
    }
  }

  // Deux pays aussi proches l'un que l'autre : mieux vaut ne rien affirmer.
  if (!best || ambiguous) return null
  return { country: best.country, label: best.label }
}

/** Réponses valables de tous les *autres* pays, mémoïsées par mode. */
const distractorCache = new Map<Mode, Map<string, string[][]>>()

function distractorsFor(country: Country, mode: Mode): string[][] {
  let byCountry = distractorCache.get(mode)
  if (!byCountry) {
    byCountry = new Map()
    distractorCache.set(mode, byCountry)
  }
  let cached = byCountry.get(country.code)
  if (!cached) {
    cached = COUNTRIES.filter((c) => c.code !== country.code).map((c) => acceptedFor(c, mode))
    byCountry.set(country.code, cached)
  }
  return cached
}

/**
 * Corrige une saisie. Tous les autres pays servent de repoussoirs, y compris
 * hors du périmètre joué : « gambie » ne doit pas passer pour la Zambie même
 * dans une série où la Gambie n'a pas été tirée.
 */
export function gradeAnswer(input: string, question: Question, mode: Mode): Verdict {
  return checkAnswer(input, question.accepted, distractorsFor(question.country, mode))
}
