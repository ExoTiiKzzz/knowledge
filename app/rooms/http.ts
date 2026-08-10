import type { HttpContext } from '@adonisjs/core/http'
import { RejectionError } from '../../shared/lib/room.ts'
import { registry } from './registry.ts'

/**
 * Shared plumbing for the room controllers.
 *
 * Every controller is single-action: it turns a request into an event, lets the
 * engine decide, and returns the player's view. None of them holds game logic —
 * that all lives in the reducer, where it is testable without HTTP.
 */

/** Player-facing message for each rejection reason. Text stays in French: it is the UI. */
const MESSAGES: Record<string, { status: number; message: string }> = {
  unknown: { status: 404, message: "Ce salon n'existe pas ou n'existe plus." },
  'room-closed': { status: 404, message: 'Ce salon est fermé.' },
  'room-full': { status: 409, message: 'Ce salon est complet.' },
  'name-taken': { status: 409, message: 'Ce nom est déjà pris dans ce salon.' },
  'not-host': { status: 403, message: "Seul l'hôte peut faire cela." },
  'game-running': { status: 409, message: 'Une partie est en cours.' },
  'no-mode': { status: 422, message: 'Choisis au moins un mode.' },
  'no-round': { status: 409, message: "Aucune manche n'est ouverte." },
  'already-answered': { status: 409, message: 'Tu as déjà répondu à cette manche.' },
  'not-in-play': { status: 409, message: 'Tu entres en jeu à la manche suivante.' },
}

export function rejectionResponse(ctx: HttpContext, error: unknown) {
  if (error instanceof RejectionError) {
    const { status, message } = MESSAGES[error.reason] ?? { status: 409, message: error.reason }
    return ctx.response.status(status).send({ reason: error.reason, message })
  }
  throw error
}

/**
 * Applies an event to a room and returns the acting player's view.
 *
 * The view is recomputed after the transition; a room that closed itself returns
 * `null`, since there is nothing left to look at.
 */
export function applyAndRespond(ctx: HttpContext, event: RoomEventOf<HttpContext>) {
  const { code } = ctx.params
  if (!event.token) return ctx.response.badRequest({ message: 'Jeton manquant.' })

  try {
    registry.apply(code, event)
    return { view: registry.find(code) ? registry.view(code, event.token) : null }
  } catch (error) {
    return rejectionResponse(ctx, error)
  }
}

/** Every room event carries the acting player's token. */
type RoomEventOf<_C> = Parameters<typeof registry.apply>[1] & { token: string }
