import { useEffect, useRef, useState } from 'react'
import { ArrowRight, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Feedback, Prompt } from '@/components/QuestionView'
import { cn } from '@/lib/utils'
import type { Verdict } from '@/lib/answer'
import {
  MODES,
  expectedFor,
  flagUrl,
  gradeAnswer,
  gradeClick,
  identify,
  type Answered,
  type Guess,
  type Mode,
  type Question,
  type Scope,
} from '@/lib/quiz'

type QuizGameProps = {
  mode: Mode
  /** Cadrage de la carte dans les modes qui en utilisent une. */
  scope: Scope
  questions: Question[]
  onFinish: (answers: Answered[]) => void
  onQuit: () => void
}

export function QuizGame({ mode, scope, questions, onFinish, onQuit }: QuizGameProps) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [guess, setGuess] = useState<Guess | null>(null)
  const [answers, setAnswers] = useState<Answered[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const spec = MODES[mode]
  const question = questions[index]
  const expected = expectedFor(question.country, mode)
  const correctCount = answers.filter((a) => a.verdict.status !== 'wrong').length
  const isLast = index + 1 >= questions.length

  // `next` change à chaque rendu ; le raccourci lit toujours la dernière version.
  const advance = useRef(next)
  advance.current = next

  /**
   * Once answered, Space or Enter moves on to the next question.
   *
   * Bound to the document rather than the input, so it works in the map modes too
   * — they have no field to focus. Only while a verdict is showing: during typing
   * a space is just a space, and country names have plenty of them.
   */
  useEffect(() => {
    if (!verdict) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.code !== 'Space' && event.key !== 'Enter') return
      // A focused button already reacts to both keys: don't advance twice.
      if (document.activeElement instanceof HTMLButtonElement) return
      // Space would otherwise scroll the page.
      event.preventDefault()
      advance.current()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [verdict])

  // Le champ reprend le focus à chaque question, y compris après validation :
  // la série s'enchaîne entièrement au clavier.
  useEffect(() => {
    if (spec.answer === 'text') inputRef.current?.focus()
  }, [index, verdict, spec.answer])

  // Le drapeau suivant est mis en cache pendant qu'on répond à celui-ci.
  useEffect(() => {
    if (MODES[mode].needsMap) return
    const upcoming = questions[index + 1]
    if (!upcoming) return
    const image = new Image()
    image.src = flagUrl(upcoming.country.code, mode === 'flags' ? 640 : 320)
  }, [index, questions, mode])

  function record(answered: Omit<Answered, keyof Question> & Partial<Question>) {
    setVerdict(answered.verdict)
    setGuess(answered.guess)
    setAnswers((previous) => [...previous, { ...question, ...answered } as Answered])
  }

  function submitText() {
    if (verdict) return next()
    if (!input.trim()) return
    const result = gradeAnswer(input, question, mode)
    record({
      input,
      verdict: result,
      guess: result.status === 'wrong' ? identify(input, question, mode) : null,
    })
  }

  function selectCountry(code: string) {
    if (verdict) return
    const { verdict: result, guess: clicked } = gradeClick(code, question)
    record({ input: clicked?.country.name ?? code, verdict: result, guess: clicked })
  }

  function skip() {
    if (verdict) return
    // Une question passée ne garde pas la saisie en cours : le retour et le
    // récapitulatif doivent tous deux la présenter comme non répondue.
    setInput('')
    record({ input: null, verdict: { status: 'wrong' }, guess: null })
  }

  function next() {
    if (isLast) return onFinish(answers)
    setIndex(index + 1)
    setInput('')
    setVerdict(null)
    setGuess(null)
  }

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
        <CardContent className="space-y-4">
          <Prompt
            mode={mode}
            scope={scope}
            question={question}
            verdict={verdict}
            guess={guess}
            onSelect={selectCountry}
          />

          <form
            onSubmit={(event) => {
              event.preventDefault()
              submitText()
            }}
            className="space-y-3"
          >
            {spec.answer === 'text' && (
              <Input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                // Un champ `readOnly` ne déclenche pas la soumission implicite du
                // formulaire : on traite Entrée nous-mêmes pour que la série
                // s'enchaîne au clavier même une fois la réponse figée.
                onKeyDown={(event) => {
                  // Entrée valide la saisie. Une fois répondu, c'est le raccourci
                  // global qui prend la main, ici comme en mode carte.
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  if (!verdict) submitText()
                }}
                readOnly={verdict !== null}
                placeholder={mode === 'capitals' ? 'Nom de la capitale…' : 'Nom du pays…'}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label={spec.prompt}
                className={cn(
                  'h-11 text-base',
                  verdict?.status === 'wrong' && 'border-destructive text-destructive',
                  verdict &&
                    verdict.status !== 'wrong' &&
                    'border-emerald-500 text-emerald-700 dark:text-emerald-400',
                )}
              />
            )}

            <div className="flex flex-wrap gap-2">
              {verdict ? (
                <Button type="button" size="lg" onClick={next}>
                  {isLast ? 'Voir le résultat' : 'Question suivante'}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              ) : (
                <>
                  {spec.answer === 'text' && (
                    <Button type="submit" size="lg" disabled={!input.trim()}>
                      Valider
                    </Button>
                  )}
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
