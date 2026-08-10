import { Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CONTINENTS } from '@/data/countries'
import { MODES, countriesIn, type Mode, type Scope } from '@/lib/quiz'
import type { RoomView } from '@/browser/room-client'

const DURATIONS = [10_000, 15_000, 20_000, 30_000]
const ROUND_COUNTS = [10, 20, 50]

/**
 * Room settings. Only the host may change them — the others see them read-only,
 * so they know what they are signing up for.
 */
export function RoomSettings({
  view,
  onChange,
  onStart,
}: {
  view: RoomView
  onChange: (settings: Record<string, unknown>) => void
  onStart: () => void
}) {
  const modes = view.settings.modes as Mode[]
  const scope = view.settings.scope as Scope
  const isHost = view.isHost

  // The announced pool is the widest a round can draw from: map modes leave the
  // micro-states out, the others do not.
  const pool = modes.length ? Math.max(...modes.map((m) => countriesIn(scope, m).length)) : 0

  function toggleMode(mode: Mode) {
    const next = modes.includes(mode) ? modes.filter((m) => m !== mode) : [...modes, mode]
    if (next.length === 0) return // at least one mode
    onChange({ modes: next })
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          <Label className="text-muted-foreground">Modes</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODES) as Mode[]).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={modes.includes(mode) ? 'default' : 'outline'}
                aria-pressed={modes.includes(mode)}
                disabled={!isHost}
                onClick={() => toggleMode(mode)}
              >
                {MODES[mode].label}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-muted-foreground">Continent</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={scope === null ? 'default' : 'outline'}
              disabled={!isHost}
              onClick={() => onChange({ scope: null })}
            >
              Tous
            </Button>
            {CONTINENTS.map((continent) => (
              <Button
                key={continent}
                size="sm"
                variant={scope === continent ? 'default' : 'outline'}
                disabled={!isHost}
                onClick={() => onChange({ scope: continent })}
              >
                {continent}
              </Button>
            ))}
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          <section className="space-y-2">
            <Label className="text-muted-foreground">Manches</Label>
            <div className="flex flex-wrap gap-2">
              {ROUND_COUNTS.map((count) => (
                <Button
                  key={count}
                  size="sm"
                  variant={view.settings.roundCount === count ? 'default' : 'outline'}
                  disabled={!isHost}
                  onClick={() => onChange({ roundCount: count })}
                >
                  {count}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <Label className="text-muted-foreground">Durée d'une manche</Label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((ms) => (
                <Button
                  key={ms}
                  size="sm"
                  variant={view.settings.roundDuration === ms ? 'default' : 'outline'}
                  disabled={!isHost}
                  onClick={() => onChange({ roundDuration: ms })}
                >
                  {ms / 1000} s
                </Button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
          <div className="space-y-1 text-sm">
            <p className="font-medium">
              {modes.map((m) => MODES[m].label).join(' + ')} · {scope ?? 'Monde entier'} ·{' '}
              {Math.min(view.settings.roundCount, pool)} manches
            </p>
            <p className="text-muted-foreground">
              Vivier : <Badge variant="secondary">{pool} pays</Badge>
              {modes.some((m) => MODES[m].needsMap) && (
                <span className="ml-2 text-xs">
                  les manches carte se limitent aux 165 pays tracés
                </span>
              )}
            </p>
          </div>

          {isHost ? (
            <Button size="lg" onClick={onStart} disabled={pool === 0}>
              <Play data-icon="inline-start" />
              Lancer la partie
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">L'hôte lance la partie.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
