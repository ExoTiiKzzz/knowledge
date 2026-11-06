'use client'

import { useEffect, useRef, useState } from 'react'
import { FlagAnswer, Prompt, mapEmphasis } from '@/components/QuestionView'
import { Button, Chip, Eyebrow, Icon, Input, Meter, Sheet, StampMark } from '@/components/ui'
import { WorldMap, type Emphasis, type Pick } from '@/components/WorldMap'
import { cn } from '@/lib/utils'
import { MODES, countryByCode, type Mode, type Question } from '@/lib/quiz'
import { RESULTS_PAUSE, pointsFor } from '@/lib/room'
import { useClock } from '@/components/clock'
import { PlayerDot, formatClock, type RoomView } from '@/components/room/common'

type Round = NonNullable<NonNullable<RoomView['game']>['round']>
type Result = NonNullable<NonNullable<RoomView['game']>['result']>
type ResultAnswer = Result['answers'][number]

/**
 * The round in progress, and the results pause that follows it.
 *
 * Nothing is decided here: the verdict, the points and the right answer all come
 * from the server, the sole judge (ADR-0002). The client only measures its own
 * thinking time and claims it — the server clamps it (ADR-0003).
 */
export function RoundView({
  view,
  onAnswer,
}: {
  view: RoomView
  /** Sends the raw input and the measured time. Resolves to false when refused. */
  onAnswer: (input: string, ms: number) => Promise<boolean>
}) {
  const game = view.game
  if (!game) return null

  if (game.round) {
    // Keyed on the round: the typed input, the sent flag and the moment the
    // round appeared all belong to one round, and must start over with the next.
    return <RoundPlay key={game.round.number} view={view} round={game.round} onAnswer={onAnswer} />
  }
  if (game.result) return <RoundResult view={view} result={game.result} />
  return null
}

/** The top line of the sheet: where we are in the game, and what is asked. */
function SheetHeader({ view, number, mode }: { view: RoomView; number: number; mode: Mode }) {
  const total = view.game?.roundCount ?? 0
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">
        <span>
          Manche {String(number).padStart(2, '0')} / {total}
        </span>
        <span>
          {view.settings.scope ?? 'Monde entier'} · {MODES[mode].label}
        </span>
      </div>
      <Meter
        value={total ? (number - 1) / total : 0}
        tone="teal"
        className="h-1"
        label={`Manche ${number} sur ${total}`}
      />
    </div>
  )
}

function RoundPlay({
  view,
  round,
  onAnswer,
}: {
  view: RoomView
  round: Round
  onAnswer: (input: string, ms: number) => Promise<boolean>
}) {
  const me = view.players.find((p) => p.token === view.me)
  const mode = round.mode
  const spec = MODES[mode]
  const [input, setInput] = useState('')
  // What this browser sent, before the server confirms it: enough to stop a
  // second send, and to show a map click at once.
  const [sent, setSent] = useState<string | null>(null)
  const field = useRef<HTMLInputElement>(null)

  // When the round appeared on screen: the claimed duration starts from there.
  // The component is keyed on the round, so this runs once per round.
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = Date.now()
    field.current?.focus()
  }, [])

  const inPlay = Boolean(me?.inPlay)
  const hasAnswered = Boolean(me?.hasAnswered) || sent !== null
  const canAnswer = inPlay && !hasAnswered

  async function send(value: string) {
    if (!canAnswer || !value.trim()) return
    setSent(value)
    const accepted = await onAnswer(value, Date.now() - shownAt.current)
    // Refused (network, round already closed): let them try again if they still can.
    if (!accepted) setSent(null)
  }

  // The renderer of the solo game, fed what the round gives: the code says the
  // country, which the client owns anyway (ADR-0002). `accepted` is not needed
  // to draw a question, and the server keeps it.
  const country = countryByCode(round.code)
  const question: Question | null = country ? { country, accepted: [] } : null

  // A map click, shown in the player's colour while they wait: nothing says yet
  // whether it is right.
  const myPick: Pick[] =
    mode === 'mapFind' && sent && me ? [{ code: sent, colour: me.colour, name: me.name }] : []

  return (
    <Sheet className="space-y-6 p-5 sm:p-8">
      <SheetHeader view={view} number={round.number} mode={mode} />

      {spec.needsMap ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-1 text-center">
            <Eyebrow>{spec.prompt}</Eyebrow>
            {mode === 'mapFind' && <p className="font-display text-4xl text-ink">{round.label}</p>}
          </div>
          <WorldMap
            scope={view.settings.scope}
            emphasis={question ? mapEmphasis(mode, question, null, null) : {}}
            onSelect={mode === 'mapFind' && canAnswer ? (code) => void send(code) : undefined}
            picks={myPick}
            resetKey={round.code}
          />
        </div>
      ) : question ? (
        <Prompt
          mode={mode}
          scope={view.settings.scope}
          question={question}
          verdict={null}
          guess={null}
          onSelect={() => {}}
        />
      ) : (
        // A code the dataset does not know: the label is all there is to show.
        <p className="py-6 text-center font-display text-4xl text-ink">{round.label ?? round.code}</p>
      )}

      {spec.answer === 'text' && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void send(input)
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="round-answer">
              <Eyebrow>{spec.asks === 'capital' ? 'Capitale' : 'Destination'}</Eyebrow>
            </label>
            <Input
              id="round-answer"
              ref={field}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              readOnly={!canAnswer}
              placeholder={spec.asks === 'capital' ? 'Nom de la capitale…' : 'Nom du pays…'}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby="round-status"
            />
          </div>
          {/* « Valider », pas « Tamponner » : un salon ne verse rien au passeport (ADR-0005). */}
          <Button type="submit" size="lg" disabled={!canAnswer || !input.trim()}>
            Valider
            <Icon name="arrow" />
          </Button>
        </form>
      )}

      <div id="round-status" role="status">
        {inPlay && hasAnswered && (
          <p className="flex flex-wrap items-center gap-3 rounded-md border-2 border-dashed border-rule px-3 py-2 text-sm text-ink-soft">
            <StampMark tone="navy" shape="square" tilt={-5} animate className="px-2 py-1 text-[10px]">
              Envoyé
            </StampMark>
            <span>
              {mode === 'mapFind' && sent && (
                <>
                  Tu as désigné <strong className="text-ink">{countryByCode(sent)?.name ?? sent}</strong>.{' '}
                </>
              )}
              On attend les autres.
            </span>
          </p>
        )}
        {!inPlay && (
          <p className="rounded-md border-2 border-dashed border-rule px-3 py-2 text-sm text-ink-soft">
            Tu entres en jeu à la manche suivante.
          </p>
        )}
      </div>
    </Sheet>
  )
}

/** The results pause: the right answer, and what everyone replied. */
function RoundResult({ view, result }: { view: RoomView; result: Result }) {
  const mode = result.mode
  const spec = MODES[mode]
  const players = new Map(view.players.map((p) => [p.token, p]))
  const mine = result.answers.find((a) => a.token === view.me)

  const emphasis: Record<string, Emphasis> = { [result.code]: 'correct' }
  if (mine?.guess) emphasis[mine.guess.code] = 'wrong'

  // Le pays désigné par chacun, dans sa couleur. Le bon pays reste vert dessous :
  // les repères disent qui a visé quoi, le remplissage dit où était la réponse.
  const picks: Pick[] = result.answers
    .filter((answer) => answer.pick)
    .map((answer) => ({
      code: answer.pick!,
      colour: players.get(answer.token)?.colour ?? 'amber',
      name: players.get(answer.token)?.name ?? '—',
    }))

  const answerName = countryByCode(result.code)?.name ?? result.expected

  return (
    <Sheet className="space-y-6 p-5 sm:p-8">
      <SheetHeader view={view} number={result.number} mode={mode} />

      {spec.needsMap ? (
        <WorldMap
          scope={view.settings.scope}
          emphasis={emphasis}
          picks={picks}
          resetKey={`result-${result.number}`}
        />
      ) : mine?.guess ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <FlagAnswer code={result.code} name={answerName} caption="la réponse" correct />
          <FlagAnswer code={mine.guess.code} name={mine.guess.name} caption="ta réponse" />
        </div>
      ) : (
        <div className="mx-auto w-1/2 max-w-56">
          <FlagAnswer code={result.code} name={answerName} caption="la réponse" correct />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {mine && <MyVerdict answer={mine} />}
        <p className="min-w-0 flex-1 text-ink">
          La réponse était <strong className="font-display text-xl font-normal">{result.expected}</strong>.
        </p>
      </div>

      <section aria-labelledby="round-answers" className="space-y-2">
        <h3 id="round-answers" className="font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase">
          Les réponses
        </h3>
        <ul className="divide-y-2 divide-dashed divide-rule/70">
          {result.answers.map((answer) => {
            const player = players.get(answer.token)
            const shown = shownAnswer(answer, mode)
            return (
              <li key={answer.token} className="flex items-center gap-3 py-2 text-sm">
                <PlayerDot colour={player?.colour ?? 'amber'} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {player?.name ?? '—'}
                    {answer.token === view.me && <span className="text-ink-soft"> (toi)</span>}
                  </span>
                  <span
                    className={cn(
                      'block truncate text-xs',
                      shown === null
                        ? 'text-ink-soft italic'
                        : answer.status === 'wrong'
                          ? 'text-stamp-deep line-through'
                          : 'text-ink-soft',
                    )}
                  >
                    {shown ?? 'aucune réponse'}
                  </span>
                </span>
                {answer.status === 'close' && <Chip tone="teal">presque</Chip>}
                {answer.status === 'wrong' ? (
                  <Icon name="cross" label="réponse fausse" className="text-stamp" />
                ) : (
                  <Icon name="check" label="bonne réponse" className="text-teal" />
                )}
                <span
                  className={cn(
                    'w-14 shrink-0 text-right font-mono font-semibold tabular-nums',
                    answer.points > 0 ? 'text-ink' : 'text-ink-soft',
                  )}
                >
                  +{answer.points}
                  <span className="sr-only"> points</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </Sheet>
  )
}

/**
 * What a player answered, in words. A click is sent as a country code, which
 * nobody wants to read: it is shown by the country's name.
 */
function shownAnswer(answer: ResultAnswer, mode: Mode): string | null {
  if (answer.input === null) return null
  if (MODES[mode].answer === 'click') return countryByCode(answer.input)?.name ?? answer.input
  return answer.input.trim() || null
}

/** This player's own verdict, stamped. */
function MyVerdict({ answer }: { answer: ResultAnswer }) {
  const label =
    answer.status === 'exact'
      ? 'Exact'
      : answer.status === 'close'
        ? 'Accepté'
        : answer.input === null
          ? 'Sans réponse'
          : 'Raté'

  return (
    <div className="flex items-center gap-3">
      <StampMark
        tone={answer.status === 'wrong' ? 'stamp' : 'teal'}
        tilt={-10}
        animate
        className="size-20 text-[11px]"
      >
        {label}
      </StampMark>
      {answer.points > 0 && (
        <p className="font-display text-3xl text-[#8a6508]">
          +{answer.points}
          <span className="sr-only"> points</span>
        </p>
      )}
    </div>
  )
}

/**
 * The clock of the round, or of the pause that follows it: a navy card, as the
 * departures board shows the time left before the gate closes.
 *
 * Purely indicative: the server is what closes the round and ends the pause.
 */
export function RoundClock({ view, className }: { view: RoomView; className?: string }) {
  const now = useClock(200)
  const game = view.game
  if (!game) return null

  const round = game.round
  const result = game.result
  const me = view.players.find((p) => p.token === view.me)

  // Settings cannot change while a game runs, so the room's are the game's.
  const span = round ? view.settings.roundDuration : RESULTS_PAUSE
  const target = round?.deadlineAt ?? game.resumeAt
  // Before the first tick the clock shows the whole span rather than a guess.
  const remaining = target && now !== null ? Math.max(0, target - now) : span

  const lastRound = !round && result !== null && result.number >= game.roundCount
  const label = round ? 'Porte close dans' : lastRound ? 'Arrivée dans' : 'Prochaine manche dans'

  const canAnswer = Boolean(round && me?.inPlay && !me.hasAnswered)
  const mine = result?.answers.find((a) => a.token === view.me)

  return (
    <div className={cn('space-y-4 rounded-md bg-navy p-5 text-sheet shadow-[0_14px_32px_rgb(20_40_71/0.25)]', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs tracking-[0.1em] text-sheet/75 uppercase">{label}</p>
          <p className="font-display text-5xl leading-none tabular-nums">{formatClock(remaining)}</p>
        </div>
        {canAnswer ? (
          <div className="space-y-1 text-right">
            <p className="font-mono text-xs tracking-[0.1em] text-sheet/75 uppercase">Points en jeu</p>
            <p className="font-display text-3xl leading-none text-gold tabular-nums">
              +{pointsFor({ status: 'exact' }, span - remaining, span)}
            </p>
          </div>
        ) : round && me?.hasAnswered ? (
          <p className="flex items-center gap-1.5 font-mono text-xs tracking-[0.1em] text-gold uppercase">
            <Icon name="check" />
            Envoyé
          </p>
        ) : mine ? (
          <div className="space-y-1 text-right">
            <p className="font-mono text-xs tracking-[0.1em] text-sheet/75 uppercase">Gagnés</p>
            <p className="font-display text-3xl leading-none text-gold tabular-nums">+{mine.points}</p>
          </div>
        ) : null}
      </div>
      {/* A track the gold can drain from: the meter's own is ink, invisible on navy. */}
      <div className="rounded-full bg-sheet/15">
        <Meter value={remaining / span} tone="gold" label="Temps restant" />
      </div>
    </div>
  )
}
