import type { HttpContext } from '@adonisjs/core/http'
import { registry } from '../../rooms/registry.ts'

/** Creates a room and returns its shareable code. */
export default class CreateRoomController {
  async handle({ response }: HttpContext) {
    return response.created({ code: registry.create() })
  }
}
