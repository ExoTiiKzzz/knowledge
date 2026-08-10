import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Keeps a server-sent event stream from being buffered by a reverse proxy.
 *
 * Hosted platforms put a proxy in front of the container, and several buffer a
 * response until it completes — which never happens for a stream, so the browser
 * receives nothing and the live scoreboard silently freezes. No error is raised:
 * the request just stays open and empty, which makes the fault hard to place.
 *
 * `X-Accel-Buffering: no` is the header nginx and its derivatives honour to
 * stream through. `no-transform` tells intermediate caches not to repack it.
 *
 * Registered on the server stack rather than the stream route: it must run
 * before the controller starts writing, and it is the only place we can
 * guarantee that.
 */
export default class StreamHeadersMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.request.url().startsWith('/__transmit/events')) {
      ctx.response.header('X-Accel-Buffering', 'no')
      ctx.response.header('Cache-Control', 'no-cache, no-transform')
    }
    return next()
  }
}
