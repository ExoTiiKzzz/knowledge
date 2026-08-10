import type { HttpContext } from '@adonisjs/core/http'
import { registry } from '../../rooms/registry.ts'
import { rejectionResponse } from '../../rooms/http.ts'

/** The room's state, as the asking player is allowed to see it. */
export default class ShowRoomController {
  async handle(ctx: HttpContext) {
    try {
      return { view: registry.view(ctx.params.code, String(ctx.request.input('token'))) }
    } catch (error) {
      return rejectionResponse(ctx, error)
    }
  }
}
