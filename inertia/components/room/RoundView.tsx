import { useEffect, useRef, useState } from 'react'
import { Check, Timer, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Flag } from '@/components/Flag'
import { WorldMap, type Emphasis, type Pick } from '@/components/WorldMap'
import { cn } from '@/lib/utils'
import { MODES, countryByCode, type Mode, type Scope } from '@/lib/quiz'
import type { RoomView } from '@/browser/room-client'

/**
 * The round in progress, and the results pause that follows it.
 *
 * Nothing is decided here: the verdict, the points and the right answer all come
 * from the server, the sole judge (ADR-0002). The client only measures its own
 * thinking time and claims it — the server clamps it (ADR-0003).
 */
export function RoundView({
  view,
  scope,
  onAnswer,
}: {
  view: RoomView
  scope: Scope
  onAnswer: (input: string, ms: number) => void
}) {
  const round = view.game?.round ?? null
  const result = view.game?.result ?? null
  const me = view.players.find((p) => p.token === view.me)
  const [input, setInput] = useState('')
  const field = useRef<HTMLInputElement>(null)

  // When the round appeared on screen: the claimed duration starts from there.
  const shownAt = useRef<number>(Date.now())
  const number = round?.number ?? null
  useEffect(() => {
    shownAt.current = Date.now()
    setInput('')
    field.current?.focus()
  }, [number])

  const mode = (round?.mode ?? result?.mode ?? 'flags') as Mode
  const typed = MODES[mode].answer === 'text'
  const hasAnswered = Boolean(me?.hasAnswered)
  const inPlay = Boolean(me?.inPlay)

  function send(value: string) {
    if (!round || hasAnswered || !inPlay || !value.trim()) return
    onAnswer(value, Date.now() - shownAt.current)
  }

  return (
    <div className="space-y-4">
      <Header view={view} />

      <Card>
        <CardContent className="space-y-4">
          {round ? (
            <Prompt
              mode={mode}
              countryCode={round.code}
              countryName={round.name}
              scope={scope}
              clickable={!hasAnswered && inPlay}
              onPickCountry={(code) => send(code)}
            />
          ) : (
            result && <Result view={view} scope={scope} />
          )}

          {round && typed && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                send(input)
              }}
              className="flex gap-2"
            >
              <Input
                ref={field}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                readOnly={hasAnswered || !inPlay}
                placeholder={mode === 'capitals' ? 'Nom de la capitale…' : 'Nom du pays…'}
                autoComplete="off"
                spellCheck={false}
                aria-label={MODES[mode].prompt}
                className="h-11 text-base"
              />
              <Button type="submit" size="lg" disabled={hasAnswered || !inPlay || !input.trim()}>
                Valider
              </Button>
            </form>
          )}

          {round && hasAnswered && (
            <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Check className="size-4" />
              Réponse envoyée. On attend les autres.
            </p>
          )}
          {round && !inPlay && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Tu entres en jeu à la manche suivante.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Header({ view }: { view: RoomView }) {
  const game = view.game!
  const round = game.round
  const [remaining, setRemaining] = useState(0)

  // The countdown is purely indicative: the server is what closes the round.
  useEffect(() => {
    const target = round?.deadlineAt ?? game.resumeAt
    if (!target) return setRemaining(0)
    const tick = () => setRemaining(Math.max(0, target - Date.now()))
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [round?.deadlineAt, game.resumeAt])

  const number = round?.number ?? game.result?.number ?? 0
  const total = game.roundCount

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Manche {number} / {total}
        </span>
        <span className="flex items-center gap-1.5 font-medium tabular-nums">
          <Timer className="size-4 text-muted-foreground" />
          {(remaining / 1000).toFixed(1)} s
        </span>
      </div>
      <Progress value={total ? ((number - 1) / total) * 100 : 0} />
    </div>
  )
}

/** The question itself, according to what the mode asks for. */
function Prompt({
  mode,
  countryCode,
  countryName,
  scope,
  clickable,
  onPickCountry,
}: {
  mode: Mode
  countryCode: string
  countryName: string | null
  scope: Scope
  clickable: boolean
  onPickCountry: (code: string) => void
}) {
  if (mode === 'flags') {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <Flag code={countryCode} frame="lg" />
        <p className="text-sm text-muted-foreground">{MODES.flags.prompt}</p>
      </div>
    )
  }

  if (mode === 'capitals') {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <Flag code={countryCode} className="h-10" />
        <p className="text-2xl font-semibold">{countryName}</p>
        <p className="text-sm text-muted-foreground">{MODES.capitals.prompt}</p>
      </div>
    )
  }

  const emphasis: Record<string, Emphasis> = mode === 'mapName' ? { [countryCode]: 'target' } : {}

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-1 text-center">
        {mode === 'mapFind' && <p className="text-2xl font-semibold">{countryName}</p>}
        <p className="text-sm text-muted-foreground">{MODES[mode].prompt}</p>
      </div>
      <WorldMap
        scope={scope}
        emphasis={emphasis}
        onSelect={mode === 'mapFind' && clickable ? onPickCountry : undefined}
        resetKey={countryCode}
      />
    </div>
  )
}

/** The results pause: the right answer, and what everyone replied. */
function Result({ view, scope }: { view: RoomView; scope: Scope }) {
  const result = view.game!.result!
  const names = new Map(view.players.map((p) => [p.token, p.name]))
  const mine = result.answers.find((a) => a.token === view.me)
  const mode = result.mode as Mode

  const emphasis: Record<string, Emphasis> = { [result.code]: 'correct' }
  if (mine?.guess) emphasis[mine.guess.code] = 'wrong'

  // Le pays désigné par chacun, dans sa couleur. Le bon pays reste vert dessous :
  // les repères disent qui a visé quoi, le remplissage dit où était la réponse.
  const colours = new Map(view.players.map((p) => [p.token, p.colour]))
  const picks: Pick[] = result.answers
    .filter((answer) => answer.pick)
    .map((answer) => ({
      code: answer.pick!,
      colour: colours.get(answer.token) ?? 'amber',
      name: names.get(answer.token) ?? '—',
    }))

  return (
    <div className="space-y-4">
      {MODES[mode].needsMap ? (
        <WorldMap
          scope={scope}
          emphasis={emphasis}
          picks={picks}
          resetKey={`result-${result.number}`}
        />
      ) : (
        <div className="flex items-end justify-center gap-6 py-2">
          <Target code={result.code} fallbackName={result.expected} caption="la réponse" correct />
          {mine?.guess && (
            <Target code={mine.guess.code} fallbackName={mine.guess.name} caption="ta réponse" />
          )}
        </div>
      )}

      <p className="text-center text-sm">
        La réponse était <strong>{result.expected}</strong>.
      </p>

      <ul className="divide-y rounded-lg border text-sm">
        {result.answers.map((answer) => (
          <li key={answer.token} className="flex items-center gap-3 px-3 py-2">
            {MODES[mode].needsMap && (
              <PlayerDot colour={colours.get(answer.token) ?? 'amber'} />
            )}
            <span className="min-w-0 flex-1 truncate">{names.get(answer.token) ?? '—'}</span>
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-right',
                answer.status === 'wrong'
                  ? 'text-destructive line-through'
                  : 'text-muted-foreground',
              )}
            >
              {answer.input?.trim() || 'aucune réponse'}
            </span>
            {answer.status === 'close' && <Badge variant="secondary">presque</Badge>}
            {answer.status === 'wrong' ? (
              <X className="size-4 shrink-0 text-destructive" />
            ) : (
              <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="w-14 shrink-0 text-right font-medium tabular-nums">
              +{answer.points}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Target({
  code,
  fallbackName,
  caption,
  correct,
}: {
  code: string
  fallbackName: string
  caption: string
  correct?: boolean
}) {
  const country = countryByCode(code)
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
          {country?.name ?? fallbackName}
        </p>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
    </div>
  )
}

/** Pastilles des couleurs de joueur, alignées sur celles des repères de la carte. */
const DOT_COLOURS: Record<string, string> = {
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  fuchsia: 'bg-fuchsia-500',
  orange: 'bg-orange-500',
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
}

/**
 * Relie un joueur à son repère sur la carte.
 *
 * Sans elle, la couleur serait la seule façon de savoir qui a visé quoi — ce qui
 * exclurait quiconque distingue mal deux teintes. Le nom reste juste à côté.
 */
function PlayerDot({ colour }: { colour: string }) {
  return (
    <span
      aria-hidden
      className={cn('size-2.5 shrink-0 rounded-full', DOT_COLOURS[colour] ?? 'bg-foreground')}
    />
  )
}
