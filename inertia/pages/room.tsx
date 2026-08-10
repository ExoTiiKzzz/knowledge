import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Globe2, RotateCcw, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RoundView } from '@/components/room/RoundView'
import { RoomSettings } from '@/components/room/Settings'
import { Standings } from '@/components/room/Standings'
import { cn } from '@/lib/utils'
import { MODES, type Mode, type Scope } from '@/lib/quiz'
import { rememberName, rememberedName } from '@/browser/token'
import { ServerRejection, listen, roomApi, type RoomView } from '@/browser/room-client'

/**
 * A room, from the doorstep to the podium.
 *
 * The client holds no rule: it renders the view the server pushes on every
 * change, and sends the player's gestures back. The room code comes from the URL,
 * so sharing the link is enough to invite.
 */
export default function RoomPage() {
  const code = window.location.pathname.split('/').filter(Boolean)[1]?.toUpperCase() ?? ''
  const [view, setView] = useState<RoomView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [entered, setEntered] = useState(false)

  // A single subscription for the whole life of the page.
  useEffect(() => {
    if (!entered) return
    return listen(code, setView)
  }, [code, entered])

  const run = useCallback(async <T,>(action: () => Promise<T>) => {
    setError(null)
    try {
      return await action()
    } catch (e) {
      setError(e instanceof ServerRejection ? e.message : 'Le serveur est injoignable.')
      return null
    }
  }, [])

  async function join(name: string) {
    rememberName(name)
    const response = await run(() => roomApi.join(code, name))
    if (response) {
      setView(response.view)
      setEntered(true)
    }
  }

  if (!entered || !view) {
    return (
      <Shell code={code}>
        <JoinForm code={code} error={error} onJoin={join} />
      </Shell>
    )
  }

  const game = view.game
  const scope = view.settings.scope as Scope
  const playing = Boolean(game && !game.finished)

  return (
    <Shell code={code} wide={playing && needsMap(view)}>
      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-5">
        {playing ? (
          <RoundView
            view={view}
            scope={scope}
            onAnswer={(input, ms) => run(() => roomApi.answer(code, input, ms))}
          />
        ) : game?.finished ? (
          <Podium view={view} onReplay={() => run(() => roomApi.start(code))} />
        ) : (
          <RoomSettings
            view={view}
            onChange={(settings) => run(() => roomApi.updateSettings(code, settings))}
            onStart={() => run(() => roomApi.start(code))}
          />
        )}

        <section className="space-y-2">
          <Label className="text-muted-foreground">
            {view.players.length} joueur{view.players.length > 1 ? 's' : ''}
          </Label>
          <Standings view={view} />
        </section>

        {view.history.length > 0 && !playing && (
          <section className="space-y-2">
            <Label className="text-muted-foreground">Parties de ce salon</Label>
            <ol className="divide-y rounded-lg border text-sm">
              {view.history.map((played, index) => (
                <li key={index} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-muted-foreground">Partie {index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-right font-medium">
                    {played.standings[0]?.name ?? '—'}
                  </span>
                  <Badge variant="secondary">{played.standings[0]?.points ?? 0} pts</Badge>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </Shell>
  )
}

/** Map modes need a wide column. */
function needsMap(view: RoomView): boolean {
  const mode = (view.game?.round?.mode ?? view.game?.result?.mode) as Mode | undefined
  return Boolean(mode && MODES[mode].needsMap)
}

function Shell({
  code,
  wide,
  children,
}: {
  code: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className={cn('mx-auto w-full px-4 py-8 sm:py-12', wide ? 'max-w-5xl' : 'max-w-2xl')}>
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
              <Globe2 className="size-6 text-muted-foreground" />
              Salon <span className="font-mono tracking-widest">{code}</span>
            </h1>
            <ShareLink code={code} />
          </div>
          <ThemeToggle />
        </header>
        {children}
      </div>
    </div>
  )
}

function ShareLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/salon/${code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard refused: the code stays readable on screen.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Lien copié' : 'Copier le lien du salon'}
    </button>
  )
}

function JoinForm({
  code,
  error,
  onJoin,
}: {
  code: string
  error: string | null
  onJoin: (name: string) => void
}) {
  const [name, setName] = useState(rememberedName)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rejoindre le salon {code}</CardTitle>
        <CardDescription>
          Choisis le nom sous lequel les autres te verront. Aucun compte, aucun mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim()) onJoin(name.trim())
          }}
          className="space-y-3"
        >
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ton nom"
              maxLength={24}
              autoFocus
              className="h-11 text-base"
            />
            <Button type="submit" size="lg" disabled={!name.trim()}>
              Entrer
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  )
}

function Podium({ view, onReplay }: { view: RoomView; onReplay: () => void }) {
  const standings = view.standings
  const medals = ['🥇', '🥈', '🥉']

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-4 text-muted-foreground" />
          {standings[0]?.token === view.me ? 'Tu gagnes !' : `${standings[0]?.name} gagne`}
        </CardTitle>
        <CardDescription>
          {view.game?.roundCount} manches · {view.players.length} joueurs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="divide-y rounded-lg border">
          {standings.map((standing, index) => (
            <li
              key={standing.token}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm',
                standing.token === view.me && 'bg-muted/50',
              )}
            >
              <span className="w-6 text-center">{medals[index] ?? index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{standing.name}</span>
              {standing.joinedMidGame && <Badge variant="outline">arrivé en cours</Badge>}
              <span className="text-muted-foreground tabular-nums">
                {standing.correctAnswers} bonnes
              </span>
              <span className="w-16 text-right font-medium tabular-nums">{standing.points}</span>
            </li>
          ))}
        </ol>

        {view.isHost ? (
          <Button size="lg" onClick={onReplay}>
            <RotateCcw data-icon="inline-start" />
            Rejouer
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">L'hôte peut relancer une partie.</p>
        )}
      </CardContent>
    </Card>
  )
}
