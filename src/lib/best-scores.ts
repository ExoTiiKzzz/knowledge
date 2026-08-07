import type { Mode, Scope } from '@/lib/quiz'

const STORAGE_KEY = 'geoquiz.best-scores'

/** Un record par combinaison mode + continent (le nombre de questions n'entre pas en compte). */
function keyOf(mode: Mode, scope: Scope): string {
  return `${mode}:${scope ?? 'monde'}`
}

function read(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    // localStorage indisponible (navigation privée, quota) : on joue sans historique.
    return {}
  }
}

export function getBestScore(mode: Mode, scope: Scope): number | null {
  return read()[keyOf(mode, scope)] ?? null
}

/** Enregistre le score s'il améliore le record ; renvoie `true` dans ce cas. */
export function saveBestScore(mode: Mode, scope: Scope, percent: number): boolean {
  const scores = read()
  const key = keyOf(mode, scope)
  if (scores[key] !== undefined && scores[key] >= percent) return false

  scores[key] = percent
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
  } catch {
    return false
  }
  return true
}
