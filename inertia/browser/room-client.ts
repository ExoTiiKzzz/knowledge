import { token } from '@/browser/token'

/** The view the server broadcasts to a player. Its shape comes from `viewFor`. */
export type RoomView = {
  code: string
  me: string
  isHost: boolean
  settings: { modes: string[]; scope: string | null; roundCount: number; roundDuration: number }
  players: Array<{
    token: string
    name: string
    /** Sa couleur sur la carte, issue de PLAYER_COLOURS. */
    colour: string
    connected: boolean
    points: number
    isHost: boolean
    hasAnswered: boolean
    inPlay: boolean
  }>
  standings: Array<{
    token: string
    name: string
    points: number
    correctAnswers: number
    joinedMidGame: boolean
  }>
  history: Array<{ standings: RoomView['standings'] }>
  game: null | {
    roundCount: number
    finished: boolean
    paused: boolean
    resumeAt: number | null
    round: null | {
      number: number
      mode: string
      code: string
      name: string | null
      deadlineAt: number
    }
    result: null | {
      number: number
      mode: string
      code: string
      expected: string
      answers: Array<{
        token: string
        input: string | null
        status: 'exact' | 'close' | 'wrong'
        points: number
        guess: { code: string; name: string } | null
        /** Le pays désigné, juste ou faux. `null` s'il n'a rien désigné. */
        pick: string | null
      }>
    }
  }
}

/** A refusal from the server, carrying the reason and a message for the player. */
export class ServerRejection extends Error {
  reason: string

  constructor(reason: string, message: string) {
    super(message)
    this.reason = reason
  }
}

async function post<T>(url: string, body: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: token(), ...body }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ServerRejection(data.reason ?? 'error', data.message ?? 'Échec.')
  return data as T
}

export const roomApi = {
  create: () => post<{ code: string }>('/api/rooms'),
  join: (code: string, name: string) => post<{ view: RoomView }>(`/api/rooms/${code}/join`, { name }),
  leave: (code: string) => post<{ view: RoomView | null }>(`/api/rooms/${code}/leave`),
  updateSettings: (code: string, settings: Record<string, unknown>) =>
    post<{ view: RoomView }>(`/api/rooms/${code}/settings`, settings),
  start: (code: string) => post<{ view: RoomView }>(`/api/rooms/${code}/start`),
  answer: (code: string, input: string, ms: number) =>
    post<{ view: RoomView }>(`/api/rooms/${code}/answer`, { input, ms }),
}

/**
 * Subscribes to the player's channel, speaking Transmit's protocol directly: an
 * event stream identified by a `uid` the client draws itself, then a subscription
 * to a channel on that stream.
 *
 * `@adonisjs/transmit-client` was not used: its latest published version (1.1.0)
 * opens the stream without the `uid` that the 3.x server requires, so the request
 * comes back a 500. Thirty lines beat a mismatched dependency.
 *
 * Subscribing cannot simply wait for the stream's `open` event: depending on when
 * AdonisJS flushes the response headers, `open` may not fire until the first
 * message — which would never come without a subscription. It is therefore sent
 * at once and retried, `open` acting only as an extra trigger.
 *
 * The server pushes a complete view on every change: the client applies no rule,
 * it renders what it receives.
 */
export function listen(code: string, onView: (view: RoomView) => void): () => void {
  const uid = crypto.randomUUID()
  const channel = `salon/${code}/${token()}`
  const stream = new EventSource(`/__transmit/events?uid=${encodeURIComponent(uid)}`)
  let alive = true

  /**
   * Subscribing races the stream's registration: the POST can land before the
   * server knows the uid, and is then turned down. We therefore retry a few
   * times, and also on `open` — subscribing twice to the same channel is
   * harmless, whereas not subscribing at all leaves the player deaf.
   */
  let subscribed = false
  const subscribe = async (attemptsLeft: number): Promise<void> => {
    if (subscribed || !alive) return
    try {
      const response = await fetch('/__transmit/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid, channel }),
      })
      if (response.ok) {
        subscribed = true
        return
      }
    } catch {
      // Network hiccup: falls through to the retry below.
    }
    if (attemptsLeft > 0) setTimeout(() => void subscribe(attemptsLeft - 1), 300)
  }

  void subscribe(8)
  stream.addEventListener('open', () => void subscribe(4))

  stream.addEventListener('message', (event) => {
    if (!alive) return
    try {
      const frame = JSON.parse((event as MessageEvent<string>).data)
      // Transmit wraps the broadcast payload: { channel, payload }.
      const view = frame?.payload?.view ?? frame?.view
      if (view) onView(view as RoomView)
    } catch {
      // Service message (ping, acknowledgement): moot here.
    }
  })

  return () => {
    alive = false
    stream.close()
    void fetch('/__transmit/unsubscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, channel }),
    }).catch(() => {})
  }
}
