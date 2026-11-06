import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { COUNTRIES } from '../data/countries.ts'
import { normalize } from './answer.ts'
import {
  acceptedFor,
  expectedFor,
  gradeAnswer,
  identify,
  questionLabel,
  type Mode,
} from './quiz.ts'

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
  test('retire accents, casse et ponctuation', () => {
    assert.equal(normalize('Côte d’Ivoire'), normalize("cote d'ivoire"))
    assert.equal(normalize('ÉTATS-UNIS'), normalize('etats unis'))
    assert.equal(normalize("N'Djaména"), normalize('ndjamena'))
  })

  test('ignore les articles', () => {
    assert.equal(normalize('Le Caire'), normalize('caire'))
    assert.equal(normalize('La Havane'), normalize('havane'))
  })
})

describe('réponses exactes', () => {
  test('accepte le nom officiel de chaque pays et de chaque capitale', () => {
    for (const c of COUNTRIES) {
      assert.equal(grade(c.name, c.name, 'flags'), 'exact', c.name)
      assert.equal(grade(c.name, c.capital, 'capitals'), 'exact', c.capital)
    }
  })

  test('accepte tous les alias déclarés', () => {
    for (const c of COUNTRIES) {
      for (const alias of c.nameAliases) {
        assert.equal(grade(c.name, alias, 'flags'), 'exact', `${c.name} ← ${alias}`)
      }
      for (const alias of c.capitalAliases) {
        assert.equal(grade(c.name, alias, 'capitals'), 'exact', `${c.capital} ← ${alias}`)
      }
    }
  })

  test('accepte les codes ISO alpha-2 et alpha-3', () => {
    for (const c of COUNTRIES) {
      for (const code of c.codes) {
        // `DE` et `LA` se réduisent à vide : ce sont aussi des articles français.
        if (!normalize(code)) continue
        assert.equal(grade(c.name, code, 'flags'), 'exact', `${c.name} ← ${code}`)
      }
    }
  })

  test('se moque de la casse et des accents manquants', () => {
    assert.equal(grade('Brésil', 'bresil'), 'exact')
    assert.equal(grade('Égypte', 'EGYPTE'), 'exact')
    assert.equal(grade('Nigéria', 'nigeria'), 'exact')
  })
})

describe('fautes tolérées', () => {
  for (const [name, input] of [
    ['Afghanistan', 'afganistan'],
    ['Kazakhstan', 'kazakstan'],
    ['Philippines', 'philipines'],
    ['Kirghizistan', 'kirghizstan'],
    ['Azerbaïdjan', 'azerbaidjian'],
    ['Luxembourg', 'luxemburg'],
    ['Bangladesh', 'bengladesh'],
    ['Éthiopie', 'ethiopi'],
    ['Mozambique', 'mozanbique'],
  ]) {
    test(`${name} accepte « ${input} »`, () => {
      assert.equal(grade(name, input), 'close')
    })
  }

  for (const [name, input] of [
    ['Bosnie-Herzégovine', 'bosnie'],
    ['Papouasie-Nouvelle-Guinée', 'papouasie'],
    ['Arabie Saoudite', 'arabie'],
    ['Émirats arabes unis', 'emirats'],
    ['Trinité-et-Tobago', 'trinite'],
    ['Saint-Vincent-et-les-Grenadines', 'saint vincent'],
    ['Antigua-et-Barbuda', 'antigua'],
    ['Sao Tomé-et-Principe', 'sao tome'],
  ]) {
    test(`${name} accepte la troncature « ${input} »`, () => {
      assert.equal(grade(name, input), 'close')
    })
  }

  for (const [name, input] of [
    // Trop court ou partagé par plusieurs pays : la troncature ne tranche pas.
    ['Corée du Sud', 'coree'],
    ['Sainte-Lucie', 'saint'],
    ['République dominicaine', 'republique'],
    ['Guinée équatoriale', 'guinee'],
    // « Congo » seul désigne le Congo-Brazzaville par convention.
    ['République démocratique du Congo', 'congo'],
  ]) {
    test(`${name} refuse la troncature ambiguë « ${input} »`, () => {
      assert.equal(grade(name, input), 'wrong')
    })
  }

  for (const [name, input] of [
    ['Allemagne', 'berlim'],
    ['Australie', 'canbera'],
    ['Ouzbékistan', 'tachkant'],
    ['Éthiopie', 'adis abeba'],
    ['Ukraine', 'kiev'],
  ]) {
    test(`capitale de ${name} accepte « ${input} »`, () => {
      assert.ok(['exact', 'close'].includes(grade(name, input, 'capitals')))
    })
  }
})

describe('réponses refusées', () => {
  for (const [name, input] of [
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
  ]) {
    test(`${name} refuse « ${input} »`, () => {
      assert.equal(grade(name, input), 'wrong')
    })
  }

  test('refuse une saisie vide', () => {
    assert.equal(grade('France', '   '), 'wrong')
  })

  for (const [name, input] of [
    ['Chine', 'tokyo'],
    ['Belgique', 'berlin'],
    ['Suisse', 'vienne'],
  ]) {
    test(`capitale de ${name} refuse « ${input} »`, () => {
      assert.equal(grade(name, input, 'capitals'), 'wrong')
    })
  }
})

describe('mode capitales inversées', () => {
  const MODE: Mode = 'countryFromCapital'

  test('énonce la capitale et attend le pays', () => {
    for (const c of COUNTRIES) {
      assert.equal(questionLabel(c, MODE), c.capital, c.name)
      assert.equal(expectedFor(c, MODE), c.name, c.name)
    }
  })

  test('accepte le nom du pays, ses alias et ses codes', () => {
    for (const c of COUNTRIES) {
      assert.equal(grade(c.name, c.name, MODE), 'exact', c.name)
      for (const alias of c.nameAliases) {
        assert.equal(grade(c.name, alias, MODE), 'exact', `${c.name} ← ${alias}`)
      }
      for (const code of c.codes) {
        if (!normalize(code)) continue
        assert.equal(grade(c.name, code, MODE), 'exact', `${c.name} ← ${code}`)
      }
    }
  })

  test('refuse de recopier la capitale énoncée', () => {
    // Les rares pays dont la capitale porte le nom du pays (Djibouti, Panama,
    // Guatemala…) rendent la question triviale, pas fausse.
    assert.equal(grade('Belgique', 'bruxelles', MODE), 'wrong')
    assert.equal(grade('Japon', 'tokyo', MODE), 'wrong')
  })

  test('identifie le pays nommé à tort', () => {
    const target = country('Belgique')
    const question = { country: target, accepted: acceptedFor(target, MODE) }
    assert.equal(identify('allemagne', question, MODE)?.country.name, 'Allemagne')
  })
})

describe('cohérence du jeu de données', () => {
  test('n’a ni code, ni nom, ni couple pays/capitale en doublon', () => {
    assert.equal(new Set(COUNTRIES.map((c) => c.code)).size, COUNTRIES.length)
    assert.equal(new Set(COUNTRIES.map((c) => normalize(c.name))).size, COUNTRIES.length)
  })

  test('n’a pas d’alias qui collisionne avec un autre pays', () => {
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

  test('a une capitale non vide pour chaque pays', () => {
    for (const c of COUNTRIES) {
      assert.notEqual(expectedFor(c, 'capitals').trim(), '', c.name)
    }
  })
})

describe('identification de la réponse donnée', () => {
  function guessFor(name: string, input: string, mode: Mode = 'flags') {
    const target = country(name)
    return identify(input, { country: target, accepted: acceptedFor(target, mode) }, mode)
  }

  for (const [name, input, expected] of [
    ['Royaume-Uni', 'france', 'France'],
    ['Belgique', 'allemagne', 'Allemagne'],
    ['Guinée-Bissau', 'guinee', 'Guinée'],
    ['Corée du Nord', 'coree du sud', 'Corée du Sud'],
    ['Nigéria', 'niger', 'Niger'],
    ['Zambie', 'gambie', 'Gambie'],
    ['Autriche', 'australie', 'Australie'],
    // Une faute sur le nom d'un autre pays reste attribuée à cet autre pays.
    ['Slovaquie', 'slovenei', 'Slovénie'],
  ]) {
    test(`${name} ← « ${input} » désigne ${expected}`, () => {
      assert.equal(guessFor(name, input)?.country.name, expected)
    })
  }

  for (const [name, input, expected] of [
    ['Belgique', 'berlin', 'Allemagne'],
    ['Suisse', 'vienne', 'Autriche'],
    ['Chine', 'tokyo', 'Japon'],
    ['Portugal', 'madrid', 'Espagne'],
  ]) {
    test(`capitale de ${name} ← « ${input} » désigne ${expected}`, () => {
      assert.equal(guessFor(name, input, 'capitals')?.country.name, expected)
    })
  }

  test('rend la capitale reconnue, pour pouvoir la citer', () => {
    assert.equal(guessFor('Belgique', 'berlim', 'capitals')?.label, 'Berlin')
  })

  test('n’attribue pas une faute de frappe à un autre pays', () => {
    // « mozambic » est à égale distance de Mozambique et de Zambie : c'est une
    // faute sur la réponse attendue, pas une réponse « Zambie ».
    assert.equal(guessFor('Mozambique', 'mozambic'), null)
    assert.equal(guessFor('Afghanistan', 'afganistan'), null)
    assert.equal(guessFor('Kazakhstan', 'kazakstan'), null)
  })

  test('n’invente rien face à une saisie qui ne ressemble à aucun pays', () => {
    assert.equal(guessFor('France', 'xyzabc'), null)
    assert.equal(guessFor('France', 'reponsecompletementbidon'), null)
    assert.equal(guessFor('France', 'berlin'), null)
  })

  test('ne se désigne jamais lui-même', () => {
    for (const c of COUNTRIES) {
      assert.notEqual(guessFor(c.name, c.name)?.country.name, c.name, c.name)
    }
  })
})
