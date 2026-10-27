import test from 'node:test'
import assert from 'node:assert/strict'
import {
  consumeCustomerReturnTo,
  readCustomerReturnTo,
  rememberCustomerReturnTo,
  safeCustomerReturnPath,
} from '../src/utils/customerAuthReturn.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

test('customer auth return paths stay internal and survive the auth flow', () => {
  globalThis.window = { sessionStorage: memoryStorage() }

  assert.equal(safeCustomerReturnPath('https://example.com', '/menu'), '/menu')
  assert.equal(safeCustomerReturnPath('//example.com', '/menu'), '/menu')
  assert.equal(rememberCustomerReturnTo('/checkout'), '/checkout')
  assert.equal(readCustomerReturnTo(), '/checkout')
  assert.equal(consumeCustomerReturnTo(), '/checkout')
  assert.equal(readCustomerReturnTo(), '/menu')

  delete globalThis.window
})
