/**
 * Génère src/data/countries.ts depuis le paquet `world-countries`.
 *
 * `world-countries` fournit les noms de pays en français (translations.fra) mais
 * les capitales uniquement en anglais, et quelques traductions FR sont
 * approximatives. Les tables ci-dessous corrigent l'un et l'autre, et déclarent
 * les réponses alternatives acceptées par le quiz.
 *
 *   npm run gen:countries
 */
import { writeFileSync } from 'node:fs'
import countries from 'world-countries'

/** Nom FR de la capitale, quand il diffère de l'anglais fourni par world-countries. */
const CAPITAL_FR = {
  AD: 'Andorre-la-Vieille',
  AE: 'Abou Dabi',
  AF: 'Kaboul',
  AM: 'Erevan',
  AT: 'Vienne',
  AZ: 'Bakou',
  BD: 'Dacca',
  BE: 'Bruxelles',
  BR: 'Brasilia',
  BT: 'Thimphou',
  CH: 'Berne',
  CN: 'Pékin',
  CO: 'Bogota',
  CU: 'La Havane',
  CY: 'Nicosie',
  DK: 'Copenhague',
  DO: 'Saint-Domingue',
  DZ: 'Alger',
  EG: 'Le Caire',
  ET: 'Addis-Abeba',
  GB: 'Londres',
  GD: 'Saint-Georges',
  GE: 'Tbilissi',
  GR: 'Athènes',
  GT: 'Guatemala',
  IL: 'Jérusalem',
  IQ: 'Bagdad',
  IR: 'Téhéran',
  KG: 'Bichkek',
  KI: 'Tarawa-Sud',
  KR: 'Séoul',
  KW: 'Koweït',
  LB: 'Beyrouth',
  MD: 'Chisinau',
  MN: 'Oulan-Bator',
  MT: 'La Valette',
  MU: 'Port-Louis',
  MX: 'Mexico',
  NP: 'Katmandou',
  OM: 'Mascate',
  PA: 'Panama',
  PH: 'Manille',
  PL: 'Varsovie',
  PT: 'Lisbonne',
  RO: 'Bucarest',
  RU: 'Moscou',
  SA: 'Riyad',
  SG: 'Singapour',
  SM: 'Saint-Marin',
  SO: 'Mogadiscio',
  SS: 'Djouba',
  SY: 'Damas',
  SZ: 'Mbabane',
  TD: "N'Djaména",
  TJ: 'Douchanbé',
  TM: 'Achgabat',
  TT: "Port-d'Espagne",
  UA: 'Kiev',
  US: 'Washington',
  UZ: 'Tachkent',
  VA: 'Vatican',
  VN: 'Hanoï',
  VU: 'Port-Vila',
  YE: 'Sanaa',
  ZA: 'Pretoria',
}

/** Réponses également acceptées pour la capitale (exonymes, sièges alternatifs, anciennes capitales). */
const CAPITAL_ALIASES = {
  AD: ['Andorra la Vella'],
  AE: ['Abu Dhabi'],
  AG: ['Saint-Jean'],
  BD: ['Dhaka'],
  BI: ['Bujumbura'],
  BJ: ['Cotonou'],
  BO: ['La Paz'],
  CI: ['Abidjan'],
  CL: ['Santiago du Chili'],
  CN: ['Beijing'],
  DO: ['Santo Domingo'],
  GD: ["St. George's"],
  GT: ['Guatemala City', 'Ciudad de Guatemala'],
  ID: ['Nusantara'],
  IN: ['Nouvelle-Delhi', 'Delhi'],
  KI: ['South Tarawa', 'Tarawa'],
  KW: ['Kuwait City', 'Koweït City'],
  KZ: ['Noursoultan', 'Nur-Sultan'],
  LK: ['Sri Jayawardenapura Kotte'],
  MG: ['Tananarive'],
  MM: ['Rangoun', 'Yangon'],
  MN: ['Ulan Bator', 'Oulan Bator'],
  MT: ['Valletta', 'Valette'],
  MX: ['Mexico City', 'Ciudad de México'],
  NL: ['La Haye'],
  OM: ['Muscat'],
  PA: ['Panama City'],
  PY: ['Assomption'],
  SM: ['San Marino'],
  SS: ['Juba'],
  ST: ['Sao Tomé'],
  SZ: ['Lobamba'],
  TJ: ['Dushanbe'],
  TM: ['Ashgabat'],
  TT: ['Port of Spain'],
  TZ: ['Dar es Salaam'],
  UA: ['Kyiv'],
  US: ['Washington D.C.', 'Washington DC'],
  VA: ['Cité du Vatican', 'Vatican City'],
  VN: ['Hanoi'],
  YE: ["Sana'a"],
  ZA: ['Le Cap', 'Cape Town', 'Bloemfontein', 'Le Cap-Ville'],
}

/** Corrections des traductions FR de `world-countries` jugées inexactes ou datées. */
const NAME_FR = {
  CD: 'République démocratique du Congo',
  CG: 'République du Congo',
  CV: 'Cap-Vert',
  MU: 'Maurice',
  PW: 'Palaos',
  ST: 'Sao Tomé-et-Principe',
  SZ: 'Eswatini',
  VN: 'Vietnam',
}

/**
 * Réponses également acceptées pour le nom du pays. Les codes ISO (alpha-2 et
 * alpha-3) sont ajoutés automatiquement — inutile de les répéter ici ; seules
 * les abréviations d'usage qui n'en sont pas ont besoin d'être déclarées.
 */
const NAME_ALIASES = {
  AE: ['EAU', 'UAE'],
  BN: ['Brunéi'],
  BY: ['Belarus', 'Bélarus'],
  CD: ['RDC', 'Congo-Kinshasa', 'Congo (RDC)', 'Zaïre'],
  CF: ['Centrafrique', 'RCA'],
  CG: ['Congo', 'Congo-Brazzaville'],
  CV: ['Îles du Cap-Vert'],
  CZ: ['République tchèque'],
  GB: ['Grande-Bretagne', 'UK', 'Angleterre'],
  KN: ['Saint-Kitts-et-Nevis'],
  LR: ['Libéria'],
  MD: ['Moldova'],
  MK: ['Macédoine'],
  MM: ['Myanmar'],
  MU: ['Île Maurice'],
  NL: ['Hollande'],
  PW: ['Palau'],
  SR: ['Suriname'],
  SV: ['El Salvador'],
  SZ: ['Swaziland'],
  TL: ['Timor-Leste', 'Timor Oriental'],
  TR: ['Türkiye'],
  US: ['USA', "États-Unis d'Amérique", 'Amérique'],
  VA: ['Vatican', 'Saint-Siège'],
  VN: ['Viêt Nam'],
}

/** region/subregion de world-countries → continent utilisé par l'application. */
function continentOf({ region, subregion }) {
  if (region !== 'Americas') {
    return { Africa: 'Afrique', Asia: 'Asie', Europe: 'Europe', Oceania: 'Océanie' }[region]
  }
  return subregion === 'South America' ? 'Amérique du Sud' : 'Amérique du Nord'
}

const rows = countries
  .filter((c) => c.unMember && c.capital?.length)
  .map((c) => {
    const code = c.cca2
    const name = NAME_FR[code] ?? c.translations.fra?.common ?? c.name.common
    const capital = CAPITAL_FR[code] ?? c.capital[0]
    // Les capitales anglaises non renommées restent une réponse valable.
    const extraCapital = CAPITAL_FR[code] && CAPITAL_FR[code] !== c.capital[0] ? [c.capital[0]] : []
    return {
      code,
      // Codes ISO alpha-2 et alpha-3, acceptés comme abréviation du nom du pays.
      codes: [code, c.cca3],
      name,
      capital,
      continent: continentOf(c),
      nameAliases: dedupe([c.name.common, c.translations.fra?.common, ...(NAME_ALIASES[code] ?? [])], name),
      capitalAliases: dedupe([...extraCapital, ...c.capital.slice(1), ...(CAPITAL_ALIASES[code] ?? [])], capital),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

function dedupe(list, main) {
  const seen = new Set([main])
  return list.filter((v) => v && !seen.has(v) && seen.add(v))
}

const missing = rows.filter((r) => !r.continent)
if (missing.length) throw new Error(`Continent inconnu : ${missing.map((r) => r.code).join(', ')}`)

const out = `// Fichier généré par scripts/generate-countries.mjs — ne pas éditer à la main.
// Source : paquet npm \`world-countries\` + corrections françaises du générateur.

export const CONTINENTS = [
  'Afrique',
  'Amérique du Nord',
  'Amérique du Sud',
  'Asie',
  'Europe',
  'Océanie',
] as const

export type Continent = (typeof CONTINENTS)[number]

export type Country = {
  /** Code ISO 3166-1 alpha-2, utilisé pour l'URL du drapeau. */
  code: string
  /** Codes ISO alpha-2 et alpha-3, acceptés comme abréviation du nom du pays. */
  codes: string[]
  name: string
  capital: string
  continent: Continent
  /** Autres orthographes/appellations acceptées comme bonne réponse. */
  nameAliases: string[]
  capitalAliases: string[]
}

export const COUNTRIES: Country[] = ${JSON.stringify(rows, null, 2)}
`

writeFileSync(new URL('../src/data/countries.ts', import.meta.url), out)
console.log(`✔ ${rows.length} pays écrits dans src/data/countries.ts`)
