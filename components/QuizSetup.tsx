'use client'

import type { ReactNode } from 'react'
import { Button, Chip, Eyebrow, Icon, Perforation, Sheet } from '@/components/ui'
import { CONTINENTS } from '@/data/countries'
import { cn } from '@/lib/utils'
import {
  MODES,
  QUESTION_COUNTS,
  countriesIn,
  type Mode,
  type QuestionCount,
  type Scope,
} from '@/lib/quiz'

type QuizSetupProps = {
  mode: Mode
  scope: Scope
  count: QuestionCount
  /** Meilleur score du réglage en pourcentage ; `null` s'il n'y en a pas, `undefined` pendant le chargement du passeport. */
  bestScore: number | null | undefined
  onModeChange: (mode: Mode) => void
  onScopeChange: (scope: Scope) => void
  onCountChange: (count: QuestionCount) => void
  onStart: () => void
}

const MODE_LIST = Object.keys(MODES) as Mode[]

/**
 * Le réglage d'une partie solo, présenté comme un guichet : on choisit son
 * billet (le mode), sa destination (le périmètre) et le nombre d'escales.
 *
 * Chaque choix est un vrai groupe de boutons radio : les flèches du clavier
 * passent d'une option à l'autre, comme partout ailleurs.
 */
export function QuizSetup({
  mode,
  scope,
  count,
  bestScore,
  onModeChange,
  onScopeChange,
  onCountChange,
  onStart,
}: QuizSetupProps) {
  const available = countriesIn(scope, mode).length
  const asked = count === null ? available : Math.min(count, available)
  // Les modes carte laissent de côté les micro-États sans géométrie.
  const excluded = countriesIn(scope).length - available

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="min-w-0 space-y-7">
        <fieldset className="space-y-3">
          <legend className="mb-3">
            <Eyebrow>Mode · ton billet</Eyebrow>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODE_LIST.map((value, position) => (
              <ModeTicket
                key={value}
                mode={value}
                number={position + 1}
                selected={mode === value}
                onSelect={() => onModeChange(value)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3">
            <Eyebrow>Périmètre · ta destination</Eyebrow>
          </legend>
          <div className="flex flex-wrap gap-2">
            <Choice
              name="scope"
              checked={scope === null}
              onChange={() => onScopeChange(null)}
            >
              <Icon name="globe" />
              Monde entier
            </Choice>
            {CONTINENTS.map((continent) => (
              <Choice
                key={continent}
                name="scope"
                checked={scope === continent}
                onChange={() => onScopeChange(continent)}
              >
                {continent}
              </Choice>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3">
            <Eyebrow>Nombre de questions · tes escales</Eyebrow>
          </legend>
          <div className="flex flex-wrap gap-2">
            {QUESTION_COUNTS.map((value) => (
              <Choice
                key={String(value)}
                name="count"
                checked={count === value}
                disabled={value !== null && value > available}
                onChange={() => onCountChange(value)}
              >
                {value === null ? `Tous (${available})` : value}
              </Choice>
            ))}
          </div>
        </fieldset>
      </div>

      <Sheet aria-label="Ton itinéraire" className="overflow-hidden lg:sticky lg:top-6">
        <div className="space-y-1 bg-navy px-5 py-4 text-sheet">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase opacity-75">
            Carte d&apos;embarquement · solo
          </p>
          <p className="font-display text-3xl leading-tight">{MODES[mode].label}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4">
          <Field label="Destination">{scope ?? 'Monde entier'}</Field>
          <Field label="Escales">
            {asked} question{asked > 1 ? 's' : ''}
          </Field>
          <div className="col-span-2 space-y-1">
            <dt>
              <Eyebrow className="text-[11px]">Meilleur score</Eyebrow>
            </dt>
            <dd className="text-sm text-ink-soft">
              {bestScore === undefined ? (
                'Ouverture du carnet…'
              ) : bestScore === null ? (
                'Aucun score enregistré pour ce réglage.'
              ) : (
                <Chip tone="teal" className="text-sm">
                  {bestScore} %
                </Chip>
              )}
            </dd>
          </div>
        </dl>

        {excluded > 0 && (
          <p className="px-5 pb-3 text-xs text-ink-soft">
            {excluded} micro-État{excluded > 1 ? 's' : ''} sans tracé sur la carte
            {excluded > 1 ? ' sont écartés' : ' est écarté'} de ce mode.
          </p>
        )}

        <Perforation className="mx-5" />

        <div className="px-5 py-4">
          <Button size="lg" className="w-full justify-center" onClick={onStart} disabled={asked === 0}>
            <Icon name="plane" />
            Embarquer
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

/** Un billet : un talon numéroté, perforé, et le mode qu'il ouvre. */
function ModeTicket({
  mode,
  number,
  selected,
  onSelect,
}: {
  mode: Mode
  number: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer overflow-hidden rounded-md border-2 bg-sheet transition',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy',
        selected
          ? 'border-navy shadow-[0_3px_0_var(--navy-deep)]'
          : 'border-transparent shadow-[0_1px_0_#d8cbae] hover:border-rule',
      )}
    >
      <input
        type="radio"
        name="mode"
        value={mode}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'rule-dashed flex w-12 shrink-0 items-center justify-center border-r-2 font-mono text-xs font-semibold tracking-[0.12em] [writing-mode:vertical-rl]',
          selected ? 'bg-navy text-sheet' : 'bg-paper-deep/60 text-ink-soft',
        )}
      >
        N° {String(number).padStart(2, '0')}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display text-xl text-ink">{MODES[mode].label}</span>
          {selected && <Icon name="check" className="text-navy" />}
        </span>
        <span className="text-sm text-ink-soft">{MODES[mode].description}</span>
      </span>
    </label>
  )
}

/** Une option d'un groupe radio, dessinée comme une étiquette à cocher. */
function Choice({
  name,
  checked,
  disabled,
  onChange,
  children,
}: {
  name: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
  children: ReactNode
}) {
  return (
    <label
      className={cn(
        'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[4px] border-2 px-3 font-mono text-xs font-semibold tracking-[0.1em] uppercase transition',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy',
        checked ? 'border-navy bg-navy text-sheet' : 'border-rule text-ink-soft hover:border-navy hover:text-navy',
        disabled && 'pointer-events-none opacity-45',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt>
        <Eyebrow className="text-[11px]">{label}</Eyebrow>
      </dt>
      <dd className="font-display text-xl text-ink">{children}</dd>
    </div>
  )
}
