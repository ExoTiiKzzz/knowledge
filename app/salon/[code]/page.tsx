'use client'

import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { api } from '@/convex/_generated/api'
import { RoundClock, RoundView } from '@/components/room/RoundView'
import { RoomSettings } from '@/components/room/Settings'
import { Standings } from '@/components/room/Standings'
import {
  HEARTBEAT_MS,
  PlayerDot,
  rejectionMessage,
  useToken,
  type RoomView,
} from '@/components/room/common'
import {
  Button,
  Chip,
  Eyebrow,
  Icon,
  Input,
  Perforation,
  Sheet,
  StampMark,
  buttonClass,
} from '@/components/ui'
import { rememberName, rememberedName } from '@/lib/identity'
import { MAX_PLAYERS, type Settings } from '@/lib/room'
import { cn } from '@/lib/utils'

/**
 * A room, from the doorstep to the podium.
 *
 * The client holds no rule: it renders the view the server sends — reactively,
 * on every change of the Room — and sends the player's gestures back. The room
 * code comes from the URL, so sharing the link is enough to invite.
 */
export default function SalonPage() {
  const code = String(useParams<{ code: string }>().code ?? '').toUpperCase()
  const token = useToken()
  const view = useQuery(api.rooms.view, token ? { code, token } : 'skip')
  const seated = Boolean(view?.players.some((p) => p.token === view.me))
  const [leaving, setLeaving] = useState(false)

  useHeartbeat(code, token, seated)

  // While leaving, the view changes under our feet — we are no longer seated, or
  // the room is gone — and neither the doorstep nor "closed" should flash.
  if (leaving) return <Notice>Débarquement…</Notice>
  if (!token || view === undefined) return <Notice>Embarquement pour le salon {code}…</Notice>
  if (view === null) return <Closed code={code} />
  if (!seated) return <Doorstep view={view} code={code} token={token} />

  return <Room view={view} code={code} token={token} onLeaving={() => setLeaving(true)} />
}

/**
 * Says this player is still here, now and every `HEARTBEAT_MS`, for as long as
 * the page is open. Whoever stops checking in is shown as away by the others,
 * and no longer holds a round up.
 */
function useHeartbeat(code: string, token: string | null, seated: boolean) {
  const heartbeat = useMutation(api.rooms.heartbeat)
  useEffect(() => {
    if (!token || !seated) return
    // A missed beat is no matter: the next one, five seconds later, makes up for it.
    const beat = () => void heartbeat({ code, token }).catch(() => {})
    beat()
    const id = setInterval(beat, HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [code, token, seated, heartbeat])
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="font-mono text-sm tracking-[0.1em] text-ink-soft uppercase">{children}</p>
    </main>
  )
}

function Closed({ code }: { code: string }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <StampMark tone="stamp" tilt={-8} animate className="size-28 text-xs">
        Fermé
      </StampMark>
      <h1 className="text-3xl text-ink">Salon {code} introuvable</h1>
      <p className="text-ink-soft">
        Ce salon n&apos;existe pas, ou il s&apos;est fermé quand le dernier joueur en est parti.
      </p>
      <Link href="/salon" className={buttonClass('primary', 'md')}>
        <Icon name="back" />
        Créer ou rejoindre un salon
      </Link>
    </main>
  )
}

/**
 * Arriving on a shared link: the salon is there, but this browser has no seat
 * yet. The name is asked here, and joining seats them for good — a refresh
 * afterwards takes the same seat back.
 */
function Doorstep({ view, code, token }: { view: RoomView; code: string; token: string }) {
  const join = useMutation(api.rooms.join)
  const [name, setName] = useState(rememberedName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const running = Boolean(view.game && !view.game.finished)
  const full = view.players.length >= MAX_PLAYERS

  async function submit() {
    const clean = name.trim()
    if (!clean) return
    setBusy(true)
    setError(null)
    rememberName(clean)
    try {
      // Nothing more to do on success: the view now lists this player, and the
      // page turns into the room by itself.
      await join({ code, token, name: clean })
    } catch (e) {
      setError(rejectionMessage(e))
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 py-10">
      <Sheet className="space-y-6 p-5 sm:p-8">
        <div className="space-y-1">
          <Eyebrow>Carte d&apos;embarquement · Salon {code}</Eyebrow>
          <h1 className="text-4xl text-ink">Rejoindre le salon</h1>
          <p className="text-sm text-ink-soft">
            Choisis le nom sous lequel les autres te verront. Aucun compte, aucun mot de passe.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="doorstep-name">
              <Eyebrow>Nom du passager</Eyebrow>
            </label>
            <Input
              id="doorstep-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ton nom"
              maxLength={24}
              autoComplete="nickname"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" disabled={busy || !name.trim()}>
            {busy ? 'Embarquement…' : 'Rejoindre'}
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-sm text-stamp-deep">
            {error}
          </p>
        )}
        {!error && full && <p className="text-sm text-stamp-deep">Ce salon est complet.</p>}
        {!error && !full && running && (
          <p className="text-sm text-ink-soft">
            Une partie est en cours : tu y entreras dès la manche suivante.
          </p>
        )}

        <Perforation />
        <Standings view={view} />
      </Sheet>

      <Link href="/salon" className={buttonClass('ghost', 'sm')}>
        <Icon name="back" />
        Autre salon
      </Link>
    </main>
  )
}

function Room({
  view,
  code,
  token,
  onLeaving,
}: {
  view: RoomView
  code: string
  token: string
  onLeaving: () => void
}) {
  const router = useRouter()
  const updateSettings = useMutation(api.rooms.updateSettings)
  const start = useMutation(api.rooms.start)
  const answer = useMutation(api.rooms.answer)
  const leave = useMutation(api.rooms.leave)

  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  // The host reopens the settings after a game. Remembered against the number of
  // games played, so that the next podium shows again without a reset.
  const [editingAfter, setEditingAfter] = useState<number | null>(null)

  /** Runs a call; a refusal is shown, and reported as false. */
  const run = useCallback(async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
      return true
    } catch (e) {
      setError(rejectionMessage(e))
      return false
    }
  }, [])

  async function startGame() {
    setStarting(true)
    await run(() => start({ code, token }))
    setStarting(false)
  }

  async function leaveRoom() {
    onLeaving()
    // Leaving a room that is already gone is still leaving: go either way.
    await leave({ code, token }).catch(() => {})
    router.push('/salon')
  }

  const game = view.game
  const playing = Boolean(game && !game.finished)
  const editing = view.isHost && editingAfter === view.history.length

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
      <BoardingPass view={view} code={code} onLeave={() => void leaveRoom()} />

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-md border-2 border-stamp/30 bg-stamp/[0.06] px-3 py-2 text-sm text-stamp-deep"
        >
          <Icon name="cross" />
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr] lg:items-start">
        {/* First in the flow so a phone sees the clock above the question; beside it on a wide screen. */}
        {playing && <RoundClock view={view} className="lg:col-start-2 lg:row-start-1" />}

        <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {playing ? (
            <RoundView view={view} onAnswer={(input, ms) => run(() => answer({ code, token, input, ms }))} />
          ) : game?.finished && !editing ? (
            <Podium
              view={view}
              starting={starting}
              onReplay={() => void startGame()}
              onEdit={() => setEditingAfter(view.history.length)}
            />
          ) : (
            <RoomSettings
              view={view}
              starting={starting}
              onChange={(settings: Partial<Settings>) =>
                void run(() => updateSettings({ code, token, ...settings }))
              }
              onStart={() => void startGame()}
            />
          )}
        </div>

        <aside className="min-w-0 space-y-6 lg:col-start-2">
          <Sheet className="p-5">
            <Standings view={view} />
          </Sheet>
          {view.history.length > 0 && !playing && <History view={view} />}
        </aside>
      </div>
    </main>
  )
}

/**
 * The salon's code as a boarding pass: the gate number in large type, and what
 * it takes to bring someone aboard — the code to read out, or the link to send.
 */
function BoardingPass({ view, code, onLeave }: { view: RoomView; code: string; onLeave: () => void }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const reset = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(reset.current), [])

  async function copy(what: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : `${window.location.origin}/salon/${code}`)
      setCopied(what)
      clearTimeout(reset.current)
      reset.current = setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard refused: the code stays readable on screen.
    }
  }

  const game = view.game
  const status = !game
    ? 'À quai'
    : game.finished
      ? 'Arrivée'
      : `Manche ${game.round?.number ?? game.result?.number ?? 1} / ${game.roundCount}`

  return (
    <Sheet className="flex flex-col overflow-hidden sm:flex-row">
      <div className="min-w-0 flex-1 space-y-3 p-5 sm:p-6">
        <Eyebrow>Carte d&apos;embarquement · Salon</Eyebrow>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p className="font-mono text-[10px] font-medium tracking-[0.14em] text-ink-soft uppercase">Porte</p>
            <h1 className="font-mono text-5xl leading-none font-semibold tracking-[0.25em] text-navy sm:text-6xl">
              <span className="sr-only">Salon </span>
              {code}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void copy('code')}>
              <Icon name={copied === 'code' ? 'check' : 'copy'} />
              {copied === 'code' ? 'Copié' : 'Copier le code'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void copy('link')}>
              <Icon name={copied === 'link' ? 'check' : 'link'} />
              {copied === 'link' ? 'Copié' : 'Copier le lien'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-ink-soft">Le code ou le lien suffit pour embarquer.</p>
        <span role="status" className="sr-only">
          {copied === 'code' ? 'Code copié' : copied === 'link' ? 'Lien copié' : ''}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 border-t-2 border-dashed border-rule bg-paper-deep/30 p-5 sm:w-52 sm:flex-col sm:items-start sm:border-t-0 sm:border-l-2 sm:p-6">
        <dl className="flex gap-6 font-mono text-xs tracking-[0.1em] uppercase sm:flex-col sm:gap-3">
          <div>
            <dt className="text-ink-soft">Passagers</dt>
            <dd className="mt-0.5 font-semibold text-ink tabular-nums">
              {view.players.length} / {MAX_PLAYERS}
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">Statut</dt>
            <dd className="mt-0.5 font-semibold text-ink">{status}</dd>
          </div>
        </dl>
        <Button variant="ghost" size="sm" onClick={onLeave}>
          <Icon name="logout" />
          Quitter
        </Button>
      </div>
    </Sheet>
  )
}

const PLACES = [
  { suffix: 'er', tone: 'gold', tilt: -6, size: 'size-24 sm:size-28', step: 'h-24' },
  { suffix: 'e', tone: 'navy', tilt: 5, size: 'size-20 sm:size-24', step: 'h-16' },
  { suffix: 'e', tone: 'teal', tilt: -9, size: 'size-20 sm:size-24', step: 'h-10' },
] as const

/** Visual order of the steps: second, first, third. The list itself stays 1-2-3. */
const STEP_ORDER = ['order-2', 'order-1', 'order-3']

function Podium({
  view,
  starting,
  onReplay,
  onEdit,
}: {
  view: RoomView
  starting: boolean
  onReplay: () => void
  onEdit: () => void
}) {
  const standings = view.standings
  const winner = standings[0]
  const colours = new Map(view.players.map((p) => [p.token, p.colour]))

  return (
    <Sheet className="space-y-8 p-5 sm:p-8">
      <div className="space-y-1 text-center">
        <Eyebrow>
          Arrivée · {view.game?.roundCount} manches · {view.players.length} joueur
          {view.players.length > 1 ? 's' : ''}
        </Eyebrow>
        <h2 className="text-4xl text-ink">
          {winner?.token === view.me ? 'Tu gagnes !' : `${winner?.name ?? 'Personne'} gagne`}
        </h2>
      </div>

      <ol className="mx-auto grid max-w-md grid-cols-3 items-end gap-2 sm:gap-4">
        {standings.slice(0, 3).map((standing, index) => {
          const place = PLACES[index]
          return (
            <li
              key={standing.token}
              className={cn('flex min-w-0 flex-col items-center gap-2 text-center', STEP_ORDER[index])}
            >
              <StampMark tone={place.tone} tilt={place.tilt} animate className={place.size}>
                <span className="font-display text-3xl tracking-normal normal-case">
                  {index + 1}
                  <sup className="text-sm">{place.suffix}</sup>
                </span>
              </StampMark>
              <p className="flex max-w-full min-w-0 items-center gap-1.5 text-sm font-semibold text-ink">
                <PlayerDot colour={colours.get(standing.token) ?? 'amber'} />
                <span className="truncate">{standing.name}</span>
              </p>
              <p className="font-mono text-xs text-ink-soft tabular-nums">{standing.points} pts</p>
              <div
                aria-hidden
                className={cn('w-full rounded-t-sm border-t-2 border-dashed border-sheet/40 bg-navy', place.step)}
              />
            </li>
          )
        })}
      </ol>

      <ol className="divide-y-2 divide-dashed divide-rule/70">
        {standings.map((standing, index) => (
          <li
            key={standing.token}
            className={cn(
              'flex items-center gap-3 px-2 py-2.5 text-sm',
              standing.token === view.me && 'rounded-sm bg-navy/[0.06]',
            )}
          >
            <span className="w-5 shrink-0 text-right font-mono text-xs text-ink-soft tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <PlayerDot colour={colours.get(standing.token) ?? 'amber'} />
              <span className="min-w-0 truncate font-medium text-ink">{standing.name}</span>
              {standing.joinedMidGame && <Chip>arrivé en cours</Chip>}
            </span>
            <span className="shrink-0 text-xs text-ink-soft tabular-nums">
              {standing.correctAnswers} bonne{standing.correctAnswers > 1 ? 's' : ''}
            </span>
            <span className="w-14 shrink-0 text-right font-mono font-semibold text-ink tabular-nums">
              {standing.points}
              <span className="sr-only"> points</span>
            </span>
          </li>
        ))}
      </ol>

      {view.isHost ? (
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={onReplay} disabled={starting}>
            <Icon name="retry" />
            {starting ? 'Décollage…' : 'Rejouer'}
          </Button>
          <Button variant="outline" size="lg" onClick={onEdit} disabled={starting}>
            Changer les réglages
          </Button>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">L&apos;hôte peut relancer une partie.</p>
      )}
    </Sheet>
  )
}

/** The games already played in this salon, as a logbook. */
function History({ view }: { view: RoomView }) {
  return (
    <Sheet className="space-y-3 p-5">
      <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase">
        Parties de ce salon
      </h2>
      <ol className="divide-y-2 divide-dashed divide-rule/70 text-sm">
        {view.history.map((played, index) => (
          <li key={index} className="flex items-center gap-3 py-2">
            <span className="shrink-0 font-mono text-xs text-ink-soft uppercase">Partie {index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-right font-medium text-ink">
              {played.standings[0]?.name ?? '—'}
            </span>
            <Chip tone="navy">{played.standings[0]?.points ?? 0} pts</Chip>
          </li>
        ))}
      </ol>
    </Sheet>
  )
}
