'use client'

import { useState } from 'react'
import { useToday } from '@/components/clock'
import { Flag } from '@/components/Flag'
import { usePassport } from '@/components/Passport'
import { Chip, Eyebrow, Icon, Meter, Sheet, StampMark } from '@/components/ui'
import { CONTINENTS, type Continent } from '@/data/countries'
import {
  GRADES,
  bestOf,
  levelProgress,
  liveStreak,
  masteryOf,
  stampKey,
  type Medal,
} from '@/lib/progress'
import { MODES, countriesIn, type Mode } from '@/lib/quiz'
import { cn } from '@/lib/utils'

const MODE_LIST = Object.keys(MODES) as Mode[]

const MEDAL_TONE: Record<Medal, 'gold' | 'navy' | 'stamp'> = {
  or: 'gold',
  argent: 'navy',
  bronze: 'stamp',
}

/**
 * The passport, opened: the grade, the streak, and for each mode the countries
 * stamped on each continent, with the medal each continent earns.
 */
export default function Carnet() {
  const { progress, signedIn } = usePassport()
  const [mode, setMode] = useState<Mode>('flags')
  const [continent, setContinent] = useState<Continent>('Europe')
  const today = useToday()

  if (!progress) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
        <Eyebrow>Ouverture du carnet…</Eyebrow>
      </main>
    )
  }

  const { level, grade, into, span } = levelProgress(progress.miles)
  const streak = today ? liveStreak(progress, today) : 0
  const owned = new Set(progress.stamps)
  const nextGrade = GRADES.find((g) => g.from > level)

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10 sm:px-8">
      <header className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Eyebrow>Carnet de voyage</Eyebrow>
          <h1 className="text-5xl">
            {grade}, niveau {level}
          </h1>
          <div className="max-w-md space-y-1.5">
            <Meter value={into / span} tone="gold" label="Progression vers le niveau suivant" />
            <p className="font-mono text-xs tracking-[0.08em] text-ink-soft uppercase">
              {progress.miles.toLocaleString('fr-FR')} miles
              {nextGrade && ` · ${nextGrade.name} au niveau ${nextGrade.from}`}
            </p>
          </div>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">Tampons</dt>
            <dd className="font-display text-4xl text-stamp">{progress.stamps.length}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs tracking-[0.1em] text-ink-soft uppercase">Jours d&apos;affilée</dt>
            <dd className="flex items-center gap-1 font-display text-4xl text-navy">
              <Icon name="flame" className="size-6 text-stamp" />
              {streak}
            </dd>
          </div>
        </dl>
      </header>

      {!signedIn && (
        <p className="text-sm text-ink-soft">
          Ce carnet vit dans ce navigateur. Connecte-toi avec Google pour le garder sur tous tes
          appareils : il sera fusionné avec ton compte.
        </p>
      )}

      <div role="tablist" aria-label="Mode" className="flex flex-wrap gap-2">
        {MODE_LIST.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={m === mode}
            onClick={() => setMode(m)}
            className={cn(
              'rounded-[4px] px-3 py-2 font-mono text-xs font-semibold tracking-[0.1em] uppercase transition',
              m === mode ? 'bg-navy text-sheet' : 'bg-ink/[0.06] text-ink-soft hover:text-ink',
            )}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <section aria-label={`Maîtrise par continent — ${MODES[mode].label}`} className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {CONTINENTS.map((c) => {
          const mastery = masteryOf(progress.stamps, mode, c)
          const best = bestOf(progress, mode, c)
          return (
            <button
              key={c}
              type="button"
              onClick={() => setContinent(c)}
              aria-pressed={c === continent}
              className={cn(
                'relative flex flex-col gap-3 rounded-md bg-sheet p-4 text-left shadow-[0_1px_0_#d8cbae] transition',
                c === continent ? 'ring-2 ring-navy' : 'hover:shadow-[0_1px_0_#d8cbae,0_8px_20px_rgb(60_40_10/0.1)]',
              )}
            >
              <span className="font-display text-xl">{c}</span>
              <Meter
                value={mastery.total ? mastery.stamped / mastery.total : 0}
                tone="teal"
                label={`${mastery.stamped} pays sur ${mastery.total}`}
              />
              <span className="flex items-center justify-between font-mono text-xs text-ink-soft">
                <span>
                  {mastery.stamped} / {mastery.total}
                </span>
                {best !== null && <span>record {best} %</span>}
              </span>
              {mastery.medal && (
                <StampMark
                  tone={MEDAL_TONE[mastery.medal]}
                  className="absolute -top-2 -right-2 size-14 bg-sheet text-[10px]"
                  tilt={12}
                  title={`Médaille ${mastery.medal}`}
                >
                  {mastery.medal}
                </StampMark>
              )}
            </button>
          )
        })}
      </section>

      <Sheet className="space-y-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-3xl">{continent}</h2>
          <Chip>{MODES[mode].label}</Chip>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-4">
          {countriesIn(continent, mode).map((country, index) => {
            const stamped = owned.has(stampKey(mode, country.code))
            return (
              <li key={country.code} className="flex flex-col items-center gap-1.5 text-center">
                {stamped ? (
                  <StampMark
                    tone={index % 3 === 0 ? 'teal' : index % 3 === 1 ? 'stamp' : 'navy'}
                    shape={index % 2 ? 'square' : 'round'}
                    tilt={((index * 37) % 21) - 10}
                    className="size-16 text-sm"
                    title={country.name}
                  >
                    {country.code}
                  </StampMark>
                ) : (
                  <StampMark tone="faded" tilt={0} className="size-16 text-sm" title={`${country.name} — pas encore tamponné`}>
                    ?
                  </StampMark>
                )}
                <span className={cn('flex items-center gap-1 text-xs', stamped ? 'text-ink' : 'text-ink-soft/70')}>
                  {stamped && <Flag code={country.code} className="h-3" />}
                  <span className="line-clamp-1">{stamped ? country.name : '—'}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </Sheet>
    </main>
  )
}
