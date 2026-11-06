/**
 * A Guest's identity: a random token this browser keeps, plus the name last used.
 *
 * The token identifies nobody: it only lets a player take their seat back in a
 * Room after a refresh or a dropped connection. It is not a credential and grants
 * nothing beyond a seat in rooms whose code you already know.
 *
 * Local storage is per origin, so two players cannot share a browser profile.
 */

const TOKEN_KEY = 'geoquiz.token'
const NAME_KEY = 'geoquiz.name'

export function token(): string {
  try {
    const existing = localStorage.getItem(TOKEN_KEY)
    if (existing) return existing
    const fresh = crypto.randomUUID()
    localStorage.setItem(TOKEN_KEY, fresh)
    return fresh
  } catch {
    // Private browsing or quota: a session-only token will do, without recovery.
    return crypto.randomUUID()
  }
}

/** Last name used, offered by default when joining. */
export function rememberedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function rememberName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    // Without memory the name gets retyped: no harm done.
  }
}
