import test from 'node:test'
import assert from 'node:assert/strict'
import { readProfileWithRetry } from '../src/lib/profileRetry.js'

const futureJwtError = { code: 'PGRST303', message: 'JWT issued at future' }

function profileClient(results) {
  let calls = 0
  return {
    get calls() { return calls },
    from(table) {
      assert.equal(table, 'profiles')
      return {
        select(columns) {
          assert.equal(columns, 'id, role')
          return {
            eq(field, value) {
              assert.equal(field, 'id')
              assert.equal(value, 'user-1')
              return { maybeSingle: async () => results[calls++] }
            },
          }
        },
      }
    },
  }
}

test('a newly issued JWT succeeds when the Data API clock catches up', async () => {
  const client = profileClient([
    { data: null, error: futureJwtError },
    { data: null, error: futureJwtError },
    { data: { id: 'user-1', role: 'admin' }, error: null },
  ])
  const result = await readProfileWithRetry(client, 'user-1', 'id, role', [0, 0])
  assert.equal(result.data.role, 'admin')
  assert.equal(client.calls, 3)
})

test('unrelated auth errors are not retried', async () => {
  const error = { code: '42501', message: 'Permission denied' }
  const client = profileClient([{ data: null, error }])
  const result = await readProfileWithRetry(client, 'user-1', 'id, role', [0, 0])
  assert.equal(result.error, error)
  assert.equal(client.calls, 1)
})

test('persistent clock errors stop after the retry limit', async () => {
  const client = profileClient(Array.from({ length: 3 }, () => ({ data: null, error: futureJwtError })))
  const result = await readProfileWithRetry(client, 'user-1', 'id, role', [0, 0])
  assert.equal(result.error, futureJwtError)
  assert.equal(client.calls, 3)
})
