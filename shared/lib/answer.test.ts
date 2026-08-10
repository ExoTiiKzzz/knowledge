import { describe, expect, it } from 'vitest'
import { COUNTRIES } from '../data/countries.ts'
import { normalize } from './answer.ts'
import { acceptedFor, expectedFor, gradeAnswer, identify, type Mode } from './quiz.ts'

const byName = new Map(COUNTRIES.map((c) => [c.name, c]))

function country(name: string) {
  const found = byName.get(name)
  if (!found) throw new Error(`Pays absent du jeu de données : ${name}`)
  return found
}

function grade(name: string, input: string, mode: Mode = 'flags') {
  const target = country(name)
  return gradeAnswer(input, { country: target, accepted: acceptedFor(target, mode) }, mode).status
}

describe('normalize', () => {
  it('retire accents, casse et ponctuation', () => {
    expect(normalize('Côte d’Ivoire')).toBe(normalize("cote d'ivoire"))
    expect(normalize('ÉTATS-UNIS')).toBe(normalize('etats unis'))
    expect(normalize("N'Djaména")).toBe(normalize('ndjamena'))
  })

  it('ignore les articles', () => {
    expect(normalize('Le Caire')).toBe(normalize('caire'))
    expect(normalize('La Havane')).toBe(normalize('havane'))
  })
})

describe('réponses exactes', () => {
  it('accepte le nom officiel de chaque pays et de chaque capitale', () => {
    for (const c of COUNTRIES) {
      expect(grade(c.name, c.name, 'flags'), c.name).toBe('exact')
      expect(grade(c.name, c.capital, 'capitals'), c.capital).toBe('exact')
    }
  })

  it('accepte tous les alias déclarés', () => {
    for (const c of COUNTRIES) {
      for (const alias of c.nameAliases) {
        expect(grade(c.name, alias, 'flags'), `${c.name} ← ${alias}`).toBe('exact')
      }
      for (const alias of c.capitalAliases) {
        expect(grade(c.name, alias, 'capitals'), `${c.capital} ← ${alias}`).toBe('exact')
      }
    }
  })

  it('accepte les codes ISO alpha-2 et alpha-3', () => {
    for (const c of COUNTRIES) {
      for (const code of c.codes) {
        // `DE` et `LA` se réduisent à vide : ce sont aussi des articles français.
        if (!normalize(code)) continue
        expect(grade(c.name, code, 'flags'), `${c.name} ← ${code}`).toBe('exact')
      }
    }
  })

  it('se moque de la casse et des accents manquants', () => {
    expect(grade('Brésil', 'bresil')).toBe('exact')
    expect(grade('Égypte', 'EGYPTE')).toBe('exact')
    expect(grade('Nigéria', 'nigeria')).toBe('exact')
  })
})

describe('fautes tolérées', () => {
  it.each([
    ['Afghanistan', 'afganistan'],
    ['Kazakhstan', 'kazakstan'],
    ['Philippines', 'philipines'],
    ['Kirghizistan', 'kirghizstan'],
    ['Azerbaïdjan', 'azerbaidjian'],
    ['Luxembourg', 'luxemburg'],
    ['Bangladesh', 'bengladesh'],
    ['Éthiopie', 'ethiopi'],
    ['Mozambique', 'mozanbique'],
  ])('%s accepte « %s »', (name, input) => {
    expect(grade(name, input)).toBe('close')
  })

  it.each([
    ['Bosnie-Herzégovine', 'bosnie'],
    ['Papouasie-Nouvelle-Guinée', 'papouasie'],
    ['Arabie Saoudite', 'arabie'],
    ['Émirats arabes unis', 'emirats'],
    ['Trinité-et-Tobago', 'trinite'],
    ['Saint-Vincent-et-les-Grenadines', 'saint vincent'],
    ['Antigua-et-Barbuda', 'antigua'],
    ['Sao Tomé-et-Principe', 'sao tome'],
  ])('%s accepte la troncature « %s »', (name, input) => {
    expect(grade(name, input)).toBe('close')
  })

  it.each([
    // Trop court ou partagé par plusieurs pays : la troncature ne tranche pas.
    ['Corée du Sud', 'coree'],
    ['Sainte-Lucie', 'saint'],
    ['République dominicaine', 'republique'],
    ['Guinée équatoriale', 'guinee'],
    // « Congo » seul désigne le Congo-Brazzaville par convention.
    ['République démocratique du Congo', 'congo'],
  ])('%s refuse la troncature ambiguë « %s »', (name, input) => {
    expect(grade(name, input)).toBe('wrong')
  })

  it.each([
    ['Allemagne', 'berlim'],
    ['Australie', 'canbera'],
    ['Ouzbékistan', 'tachkant'],
    ['Éthiopie', 'adis abeba'],
    ['Ukraine', 'kiev'],
  ])('capitale de %s accepte « %s »', (name, input) => {
    expect(['exact', 'close']).toContain(grade(name, input, 'capitals'))
  })
})

describe('réponses refusées', () => {
  it.each([
    ['Nigéria', 'niger'],
    ['Niger', 'nigeria'],
    ['Iran', 'irak'],
    ['Irak', 'iran'],
    ['Zambie', 'gambie'],
    ['Gambie', 'zambie'],
    ['Corée du Nord', 'coree du sud'],
    ['Corée du Sud', 'coree du nord'],
    ['Autriche', 'australie'],
    ['Slovaquie', 'slovenie'],
    ['Mali', 'malte'],
    ['Tchad', 'tchequie'],
    ['Soudan', 'soudan du sud'],
    ['Soudan du Sud', 'soudan'],
    ['Guinée', 'guinee equatoriale'],
    ['Guinée-Bissau', 'guinee'],
    ['République du Congo', 'republique democratique du congo'],
    ['Suisse', 'suede'],
    ['Inde', 'indonesie'],
    ['Chili', 'chine'],
  ])('%s refuse « %s »', (name, input) => {
    expect(grade(name, input)).toBe('wrong')
  })

  it('refuse une saisie vide', () => {
    expect(grade('France', '   ')).toBe('wrong')
  })

  it.each([
    ['Chine', 'tokyo'],
    ['Belgique', 'berlin'],
    ['Suisse', 'vienne'],
  ])('capitale de %s refuse « %s »', (name, input) => {
    expect(grade(name, input, 'capitals')).toBe('wrong')
  })
})

describe('cohérence du jeu de données', () => {
  it('n’a ni code, ni nom, ni couple pays/capitale en doublon', () => {
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length)
    expect(new Set(COUNTRIES.map((c) => normalize(c.name))).size).toBe(COUNTRIES.length)
  })

  it('n’a pas d’alias qui collisionne avec un autre pays', () => {
    for (const mode of ['flags', 'capitals'] as Mode[]) {
      const seen = new Map<string, string>()
      for (const c of COUNTRIES) {
        for (const answer of acceptedFor(c, mode)) {
          const key = normalize(answer)
          // Les codes `DE` et `LA` se réduisent à vide (articles français) :
          // la correction les ignore, ils ne créent donc aucune ambiguïté.
          if (!key) continue
          const owner = seen.get(key)
          // Deux pays peuvent légitimement partager une capitale homonyme
          // (Victoria, Saint-Marin…) : on ne signale que les vrais conflits.
          if (owner && owner !== c.name && mode === 'flags') {
            throw new Error(`« ${answer} » désigne à la fois ${owner} et ${c.name}`)
          }
          seen.set(key, c.name)
        }
      }
    }
  })

  it('a une capitale non vide pour chaque pays', () => {
    for (const c of COUNTRIES) {
      expect(expectedFor(c, 'capitals').trim(), c.name).not.toBe('')
    }
  })
})

describe('identification de la réponse donnée', () => {
  function guessFor(name: string, input: string, mode: Mode = 'flags') {
    const target = country(name)
    return identify(input, { country: target, accepted: acceptedFor(target, mode) }, mode)
  }

  it.each([
    ['Royaume-Uni', 'france', 'France'],
    ['Belgique', 'allemagne', 'Allemagne'],
    ['Guinée-Bissau', 'guinee', 'Guinée'],
    ['Corée du Nord', 'coree du sud', 'Corée du Sud'],
    ['Nigéria', 'niger', 'Niger'],
    ['Zambie', 'gambie', 'Gambie'],
    ['Autriche', 'australie', 'Australie'],
    // Une faute sur le nom d'un autre pays reste attribuée à cet autre pays.
    ['Slovaquie', 'slovenei', 'Slovénie'],
  ])('%s ← « %s » désigne %s', (name, input, expected) => {
    expect(guessFor(name, input)?.country.name).toBe(expected)
  })

  it.each([
    ['Belgique', 'berlin', 'Allemagne'],
    ['Suisse', 'vienne', 'Autriche'],
    ['Chine', 'tokyo', 'Japon'],
    ['Portugal', 'madrid', 'Espagne'],
  ])('capitale de %s ← « %s » désigne %s', (name, input, expected) => {
    expect(guessFor(name, input, 'capitals')?.country.name).toBe(expected)
  })

  it('rend la capitale reconnue, pour pouvoir la citer', () => {
    expect(guessFor('Belgique', 'berlim', 'capitals')?.label).toBe('Berlin')
  })

  it('n’attribue pas une faute de frappe à un autre pays', () => {
    // « mozambic » est à égale distance de Mozambique et de Zambie : c'est une
    // faute sur la réponse attendue, pas une réponse « Zambie ».
    expect(guessFor('Mozambique', 'mozambic')).toBeNull()
    expect(guessFor('Afghanistan', 'afganistan')).toBeNull()
    expect(guessFor('Kazakhstan', 'kazakstan')).toBeNull()
  })

  it('n’invente rien face à une saisie qui ne ressemble à aucun pays', () => {
    expect(guessFor('France', 'xyzabc')).toBeNull()
    expect(guessFor('France', 'reponsecompletementbidon')).toBeNull()
    expect(guessFor('France', 'berlin')).toBeNull()
  })

  it('ne se désigne jamais lui-même', () => {
    for (const c of COUNTRIES) {
      expect(guessFor(c.name, c.name)?.country.name, c.name).not.toBe(c.name)
    }
  })
})
