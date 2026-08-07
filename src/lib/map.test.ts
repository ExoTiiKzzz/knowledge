import { describe, expect, it } from 'vitest'
import { COUNTRIES, CONTINENTS } from '@/data/countries'
import { CONTINENT_VIEWBOXES, MAP_SHAPES, MAP_VIEWBOX } from '@/data/map'
import { MODES, acceptedFor, countriesIn, gradeClick, isMapped, type Mode } from '@/lib/quiz'

const MAP_MODES = (Object.keys(MODES) as Mode[]).filter((m) => MODES[m].needsMap)

function parseViewBox(value: string) {
  const [x, y, width, height] = value.split(' ').map(Number)
  return { x, y, width, height }
}

/**
 * Centre approximatif d'un tracé. geoPath n'émet que des commandes M/L/Z, donc
 * tous les nombres du chemin sont des coordonnées, appariées dans l'ordre.
 */
function centroid(d: string) {
  const numbers = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  let sumX = 0
  let sumY = 0
  const count = Math.floor(numbers.length / 2)
  for (let i = 0; i < count; i++) {
    sumX += numbers[i * 2]
    sumY += numbers[i * 2 + 1]
  }
  return { x: sumX / count, y: sumY / count }
}

describe('géométrie de la carte', () => {
  it('ne référence que des pays du jeu de données', () => {
    const known = new Set(COUNTRIES.map((c) => c.code))
    for (const shape of MAP_SHAPES) {
      if (shape.code) expect(known.has(shape.code), shape.code).toBe(true)
    }
  })

  it('n’a qu’un seul tracé par pays', () => {
    const codes = MAP_SHAPES.map((s) => s.code).filter(Boolean)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('a un chemin non vide pour chaque tracé', () => {
    for (const shape of MAP_SHAPES) {
      expect(shape.d.startsWith('M'), shape.code ?? 'fond').toBe(true)
    }
  })

  it('dessine les pays jouables au-dessus des territoires de fond', () => {
    const premierJouable = MAP_SHAPES.findIndex((s) => s.code)
    const dernierFond = MAP_SHAPES.map((s) => s.code).lastIndexOf(null)
    expect(dernierFond).toBeLessThan(premierJouable)
  })

  it('couvre une large majorité des pays', () => {
    const mapped = COUNTRIES.filter(isMapped)
    expect(mapped.length).toBe(165)
    expect(COUNTRIES.length - mapped.length).toBe(29)
  })
})

describe('cadrages', () => {
  it('a un cadrage par continent', () => {
    for (const continent of CONTINENTS) {
      expect(CONTINENT_VIEWBOXES[continent], continent).toBeTruthy()
    }
  })

  it.each([...CONTINENTS])('le cadrage de %s reste dans le monde et le resserre', (continent) => {
    const world = parseViewBox(MAP_VIEWBOX)
    const box = parseViewBox(CONTINENT_VIEWBOXES[continent])

    for (const value of Object.values(box)) expect(Number.isFinite(value)).toBe(true)
    expect(box.width).toBeGreaterThan(0)
    expect(box.height).toBeGreaterThan(0)
    // Un cadrage plus large que le monde signalerait un franchissement de
    // l'antiméridien ou un pays qui étire l'emprise (Russie, Guyane française).
    expect(box.width).toBeLessThan(world.width * 0.75)
    expect(box.x).toBeGreaterThanOrEqual(-1)
    expect(box.x + box.width).toBeLessThanOrEqual(world.width + 1)
  })

  it('cadre chaque continent autour de ses propres pays', () => {
    // Un cadrage qui ne contiendrait aucun pays du continent serait inutilisable.
    for (const continent of CONTINENTS) {
      const box = parseViewBox(CONTINENT_VIEWBOXES[continent])
      const codes = new Set(countriesIn(continent, 'mapFind').map((c) => c.code))
      const inside = MAP_SHAPES.filter((s) => s.code && codes.has(s.code)).filter((s) => {
        const { x, y } = centroid(s.d)
        return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
      })
      expect(inside.length, continent).toBeGreaterThan(codes.size * 0.7)
    }
  })
})

describe('périmètre des modes carte', () => {
  it.each(MAP_MODES)('%s ne tire que des pays tracés', (mode) => {
    for (const continent of [null, ...CONTINENTS]) {
      for (const country of countriesIn(continent, mode)) {
        expect(isMapped(country), `${country.name} (${mode})`).toBe(true)
      }
    }
  })

  it('les modes sans carte gardent les 194 pays', () => {
    expect(countriesIn(null, 'flags')).toHaveLength(194)
    expect(countriesIn(null, 'capitals')).toHaveLength(194)
  })

  it('chaque continent reste jouable sur la carte', () => {
    for (const continent of CONTINENTS) {
      expect(countriesIn(continent, 'mapFind').length, continent).toBeGreaterThan(5)
    }
  })

  it('la surbrillance attend le nom du pays, pas sa capitale', () => {
    const france = COUNTRIES.find((c) => c.code === 'FR')!
    expect(acceptedFor(france, 'mapName')).toContain('France')
    expect(acceptedFor(france, 'mapName')).not.toContain('Paris')
  })
})

describe('correction d’un clic', () => {
  const target = COUNTRIES.find((c) => c.code === 'FR')!
  const question = { country: target, accepted: acceptedFor(target, 'mapFind') }

  it('valide le bon pays sans rien à identifier', () => {
    const { verdict, guess } = gradeClick('FR', question)
    expect(verdict.status).toBe('exact')
    expect(guess).toBeNull()
  })

  it('refuse un autre pays et le nomme', () => {
    const { verdict, guess } = gradeClick('DE', question)
    expect(verdict.status).toBe('wrong')
    expect(guess?.country.name).toBe('Allemagne')
  })

  it('n’accorde jamais de « presque » à un clic', () => {
    // Cliquer un voisin n'est pas une faute d'orthographe : c'est faux.
    for (const code of ['DE', 'ES', 'IT', 'BE']) {
      expect(gradeClick(code, question).verdict.status).toBe('wrong')
    }
  })
})

describe('repères des pays minuscules', () => {
  const size = (code: string) => MAP_SHAPES.find((s) => s.code === code)?.size ?? 0
  const worldWidth = parseViewBox(MAP_VIEWBOX).width

  it('donne un centre et une taille à chaque pays jouable', () => {
    for (const shape of MAP_SHAPES) {
      if (!shape.code) continue
      expect(shape.cx, shape.code).toBeGreaterThan(0)
      expect(shape.cy, shape.code).toBeGreaterThan(0)
      expect(shape.size, shape.code).toBeGreaterThan(0)
    }
  })

  it('mesure l’aire dessinée, pas la boîte englobante', () => {
    // Les Fidji et la Russie franchissent l'antiméridien : leur boîte englobante
    // couvre toute la carte. Mesurées à l'aire, les Fidji sont minuscules et la
    // Russie reste le plus grand pays.
    expect(size('FJ')).toBeLessThan(worldWidth * 0.013)
    expect(size('RU')).toBe(Math.max(...MAP_SHAPES.map((s) => s.size ?? 0)))
  })

  it('place chaque centre à l’intérieur du repère', () => {
    const world = parseViewBox(MAP_VIEWBOX)
    for (const shape of MAP_SHAPES) {
      if (!shape.code) continue
      expect(shape.cx!, shape.code).toBeLessThanOrEqual(world.width)
      expect(shape.cy!, shape.code).toBeLessThanOrEqual(world.height)
    }
  })

  it.each(['LU', 'DO', 'TN', 'CY', 'FJ'])('%s est trop petit pour être vu sans repère', (code) => {
    expect(size(code)).toBeLessThan(worldWidth * 0.013)
  })

  it.each(['GB', 'IT', 'JP', 'KE', 'FR', 'BR'])('%s se repère sans aide', (code) => {
    expect(size(code)).toBeGreaterThanOrEqual(worldWidth * 0.013)
  })
})

describe('centre des repères', () => {
  /** Sommets du tracé, dans les unités du repère. */
  function vertices(d: string) {
    const numbers = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
    const points: Array<[number, number]> = []
    for (let i = 0; i < Math.floor(numbers.length / 2); i++) {
      points.push([numbers[i * 2], numbers[i * 2 + 1]])
    }
    return points
  }

  function distanceToOutline(shape: (typeof MAP_SHAPES)[number]) {
    let best = Infinity
    for (const [x, y] of vertices(shape.d)) {
      best = Math.min(best, Math.hypot(x - shape.cx!, y - shape.cy!))
    }
    return best
  }

  const worldWidth = parseViewBox(MAP_VIEWBOX).width
  const ringRadius = worldWidth * 0.016
  const ringed = MAP_SHAPES.filter((s) => s.code && (s.size ?? 0) < worldWidth * 0.013)

  it('cercle bien assez de pays pour que le test ait un sens', () => {
    expect(ringed.length).toBeGreaterThan(50)
  })

  it('pose chaque cercle sur les terres du pays, jamais en pleine mer', () => {
    // Les Fidji sont le cas limite : à cheval sur l'antiméridien, leurs moitiés
    // se retrouvent aux bords opposés de la carte. Un centre pondéré sur
    // l'ensemble du pays tomberait à 37 unités de toute terre — d'où le choix de
    // ne retenir que la partie la plus étendue.
    for (const shape of ringed) {
      expect(distanceToOutline(shape), shape.code!).toBeLessThan(ringRadius)
    }
  })

  it('vise l’île principale des Fidji, pas le milieu du Pacifique', () => {
    const fiji = MAP_SHAPES.find((s) => s.code === 'FJ')!
    expect(distanceToOutline(fiji)).toBeLessThan(ringRadius)
  })
})
