import { Chip, Icon, StampMark } from '@/components/ui'
import { cn } from '@/lib/utils'
import { MAX_PLAYERS } from '@/lib/room'
import { PlayerDot, type RoomView } from '@/components/room/common'

/**
 * The room's players, as a passenger list ordered by points.
 *
 * During a round we show *who* answered, never *what*: the server does not even
 * send the inputs before the round closes.
 */
export function Standings({ view, className }: { view: RoomView; className?: string }) {
  const byToken = new Map(view.players.map((p) => [p.token, p]))
  const inRound = Boolean(view.game?.round)

  return (
    <section aria-labelledby="passengers" className={cn('space-y-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="passengers" className="font-mono text-xs font-medium tracking-[0.12em] text-ink-soft uppercase">
          Passagers
        </h2>
        <p className="font-mono text-xs text-ink-soft tabular-nums">
          {view.players.length} / {MAX_PLAYERS}
        </p>
      </div>

      <ol className="divide-y-2 divide-dashed divide-rule/70">
        {view.standings.map((standing, index) => {
          const player = byToken.get(standing.token)
          const isMe = standing.token === view.me
          const away = player && !player.connected

          return (
            <li
              key={standing.token}
              className={cn(
                'flex min-h-12 items-center gap-3 px-2 py-2 text-sm',
                isMe && 'rounded-sm bg-navy/[0.06]',
              )}
            >
              <span className="w-5 shrink-0 text-right font-mono text-xs text-ink-soft tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span
                className={cn(
                  'flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1',
                  // Faded rather than removed: they keep their seat and score, and
                  // come back as soon as their page checks in again.
                  away && 'opacity-50',
                )}
              >
                {player && <PlayerDot colour={player.colour} />}
                <span className={cn('min-w-0 truncate', isMe ? 'font-semibold text-ink' : 'text-ink')}>
                  {standing.name}
                </span>
                {isMe && <Chip>toi</Chip>}
                {player?.isHost && (
                  <Chip tone="navy">
                    <Icon name="crown" className="size-3" />
                    Hôte
                  </Chip>
                )}
                {away && <Chip>absent</Chip>}
                {player?.connected && !player.inPlay && <Chip>à la manche suivante</Chip>}
                {standing.joinedMidGame && player?.inPlay && <Chip>arrivé en cours</Chip>}
              </span>

              {inRound && player?.hasAnswered && (
                <StampMark tone="teal" shape="square" tilt={-6} animate className="shrink-0 px-1.5 py-1 text-[10px]">
                  a répondu
                </StampMark>
              )}
              {inRound && player && !player.hasAnswered && player.inPlay && player.connected && (
                <span className="flex shrink-0 items-center gap-1" title="réfléchit encore">
                  <span className="size-1.5 animate-pulse rounded-full bg-ink-soft" />
                  <span className="sr-only">réfléchit encore</span>
                </span>
              )}

              <span className="w-14 shrink-0 text-right font-mono font-semibold text-ink tabular-nums">
                {standing.points}
                <span className="sr-only"> points</span>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
