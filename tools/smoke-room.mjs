// End-to-end check of a salon against the live Convex deployment.
//
// The rules are unit-tested in lib/room.test.ts; this exercises what those tests
// cannot: the adapter in convex/rooms.ts — storing the Room, scheduling the wake-ups,
// the rejections. A client here has exactly the powers a browser has.
//
//   node tools/smoke-room.mjs

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'
import { countryByCode } from '../lib/quiz.ts'

const env = await readFile(new URL('../.env.local', import.meta.url), 'utf8')
const url = env.match(/^NEXT_PUBLIC_CONVEX_URL=(.+)$/m)?.[1]?.trim()
if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL absent de .env.local')

const client = new ConvexHttpClient(url)
const alice = `smoke-a-${crypto.randomUUID()}`
const bob = `smoke-b-${crypto.randomUUID()}`
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const view = (code, token) => client.query(api.rooms.view, { code, token })

async function rejected(promise, reason) {
  try {
    await promise
  } catch (error) {
    assert.equal(error.data?.reason, reason, `expected ${reason}, got ${error.message}`)
    return
  }
  assert.fail(`expected a ${reason} rejection`)
}

const code = await client.mutation(api.rooms.create, { token: alice, name: 'Alice' })
console.log('salon', code)

await client.mutation(api.rooms.join, { code: code.toLowerCase(), token: bob, name: 'Bob' })
await rejected(client.mutation(api.rooms.join, { code, token: 'x', name: 'alice' }), 'name-taken')
await rejected(client.mutation(api.rooms.start, { code, token: bob }), 'not-host')
await rejected(client.mutation(api.rooms.join, { code: 'ZZZZ', token: bob, name: 'Bob' }), 'unknown')

await client.mutation(api.rooms.updateSettings, {
  code,
  token: alice,
  modes: ['flags', 'nonsense'],
  scope: 'Europe',
  roundCount: 2,
  roundDuration: 1, // clamped to 5 s
})
let v = await view(code, alice)
assert.deepEqual(v.settings, { modes: ['flags'], scope: 'Europe', roundCount: 2, roundDuration: 5000 })
assert.equal(v.isHost, true)

// Round 1: both answer, so it closes at once without waiting for the deadline.
await client.mutation(api.rooms.start, { code, token: alice })
v = await view(code, alice)
const first = v.game.round
assert.equal(first.number, 1)
const answer = countryByCode(first.code).name
await client.mutation(api.rooms.answer, { code, token: alice, input: answer, ms: 1200 })
await rejected(client.mutation(api.rooms.answer, { code, token: alice, input: answer, ms: 1 }), 'already-answered')
await client.mutation(api.rooms.answer, { code, token: bob, input: 'atlantide', ms: 3000 })

v = await view(code, bob)
assert.equal(v.game.round, null)
assert.equal(v.game.result.number, 1)
const mine = v.game.result.answers.find((a) => a.token === alice)
assert.notEqual(mine.status, 'wrong')
assert.ok(mine.points > 0)
console.log('manche 1 close, Alice +', mine.points)

// The results pause ends on a scheduled wake-up, and round 2 opens by itself.
await sleep(v.game.resumeAt - Date.now() + 1500)
v = await view(code, alice)
assert.equal(v.game.round?.number, 2, 'round 2 should have opened after the pause')
console.log('manche 2 ouverte par le réveil programmé')

// Nobody answers round 2: the deadline closes it, then the game ends after the pause.
await sleep(v.game.round.deadlineAt - Date.now() + 1500)
v = await view(code, alice)
assert.equal(v.game.round, null)
assert.ok(v.game.result.answers.every((a) => a.status === 'wrong'))
console.log("manche 2 close par l'échéance")

await sleep(v.game.resumeAt - Date.now() + 1500)
v = await view(code, alice)
assert.equal(v.game.finished, true)
assert.equal(v.history.length, 1)
assert.equal(v.standings[0].name, 'Alice')
console.log('partie finie, podium :', v.standings.map((s) => `${s.name} ${s.points}`).join(', '))

// Bob's browser falls silent: Alice's heartbeat notices, and marks him away. His own
// next heartbeat brings him back.
await client.mutation(api.rooms.heartbeat, { code, token: alice })
await sleep(16_000)
await client.mutation(api.rooms.heartbeat, { code, token: alice })
v = await view(code, alice)
assert.equal(v.players.find((p) => p.token === bob).connected, false)
await client.mutation(api.rooms.heartbeat, { code, token: bob })
v = await view(code, alice)
assert.equal(v.players.find((p) => p.token === bob).connected, true)
console.log('absence détectée par le battement, puis retour')

// The host leaving passes the role on; the last one out closes the salon.
await client.mutation(api.rooms.leave, { code, token: alice })
v = await view(code, bob)
assert.equal(v.isHost, true)
await client.mutation(api.rooms.leave, { code, token: bob })
assert.equal(await view(code, bob), null)
console.log('salon fermé — tout est bon')
