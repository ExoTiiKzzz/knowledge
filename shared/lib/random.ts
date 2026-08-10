/**
 * Générateur pseudo-aléatoire ensemençable.
 *
 * Le multijoueur exige qu'une même graine produise toujours la même série : sans
 * cela, le moteur de salon ne se teste pas de façon déterministe, et le serveur
 * ne peut pas rejouer une partie à l'identique pour la déboguer.
 *
 * L'algorithme retenu est `mulberry32` : trente lignes, aucune dépendance, et une
 * qualité de distribution très supérieure à ce qu'un quiz demande. Ce n'est pas un
 * générateur cryptographique et il ne doit jamais servir à produire un secret.
 */

/** Rend un flottant dans [0, 1). Même contrat que `Math.random`. */
export type Random = () => number

/** Crée un générateur déterministe à partir d'une graine entière. */
export function randomFrom(seed: number): Random {
  // Le décalage évite qu'une graine de 0 dégénère en suite constante.
  let state = (seed >>> 0) + 0x6d2b79f5

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Graine imprévisible, pour les parties dont personne n'a besoin de rejouer le tirage. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

/**
 * Mélange de Fisher-Yates. Rend un nouveau tableau ; l'entrée n'est pas modifiée.
 *
 * Le générateur est un paramètre et non l'aléatoire global : c'est ce qui rend le
 * tirage reproductible.
 */
export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Tire un élément au hasard. Rend `undefined` sur une liste vide. */
export function pick<T>(items: readonly T[], random: Random = Math.random): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(random() * items.length)]
}
