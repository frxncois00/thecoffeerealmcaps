import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeNotifications, needsSilentToast, notificationDestination, normalizeNotification } from '../src/utils/notifications.js'

test('history merges repeated deliveries and synchronizes read and clear actions', () => {
  const row = { id: 'a', created_at: '2026-10-22T01:00:00Z', read_at: null }
  const first = normalizeNotification(row)
  const read = normalizeNotification({ ...row, read_at: row.created_at })
  const items = mergeNotifications([first], [read, read])
  assert.equal(items.length, 1)
  assert.equal(items[0].read, true)
  assert.deepEqual(mergeNotifications(items, [{ ...read, cleared_at: row.created_at }]), [])
})

test('equal-time notifications have a stable order across page boundaries', () => {
  const createdAt = '2026-10-22T01:00:00Z'
  assert.deepEqual(mergeNotifications([{ id: 'a', createdAt }], [{ id: 'c', createdAt }, { id: 'b', createdAt }]).map(item => item.id), ['c', 'b', 'a'])
})

test('urgent toasts are silent additions only for fresh events in the active app', () => {
  const item = { toast: true, event_type: 'payment_issue', createdAt: new Date().toISOString() }
  assert.equal(needsSilentToast(item, 'customer', true), true)
  assert.equal(needsSilentToast(item, 'customer', false), false)
  assert.equal(needsSilentToast({ ...item, toast: false }, 'customer', true), false)
  assert.equal(needsSilentToast({ ...item, read: true }, 'customer', true), false)
  assert.equal(needsSilentToast({ ...item, createdAt: new Date(Date.now() - 120000).toISOString() }, 'customer', true), false)
})

test('existing operational toasts are not duplicated by the new bell', () => {
  for (const event_type of ['new_order', 'low_stock', 'out_of_stock', 'customer_cancelled', 'cancellation_requested', 'daily_restock']) {
    assert.equal(needsSilentToast({ toast: true, event_type, createdAt: new Date().toISOString() }, 'staff', true), false)
  }
})

test('notification links preserve the record and recipient workspace', () => {
  assert.deepEqual(notificationDestination({ kind: 'order', id: 'order-1' }, 'customer'), { path: '/orders', state: { notificationOrderId: 'order-1' } })
  assert.equal(notificationDestination({ kind: 'purchase-order', id: 'po-1' }, 'staff').path, '/staff/purchase-orders')
  assert.equal(notificationDestination({ kind: 'refund', id: 'order-1' }, 'admin').state.notificationOrderId, 'order-1')
  assert.equal(notificationDestination({ kind: 'message', id: 'm-1' }, 'admin').state.notificationMessageId, 'm-1')
  assert.equal(notificationDestination({ kind: 'unknown' }, 'customer'), null)
})
