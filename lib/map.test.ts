import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { COUNTRIES, CONTINENTS } from '../data/countries.ts'
import { CONTINENT_VIEWBOXES, MAP_SHAPES, MAP_VIEWBOX } from '../data/map.ts'
import { MODES, acceptedFor, countriesIn, gradeClick, isMapped, type Mode } from './quiz.ts'

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
  test('ne référence que des pays du jeu de données', () => {
    const known = new Set(COUNTRIES.map((c) => c.code))
    for (const shape of MAP_SHAPES) {
      if (shape.code) assert.equal(known.has(shape.code), true, shape.code)
    }
  })

  test('n’a qu’un seul tracé par pays', () => {
    const codes = MAP_SHAPES.map((s) => s.code).filter(Boolean)
    assert.equal(new Set(codes).size, codes.length)
  })

  test('a un chemin non vide pour chaque tracé', () => {
    for (const shape of MAP_SHAPES) {
      assert.equal(shape.d.startsWith('M'), true, shape.code ?? 'fond')
    }
  })

  test('dessine les pays jouables au-dessus des territoires de fond', () => {
    const premierJouable = MAP_SHAPES.findIndex((s) => s.code)
    const dernierFond = MAP_SHAPES.map((s) => s.code).lastIndexOf(null)
    assert.ok(dernierFond < premierJouable)
  })

  test('couvre une large majorité des pays', () => {
    const mapped = COUNTRIES.filter(isMapped)
    assert.equal(mapped.length, 165)
    assert.equal(COUNTRIES.length - mapped.length, 29)
  })
})

describe('cadrages', () => {
  test('a un cadrage par continent', () => {
    for (const continent of CONTINENTS) {
      assert.ok(CONTINENT_VIEWBOXES[continent], continent)
    }
  })

  for (const continent of [...CONTINENTS]) {
    test(`le cadrage de ${continent} reste dans le monde et le resserre`, () => {
      const world = parseViewBox(MAP_VIEWBOX)
      const box = parseViewBox(CONTINENT_VIEWBOXES[continent])

      for (const value of Object.values(box)) assert.equal(Number.isFinite(value), true)
      assert.ok(box.width > 0)
      assert.ok(box.height > 0)
      // Un cadrage plus large que le monde signalerait un franchissement de
      // l'antiméridien ou un pays qui étire l'emprise (Russie, Guyane française).
      assert.ok(box.width < world.width * 0.75)
      assert.ok(box.x >= -1)
      assert.ok(box.x + box.width <= world.width + 1)
    })
  }

  test('cadre chaque continent autour de ses propres pays', () => {
    // Un cadrage qui ne contiendrait aucun pays du continent serait inutilisable.
    for (const continent of CONTINENTS) {
      const box = parseViewBox(CONTINENT_VIEWBOXES[continent])
      const codes = new Set(countriesIn(continent, 'mapFind').map((c) => c.code))
      const inside = MAP_SHAPES.filter((s) => s.code && codes.has(s.code)).filter((s) => {
        const { x, y } = centroid(s.d)
        return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
      })
      assert.ok(inside.length > codes.size * 0.7, continent)
    }
  })
})

describe('périmètre des modes carte', () => {
  for (const mode of MAP_MODES) {
    test(`${mode} ne tire que des pays tracés`, () => {
      for (const continent of [null, ...CONTINENTS]) {
        for (const country of countriesIn(continent, mode)) {
          assert.equal(isMapped(country), true, `${country.name} (${mode})`)
        }
      }
    })
  }

  test('les modes sans carte gardent les 194 pays', () => {
    assert.equal(countriesIn(null, 'flags').length, 194)
    assert.equal(countriesIn(null, 'capitals').length, 194)
  })

  test('chaque continent reste jouable sur la carte', () => {
    for (const continent of CONTINENTS) {
      assert.ok(countriesIn(continent, 'mapFind').length > 5, continent)
    }
  })

  test('la surbrillance attend le nom du pays, pas sa capitale', () => {
    const france = COUNTRIES.find((c) => c.code === 'FR')!
    assert.ok(acceptedFor(france, 'mapName').includes('France'))
    assert.ok(!acceptedFor(france, 'mapName').includes('Paris'))
  })
})

describe('correction d’un clic', () => {
  const target = COUNTRIES.find((c) => c.code === 'FR')!
  const question = { country: target, accepted: acceptedFor(target, 'mapFind') }

  test('valide le bon pays sans rien à identifier', () => {
    const { verdict, guess } = gradeClick('FR', question)
    assert.equal(verdict.status, 'exact')
    assert.equal(guess, null)
  })

  test('refuse un autre pays et le nomme', () => {
    const { verdict, guess } = gradeClick('DE', question)
    assert.equal(verdict.status, 'wrong')
    assert.equal(guess?.country.name, 'Allemagne')
  })

  test('n’accorde jamais de « presque » à un clic', () => {
    // Cliquer un voisin n'est pas une faute d'orthographe : c'est faux.
    for (const code of ['DE', 'ES', 'IT', 'BE']) {
      assert.equal(gradeClick(code, question).verdict.status, 'wrong')
    }
  })
})

describe('repères des pays minuscules', () => {
  const size = (code: string) => MAP_SHAPES.find((s) => s.code === code)?.size ?? 0
  const worldWidth = parseViewBox(MAP_VIEWBOX).width

  test('donne un centre et une taille à chaque pays jouable', () => {
    for (const shape of MAP_SHAPES) {
      if (!shape.code) continue
      assert.ok((shape.cx ?? 0) > 0, shape.code)
      assert.ok((shape.cy ?? 0) > 0, shape.code)
      assert.ok((shape.size ?? 0) > 0, shape.code)
    }
  })

  test('mesure l’aire dessinée, pas la boîte englobante', () => {
    // Les Fidji et la Russie franchissent l'antiméridien : leur boîte englobante
    // couvre toute la carte. Mesurées à l'aire, les Fidji sont minuscules et la
    // Russie reste le plus grand pays.
    assert.ok(size('FJ') < worldWidth * 0.013)
    assert.equal(size('RU'), Math.max(...MAP_SHAPES.map((s) => s.size ?? 0)))
  })

  test('place chaque centre à l’intérieur du repère', () => {
    const world = parseViewBox(MAP_VIEWBOX)
    for (const shape of MAP_SHAPES) {
      if (!shape.code) continue
      assert.ok(shape.cx! <= world.width, shape.code)
      assert.ok(shape.cy! <= world.height, shape.code)
    }
  })

  for (const code of ['LU', 'DO', 'TN', 'CY', 'FJ']) {
    test(`${code} est trop petit pour être vu sans repère`, () => {
      assert.ok(size(code) < worldWidth * 0.013)
    })
  }

  for (const code of ['GB', 'IT', 'JP', 'KE', 'FR', 'BR']) {
    test(`${code} se repère sans aide`, () => {
      assert.ok(size(code) >= worldWidth * 0.013)
    })
  }
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

  test('cercle bien assez de pays pour que le test ait un sens', () => {
    assert.ok(ringed.length > 50)
  })

  test('pose chaque cercle sur les terres du pays, jamais en pleine mer', () => {
    // Les Fidji sont le cas limite : à cheval sur l'antiméridien, leurs moitiés
    // se retrouvent aux bords opposés de la carte. Un centre pondéré sur
    // l'ensemble du pays tomberait à 37 unités de toute terre — d'où le choix de
    // ne retenir que la partie la plus étendue.
    for (const shape of ringed) {
      assert.ok(distanceToOutline(shape) < ringRadius, shape.code!)
    }
  })

  test('vise l’île principale des Fidji, pas le milieu du Pacifique', () => {
    const fiji = MAP_SHAPES.find((s) => s.code === 'FJ')!
    assert.ok(distanceToOutline(fiji) < ringRadius)
  })
})
