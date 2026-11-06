import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The passport's few building blocks. Plain Tailwind, as in pokefight: no
 * component library, so every screen is drawn from these and the tokens in
 * app/globals.css.
 */

type Variant = 'primary' | 'stamp' | 'gold' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-navy text-sheet shadow-[0_3px_0_var(--navy-deep)] hover:bg-navy-deep',
  stamp: 'bg-stamp text-sheet shadow-[0_3px_0_var(--stamp-deep)] hover:bg-stamp-deep',
  /** On the navy of a boarding pass, where a navy button would vanish. */
  gold: 'bg-gold text-navy-deep shadow-[0_3px_0_#b8860b] hover:bg-[#f5cd6b]',
  outline: 'border-2 border-navy text-navy hover:bg-navy/5',
  ghost: 'text-ink-soft hover:bg-ink/5 hover:text-ink',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-sm',
  icon: 'size-9 justify-center',
}

/** The classes of a button, for a link that must look like one. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center gap-2 rounded-[4px] font-mono font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition active:translate-y-px disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}

/** A page of the notebook: the card everything sits on. */
export function Sheet({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-md bg-sheet shadow-[0_1px_0_#d8cbae,0_14px_32px_rgb(60_40_10/0.12)]',
        className,
      )}
      {...props}
    />
  )
}

/** The typewritten label over a field or a figure. */
export function Eyebrow({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase', className)}
      {...props}
    />
  )
}

/** A line to write on, as on a form. */
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-12 w-full min-w-0 border-0 border-b-[3px] border-navy bg-transparent px-1 font-display text-2xl text-ink outline-none placeholder:text-ink-soft/60 focus-visible:border-stamp disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export function Meter({
  value,
  className,
  tone = 'navy',
  label,
}: {
  /** Between 0 and 1. */
  value: number
  className?: string
  tone?: 'navy' | 'teal' | 'gold' | 'stamp'
  label: string
}) {
  const fill = { navy: 'bg-navy', teal: 'bg-teal', gold: 'bg-gold', stamp: 'bg-stamp' }[tone]
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn('h-2 overflow-hidden rounded-full bg-ink/10', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', fill)}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  )
}

const STAMP_TONES = {
  stamp: 'border-stamp text-stamp',
  teal: 'border-teal text-teal',
  navy: 'border-navy text-navy',
  gold: 'border-[#b8860b] text-[#8a6508]',
  /** On the navy of a boarding pass. */
  bright: 'border-gold text-gold',
  faded: 'border-rule border-dashed text-ink-soft/70',
}

/**
 * A rubber stamp: a tilted, inked outline. Round for a country, square for a
 * mode — the shape only varies the page, the text says what it is.
 */
export function StampMark({
  children,
  tone = 'stamp',
  shape = 'round',
  tilt = -8,
  animate = false,
  className,
  title,
}: {
  children: ReactNode
  tone?: keyof typeof STAMP_TONES
  shape?: 'round' | 'square'
  tilt?: number
  animate?: boolean
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      style={{ '--tilt': `${tilt}deg`, rotate: animate ? undefined : `${tilt}deg` } as CSSProperties}
      className={cn(
        'inline-flex items-center justify-center border-[2.5px] text-center font-mono font-semibold uppercase leading-none tracking-[0.08em]',
        shape === 'round' ? 'rounded-full' : 'rounded-[5px]',
        STAMP_TONES[tone],
        animate && 'stamp-in',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A small tag: a mode, a scope, a role. */
export function Chip({
  className,
  tone = 'plain',
  ...props
}: ComponentProps<'span'> & { tone?: 'plain' | 'navy' | 'teal' | 'stamp' }) {
  const tones = {
    plain: 'bg-ink/[0.06] text-ink-soft',
    navy: 'bg-navy text-sheet',
    teal: 'bg-teal/12 text-teal-deep',
    stamp: 'bg-stamp/10 text-stamp-deep',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

/** A dashed separator, as between the stubs of a ticket. */
export function Perforation({ className }: { className?: string }) {
  return <hr className={cn('rule-dashed border-t-2', className)} />
}

/** Small inline icons, stroked like the rest of the ink. Decorative unless labelled. */
export function Icon({
  name,
  className,
  label,
}: {
  name: keyof typeof ICONS
  className?: string
  label?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-4 shrink-0', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {ICONS[name]}
    </svg>
  )
}

const ICONS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  skip: <path d="M5 5l9 7-9 7zM18 5v14" />,
  retry: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />,
  copy: <path d="M9 9h10v10H9zM5 15V5h10" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  frame: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6" />
    </>
  ),
  crown: <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  plane: <path d="M10.5 20l1.5-6-6-2 1-2 6 1 3-6c.5-1 2-1.5 2.5-1s0 2-1 2.5l-3 6 1 6-2 1-2-6-6 1" />,
  stamp: <path d="M9 3h6v6l-1 3h5v4H5v-4h5l-1-3zM5 20h14" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
} as const
