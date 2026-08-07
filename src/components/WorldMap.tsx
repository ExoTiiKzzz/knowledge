import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CONTINENT_VIEWBOXES, MAP_SHAPES, MAP_VIEWBOX } from '@/data/map'
import { cn } from '@/lib/utils'
import type { Scope } from '@/lib/quiz'

/** Comment un pays doit ressortir du fond de carte. */
export type Emphasis = 'target' | 'correct' | 'wrong'

const FILLS: Record<Emphasis, string> = {
  // Le pays à deviner : volontairement neutre et franc, sans connotation.
  target: 'fill-sky-500 stroke-sky-700 dark:fill-sky-400 dark:stroke-sky-200',
  correct: 'fill-emerald-500 stroke-emerald-700 dark:fill-emerald-400 dark:stroke-emerald-200',
  wrong: 'fill-destructive stroke-destructive',
}

const RINGS: Record<Emphasis, string> = {
  target: 'stroke-sky-500 dark:stroke-sky-400',
  correct: 'stroke-emerald-600 dark:stroke-emerald-400',
  wrong: 'stroke-destructive',
}

/**
 * En deçà de cette fraction de la largeur affichée, un pays est trop petit pour
 * se repérer à l'œil : on le cercle. Le seuil étant relatif au cadrage courant,
 * zoomer fait disparaître les cercles devenus inutiles.
 *
 * Calibré sur les tailles réelles : en vue monde, ce seuil cercle le Luxembourg
 * (1 px), la République dominicaine (6 px) et la Tunisie (11 px), mais laisse
 * nus le Royaume-Uni (15 px), le Japon (18 px) et le Kenya (20 px).
 */
const RING_BELOW = 0.013
/** Rayon plancher du cercle, en fraction de la largeur affichée. */
const RING_MIN = 0.016

/** Bornes du zoom, en facteur d'agrandissement par rapport au cadrage initial. */
const MAX_ZOOM = 24
const MIN_ZOOM = 1
/** Déplacement en pixels au-delà duquel un geste est un glissement, non un clic. */
const DRAG_SLOP = 4

type View = { x: number; y: number; w: number; h: number }

function parseViewBox(value: string): View {
  const [x, y, w, h] = value.split(' ').map(Number)
  return { x, y, w, h }
}

const WORLD = parseViewBox(MAP_VIEWBOX)

/**
 * Le pays sous un point de l'écran, ou `null`.
 *
 * La sélection se résout ici plutôt que par un `onClick` sur chaque tracé : la
 * capture de pointeur, nécessaire au glissé, réachemine les événements souris
 * vers l'élément capteur — le `<svg>` — si bien que le `click` n'atteint jamais
 * le `<path>` visé. Partir de la position du pointeur contourne le problème.
 */
function countryAt(clientX: number, clientY: number): string | null {
  const element = document.elementFromPoint(clientX, clientY)
  return element?.closest('path[data-country]')?.getAttribute('data-country') ?? null
}

/** Garde le cadrage dans les bornes de zoom et à l'intérieur du monde. */
function clamp(view: View, base: View): View {
  const minW = base.w / MAX_ZOOM
  const maxW = base.w / MIN_ZOOM
  const ratio = base.h / base.w

  const w = Math.min(maxW, Math.max(minW, view.w))
  const h = w * ratio

  // La vue reste entièrement dans le tracé : sans cette borne on déplace la
  // carte hors de l'écran et on se retrouve devant du vide. Au dézoom maximal,
  // la marge tombe à zéro et le déplacement se bloque de lui-même.
  const x = Math.min(Math.max(view.x, 0), Math.max(0, WORLD.w - w))
  const y = Math.min(Math.max(view.y, 0), Math.max(0, WORLD.h - h))
  return { x, y, w, h }
}

type WorldMapProps = {
  /** Continent sur lequel cadrer. `null` pour le monde entier. */
  scope: Scope
  /** Pays à faire ressortir, par code ISO alpha-2. */
  emphasis?: Record<string, Emphasis>
  /** Rend les pays cliquables. Reçoit le code ISO alpha-2. */
  onSelect?: (code: string) => void
  /** Tout changement de cette valeur remet le zoom et le recentrage à zéro. */
  resetKey?: string
  className?: string
}

/**
 * Carte du monde en SVG, chemins précalculés par scripts/generate-map.mjs.
 *
 * Zoomable à la molette ou au pincement, déplaçable au glissé. Tout passe par le
 * `viewBox` : le tracé reste vectoriel à n'importe quel grossissement, et les
 * bordures gardent leur épaisseur à l'écran (`vector-effect`).
 *
 * Les pays hors quiz (Antarctique, territoires non membres de l'ONU) sont
 * dessinés en fond inerte : sans eux la carte serait trouée, mais les cliquer
 * n'aurait pas de sens.
 */
export function WorldMap({ scope, emphasis = {}, onSelect, resetKey, className }: WorldMapProps) {
  // Mémoïsé : `base` alimente `zoomAt`, dont dépend l'attache du listener de
  // molette. Un nouvel objet à chaque rendu la ferait se détacher sans cesse.
  const base = useMemo(() => {
    const framing = scope ? CONTINENT_VIEWBOXES[scope] : undefined
    return framing ? parseViewBox(framing) : WORLD
  }, [scope])

  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState<View>(base)

  // Une nouvelle question repart du cadrage d'origine : rester zoomé sur
  // l'Europe alors que la question suivante porte sur le Brésil donnerait
  // l'impression que le pays est introuvable.
  const baseKey = `${scope ?? 'monde'}|${resetKey ?? ''}`
  const lastKey = useRef(baseKey)
  useEffect(() => {
    if (lastKey.current === baseKey) return
    lastKey.current = baseKey
    setView(base)
  }, [baseKey, base])

  /** Facteur pixels écran → unités du repère, letterboxing compris. */
  const scaleOf = useCallback(() => {
    const ctm = svgRef.current?.getScreenCTM()
    return ctm && ctm.a ? 1 / ctm.a : view.w / (svgRef.current?.clientWidth || 1)
  }, [view.w])

  /** Zoome d'un facteur `k` en gardant fixe le point écran donné. */
  const zoomAt = useCallback(
    (k: number, clientX?: number, clientY?: number) => {
      setView((current) => {
        const svg = svgRef.current
        let focusX = current.x + current.w / 2
        let focusY = current.y + current.h / 2

        if (svg && clientX !== undefined && clientY !== undefined) {
          const ctm = svg.getScreenCTM()
          if (ctm) {
            const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
            focusX = point.x
            focusY = point.y
          }
        }

        const next = clamp({ ...current, w: current.w * k, h: current.h * k }, base)
        // Le facteur réellement appliqué peut différer de `k` après bornage :
        // le recentrage doit suivre le zoom effectif, sinon la carte dérive.
        const applied = next.w / current.w
        return clamp(
          {
            ...next,
            x: focusX - (focusX - current.x) * applied,
            y: focusY - (focusY - current.y) * applied,
          },
          base,
        )
      })
    },
    [base],
  )

  // Listener natif non passif : un `onWheel` React ne peut pas empêcher le
  // défilement de la page, la molette zoomerait *et* ferait défiler.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      zoomAt(Math.exp(event.deltaY * 0.0015), event.clientX, event.clientY)
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  // Pointeurs actifs : un seul pour le glissé, deux pour le pincement.
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchDistance = useRef(0)
  const dragged = useRef(false)

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    dragged.current = false
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDistance.current > 0 && distance > 0) {
        dragged.current = true
        zoomAt(pinchDistance.current / distance, (a.x + b.x) / 2, (a.y + b.y) / 2)
      }
      pinchDistance.current = distance
      return
    }

    const dx = event.clientX - previous.x
    const dy = event.clientY - previous.y
    if (Math.abs(dx) > DRAG_SLOP || Math.abs(dy) > DRAG_SLOP) dragged.current = true
    if (!dragged.current) return

    const scale = scaleOf()
    setView((current) => clamp({ ...current, x: current.x - dx * scale, y: current.y - dy * scale }, base))
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    const wasDragging = dragged.current
    const wasPinching = pointers.current.size >= 2
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinchDistance.current = 0

    // Un glissement ou un pincement qui s'achève sur un pays n'est pas un choix.
    if (wasDragging || wasPinching || !onSelect) return

    const code = countryAt(event.clientX, event.clientY)
    if (code) onSelect(code)
  }

  const zoom = base.w / view.w
  const canZoomOut = zoom > MIN_ZOOM * 1.01
  const canZoomIn = zoom < MAX_ZOOM * 0.99

  return (
    <div className={cn('relative', className)}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        // Le tracé est déjà projeté : on ne le déforme jamais.
        preserveAspectRatio="xMidYMid meet"
        role={onSelect ? 'group' : 'img'}
        aria-label="Carte du monde"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // Sans cela, le glissé au doigt ferait défiler la page au lieu de
        // déplacer la carte, et le pincement zoomerait le navigateur.
        className="w-full touch-none select-none"
      >
        {MAP_SHAPES.map((shape, index) => {
          const highlight = shape.code ? emphasis[shape.code] : undefined
          const clickable = Boolean(onSelect && shape.code)

          return (
            <path
              key={shape.code ?? `bg-${index}`}
              d={shape.d}
              data-country={shape.code ?? undefined}
              // Une bordure d'épaisseur fixe à l'écran quel que soit le zoom.
              vectorEffect="non-scaling-stroke"
              strokeWidth={highlight ? 1.6 : 0.9}
              // Pas de `onClick` : la sélection est résolue au `pointerup`, voir
              // `countryAt`.
              className={cn(
                'transition-colors duration-150',
                highlight
                  ? FILLS[highlight]
                  : shape.code
                    ? // `--border` est presque de la couleur de `--muted` : les
                      // frontières n'offraient qu'un contraste de 1,16:1, soit
                      // rien. Ces alphas sur `--muted-foreground` atteignent le
                      // 3:1 attendu d'un élément graphique porteur de sens, sur
                      // les deux thèmes (mesuré : 3,2:1 en clair, 3,0:1 en sombre).
                      'fill-muted stroke-muted-foreground/85 dark:stroke-muted-foreground/60'
                    : 'fill-muted/40 stroke-muted-foreground/30',
                clickable && !highlight && 'cursor-pointer hover:fill-muted-foreground/40',
              )}
            />
          )
        })}

        {/* Cercles de repérage en dernier, pour rester au-dessus des tracés. */}
        {MAP_SHAPES.map((shape) => {
          const highlight = shape.code ? emphasis[shape.code] : undefined
          if (!highlight || shape.cx === undefined || shape.cy === undefined) return null
          if ((shape.size ?? 0) >= view.w * RING_BELOW) return null

          return (
            <circle
              key={`ring-${shape.code}`}
              data-ring={shape.code}
              cx={shape.cx}
              cy={shape.cy}
              r={Math.max(shape.size ?? 0, view.w * RING_MIN)}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              // Purement indicatif : ne doit jamais intercepter un clic.
              pointerEvents="none"
              className={RINGS[highlight]}
            />
          )
        })}
      </svg>

      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Zoomer"
          disabled={!canZoomIn}
          onClick={() => zoomAt(1 / 1.5)}
        >
          <Plus />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Dézoomer"
          disabled={!canZoomOut}
          onClick={() => zoomAt(1.5)}
        >
          <Minus />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Recadrer"
          disabled={!canZoomOut}
          onClick={() => setView(base)}
        >
          <RotateCcw />
        </Button>
      </div>

      <p className="absolute bottom-1 left-2 text-xs text-muted-foreground">
        {zoom > 1.01 ? `Zoom ×${zoom.toFixed(1)} · glisse pour déplacer` : 'Molette ou pincement pour zoomer'}
      </p>
    </div>
  )
}
