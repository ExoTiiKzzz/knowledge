import Google from '@auth/core/providers/google'
import { convexAuth } from '@convex-dev/auth/server'

/**
 * Google is the only provider, and signing in is never required: a Guest plays
 * everything, and an Account only carries the passport across devices.
 *
 * The Anonymous provider stays off, as in pokefight: a Guest is a token in the
 * browser, not an authenticated user. Their passport is merged into the Account
 * on first sign-in instead — see `passports.adopt`.
 *
 * Credentials come from AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET on the Convex
 * deployment — not from .env.local, which never reaches the Convex runtime.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
})
