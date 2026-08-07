import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, SkipForward, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Flag } from '@/components/Flag'
import { cn } from '@/lib/utils'
import type { Verdict } from '@/lib/answer'
import {
  MODES,
  expectedFor,
  flagUrl,
  gradeAnswer,
  identify,
  type Answered,
  type Guess,
  type Mode,
  type Question,
} from '@/lib/quiz'

type QuizGameProps = {
  mode: Mode
  questions: Question[]
  onFinish: (answers: Answered[]) => void
  onQuit: () => void
}

export function QuizGame({ mode, questions, onFinish, onQuit }: QuizGameProps) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [guess, setGuess] = useState<Guess | null>(null)
  const [answers, setAnswers] = useState<Answered[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const question = questions[index]
  const expected = expectedFor(question.country, mode)
  const correctCount = answers.filter((a) => a.verdict.status !== 'wrong').length

  // Le champ reprend le focus à chaque question, y compris après validation :
  // la série s'enchaîne entièrement au clavier.
  useEffect(() => {
    inputRef.current?.focus()
  }, [index, verdict])

  // Le drapeau suivant est mis en cache pendant qu'on répond à celui-ci.
  useEffect(() => {
    const upcoming = questions[index + 1]
    if (!upcoming) return
    const image = new Image()
    image.src = flagUrl(upcoming.country.code, mode === 'flags' ? 640 : 320)
  }, [index, questions, mode])

  function submit() {
    if (verdict) return next()
    if (!input.trim()) return
    const result = gradeAnswer(input, question, mode)
    const named = result.status === 'wrong' ? identify(input, question, mode) : null
    setVerdict(result)
    setGuess(named)
    setAnswers((previous) => [...previous, { ...question, input, verdict: result, guess: named }])
  }

  function skip() {
    if (verdict) return
    const result: Verdict = { status: 'wrong' }
    setVerdict(result)
    // Une question passée ne garde pas la saisie en cours : le retour et le
    // récapitulatif doivent tous deux la présenter comme non répondue.
    setInput('')
    setAnswers((previous) => [...previous, { ...question, input: null, verdict: result, guess: null }])
  }

  function next() {
    if (index + 1 >= questions.length) return onFinish(answers)
    setIndex(index + 1)
    setInput('')
    setVerdict(null)
    setGuess(null)
  }

  const isLast = index + 1 >= questions.length

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {index + 1} / {questions.length}
          </span>
          <span className="font-medium tabular-nums">
            {correctCount} bonne{correctCount > 1 ? 's' : ''} réponse{correctCount > 1 ? 's' : ''}
          </span>
        </div>
        <Progress value={(index / questions.length) * 100} />
      </div>

      <Card>
        <CardContent className="space-y-5">
          <Prompt mode={mode} question={question} guess={guess} />

          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
            className="space-y-3"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              // Un champ `readOnly` ne déclenche pas la soumission implicite du
              // formulaire : on traite Entrée nous-mêmes pour que la série
              // s'enchaîne au clavier même une fois la réponse figée.
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                submit()
              }}
              readOnly={verdict !== null}
              placeholder={mode === 'flags' ? 'Nom du pays…' : 'Nom de la capitale…'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label={MODES[mode].prompt}
              className={cn(
                'h-11 text-base',
                verdict?.status === 'wrong' && 'border-destructive text-destructive',
                verdict && verdict.status !== 'wrong' && 'border-emerald-500 text-emerald-700 dark:text-emerald-400',
              )}
            />

            <div className="flex flex-wrap gap-2">
              {verdict ? (
                <Button type="submit" size="lg">
                  {isLast ? 'Voir le résultat' : 'Question suivante'}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              ) : (
                <>
                  <Button type="submit" size="lg" disabled={!input.trim()}>
                    Valider
                  </Button>
                  <Button type="button" variant="ghost" size="lg" onClick={skip}>
                    <SkipForward data-icon="inline-start" />
                    Passer
                  </Button>
                </>
              )}
              <Button type="button" variant="ghost" size="lg" className="ml-auto" onClick={onQuit}>
                Abandonner
              </Button>
            </div>
          </form>

          {verdict && (
            <Feedback
              verdict={verdict}
              input={input}
              expected={expected}
              country={question.country.name}
              guess={guess}
              mode={mode}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Rattache la réponse fausse à ce qu'elle désignait — en mode Capitales, où la
 * question n'est pas un drapeau et ne se prête donc pas à la comparaison
 * côte à côte de `FlagComparison`.
 *
 * La tournure évite l'article devant le nom du pays : « capitale de
 * l'Allemagne » contre « du Japon » contre « des Pays-Bas » demanderait de
 * connaître le genre et le nombre de chacun des 194 pays.
 */
function GuessLine({ guess }: { guess: Guess }) {
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
function FlagComparison({ question, guess }: { question: Question; guess: Guess }) {
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

function FlagAnswer({
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

function Prompt({ mode, question, guess }: { mode: Mode; question: Question; guess: Guess | null }) {
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

function Feedback({
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
    return (
      <div className="space-y-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <p className="flex flex-wrap items-center gap-2">
          <X className="size-4 shrink-0" />
          <span>
            {input.trim() ? (
              <>
                Non, la réponse était <strong>{expected}</strong>.
              </>
            ) : (
              <>
                Passé — la réponse était <strong>{expected}</strong>.
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
        <span>
          Correct{mode === 'flags' ? '' : ` — capitale de ${country}`} !
        </span>
      ) : (
        <span className="flex flex-wrap items-center gap-2">
          Accepté, l'orthographe exacte est <strong>{expected}</strong>
          <Badge variant="secondary">tu avais écrit « {input.trim()} »</Badge>
        </span>
      )}
    </p>
  )
}
