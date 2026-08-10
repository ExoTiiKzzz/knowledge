const TOKEN_KEY = 'geoquiz.token'
const NAME_KEY = 'geoquiz.name'

/**
 * Opaque browser token. It identifies nobody: it only lets a player take their
 * seat back in a room after a refresh or a dropped connection. No account, no
 * personal data.
 *
 * One consequence worth knowing: local storage is per origin, so two players
 * cannot share a browser profile.
 */
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
