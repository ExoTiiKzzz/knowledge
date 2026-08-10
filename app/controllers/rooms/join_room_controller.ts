import type { HttpContext } from '@adonisjs/core/http'
import { applyAndRespond } from '../../rooms/http.ts'

/** Joins a room, or takes a seat back when the token is already known. */
export default class JoinRoomController {
  async handle(ctx: HttpContext) {
    const { token, name } = ctx.request.only(['token', 'name'])

    if (!token || typeof token !== 'string') {
      return ctx.response.badRequest({ message: 'Jeton manquant.' })
    }
    if (!name || !String(name).trim()) {
      return ctx.response.badRequest({ message: 'Choisis un nom.' })
    }

    return applyAndRespond(ctx, { type: 'join', token, name: String(name).slice(0, 24) })
  }
}
