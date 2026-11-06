'use client'

import Link from 'next/link'
import { useRef, useState, type ReactNode } from 'react'
import { useClock, useToday } from '@/components/clock'
import { usePassport } from '@/components/Passport'
import { QuizGame, type FinishedGame, type Played, type Stop } from '@/components/QuizGame'
import { QuizResults } from '@/components/QuizResults'
import { Button, Eyebrow, Icon, Perforation, Sheet, StampMark, buttonClass } from '@/components/ui'
import { DAILY_LENGTH, dailyQuestions } from '@/lib/daily'
import { dailyBonus, dayOf, liveStreak, type DailyResult, type Earned } from '@/lib/progress'
import { MODES } from '@/lib/quiz'

type Screen =
  | { name: 'intro' }
  /** Le jour est figé au départ : une partie entamée avant minuit reste celle de son jour. */
  | { name: 'playing'; day: string; stops: Stop[]; round: number }
  | { name: 'results'; answers: Played[]; earned: Earned | null | undefined; round: number }

/**
 * Le défi du jour : dix questions, les mêmes pour tout le monde, tous modes
 * confondus, sur le monde entier. Il ne compte qu'une fois par jour ; une fois
 * joué, la page montre son résultat jusqu'au suivant.
 */
export default function DailyPage() {
  const { progress, record } = usePassport()
  const today = useToday()
  const [screen, setScreen] = useState<Screen>({ name: 'intro' })
  const round = useRef(0)

  function start(day: string) {
    const stops = dailyQuestions(day)
    if (stops.length === 0) return
    setScreen({ name: 'playing', day, stops, round: ++round.current })
  }

  function finish(game: FinishedGame, day: string, finished: number) {
    setScreen({ name: 'results', answers: game.answered, earned: undefined, round: finished })
    const settle = (earned: Earned | null) =>
      setScreen((current) =>
        current.name === 'results' && current.round === finished ? { ...current, earned } : current,
      )
    record({ kind: 'daily', day, answers: game.recorded }).then(settle, () => settle(null))
  }

  let content
  if (screen.name === 'playing') {
    const { day, round: playing } = screen
    content = (
      <>
        <h1 className="sr-only">Défi du jour</h1>
        <QuizGame
          key={playing}
          stops={screen.stops}
          scope={null}
          onFinish={(game) => finish(game, day, playing)}
          onQuit={() => setScreen({ name: 'intro' })}
        />
      </>
    )
  } else if (screen.name === 'results') {
    content = (
      <>
        <h1 className="sr-only">Résultat du défi du jour</h1>
        <QuizResults kind="daily" answers={screen.answers} earned={screen.earned} />
      </>
    )
  } else if (today === null || progress === null) {
    content = (
      <Sheet className="mx-auto max-w-xl px-6 py-10 text-center">
        <h1 className="sr-only">Défi du jour</h1>
        <p className="font-mono text-xs tracking-[0.12em] text-ink-soft uppercase" role="status">
          Impression de la carte d&apos;embarquement…
        </p>
      </Sheet>
    )
  } else if (progress.daily?.day === today) {
    content = <Done result={progress.daily} streak={liveStreak(progress, today)} />
  } else {
    // Le défi d'aujourd'hui ajoute un jour d'affilée si hier a été joué, sinon il en ouvre un premier.
    const streak = liveStreak(progress, today) + 1
    content = <BoardingPass day={today} streak={streak} onStart={() => start(today)} />
  }

  return <main className="w-full flex-1 px-4 py-8 sm:px-8 sm:py-10">{content}</main>
}

/** La carte d'embarquement du jour : ce qui attend le joueur avant qu'il parte. */
function BoardingPass({ day, streak, onStart }: { day: string; streak: number; onStart: () => void }) {
  const bonus = dailyBonus(streak)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <Eyebrow>Défi du jour</Eyebrow>
        <h1 className="text-4xl text-ink sm:text-5xl">Le vol du jour est à l&apos;heure</h1>
        <p className="text-ink-soft">
          Les mêmes questions pour tout le monde, et une seule partie au carnet par jour. Rendez-vous demain pour le suivant.
        </p>
      </header>

      <Sheet className="overflow-hidden sm:flex">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 bg-navy px-5 py-3 text-sheet sm:px-7">
            <p className="font-mono text-xs tracking-[0.14em] uppercase">Carte d&apos;embarquement</p>
            <Icon name="plane" className="size-5 text-gold" />
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 sm:px-7">
            <PassField label="Date" wide>
              <span className="first-letter:uppercase">{formatDay(day)}</span>
            </PassField>
            <PassField label="Escales">{DAILY_LENGTH} questions</PassField>
            <PassField label="Destination">Monde entier</PassField>
            <PassField label="Modes" wide>
              <span className="text-base leading-snug">
                Tous : {Object.values(MODES).map((m) => m.label.toLowerCase()).join(', ')}
              </span>
            </PassField>
          </dl>
        </div>

        {/* Le talon détachable : le bonus de régularité et le départ. */}
        <div className="rule-dashed flex flex-col items-center justify-center gap-4 border-t-2 px-5 py-5 sm:w-56 sm:border-t-0 sm:border-l-2">
          <StampMark tone="stamp" tilt={-10} className="size-24 flex-col gap-1">
            <span className="text-[9px]">Bonus</span>
            <span className="font-display text-2xl leading-none normal-case tracking-normal">
              ×{formatNumber(bonus)}
            </span>
            <span className="text-[9px]">miles</span>
          </StampMark>
          <p className="text-center text-sm text-ink-soft">
            {streak > 1
              ? `${streak}e jour d'affilée : chaque jour ajoute un dixième, jusqu'au double.`
              : 'Joue chaque jour : chaque jour d’affilée ajoute un dixième aux miles, jusqu’au double.'}
          </p>
          <Button size="lg" variant="stamp" className="w-full justify-center" onClick={onStart}>
            <Icon name="plane" />
            Embarquer
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

/** Le défi est déjà au carnet : son résultat, les jours d'affilée et l'attente du suivant. */
function Done({ result, streak }: { result: DailyResult; streak: number }) {
  const percent = result.total ? Math.round((result.correct / result.total) * 100) : 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <Eyebrow>Défi du jour</Eyebrow>
        <h1 className="text-4xl text-ink sm:text-5xl">Défi du jour tamponné</h1>
        <p className="text-ink-soft">Le prochain vol décolle à minuit (UTC). En attendant, le solo t&apos;attend.</p>
      </header>

      <Sheet className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <PassField label="Bonnes réponses">
              {result.correct} / {result.total}
              <span className="ml-2 font-mono text-sm text-ink-soft">{percent} %</span>
            </PassField>
            <PassField label="Points">{result.points.toLocaleString('fr-FR')}</PassField>
            <PassField label="Jours d'affilée" wide>
              <span className="flex items-center gap-1.5 text-stamp">
                <Icon name="flame" className="size-5" />
                {streak} jour{streak > 1 ? 's' : ''}
              </span>
            </PassField>
          </dl>
          <StampMark tone="teal" tilt={-12} className="size-24 flex-col gap-1">
            <span className="text-[9px]">Défi</span>
            <span className="text-sm">Joué</span>
          </StampMark>
        </div>

        <Perforation />

        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Countdown />
          <div className="flex flex-wrap gap-2">
            <Link href="/solo" className={buttonClass('primary', 'md')}>
              Jouer en solo
            </Link>
            <Link href="/carnet" className={buttonClass('outline', 'md')}>
              Mon carnet
            </Link>
          </div>
        </div>
      </Sheet>
    </div>
  )
}

/** Le temps qui reste avant le prochain défi, à minuit UTC pour tout le monde. */
function Countdown() {
  const now = useClock(1000)
  if (now === null) return null

  const midnight = Date.parse(`${dayOf(now)}T00:00:00Z`) + 86_400_000
  const left = Math.max(0, Math.floor((midnight - now) / 1000))
  const hours = Math.floor(left / 3600)
  const minutes = Math.floor((left % 3600) / 60)
  const seconds = left % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="space-y-1">
      <Eyebrow className="text-[11px]">Prochain défi dans</Eyebrow>
      <p className="font-display text-3xl leading-none text-navy tabular-nums">
        <time dateTime={`PT${hours}H${minutes}M${seconds}S`}>
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </time>
      </p>
    </div>
  )
}

function PassField({
  label,
  wide,
  children,
}: {
  label: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={wide ? 'col-span-2 space-y-1' : 'space-y-1'}>
      <dt>
        <Eyebrow className="text-[11px]">{label}</Eyebrow>
      </dt>
      <dd className="font-display text-xl text-ink">{children}</dd>
    </div>
  )
}

/** « vendredi 6 novembre 2026 », lu dans le fuseau du défi : UTC. */
function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatNumber(value: number): string {
  return String(value).replace('.', ',')
}
