'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthButton } from '@/components/AuthButton'
import { usePassport } from '@/components/Passport'
import { Icon, Meter } from '@/components/ui'
import { useToday } from '@/components/clock'
import { levelProgress, liveStreak } from '@/lib/progress'

/** Every page a player can go to, in the order the home page offers them. */
const LINKS = [
  { href: '/solo', label: 'Solo' },
  { href: '/defi', label: 'Défi du jour' },
  { href: '/salon', label: 'Salon' },
  { href: '/carnet', label: 'Carnet' },
]

/**
 * The bar on every page: the title, each destination, the passport at a
 * glance, and the account.
 *
 * On a phone the links take a row of their own under the title, scrolling
 * sideways if they must, rather than wrapping into a stack that pushes the
 * question down.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="rule-dashed flex flex-wrap items-center gap-x-8 gap-y-2 border-b-2 px-4 py-3 sm:px-8">
      <Link href="/" className="font-display text-3xl text-navy">
        Géo Quiz
      </Link>
      <nav
        aria-label="Destinations"
        className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 [scrollbar-width:none] md:order-none md:mx-0 md:w-auto md:overflow-visible md:px-0"
      >
        <ul className="flex gap-5 py-1 font-mono text-[13px] font-semibold tracking-[0.1em] uppercase">
          {LINKS.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'whitespace-nowrap text-navy underline decoration-2 underline-offset-[7px]'
                      : 'whitespace-nowrap text-ink-soft transition hover:text-ink'
                  }
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="ml-auto flex items-center gap-5">
        <PassportGlance />
        <AuthButton />
      </div>
    </header>
  )
}

/** Grade, miles towards the next level, and the Daily streak. */
function PassportGlance() {
  const { progress } = usePassport()
  const today = useToday()
  if (!progress) return null

  const { level, grade, into, span } = levelProgress(progress.miles)
  const streak = today ? liveStreak(progress, today) : 0

  return (
    <Link href="/carnet" className="hidden items-center gap-4 sm:flex" aria-label="Mon carnet">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
          Niv. {level} · <span className="font-semibold text-ink">{grade}</span>
        </p>
        <Meter value={into / span} tone="gold" className="w-36" label={`${into} miles sur ${span} avant le niveau suivant`} />
      </div>
      {streak > 0 && (
        <span className="flex items-center gap-1 font-mono text-sm font-semibold text-stamp" title={`${streak} jours d'affilée`}>
          <Icon name="flame" />
          {streak}
        </span>
      )}
    </Link>
  )
}
