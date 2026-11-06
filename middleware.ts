import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server'

// Keeps the auth cookie fresh. Nothing is gated here: every route is playable as a
// Guest, and signing in only carries the passport across devices.
export default convexAuthNextjsMiddleware()

export const config = {
  // Everything except Next internals and static files.
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
