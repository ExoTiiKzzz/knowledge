import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { flagUrl } from '@/lib/quiz'

type FlagProps = {
  code: string
  className?: string
  /** Rendu large : les drapeaux du quiz méritent la version haute résolution. */
  large?: boolean
}

/**
 * Drapeau servi par flagcdn.com. Le ratio varie d'un pays à l'autre (le Népal
 * n'est pas un rectangle, la Suisse est carrée) : on borne la hauteur et on
 * laisse la largeur suivre.
 */
export function Flag({ code, className, large }: FlagProps) {
  const [failed, setFailed] = useState(false)

  // Un même composant est réutilisé d'une question à l'autre : sans reset, un
  // drapeau introuvable masquerait le suivant.
  useEffect(() => setFailed(false), [code])

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-dashed bg-muted font-mono text-muted-foreground',
          large ? 'h-52 w-72 text-2xl' : 'h-6 w-9 text-[10px]',
          className,
        )}
      >
        {code}
      </div>
    )
  }

  const image = (
    <img
      src={flagUrl(code, large ? 640 : 320)}
      alt=""
      onError={() => setFailed(true)}
      className={cn(
        'rounded-md border object-contain shadow-sm',
        large ? 'max-h-full max-w-full' : 'h-6 w-auto',
        className,
      )}
    />
  )

  // Hauteur réservée en mode large : sans elle, la carte se replie le temps du
  // chargement puis saute d'une question à l'autre.
  return large ? <div className="flex h-52 w-full items-center justify-center">{image}</div> : image
}
