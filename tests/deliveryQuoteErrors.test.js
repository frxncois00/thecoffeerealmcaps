import test from 'node:test'
import assert from 'node:assert/strict'
import { deliveryQuoteErrorMessage } from '../src/utils/deliveryQuoteErrors.js'

const responseError = (status, body) => ({ context: new Response(JSON.stringify(body), { status }) })
test('delivery errors expose the actionable function failure', async () => {
  const error = responseError(400, { error: 'No road route found. Move the pin and retry.' })
  assert.equal(await deliveryQuoteErrorMessage(error), 'No road route found. Move the pin and retry.')
  assert.equal(error.context.bodyUsed, false)
})
test('gateway errors distinguish missing deployment and authentication', async () => {
  assert.match(await deliveryQuoteErrorMessage(responseError(404, { message: 'Function not found' })), /not deployed/)
  assert.match(await deliveryQuoteErrorMessage(responseError(401, { message: 'Invalid JWT' })), /authentication needs updating/)
  assert.match(await deliveryQuoteErrorMessage(responseError(401, {})), /Sign in again/)
})
test('transport failures and unavailable runtimes have useful fallbacks', async () => {
  assert.match(await deliveryQuoteErrorMessage(new Error('Failed to fetch')), /Check your connection/)
  assert.match(await deliveryQuoteErrorMessage(responseError(503, {})), /unavailable/)
})
