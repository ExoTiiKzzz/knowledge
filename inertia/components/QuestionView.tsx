import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Flag } from '@/components/Flag'
import { WorldMap, type Emphasis } from '@/components/WorldMap'
import { cn } from '@/lib/utils'
import type { Verdict } from '@/lib/answer'
import { MODES, type Guess, type Mode, type Question, type Scope } from '@/lib/quiz'

/**
 * Rendu d'une question, entièrement piloté par ses props.
 *
 * Ces composants ne possèdent aucun état : ni la progression, ni le verdict, ni
 * l'historique. En solo c'est `QuizGame` qui les possède ; en multijoueur c'est
 * le serveur, seul juge (ADR-0002). C'est cette séparation qui permet au salon de
 * réemployer le rendu du solo sans le réécrire.
 */

/**
 * Rattache la réponse fausse à ce qu'elle désignait — en mode Capitales, où la
 * question n'est ni un drapeau ni une carte, et ne se prête donc pas à une mise
 * en regard visuelle.
 *
 * La tournure évite l'article devant le nom du pays : « capitale de
 * l'Allemagne » contre « du Japon » contre « des Pays-Bas » demanderait de
 * connaître le genre et le nombre de chacun des 194 pays.
 */
export function GuessLine({ guess }: { guess: Guess }) {
  return (
    <p className="flex flex-wrap items-center gap-2 border-t border-destructive/20 pt-2">
      <span className="text-destructive/80">
        <strong>{guess.label}</strong> est la capitale de :
      </span>
      <span className="flex items-center gap-2 font-medium">
        {/* Même hauteur que le drapeau de la question, pour se comparer à lui. */}
        <Flag code={guess.country.code} className="h-10" />
        {guess.country.name}
      </span>
    </p>
  )
}

/** Le drapeau demandé et celui qu'on a nommé, à taille égale pour être comparés. */
export function FlagComparison({ question, guess }: { question: Question; guess: Guess }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5">
      <FlagAnswer
        code={question.country.code}
        name={question.country.name}
        caption="la réponse"
        correct
      />
      <FlagAnswer code={guess.country.code} name={guess.country.name} caption="ta réponse" />
    </div>
  )
}

export function FlagAnswer({
  code,
  name,
  caption,
  correct,
}: {
  code: string
  name: string
  caption: string
  correct?: boolean
}) {
  return (
    <div className="space-y-2">
      <Flag code={code} frame="md" />
      <div className="text-center">
        <p
          className={cn(
            'text-sm font-medium',
            correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive',
          )}
        >
          {name}
        </p>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
    </div>
  )
}

/**
 * Ce que la carte doit faire ressortir.
 *
 * Avant de répondre, seul le mode « surbrillance » colore quelque chose — en
 * « placer sur la carte », colorer le pays donnerait la réponse. Après, les deux
 * modes montrent la même chose : le bon pays en vert, celui cliqué en rouge.
 */
export function mapEmphasis(
  mode: Mode,
  question: Question,
  verdict: Verdict | null,
  guess: Guess | null,
): Record<string, Emphasis> {
  if (!verdict) return mode === 'mapName' ? { [question.country.code]: 'target' } : {}

  const emphasis: Record<string, Emphasis> = { [question.country.code]: 'correct' }
  if (guess) emphasis[guess.country.code] = 'wrong'
  return emphasis
}

export function Prompt({
  mode,
  scope,
  question,
  verdict,
  guess,
  onSelect,
}: {
  mode: Mode
  scope: Scope
  question: Question
  verdict: Verdict | null
  guess: Guess | null
  onSelect: (code: string) => void
}) {
  if (MODES[mode].needsMap) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center gap-1 text-center">
          {mode === 'mapFind' && (
            <p className="text-2xl font-semibold">{question.country.name}</p>
          )}
          <p className="text-sm text-muted-foreground">{MODES[mode].prompt}</p>
        </div>
        <WorldMap
          scope={scope}
          emphasis={mapEmphasis(mode, question, verdict, guess)}
          // Une fois répondu, la carte n'est plus une surface de réponse.
          onSelect={mode === 'mapFind' && !verdict ? onSelect : undefined}
          // Chaque question repart d'un cadrage neuf.
          resetKey={question.country.code}
        />
      </div>
    )
  }

  if (mode === 'flags') {
    // Une fois le pays nommé identifié, les deux drapeaux se substituent à la
    // question : les mettre en regard est ce qui fait retenir la différence.
    return guess ? (
      <FlagComparison question={question} guess={guess} />
    ) : (
      <div className="flex flex-col items-center gap-4 py-2">
        <Flag code={question.country.code} frame="lg" />
        <p className="text-sm text-muted-foreground">{MODES.flags.prompt}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <Flag code={question.country.code} className="h-10" />
      <p className="text-2xl font-semibold">{question.country.name}</p>
      <p className="text-sm text-muted-foreground">{MODES.capitals.prompt}</p>
    </div>
  )
}

export function Feedback({
  verdict,
  input,
  expected,
  country,
  guess,
  mode,
}: {
  verdict: Verdict
  input: string
  expected: string
  country: string
  guess: Guess | null
  mode: Mode
}) {
  if (verdict.status === 'wrong') {
    const skipped = mode === 'mapFind' ? !guess : !input.trim()
    return (
      <div className="space-y-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <p className="flex flex-wrap items-center gap-2">
          <X className="size-4 shrink-0" />
          <span>
            {skipped ? 'Passé — ' : 'Non, '}la réponse était <strong>{expected}</strong>.
            {guess && mode !== 'capitals' && (
              <>
                {' '}
                Tu as {mode === 'mapFind' ? 'cliqué' : 'répondu'} <strong>{guess.country.name}</strong>.
              </>
            )}
          </span>
        </p>
        {guess && mode === 'capitals' && <GuessLine guess={guess} />}
      </div>
    )
  }

  return (
    <p className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
      <Check className="size-4 shrink-0" />
      {verdict.status === 'exact' ? (
        <span>Correct{mode === 'capitals' ? ` — capitale de ${country}` : ''} !</span>
      ) : (
        <span className="flex flex-wrap items-center gap-2">
          Accepté, l'orthographe exacte est <strong>{expected}</strong>
          <Badge variant="secondary">tu avais écrit « {input.trim()} »</Badge>
        </span>
      )}
    </p>
  )
}
