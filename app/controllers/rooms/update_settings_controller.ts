import type { HttpContext } from '@adonisjs/core/http'
import { applyAndRespond } from '../../rooms/http.ts'
import type { Settings } from '../../../shared/lib/room.ts'
import type { Mode } from '../../../shared/lib/quiz.ts'

const VALID_MODES: Mode[] = ['flags', 'capitals', 'mapFind', 'mapName']

/**
 * Changes the room settings. Host only, and only outside a game.
 *
 * Values are clamped here rather than trusted: a request is not a form, and the
 * engine should not have to defend against absurd numbers.
 */
export default class UpdateSettingsController {
  async handle(ctx: HttpContext) {
    const { token, modes, scope, roundCount, roundDuration } = ctx.request.only([
      'token',
      'modes',
      'scope',
      'roundCount',
      'roundDuration',
    ])

    const partial: Partial<Settings> = {}
    if (Array.isArray(modes)) {
      partial.modes = modes.filter((mode): mode is Mode => VALID_MODES.includes(mode))
    }
    if (scope !== undefined) partial.scope = scope || null
    if (roundCount !== undefined) {
      partial.roundCount = Math.min(194, Math.max(1, Number(roundCount) || 20))
    }
    if (roundDuration !== undefined) {
      partial.roundDuration = Math.min(60_000, Math.max(5_000, Number(roundDuration) || 15_000))
    }

    return applyAndRespond(ctx, { type: 'settings', token, settings: partial })
  }
}
