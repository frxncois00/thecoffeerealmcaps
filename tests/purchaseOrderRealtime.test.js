import test from 'node:test'
import assert from 'node:assert/strict'
import { hasBellPurchaseOrderToast, pickPurchaseOrderUpdate } from '../src/utils/purchaseOrderRealtime.js'

const draft = { id: 'one', po_number: 'PO-1', status: 'draft' }
const pending = { ...draft, status: 'pending_approval' }

test('reports status changes to staff and admin', () => {
  assert.deepEqual(pickPurchaseOrderUpdate([draft], [pending], false), { type: 'status', order: pending })
  assert.deepEqual(pickPurchaseOrderUpdate([draft], [pending], true), { type: 'status', order: pending })
})

test('reports a newly arrived order to admin but not its creator', () => {
  assert.deepEqual(pickPurchaseOrderUpdate([], [draft], true), { type: 'new', order: draft })
  assert.equal(pickPurchaseOrderUpdate([], [draft], false), null)
})

test('does not notify when an order is only edited or re-fetched', () => {
  assert.equal(pickPurchaseOrderUpdate([draft], [{ ...draft, supplierName: 'Updated' }], true), null)
  assert.equal(pickPurchaseOrderUpdate([draft], [draft], false), null)
})

test('suppresses live toasts for PO statuses already announced by the bell', () => {
  assert.equal(hasBellPurchaseOrderToast({ type: 'status', order: { status: 'approved' } }, false), true)
  assert.equal(hasBellPurchaseOrderToast({ type: 'status', order: { status: 'rejected' } }, false), true)
  assert.equal(hasBellPurchaseOrderToast({ type: 'new', order: pending }, true), true)
  assert.equal(hasBellPurchaseOrderToast({ type: 'status', order: { status: 'returned' } }, true), true)
  assert.equal(hasBellPurchaseOrderToast({ type: 'status', order: { status: 'sent' } }, false), false)
  assert.equal(hasBellPurchaseOrderToast({ type: 'new', order: draft }, true), false)
})
