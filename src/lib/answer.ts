/**
 * Correction tolérante aux fautes d'orthographe.
 *
 * On accepte une réponse « très proche » de la bonne, sans pour autant valider
 * une réponse qui désigne en réalité un autre pays : « Corée du Sud » est à
 * distance 3 de « Corée du Nord », ce qui rentrerait dans la tolérance d'une
 * chaîne de cette longueur. D'où la seconde règle : une réponse plus proche
 * d'une autre bonne réponse du jeu que de celle attendue est refusée.
 */

const DIACRITICS = /[̀-ͯ]/g
const ARTICLES = /\b(le|la|les|l|de|du|des|d)\b/g

/**
 * Réduit une réponse à sa forme comparable : minuscules, sans accents, sans
 * ponctuation, sans articles et sans espaces. Retirer les espaces en dernier
 * réconcilie les graphies que la ponctuation sépare arbitrairement —
 * « N'Djaména » et « Ndjamena », « New Delhi » et « Newdelhi ».
 */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(ARTICLES, ' ')
    .replace(/\s+/g, '')
}

/** Distance de Levenshtein, bornée à `max` pour sortir tôt. */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
      rowMin = Math.min(rowMin, row[j])
    }
    if (rowMin > max) return max + 1
    prev = row
  }
  return prev[b.length]
}

/** Nombre de fautes tolérées, proportionnel à la longueur de la réponse attendue. */
function tolerance(length: number): number {
  if (length <= 4) return 0
  if (length <= 7) return 1
  if (length <= 12) return 2
  return 3
}

/**
 * Longueur minimale d'une abréviation par troncature. En dessous, « saint » ou
 * « coree » désignent trop de pays pour trancher.
 */
const MIN_PREFIX = 5

export type Match = {
  distance: number
  /** Longueur normalisée de l'orthographe retenue. */
  length: number
  /** L'orthographe retenue, telle qu'elle est écrite dans les données. */
  candidate: string | null
}

/** Orthographe acceptée la plus proche de la saisie (déjà normalisée). */
function closest(input: string, accepted: string[]): Match {
  let best: Match = { distance: Infinity, length: 0, candidate: null }
  for (const candidate of accepted) {
    const normalized = normalize(candidate)
    if (!normalized) continue
    const distance = editDistance(input, normalized, best.distance)
    if (distance < best.distance) best = { distance, length: normalized.length, candidate }
    if (best.distance === 0) break
  }
  return best
}

/** Orthographe acceptée la plus proche d'une saisie brute. */
export function closestMatch(input: string, accepted: string[]): Match {
  return closest(normalize(input), accepted)
}

/** La correspondance tient-elle dans la tolérance aux fautes ? */
export function withinTolerance(input: string, match: Match): boolean {
  return match.distance <= tolerance(Math.max(normalize(input).length, match.length))
}

/** La saisie tronque-t-elle l'une des réponses acceptées ? */
function truncates(input: string, accepted: string[]): boolean {
  return accepted.some((candidate) => {
    const normalized = normalize(candidate)
    return normalized.length > input.length && normalized.startsWith(input)
  })
}

export type Verdict =
  /** Orthographe exacte (à la casse, aux accents et aux articles près). */
  | { status: 'exact' }
  /** Accepté malgré une faute ou une troncature. */
  | { status: 'close' }
  | { status: 'wrong' }

/**
 * @param input       la saisie de l'utilisateur
 * @param accepted    orthographes valables pour la question posée
 * @param distractors orthographes valables des *autres* questions du jeu, pour
 *                    écarter les réponses ambiguës
 */
export function checkAnswer(input: string, accepted: string[], distractors: string[][]): Verdict {
  const normalized = normalize(input)
  if (!normalized) return { status: 'wrong' }

  const match = closest(normalized, accepted)
  if (match.distance === 0) return { status: 'exact' }

  // Une saisie qui désigne exactement un autre pays est refusée sans autre
  // examen : « guinee » ne vaut pas Guinée-Bissau, « niger » ne vaut pas Nigéria.
  if (distractors.some((other) => closest(normalized, other).distance === 0)) return { status: 'wrong' }

  // Abréviation par troncature : « bosnie » pour Bosnie-Herzégovine, « arabie »
  // pour Arabie Saoudite. Refusée si elle tronque aussi un autre pays.
  if (
    normalized.length >= MIN_PREFIX &&
    truncates(normalized, accepted) &&
    !distractors.some((other) => truncates(normalized, other))
  ) {
    return { status: 'close' }
  }

  if (match.distance > tolerance(Math.max(normalized.length, match.length))) return { status: 'wrong' }

  for (const other of distractors) {
    if (closest(normalized, other).distance < match.distance) return { status: 'wrong' }
  }
  return { status: 'close' }
}
