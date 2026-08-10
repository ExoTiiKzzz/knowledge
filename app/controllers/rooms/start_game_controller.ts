import type { HttpContext } from '@adonisjs/core/http'
import { applyAndRespond } from '../../rooms/http.ts'
import { registry } from '../../rooms/registry.ts'

/** Starts a game. The seed comes from the server, never from the client. */
export default class StartGameController {
  async handle(ctx: HttpContext) {
    const { token } = ctx.request.only(['token'])
    return applyAndRespond(ctx, { type: 'start', token, seed: registry.seed() })
  }
}
