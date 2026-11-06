'use client'

import Link from 'next/link'
import { useToday } from '@/components/clock'
import { usePassport } from '@/components/Passport'
import { Eyebrow, Icon, Meter, Perforation, Sheet, StampMark, buttonClass } from '@/components/ui'
import { DAILY_LENGTH } from '@/lib/daily'
import { dailyBonus, levelProgress, liveStreak } from '@/lib/progress'

/**
 * The departures board: the Daily, solo play, a salon, and the passport.
 *
 * The day comes from `useToday`, null until hydrated: the server would render
 * another instant than the browser, and the two must agree.
 */
export default function Home() {
  const { progress } = usePassport()
  const today = useToday()

  const streak = progress && today ? liveStreak(progress, today) : 0
  const playedToday = Boolean(progress?.daily && progress.daily.day === today)

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-4 py-10 sm:px-8">
      <section className="space-y-3">
        <Eyebrow>Drapeaux · capitales · carte — 194 pays</Eyebrow>
        <h1 className="max-w-2xl text-5xl leading-[1.05] text-ink sm:text-6xl">
          Remplis ton passeport, un pays à la fois.
        </h1>
        <p className="max-w-xl text-ink-soft">
          Chaque bonne réponse tamponne un pays dans ton carnet. Enchaîne-les pour le combo,
          reviens chaque jour pour le défi, ou affronte tes amis dans un salon.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <DailyTicket today={today} streak={streak} playedToday={playedToday} />

        <div className="grid gap-6">
          <Sheet className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Eyebrow>Vol libre</Eyebrow>
                <h2 className="text-3xl">Solo</h2>
              </div>
              <Icon name="plane" className="size-7 text-navy" />
            </div>
            <p className="text-sm text-ink-soft">
              Un mode, un continent, à ton rythme. Fonctionne même hors ligne.
            </p>
            <Link href="/solo" className={buttonClass('outline', 'md', 'self-start')}>
              Choisir un vol <Icon name="arrow" />
            </Link>
          </Sheet>

          <Sheet className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Eyebrow>Vol de groupe</Eyebrow>
                <h2 className="text-3xl">Salon</h2>
              </div>
              <Icon name="users" className="size-7 text-navy" />
            </div>
            <p className="text-sm text-ink-soft">
              Jusqu&apos;à huit joueurs, les mêmes questions au même instant. Les plus rapides
              marquent le plus.
            </p>
            <Link href="/salon" className={buttonClass('outline', 'md', 'self-start')}>
              Créer ou rejoindre <Icon name="arrow" />
            </Link>
          </Sheet>
        </div>
      </div>

      <PassportSummary />
    </main>
  )
}

/** The Daily as a boarding pass, with its stub. */
function DailyTicket({
  today,
  streak,
  playedToday,
}: {
  today: string | null
  streak: number
  playedToday: boolean
}) {
  const date = today
    ? new Date(`${today}T12:00:00Z`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : ''

  return (
    <article className="relative flex flex-col overflow-hidden rounded-md bg-navy text-sheet shadow-[0_14px_32px_rgb(20_40_71/0.3)] sm:flex-row">
      <div className="flex flex-1 flex-col gap-5 p-7">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs tracking-[0.14em] text-sheet/70 uppercase">
            Carte d&apos;embarquement
          </p>
          <p className="font-mono text-xs tracking-[0.14em] text-gold uppercase">{date}</p>
        </div>
        <h2 className="text-5xl leading-none">Défi du jour</h2>
        <dl className="grid grid-cols-3 gap-4 font-mono text-xs tracking-[0.1em] uppercase">
          <div>
            <dt className="text-sheet/60">Questions</dt>
            <dd className="mt-1 font-display text-2xl tracking-normal normal-case">{DAILY_LENGTH}</dd>
          </div>
          <div>
            <dt className="text-sheet/60">Modes</dt>
            <dd className="mt-1 font-display text-2xl tracking-normal normal-case">Tous</dd>
          </div>
          <div>
            <dt className="text-sheet/60">Bonus</dt>
            <dd className="mt-1 font-display text-2xl tracking-normal normal-case text-gold">
              ×{dailyBonus(streak + (playedToday ? 0 : 1)).toLocaleString('fr-FR')}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-sheet/75">
          Les mêmes dix questions pour tout le monde, une seule fois par jour. Chaque jour
          d&apos;affilée ajoute un dixième aux miles gagnés.
        </p>
        <Link
          href="/defi"
          className={buttonClass('gold', 'lg', 'self-start')}
        >
          {playedToday ? 'Voir mon résultat' : 'Embarquer'} <Icon name="arrow" />
        </Link>
      </div>

      <div className="flex items-center justify-center gap-6 border-t-2 border-dashed border-sheet/25 p-6 sm:w-44 sm:flex-col sm:border-t-0 sm:border-l-2">
        <StampMark tone="bright" className="size-24 text-[11px]" tilt={10}>
          <span className="flex flex-col items-center gap-1">
            <span className="font-display text-4xl tracking-normal">{streak}</span>
            <span>jour{streak > 1 ? 's' : ''}</span>
          </span>
        </StampMark>
        <p className="max-w-28 text-center font-mono text-[11px] tracking-[0.1em] text-sheet/70 uppercase">
          {playedToday ? 'Tamponné aujourd’hui' : streak > 0 ? 'Ne casse pas la série' : 'Commence ta série'}
        </p>
      </div>
    </article>
  )
}

function PassportSummary() {
  const { progress, signedIn } = usePassport()
  if (!progress) return null

  const { level, grade, into, span } = levelProgress(progress.miles)

  return (
    <Sheet className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
      <div className="flex-1 space-y-3">
        <Eyebrow>Mon passeport</Eyebrow>
        <p className="font-display text-3xl">
          Niveau {level} · {grade}
        </p>
        <Meter value={into / span} tone="gold" label="Progression vers le niveau suivant" />
        <p className="font-mono text-xs tracking-[0.08em] text-ink-soft uppercase">
          {progress.miles.toLocaleString('fr-FR')} miles · encore {(span - into).toLocaleString('fr-FR')} avant le niveau {level + 1}
        </p>
      </div>
      <Perforation className="sm:hidden" />
      <div className="flex items-center gap-6 sm:border-l-2 sm:border-dashed sm:border-rule sm:pl-6">
        <div>
          <p className="font-display text-4xl text-stamp">{progress.stamps.length}</p>
          <Eyebrow>Tampons</Eyebrow>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/carnet" className={buttonClass('outline', 'sm')}>
            Ouvrir le carnet
          </Link>
          {!signedIn && (
            <p className="max-w-48 text-xs text-ink-soft">
              Connecte-toi pour retrouver ton carnet sur tous tes appareils.
            </p>
          )}
        </div>
      </div>
    </Sheet>
  )
}
