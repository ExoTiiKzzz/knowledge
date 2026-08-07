import { Building2, Flag as FlagIcon, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
  bestScore: number | null
  onModeChange: (mode: Mode) => void
  onScopeChange: (scope: Scope) => void
  onCountChange: (count: QuestionCount) => void
  onStart: () => void
}

const MODE_ICONS = { flags: FlagIcon, capitals: Building2 }

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
  const available = countriesIn(scope).length
  const asked = count === null ? available : Math.min(count, available)

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Label className="text-muted-foreground">Mode</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(MODES) as Mode[]).map((value) => {
            const Icon = MODE_ICONS[value]
            const selected = mode === value
            return (
              <Card
                key={value}
                onClick={() => onModeChange(value)}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onModeChange(value)
                  }
                }}
                className={cn(
                  'cursor-pointer gap-2 py-4 transition-colors outline-none',
                  'hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50',
                  selected && 'border-foreground/40 bg-muted/50',
                )}
              >
                <CardHeader className="gap-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className={cn('size-4', selected ? 'text-foreground' : 'text-muted-foreground')} />
                    {MODES[value].label}
                  </CardTitle>
                  <CardDescription>{MODES[value].description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <Label className="text-muted-foreground">Continent</Label>
        <div className="flex flex-wrap gap-2">
          <ScopeButton label="Tous" selected={scope === null} onClick={() => onScopeChange(null)} />
          {CONTINENTS.map((continent) => (
            <ScopeButton
              key={continent}
              label={continent}
              selected={scope === continent}
              onClick={() => onScopeChange(continent)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label className="text-muted-foreground">Nombre de questions</Label>
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.map((value) => (
            <ScopeButton
              key={String(value)}
              label={value === null ? `Tous (${available})` : String(value)}
              selected={count === value}
              disabled={value !== null && value > available}
              onClick={() => onCountChange(value)}
            />
          ))}
        </div>
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 text-sm">
            <p className="font-medium">
              {MODES[mode].label} · {scope ?? 'Monde entier'} · {asked} question{asked > 1 ? 's' : ''}
            </p>
            <p className="text-muted-foreground">
              {bestScore === null ? (
                'Aucun score enregistré pour ce réglage.'
              ) : (
                <>
                  Meilleur score : <Badge variant="secondary">{bestScore} %</Badge>
                </>
              )}
            </p>
          </div>
          <Button size="lg" onClick={onStart} disabled={asked === 0}>
            <Play data-icon="inline-start" />
            Commencer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ScopeButton({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant={selected ? 'default' : 'outline'}
      size="sm"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
