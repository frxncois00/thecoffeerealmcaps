import test from 'node:test'
import assert from 'node:assert/strict'
import { isJwtIssuedInFutureError, retryJwtTimingRequest } from '../src/lib/supabaseRetry.js'

test('recognizes only the Supabase JWT timing error', () => {
  assert.equal(isJwtIssuedInFutureError({ code: 'PGRST303', message: 'JWT issued at future' }), true)
  assert.equal(isJwtIssuedInFutureError({ code: 'PGRST303', message: 'Other JWT error' }), false)
  assert.equal(isJwtIssuedInFutureError({ code: '42501', message: 'JWT issued at future' }), false)
})

test('retries the timing error and returns the first successful result', async () => {
  let attempts = 0
  const result = await retryJwtTimingRequest(async () => {
    attempts += 1
    return attempts < 3
      ? { data: null, error: { code: 'PGRST303', message: 'JWT issued at future' } }
      : { data: { role: 'customer' }, error: null }
  }, [0, 0, 0])

  assert.equal(attempts, 3)
  assert.deepEqual(result.data, { role: 'customer' })
})

test('does not retry unrelated errors', async () => {
  let attempts = 0
  const result = await retryJwtTimingRequest(async () => {
    attempts += 1
    return { data: null, error: { code: '42501', message: 'Permission denied' } }
  }, [0, 0, 0])

  assert.equal(attempts, 1)
  assert.equal(result.error.code, '42501')
})
