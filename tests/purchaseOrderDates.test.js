import test from 'node:test'
import assert from 'node:assert/strict'
import { isPastPurchaseOrderDeliveryDate, purchaseOrderToday } from '../src/utils/purchaseOrderDates.js'

test('purchase order delivery dates use the shop date in Manila', () => {
  const beforeMidnight = new Date('2026-10-29T15:30:00Z')
  const afterMidnight = new Date('2026-10-29T16:30:00Z')
  assert.equal(purchaseOrderToday(beforeMidnight), '2026-10-29')
  assert.equal(purchaseOrderToday(afterMidnight), '2026-10-30')
  assert.equal(isPastPurchaseOrderDeliveryDate('2026-10-29', afterMidnight), true)
  assert.equal(isPastPurchaseOrderDeliveryDate('2026-10-30', afterMidnight), false)
  assert.equal(isPastPurchaseOrderDeliveryDate('2026-10-31', afterMidnight), false)
  assert.equal(isPastPurchaseOrderDeliveryDate('', afterMidnight), false)
})
