import type { HttpContext } from '@adonisjs/core/http'
import { applyAndRespond } from '../../rooms/http.ts'

/** Leaves the room. The last one out closes it. */
export default class LeaveRoomController {
  async handle(ctx: HttpContext) {
    const { token } = ctx.request.only(['token'])
    return applyAndRespond(ctx, { type: 'leave', token })
  }
}
