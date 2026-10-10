import test from 'node:test'
import assert from 'node:assert/strict'
import { createSingleFlight, uniquePortalSessions } from '../src/utils/portalSessions.js'

const row = { user_id: 'cashier', auth_session_id: 'edge-login', browser: 'Microsoft Edge', ip_address: '136.158.29.227', last_seen_at: '2026-10-08T02:26:00Z', auth_session_exists: true }
test('repeated records for one auth session collapse to its freshest row', () => {
  const records = uniquePortalSessions([{ ...row, id: 'old' }, { ...row, id: 'new', last_seen_at: '2026-10-08T02:27:00Z' }], 'edge-login')
  assert.equal(records.length, 1)
  assert.equal(records[0].id, 'new')
  assert.equal(records[0].isCurrent, true)
})
test('distinct sessions remain visible even with identical account, browser, IP and timestamps', () => {
  const records = uniquePortalSessions([row, { ...row, auth_session_id: 'another-edge-login' }], 'edge-login')
  assert.equal(records.length, 2)
  assert.deepEqual(records.map((item) => item.isCurrent), [true, false])
})
test('revocation takes precedence over a duplicate active record', () => {
  const records = uniquePortalSessions([{ ...row, revoked_at: '2026-10-08T02:27:00Z' }, { ...row, last_seen_at: '2026-10-08T02:28:00Z' }])
  assert.ok(records[0].revoked_at)
})
test('concurrent registration requests run once; later heartbeats run again', async () => {
  const run = createSingleFlight()
  let calls = 0
  let release
  const operation = () => { calls++; return new Promise((resolve) => { release = resolve }) }
  const first = run('session-a', operation)
  const second = run('session-a', operation)
  await Promise.resolve()
  assert.equal(calls, 1)
  release('registered')
  assert.deepEqual(await Promise.all([first, second]), ['registered', 'registered'])
  assert.equal(await run('session-a', () => ++calls), 2)
})
test('failed registration can retry and separate sessions do not share requests', async () => {
  const run = createSingleFlight()
  await assert.rejects(run('session-a', () => { throw new Error('offline') }), /offline/)
  assert.deepEqual(await Promise.all([run('session-a', () => 'a'), run('session-b', () => 'b')]), ['a', 'b'])
})
