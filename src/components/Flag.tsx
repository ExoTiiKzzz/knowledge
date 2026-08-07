import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { flagUrl } from '@/lib/quiz'

/**
 * Hauteurs de cadre disponibles. `lg` sert au drapeau seul d'une question,
 * `md` à la comparaison côte à côte qui doit tenir deux drapeaux en largeur.
 */
const FRAMES = {
  lg: 'h-52',
  md: 'h-36 sm:h-44',
} as const

type FlagProps = {
  code: string
  className?: string
  /**
   * Réserve un cadre de hauteur fixe. Sans cadre, le drapeau s'aligne sur la
   * hauteur du texte (listes, en-tête de question).
   */
  frame?: keyof typeof FRAMES
}

/**
 * Drapeau servi par flagcdn.com. Le ratio varie d'un pays à l'autre (le Népal
 * n'est pas un rectangle, la Suisse est carrée) : on borne la hauteur et on
 * laisse la largeur suivre.
 */
export function Flag({ code, className, frame }: FlagProps) {
  const [failed, setFailed] = useState(false)

  // Un même composant est réutilisé d'une question à l'autre : sans reset, un
  // drapeau introuvable masquerait le suivant.
  useEffect(() => setFailed(false), [code])

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-dashed bg-muted font-mono text-muted-foreground',
          frame ? `${FRAMES[frame]} w-full text-2xl` : 'h-6 w-9 text-[10px]',
          className,
        )}
      >
        {code}
      </div>
    )
  }

  const image = (
    <img
      src={flagUrl(code, frame ? 640 : 320)}
      alt=""
      onError={() => setFailed(true)}
      className={cn(
        'rounded-md border object-contain shadow-sm',
        frame ? 'max-h-full max-w-full' : 'h-6 w-auto',
        className,
      )}
    />
  )

  // Hauteur réservée : sans elle, la carte se replie le temps du chargement puis
  // saute d'une question à l'autre.
  return frame ? (
    <div className={cn('flex w-full items-center justify-center', FRAMES[frame])}>{image}</div>
  ) : (
    image
  )
}
