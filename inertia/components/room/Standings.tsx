import { Check, Crown, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RoomView } from '@/browser/room-client'

/**
 * The room's players, ordered by points.
 *
 * During a round we show *who* answered, never *what*: the server does not even
 * broadcast the inputs before the round closes.
 */
export function Standings({ view }: { view: RoomView }) {
  const byToken = new Map(view.players.map((p) => [p.token, p]))
  const inRound = Boolean(view.game?.round)

  return (
    <ul className="divide-y rounded-lg border">
      {view.standings.map((standing, index) => {
        const player = byToken.get(standing.token)
        const isMe = standing.token === view.me

        return (
          <li
            key={standing.token}
            className={cn('flex items-center gap-3 px-3 py-2 text-sm', isMe && 'bg-muted/50')}
          >
            <span className="w-5 text-center text-xs text-muted-foreground tabular-nums">
              {index + 1}
            </span>

            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className={cn('truncate', isMe && 'font-medium')}>{standing.name}</span>
              {player?.isHost && <Crown className="size-3.5 shrink-0 text-muted-foreground" />}
              {player && !player.connected && (
                <WifiOff className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              {player?.connected && !player.inPlay && (
                <Badge variant="outline" className="shrink-0">
                  à la manche suivante
                </Badge>
              )}
              {standing.joinedMidGame && player?.inPlay && (
                <Badge variant="outline" className="shrink-0">
                  arrivé en cours
                </Badge>
              )}
            </span>

            {inRound && player?.hasAnswered && (
              <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <Check className="size-3.5" />a répondu
              </span>
            )}
            {inRound && player && !player.hasAnswered && player.inPlay && (
              <Wifi className="size-3.5 shrink-0 animate-pulse text-muted-foreground" />
            )}

            <span className="w-16 shrink-0 text-right font-medium tabular-nums">
              {standing.points}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
