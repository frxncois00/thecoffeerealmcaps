import test from 'node:test'
import assert from 'node:assert/strict'
import { installCashierTouchGuard } from '../src/utils/cashierTouch.js'

test('cashier blocks zoom gestures, preserves scrolling, and restores listeners on exit', () => {
  const doc = new EventTarget()
  const cleanup = installCashierTouchGuard(doc)
  function gesture(type, { cashier = true, fingers = 1, ctrlKey = false } = {}) {
    const event = new Event(type, { cancelable: true })
    Object.defineProperties(event, {
      target: { value: { closest: () => cashier ? {} : null } },
      touches: { value: Array(fingers).fill({}) },
      ctrlKey: { value: ctrlKey },
    })
    doc.dispatchEvent(event)
    return event.defaultPrevented
  }
  assert.equal(gesture('touchmove'), false)
  assert.equal(gesture('wheel'), false)
  for (const fingers of [2, 3, 4]) assert.equal(gesture('touchmove', { fingers }), true)
  assert.equal(gesture('gesturestart'), true)
  assert.equal(gesture('wheel', { ctrlKey: true }), true)
  assert.equal(gesture('touchmove', { cashier: false, fingers: 2 }), false)
  assert.equal(gesture('wheel', { cashier: false, ctrlKey: true }), false)
  cleanup()
  assert.equal(gesture('gesturestart'), false)
  assert.equal(gesture('touchmove', { fingers: 2 }), false)
  assert.equal(gesture('wheel', { ctrlKey: true }), false)
})
