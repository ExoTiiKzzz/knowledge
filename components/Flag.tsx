'use client'

import { useState } from 'react'
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
  // On retient *quel* drapeau a échoué : un même composant est réutilisé d'une
  // question à l'autre, et un drapeau introuvable ne doit pas masquer le suivant.
  const [failedCode, setFailedCode] = useState<string | null>(null)
  const failed = failedCode === code

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-sm border-2 border-dashed border-rule bg-paper-deep font-mono text-ink-soft',
          frame ? `${FRAMES[frame]} w-full text-2xl` : 'h-6 w-9 text-[10px]',
          className,
        )}
      >
        {code}
      </div>
    )
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- served by flagcdn.com, outside Next's optimizer.
    <img
      src={flagUrl(code, frame ? 640 : 320)}
      alt=""
      onError={() => setFailedCode(code)}
      className={cn(
        'object-contain',
        // Framed, a flag is a postcard pinned to the page: a white border, a
        // shadow, a slight tilt. Inline, it is just a flag in a line of text.
        frame
          ? 'max-h-full max-w-full border-[6px] border-white bg-white shadow-[0_8px_22px_rgb(60_40_10/0.2)] -rotate-1'
          : cn(
              'w-auto rounded-[2px] shadow-[0_0_0_1px_rgb(30_36_51/0.15)]',
              // Classes are joined, not merged: a height given by the caller
              // must replace the default rather than compete with it.
              !/(^|\s)h-/.test(className ?? '') && 'h-6',
            ),
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
