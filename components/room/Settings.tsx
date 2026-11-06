import type { ReactNode } from 'react'
import { Button, Chip, Eyebrow, Icon, Perforation, Sheet } from '@/components/ui'
import { CONTINENTS } from '@/data/countries'
import { MODES, countriesIn, type Mode } from '@/lib/quiz'
import type { Settings } from '@/lib/room'
import type { RoomView } from '@/components/room/common'

const DURATIONS = [10_000, 15_000, 20_000, 30_000]
const ROUND_COUNTS = [10, 20, 50]

/**
 * Room settings, as a flight plan. Only the host may change them — the others
 * see them read-only, so they know what they are signing up for.
 */
export function RoomSettings({
  view,
  onChange,
  onStart,
  starting,
}: {
  view: RoomView
  onChange: (settings: Partial<Settings>) => void
  onStart: () => void
  /** A start request is in flight: the button must not fire twice. */
  starting?: boolean
}) {
  const { modes, scope, roundCount, roundDuration } = view.settings
  const isHost = view.isHost
  const host = view.players.find((p) => p.isHost)

  // The announced pool is the widest a round can draw from: map modes leave the
  // micro-states out, the others do not.
  const pool = modes.length ? Math.max(...modes.map((m) => countriesIn(scope, m).length)) : 0
  const mapped = countriesIn(scope, 'mapFind').length

  function toggleMode(mode: Mode) {
    const next = modes.includes(mode) ? modes.filter((m) => m !== mode) : [...modes, mode]
    if (next.length === 0) return // at least one mode
    onChange({ modes: next })
  }

  return (
    <Sheet className="space-y-6 p-5 sm:p-7">
      <div className="space-y-1">
        <Eyebrow>Plan de vol</Eyebrow>
        <h2 className="text-3xl text-ink">Réglages de la partie</h2>
        {!isHost && (
          <p className="text-sm text-ink-soft">
            Seul l&apos;hôte{host ? `, ${host.name},` : ''} règle et lance la partie. Voici ce
            qui est prévu.
          </p>
        )}
      </div>

      <Field label="Modes">
        {isHost ? (
          <Choices>
            {(Object.keys(MODES) as Mode[]).map((mode) => (
              <Choice key={mode} selected={modes.includes(mode)} onClick={() => toggleMode(mode)}>
                {MODES[mode].label}
              </Choice>
            ))}
          </Choices>
        ) : (
          <Chosen values={modes.map((m) => MODES[m].label)} />
        )}
      </Field>

      <Field label="Continent">
        {isHost ? (
          <Choices>
            <Choice selected={scope === null} onClick={() => onChange({ scope: null })}>
              Monde entier
            </Choice>
            {CONTINENTS.map((continent) => (
              <Choice
                key={continent}
                selected={scope === continent}
                onClick={() => onChange({ scope: continent })}
              >
                {continent}
              </Choice>
            ))}
          </Choices>
        ) : (
          <Chosen values={[scope ?? 'Monde entier']} />
        )}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Manches">
          {isHost ? (
            <Choices>
              {ROUND_COUNTS.map((count) => (
                <Choice
                  key={count}
                  selected={roundCount === count}
                  onClick={() => onChange({ roundCount: count })}
                >
                  {count}
                </Choice>
              ))}
            </Choices>
          ) : (
            <Chosen values={[String(roundCount)]} />
          )}
        </Field>

        <Field label="Durée d'une manche">
          {isHost ? (
            <Choices>
              {DURATIONS.map((ms) => (
                <Choice
                  key={ms}
                  selected={roundDuration === ms}
                  onClick={() => onChange({ roundDuration: ms })}
                >
                  {ms / 1000} s
                </Choice>
              ))}
            </Choices>
          ) : (
            <Chosen values={[`${roundDuration / 1000} s`]} />
          )}
        </Field>
      </div>

      <Perforation />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1.5 text-sm">
          <p className="font-medium text-ink">
            {modes.map((m) => MODES[m].label).join(' + ')} · {scope ?? 'Monde entier'} ·{' '}
            {Math.min(roundCount, pool)} manches
          </p>
          <p className="flex flex-wrap items-center gap-2 text-ink-soft">
            Vivier <Chip tone="teal">{pool} pays</Chip>
            {modes.some((m) => MODES[m].needsMap) && (
              <span className="text-xs">les manches carte se limitent aux {mapped} pays tracés</span>
            )}
          </p>
        </div>

        {isHost ? (
          <Button size="lg" onClick={onStart} disabled={pool === 0 || starting}>
            <Icon name="plane" />
            {starting ? 'Décollage…' : 'Lancer la partie'}
          </Button>
        ) : (
          <p className="font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">
            En attente de l&apos;hôte…
          </p>
        )}
      </div>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="space-y-2">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  )
}

function Choices({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>
}

/** A toggle: pressed when part of the plan. */
function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      size="sm"
      variant={selected ? 'primary' : 'outline'}
      aria-pressed={selected}
      onClick={onClick}
    >
      {selected && <Icon name="check" className="size-3.5" />}
      {children}
    </Button>
  )
}

/** The host's choices, as a guest reads them: nothing to press. */
function Chosen({ values }: { values: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {values.map((value) => (
        <li key={value}>
          <Chip tone="navy" className="px-2.5 py-1 text-xs">
            {value}
          </Chip>
        </li>
      ))}
    </ul>
  )
}
