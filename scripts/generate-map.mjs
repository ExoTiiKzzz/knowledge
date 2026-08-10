/**
 * Génère shared/data/map.ts : la carte du monde en chemins SVG déjà projetés.
 *
 * Projeter à la génération plutôt qu'à l'exécution évite d'embarquer d3-geo et
 * topojson dans le bundle — le navigateur ne reçoit que des chaînes `d`.
 *
 *   npm run gen:map
 */
import { writeFileSync } from 'node:fs'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import topology from 'world-atlas/countries-110m.json' with { type: 'json' }
import countries from 'world-countries'

/** Largeur du repère SVG ; la hauteur suit le ratio de la projection. */
const WIDTH = 1000
/** Précision des coordonnées, en pixels du repère. Au-delà, on ne voit plus rien. */
const DECIMALS = 1

const collection = feature(topology, topology.objects.countries)

const projection = geoNaturalEarth1().fitWidth(WIDTH, collection)
const [, height] = projection.clipExtent()?.[1] ?? []
const path = geoPath(projection)

// fitWidth ne renseigne pas la hauteur : on la déduit de l'emprise projetée.
const bounds = path.bounds(collection)
const HEIGHT = Math.ceil(bounds[1][1] - bounds[0][1])
void height

/** ccn3 (identifiant de world-atlas) → code ISO alpha-2 des pays jouables. */
const playable = new Map(
  countries.filter((c) => c.unMember && c.capital?.length).map((c) => [c.ccn3, c.cca2]),
)

/**
 * Réduit un pays à sa partie la plus étendue.
 *
 * Le centre de l'ensemble tomberait en pleine mer pour les pays en morceaux :
 * les Fidji franchissent l'antiméridien, leurs deux moitiés se retrouvant aux
 * bords opposés de la carte, et le centre pondéré atterrit à 37 unités de toute
 * terre. Le repère doit désigner l'île principale, pas le milieu du Pacifique.
 */
function largestPart(feature) {
  if (feature.geometry.type !== 'MultiPolygon') return feature

  let best = null
  let bestArea = -Infinity
  for (const coordinates of feature.geometry.coordinates) {
    const part = { type: 'Feature', geometry: { type: 'Polygon', coordinates } }
    const area = Math.abs(path.area(part))
    if (area > bestArea) {
      bestArea = area
      best = part
    }
  }
  return best ?? feature
}

/** Allège le chemin : 0,1 px de précision suffit à ce niveau de zoom. */
function round(d) {
  return d.replace(/\d+\.\d+/g, (value) => String(Number(Number(value).toFixed(DECIMALS))))
}

const shapes = collection.features
  .map((f) => {
    const d = path(f)
    if (!d) return null

    const code = playable.get(f.id) ?? null
    if (!code) {
      // Territoire hors quiz (Antarctique, Taïwan, Sahara occidental…), dessiné
      // en fond pour que la carte reste lisible mais jamais cliquable.
      return { code: null, d: round(d) }
    }

    const [cx, cy] = path.centroid(largestPart(f))
    return {
      code,
      d: round(d),
      // Centre et taille du tracé : de quoi ancrer un repère cliquable et
      // visible sur les pays trop petits pour être atteints au doigt.
      //
      // La taille dérive de l'aire dessinée, pas de la boîte englobante : les
      // Fidji et la Russie franchissent l'antiméridien, ce qui étire leur boîte
      // sur toute la largeur de la carte et ferait passer les Fidji pour un
      // pays immense.
      cx: Number(cx.toFixed(DECIMALS)),
      cy: Number(cy.toFixed(DECIMALS)),
      size: Number(Math.sqrt(Math.abs(path.area(f))).toFixed(DECIMALS)),
    }
  })
  .filter(Boolean)
  // Les pays jouables en dernier : ils passent ainsi au-dessus des fonds.
  .sort((a, b) => Number(Boolean(a.code)) - Number(Boolean(b.code)))

/**
 * Fenêtres de cadrage par continent, en longitude/latitude.
 *
 * Elles sont posées à la main, et non déduites de l'emprise des pays : la Russie
 * étirerait l'Europe sur tout l'hémisphère nord, la Guyane rattacherait la France
 * à l'Amérique du Sud, et les Fidji font franchir l'antiméridien à l'Océanie.
 * Le cadrage d'un continent est un choix de lecture, pas une donnée.
 */
const WINDOWS = {
  Europe: { lon: [-26, 46], lat: [33, 72] },
  Afrique: { lon: [-20, 53], lat: [-37, 39] },
  Asie: { lon: [24, 151], lat: [-12, 57] },
  'Amérique du Nord': { lon: [-171, -51], lat: [4, 73] },
  'Amérique du Sud': { lon: [-83, -32], lat: [-57, 14] },
  // Bornée juste avant l'antiméridien : à 180° la projection repart du bord
  // gauche, ce qui étirerait le cadrage sur toute la largeur du monde. Coupe la
  // pointe orientale des Fidji, dont les îles principales restent visibles.
  Océanie: { lon: [109, 179.5], lat: [-49, 1] },
}

/**
 * Emprise projetée d'une fenêtre géographique. La projection n'étant pas
 * linéaire, on échantillonne le pourtour au lieu d'en projeter les 4 coins.
 */
function viewBoxOf({ lon, lat }, steps = 60) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const λ = lon[0] + (lon[1] - lon[0]) * t
    const φ = lat[0] + (lat[1] - lat[0]) * t
    for (const point of [
      [λ, lat[0]],
      [λ, lat[1]],
      [lon[0], φ],
      [lon[1], φ],
    ]) {
      const projected = projection(point)
      if (!projected) continue
      const [x, y] = projected
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  }

  // Borné au tracé mondial : la projection se resserre vers les pôles, si bien
  // qu'un point équatorial à 179,5° tombe plus à l'est que la terre la plus
  // orientale (la Tchoukotka, vers 65° N). Sans cette borne, le cadrage de
  // l'Océanie dépasserait le bord droit de la carte.
  const left = Math.max(0, x0)
  const top = Math.max(0, y0)
  return [left, top, Math.min(WIDTH, x1) - left, Math.min(HEIGHT, y1) - top].map((v) =>
    Number(v.toFixed(DECIMALS)),
  )
}

const viewBoxes = Object.fromEntries(
  Object.entries(WINDOWS).map(([continent, window]) => [continent, viewBoxOf(window)]),
)

const mapped = shapes.filter((s) => s.code).length
const out = `// Fichier généré par scripts/generate-map.mjs — ne pas éditer à la main.
// Source : world-atlas (Natural Earth 110m), projection geoNaturalEarth1.

/** Repère du tracé mondial. Les chemins sont exprimés dans ce système. */
export const MAP_VIEWBOX = '0 0 ${WIDTH} ${HEIGHT}'

/**
 * Cadrages resserrés par continent. La Russie s'étendant sur tout l'hémisphère
 * nord, le cadrage de l'Europe et celui de l'Asie restent larges.
 */
export const CONTINENT_VIEWBOXES: Record<string, string> = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(viewBoxes).map(([continent, box]) => [continent, box.join(' ')]),
  ),
  null,
  2,
)}

export type MapShape = {
  /** Code ISO alpha-2, ou \`null\` pour un territoire hors quiz dessiné en fond. */
  code: string | null
  /** Attribut \`d\` d'un <path> SVG, dans le repère \`MAP_VIEWBOX\`. */
  d: string
  /** Centre du tracé. Absent pour les territoires de fond. */
  cx?: number
  cy?: number
  /** Diagonale du tracé, dans les unités du repère. */
  size?: number
}

/** ${mapped} pays jouables, ${shapes.length - mapped} territoires de fond. */
export const MAP_SHAPES: MapShape[] = ${JSON.stringify(shapes)}
`

writeFileSync(new URL('../shared/data/map.ts', import.meta.url), out)
console.log(
  `✔ ${mapped} pays jouables (+ ${shapes.length - mapped} en fond) — viewBox 0 0 ${WIDTH} ${HEIGHT}`,
)
