import type { HttpContext } from '@adonisjs/core/http'
import { applyAndRespond } from '../../rooms/http.ts'

/**
 * Submits an answer.
 *
 * The input travels raw — the server is the sole judge (ADR-0002) — along with
 * the duration the client measured, which the engine clamps before keeping it
 * (ADR-0003).
 */
export default class SubmitAnswerController {
  async handle(ctx: HttpContext) {
    const { token, input, ms } = ctx.request.only(['token', 'input', 'ms'])
    return applyAndRespond(ctx, {
      type: 'answer',
      token,
      input: String(input ?? ''),
      claimedMs: Number(ms),
    })
  }
}
