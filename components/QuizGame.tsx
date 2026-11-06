'use client'

import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { Feedback, Prompt } from '@/components/QuestionView'
import { Button, Eyebrow, Icon, Input, Sheet, StampMark } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Verdict } from '@/lib/answer'
import {
  COMBO_STEPS,
  SOLO_PACE_MS,
  comboMultiplier,
  nextCombo,
  soloPoints,
  type RecordedAnswer,
} from '@/lib/progress'
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

/** Une question de la partie, avec le mode dans lequel elle est posée. */
export type Stop = { mode: Mode; question: Question }

/** Une réponse donnée, avec ce qu'il faut pour le récapitulatif et pour le passeport. */
export type Played = Answered & { mode: Mode; points: number }

export type FinishedGame = {
  /** Pour le récapitulatif : chaque réponse, son verdict, le pays désigné. */
  answered: Played[]
  /** Pour le passeport : ce que `record` attend, ni plus ni moins. */
  recorded: RecordedAnswer[]
}

type QuizGameProps = {
  /**
   * Les questions et leur mode. Une partie solo répète le même mode partout ;
   * le défi du jour les mélange.
   */
  stops: Stop[]
  /** Cadrage de la carte dans les modes qui en utilisent une ; `null` = le monde. */
  scope: Scope
  onFinish: (game: FinishedGame) => void
  onQuit: () => void
}

/** Ce que vaudrait une bonne réponse donnée maintenant. */
const RIGHT: Verdict = { status: 'exact' }

export function QuizGame({ stops, scope, onFinish, onQuit }: QuizGameProps) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [guess, setGuess] = useState<Guess | null>(null)
  const [answers, setAnswers] = useState<Played[]>([])
  const [combo, setCombo] = useState(0)
  // Le chrono part quand la question s'affiche, pas quand on commence à taper :
  // c'est le temps de réflexion qui est récompensé. `performance.now()` plutôt
  // que l'horloge murale, qu'un réglage système peut faire sauter.
  const [shownAt, setShownAt] = useState(() => performance.now())
  const [elapsed, setElapsed] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const fieldId = useId()

  const { mode, question } = stops[index]
  const spec = MODES[mode]
  const expected = expectedFor(question.country, mode)
  const correctCount = answers.filter((a) => a.verdict.status !== 'wrong').length
  const total = answers.reduce((sum, a) => sum + a.points, 0)
  const last = verdict ? answers[answers.length - 1] : null
  const isLast = index + 1 >= stops.length

  // Les points en jeu fondent tant que la question reste ouverte. Un rendu toutes
  // les 200 ms suffit à l'œil, et s'arrête dès qu'on a répondu.
  useEffect(() => {
    if (verdict) return
    const timer = setInterval(() => setElapsed(performance.now() - shownAt), 200)
    return () => clearInterval(timer)
  }, [verdict, shownAt])

  /**
   * Le clavier de la partie : Entrée valide, puis Entrée ou Espace enchaîne.
   *
   * Un seul propriétaire, et il est sur le document — les modes carte n'ont
   * aucun champ à focaliser. Surtout, une frappe n'est ainsi traitée qu'une
   * fois : validée par le champ *et* vue par un raccourci global, la touche qui
   * valide ferait aussitôt passer à la suivante, sans laisser voir le retour.
   *
   * Un événement d'effet, pour que le raccourci travaille toujours sur la saisie
   * et le verdict courants sans réabonner l'écouteur à chaque frappe.
   */
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const enter = event.key === 'Enter'
    const space = event.key === ' ' || event.code === 'Space'
    if (!enter && !space) return
    // Pendant la saisie, un espace reste un espace : « Corée du Sud », « Le
    // Caire »… Espace n'enchaîne qu'une fois la réponse figée.
    if (space && !verdict) return
    // Un bouton focalisé réagit déjà aux deux touches : ne pas agir deux fois.
    if (document.activeElement instanceof HTMLButtonElement) return
    // Sinon Espace fait défiler la page, et Entrée soumet le formulaire.
    event.preventDefault()
    if (verdict) next()
    else submitText()
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])

  // Le champ reprend le focus à chaque question, y compris après validation :
  // la partie s'enchaîne entièrement au clavier.
  useEffect(() => {
    if (spec.answer === 'text') inputRef.current?.focus()
  }, [index, verdict, spec.answer])

  // Le drapeau suivant est mis en cache pendant qu'on répond à celui-ci. Les
  // modes dont la réponse est un pays l'affichent en grand une fois répondu.
  useEffect(() => {
    const upcoming = stops[index + 1]
    if (!upcoming || MODES[upcoming.mode].needsMap) return
    const large = upcoming.mode === 'flags' || upcoming.mode === 'countryFromCapital'
    const image = new Image()
    image.src = flagUrl(upcoming.question.country.code, large ? 640 : 320)
  }, [index, stops])

  function record(answered: Pick<Answered, 'input' | 'verdict' | 'guess'>) {
    const ms = performance.now() - shownAt
    const points = soloPoints(answered.verdict, ms, combo)
    setElapsed(ms)
    setCombo(nextCombo(combo, answered.verdict))
    setVerdict(answered.verdict)
    setGuess(answered.guess)
    setAnswers((previous) => [...previous, { ...question, ...answered, mode, points }])
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
    if (isLast) {
      return onFinish({
        answered: answers,
        recorded: answers.map((a) => ({
          mode: a.mode,
          code: a.country.code,
          correct: a.verdict.status !== 'wrong',
          points: a.points,
        })),
      })
    }
    setIndex(index + 1)
    setInput('')
    setVerdict(null)
    setGuess(null)
    setShownAt(performance.now())
    setElapsed(0)
  }

  // Une carte a besoin de place : les modes qui en affichent une élargissent la
  // partie. Le tableau de bord, lui, reste à droite dans tous les modes, et y
  // reste collé quand la page défile — sinon une carte haute repousse le chrono
  // hors de l'écran. Sur un téléphone, il passe sous la question.
  const wide = spec.needsMap
  const remaining = Math.max(0, SOLO_PACE_MS - elapsed)
  const atStake = last ? last.points : soloPoints(RIGHT, elapsed, combo)

  const board = (
    <Board
      remaining={remaining}
      atStake={atStake}
      answeredRight={last ? last.points > 0 : null}
      combo={combo}
      total={total}
      correctCount={correctCount}
      answers={answers}
      count={stops.length}
      index={index}
    />
  )

  return (
    <div
      // Pas de transition sur la largeur : animer `max-width` fait refluer
      // toute la page, alors que l'écran change de toute façon d'un coup.
      className={cn(
        'mx-auto grid w-full gap-5 md:grid-cols-[minmax(0,1fr)_17rem] md:items-start',
        wide ? 'max-w-6xl' : 'max-w-5xl',
      )}
    >
      <ClockBar
        remaining={remaining}
        atStake={atStake}
        answeredRight={last ? last.points > 0 : null}
        combo={combo}
        index={index}
        count={stops.length}
      />

      <Sheet className="min-w-0 space-y-5 px-4 py-5 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">
          <span>
            Escale N° {String(index + 1).padStart(2, '0')} / {String(stops.length).padStart(2, '0')}
          </span>
          <span>
            {scope ?? 'Monde entier'} · {spec.label}
          </span>
        </div>

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
          className="space-y-4"
        >
          {spec.answer === 'text' && (
            <div className="space-y-1">
              <label htmlFor={fieldId} className="block">
                <Eyebrow>
                  {spec.asks === 'capital' ? 'Capitale' : 'Destination'}
                  <span className="sr-only"> — {spec.prompt}</span>
                </Eyebrow>
              </label>
              <Input
                id={fieldId}
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                readOnly={verdict !== null}
                placeholder={spec.asks === 'capital' ? 'Nom de la capitale…' : 'Nom du pays…'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className={cn(
                  verdict?.status === 'wrong' && 'border-stamp text-stamp-deep',
                  verdict && verdict.status !== 'wrong' && 'border-teal text-teal-deep',
                )}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {verdict ? (
              <Button type="button" size="lg" onClick={next}>
                {isLast ? 'Voir le résultat' : 'Question suivante'}
                <Icon name="arrow" />
              </Button>
            ) : (
              <>
                {spec.answer === 'text' && (
                  <Button type="submit" size="lg" disabled={!input.trim()}>
                    <Icon name="stamp" />
                    Tamponner
                  </Button>
                )}
                <Button type="button" variant="ghost" size="lg" onClick={skip}>
                  <Icon name="skip" />
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
      </Sheet>

      {board}
    </div>
  )
}

/**
 * Le chrono d'un téléphone : une barre collée en haut de l'écran.
 *
 * Sur un téléphone le tableau de bord passe sous la question, et une carte le
 * repousse hors de l'écran ; cette barre garde l'essentiel en vue, et remplace
 * alors le chrono du tableau de bord. Elle disparaît dès que celui-ci tient à
 * droite.
 */
function ClockBar({
  remaining,
  atStake,
  answeredRight,
  combo,
  index,
  count,
}: {
  remaining: number
  atStake: number
  answeredRight: boolean | null
  combo: number
  index: number
  count: number
}) {
  const seconds = Math.ceil(remaining / 1000)
  const multiplier = comboMultiplier(combo)
  return (
    <div
      className="sticky top-0 z-20 -mx-1 flex items-center justify-between gap-3 rounded-b-md bg-navy px-4 py-2.5 text-sheet shadow-[0_6px_16px_rgb(20_40_71/0.25)] md:hidden"
    >
      <p className="font-display text-2xl leading-none tabular-nums">
        <span className="sr-only">Temps : </span>0:{String(seconds).padStart(2, '0')}
      </p>
      <p className="font-mono text-[11px] tracking-[0.1em] text-sheet/75 uppercase">
        <span className="sr-only">Escale </span>
        {index + 1} / {count}
        {multiplier > 1 && <span className="ml-2 font-semibold text-gold">×{multiplier.toLocaleString('fr-FR')}</span>}
      </p>
      <p
        className={cn(
          'font-display text-xl leading-none tabular-nums',
          answeredRight === false ? 'text-sheet/60' : 'text-gold',
        )}
      >
        <span className="sr-only">{answeredRight === null ? 'Points en jeu : ' : 'Points gagnés : '}</span>+{atStake}
      </p>
    </div>
  )
}

/** Le tableau de bord du voyage : chrono, points en jeu, combo, total et escales. */
function Board({
  remaining,
  atStake,
  answeredRight,
  combo,
  total,
  correctCount,
  answers,
  count,
  index,
}: {
  remaining: number
  atStake: number
  /** `null` tant que la question est ouverte. */
  answeredRight: boolean | null
  combo: number
  total: number
  correctCount: number
  answers: Played[]
  count: number
  index: number
}) {
  const seconds = Math.ceil(remaining / 1000)
  const multiplier = comboMultiplier(combo)
  // Le prochain seuil de multiplicateur, pour donner envie de tenir la combo.
  const nextStep = [...COMBO_STEPS].reverse().find((step) => step.from > combo)
  const lastPoints = answers[answers.length - 1]?.points ?? 0

  return (
    <aside
      aria-label="Tableau de bord"
      className="grid min-w-0 gap-4 md:sticky md:top-4"
    >
      {/* Sur un téléphone, la barre collée en haut tient déjà ce rôle. */}
      <div className="hidden items-center justify-between gap-4 rounded-md bg-navy px-5 py-4 text-sheet md:flex">
        <div className="space-y-1">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase opacity-75">
            {remaining > 0 ? 'Embarquement dans' : 'Dernier appel'}
          </p>
          <p className="font-display text-4xl leading-none tabular-nums">
            0:{String(seconds).padStart(2, '0')}
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase opacity-75">
            {answeredRight === null ? 'Points en jeu' : 'Points gagnés'}
          </p>
          <p
            className={cn(
              'font-display text-3xl leading-none tabular-nums',
              answeredRight === false ? 'text-sheet/60' : 'text-gold',
            )}
          >
            +{atStake}
          </p>
        </div>
      </div>

      <Sheet className="grid gap-4 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative space-y-1">
            <Eyebrow className="text-[11px]">Total</Eyebrow>
            <p className="font-display text-3xl leading-none text-ink tabular-nums">
              {total.toLocaleString('fr-FR')}
            </p>
            {answeredRight && (
              <span
                // Remonté à chaque réponse, pour rejouer l'envol.
                key={answers.length}
                aria-hidden
                className="float-up pointer-events-none absolute -top-3 left-full ml-1 font-mono text-sm font-semibold whitespace-nowrap text-teal"
              >
                +{lastPoints}
              </span>
            )}
          </div>

          {combo >= 2 ? (
            <StampMark
              // Remonté à chaque bonne réponse de plus, pour que le tampon frappe à nouveau.
              key={combo}
              animate
              tilt={12}
              className="size-[4.5rem] shrink-0 flex-col gap-0.5"
              title={`${combo} bonnes réponses d'affilée`}
            >
              <span className="font-display text-2xl leading-none normal-case tracking-normal">
                ×{combo}
              </span>
              <span className="text-[9px]">Combo</span>
            </StampMark>
          ) : (
            <StampMark tone="faded" tilt={12} className="size-[4.5rem] shrink-0 text-[9px]">
              Combo
            </StampMark>
          )}
        </div>

        <p className="font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
          Points ×{formatMultiplier(multiplier)}
          {nextStep && (
            <>
              {' '}
              · encore {nextStep.from - combo} pour ×{formatMultiplier(nextStep.multiplier)}
            </>
          )}
        </p>

        <div className="rule-dashed space-y-2 border-t-2 pt-3">
          <div className="flex items-baseline justify-between gap-2 font-mono text-[11px] tracking-[0.08em] text-ink-soft uppercase">
            <span>Parcours</span>
            <span className="font-semibold text-ink">
              {correctCount} bonne{correctCount > 1 ? 's' : ''}
            </span>
          </div>
          <ol aria-hidden className="flex flex-wrap gap-1">
            {Array.from({ length: count }, (_, i) => {
              const answer = answers[i]
              return (
                <li
                  key={i}
                  className={cn(
                    'size-2.5 rounded-full',
                    answer
                      ? answer.verdict.status === 'wrong'
                        ? 'bg-stamp'
                        : 'bg-teal'
                      : i === index
                        ? 'bg-ink ring-2 ring-ink/20'
                        : 'bg-ink/15',
                  )}
                />
              )
            })}
          </ol>
        </div>
      </Sheet>
    </aside>
  )
}

/** « 1,5 » plutôt que « 1.5 ». */
function formatMultiplier(value: number): string {
  return String(value).replace('.', ',')
}
