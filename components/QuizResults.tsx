'use client'

import Link from 'next/link'
import { Flag } from '@/components/Flag'
import type { Played } from '@/components/QuizGame'
import { Button, Chip, Eyebrow, Icon, Perforation, Sheet, StampMark, buttonClass } from '@/components/ui'
import { cn } from '@/lib/utils'
import { dailyBonus, gradeFor, type Earned } from '@/lib/progress'
import { MODES, countryByCode, expectedFor, type Mode } from '@/lib/quiz'

/** Au-delà, les nouveaux tampons se résument à un compte : la page reste lisible. */
const VISIBLE_STAMPS = 12

type QuizResultsProps = {
  answers: Played[]
  /**
   * Ce que la partie a rapporté au passeport : `undefined` tant que
   * l'enregistrement est en cours, `null` s'il a échoué — le résultat s'affiche
   * alors sans.
   */
  earned: Earned | null | undefined
} & (
  | {
      kind: 'solo'
      onRetryMistakes: () => void
      onReplay: () => void
      onBackToSetup: () => void
    }
  | { kind: 'daily' }
)

export function QuizResults(props: QuizResultsProps) {
  const { answers, earned } = props
  const correct = answers.filter((a) => a.verdict.status !== 'wrong')
  const mistakes = answers.filter((a) => a.verdict.status === 'wrong')
  const percent = answers.length ? Math.round((correct.length / answers.length) * 100) : 0
  const points = answers.reduce((sum, a) => sum + a.points, 0)
  // Le défi mélange les modes : chaque ligne du récapitulatif dit le sien.
  const mixed = new Set(answers.map((a) => a.mode)).size > 1

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Sheet className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
          <div className="min-w-0 space-y-2">
            <Eyebrow>{props.kind === 'daily' ? 'Défi du jour · arrivée' : 'Arrivée à destination'}</Eyebrow>
            <h2 className="text-4xl text-ink sm:text-5xl">{verdictHeadline(percent)}</h2>
            <p className="font-mono text-sm tracking-[0.06em] text-ink-soft">
              {correct.length} / {answers.length} — soit {percent} %
            </p>
          </div>
          <StampMark
            animate
            tone={percent >= 60 ? 'teal' : 'stamp'}
            tilt={-10}
            className="size-28 shrink-0 flex-col gap-1"
          >
            <span className="text-[10px]">Points</span>
            <span className="font-display text-2xl leading-none normal-case tracking-normal">
              {points.toLocaleString('fr-FR')}
            </span>
          </StampMark>
        </div>

        <Perforation />

        {/* Une région vivante stable : le carnet répond après coup, et ce qu'il
            a tamponné doit être annoncé quand il arrive. */}
        <div aria-live="polite">
          <EarnedSection earned={earned} kind={props.kind} />
        </div>

        <div className="flex flex-wrap gap-2 px-5 pb-6 sm:px-8">
          {props.kind === 'solo' ? (
            <>
              {mistakes.length > 0 && (
                <Button size="lg" onClick={props.onRetryMistakes}>
                  <Icon name="retry" />
                  {mistakes.length > 1 ? `Rejouer mes ${mistakes.length} erreurs` : 'Rejouer mon erreur'}
                </Button>
              )}
              <Button
                size="lg"
                variant={mistakes.length > 0 ? 'outline' : 'primary'}
                onClick={props.onReplay}
              >
                Nouvelle partie
              </Button>
              <Button size="lg" variant="ghost" onClick={props.onBackToSetup}>
                Changer de réglages
              </Button>
            </>
          ) : (
            <>
              <Link href="/carnet" className={buttonClass('primary', 'lg')}>
                <Icon name="stamp" />
                Ouvrir mon carnet
              </Link>
              <Link href="/" className={buttonClass('ghost', 'lg')}>
                <Icon name="back" />
                Retour à l&apos;accueil
              </Link>
            </>
          )}
        </div>
      </Sheet>

      <Sheet>
        <div className="px-5 pt-5 pb-2 sm:px-8">
          <Eyebrow>Carnet de route</Eyebrow>
        </div>
        <ul className="pb-2">
          {answers.map((answer, position) => (
            <li
              key={answer.country.code}
              className={cn(position > 0 && 'rule-dashed border-t')}
            >
              <AnswerRow answer={answer} showMode={mixed} />
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  )
}

/** Ce que la partie a versé au passeport : miles, record, niveau, tampons, jours d'affilée. */
function EarnedSection({ earned, kind }: { earned: Earned | null | undefined; kind: 'solo' | 'daily' }) {
  if (earned === null) return <div className="pt-5" />

  if (earned === undefined) {
    return (
      <p className="px-5 py-5 font-mono text-xs tracking-[0.1em] text-ink-soft uppercase sm:px-8">
        Tamponnage du carnet…
      </p>
    )
  }

  if (!earned.counted) {
    return (
      <p className="px-5 py-5 text-sm text-ink-soft sm:px-8">
        {kind === 'daily'
          ? 'Le défi du jour était déjà au carnet : cette partie ne compte pas une seconde fois.'
          : 'Cette partie n’a rien ajouté au carnet.'}
      </p>
    )
  }

  const levelUp = earned.levelAfter > earned.levelBefore
  const gradeBefore = gradeFor(earned.levelBefore)
  const gradeAfter = gradeFor(earned.levelAfter)
  const shown = earned.stamps.slice(0, VISIBLE_STAMPS)
  const hidden = earned.stamps.length - shown.length

  return (
    <div className="space-y-5 px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <div className="space-y-1">
          <Eyebrow className="text-[11px]">Miles gagnés</Eyebrow>
          <p className="font-display text-4xl leading-none text-navy tabular-nums">
            +{earned.miles.toLocaleString('fr-FR')}
          </p>
        </div>

        {kind === 'daily' && earned.streak > 0 && (
          <div className="space-y-1">
            <Eyebrow className="text-[11px]">Jours d&apos;affilée</Eyebrow>
            <p className="flex items-center gap-1.5 font-mono text-sm font-semibold text-stamp">
              <Icon name="flame" />
              {earned.streak} jour{earned.streak > 1 ? 's' : ''}
              <span className="font-medium text-ink-soft">
                · miles ×{String(dailyBonus(earned.streak)).replace('.', ',')}
              </span>
            </p>
          </div>
        )}

        {earned.newBest && (
          <StampMark animate tone="gold" shape="square" tilt={-6} className="px-3 py-2 text-xs">
            Nouveau record
          </StampMark>
        )}
      </div>

      {levelUp && (
        <div className="slide-in flex flex-wrap items-center gap-3 rounded-md bg-navy px-4 py-3 text-sheet">
          <Icon name="plane" className="size-5 text-gold" />
          <p className="font-mono text-xs tracking-[0.1em] uppercase">
            Niveau {earned.levelBefore} → <span className="font-semibold text-gold">{earned.levelAfter}</span>
          </p>
          <p className="font-display text-xl">
            {gradeAfter !== gradeBefore ? `Nouveau grade : ${gradeAfter}` : gradeAfter}
          </p>
        </div>
      )}

      {earned.stamps.length > 0 && (
        <div className="space-y-3">
          <Eyebrow className="text-[11px]">
            {earned.stamps.length} nouveau{earned.stamps.length > 1 ? 'x' : ''} tampon
            {earned.stamps.length > 1 ? 's' : ''}
          </Eyebrow>
          <ul className="flex flex-wrap items-center gap-3">
            {shown.map((key, position) => (
              <li key={key}>
                <NewStamp stampKey={key} tilt={position % 2 ? 7 : -7} />
              </li>
            ))}
            {hidden > 0 && (
              <li className="font-mono text-xs font-semibold tracking-[0.1em] text-ink-soft uppercase">
                +{hidden} autre{hidden > 1 ? 's' : ''}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Un tampon tout juste gagné : le code du pays, le drapeau en vignette. */
function NewStamp({ stampKey, tilt }: { stampKey: string; tilt: number }) {
  const [mode, code] = stampKey.split(':') as [Mode, string]
  const country = countryByCode(code)
  const label = `${country?.name ?? code} · ${MODES[mode]?.label ?? mode}`

  return (
    <span className="flex items-center gap-1.5" title={label}>
      <StampMark animate tone="teal" tilt={tilt} className="size-12 text-xs">
        {code}
      </StampMark>
      <Flag code={code} className="h-4" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

function context(answer: Played): string {
  if (answer.mode === 'capitals') return answer.country.name
  if (answer.mode === 'countryFromCapital') return answer.country.capital
  return answer.country.continent
}

function AnswerRow({ answer, showMode }: { answer: Played; showMode: boolean }) {
  const wrong = answer.verdict.status === 'wrong'
  const expected = expectedFor(answer.country, answer.mode)

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 sm:px-8">
      <Flag code={answer.country.code} />
      <div className="min-w-0 flex-1">
        {/* La réponse attendue en tête ; en dessous, ce qui la situe. Les deux
            modes de la paire pays/capitale donnent l'autre moitié. Ailleurs
            `expected` est déjà le nom du pays : le répéter en sous-titre
            n'apprendrait rien, le continent si. */}
        <p className="truncate font-medium text-ink">{expected}</p>
        <p className="truncate text-xs text-ink-soft">
          {showMode && <>{MODES[answer.mode].label} · </>}
          {context(answer)}
        </p>
      </div>

      {wrong ? (
        <div className="flex min-w-0 items-center gap-2">
          {answer.input?.trim() ? (
            <Chip tone="stamp" className="max-w-36 gap-1.5 normal-case tracking-normal sm:max-w-44">
              {/* Le drapeau de ce que la réponse désignait, s'il a pu être identifié. */}
              {answer.guess && <Flag code={answer.guess.country.code} className="h-3.5" />}
              <span className="truncate line-through">{answer.input.trim()}</span>
            </Chip>
          ) : (
            <Chip>passé</Chip>
          )}
          <Icon name="cross" className="text-stamp" label="Faux" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {answer.verdict.status === 'close' && <Chip tone="teal">presque</Chip>}
          {answer.points > 0 && (
            <span className="font-mono text-xs text-ink-soft tabular-nums">+{answer.points}</span>
          )}
          <Icon name="check" className="text-teal" label="Juste" />
        </div>
      )}
    </div>
  )
}

function verdictHeadline(percent: number): string {
  if (percent === 100) return 'Sans faute !'
  if (percent >= 80) return 'Très bien'
  if (percent >= 60) return 'Pas mal'
  if (percent >= 40) return 'À retravailler'
  return 'Il y a du chemin'
}
