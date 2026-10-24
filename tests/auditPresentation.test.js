import test from 'node:test'
import assert from 'node:assert/strict'
import { presentAuditEvent } from '../src/utils/auditPresentation.js'

test('customer-triggered updates remain visible with System attribution', () => {
  const events = ['Latte', 'Caramel Latte', 'Spanish Latte'].map((name, id) => ({
    id,
    actor_name_snapshot: 'Jojo Makaraeg',
    actor_role_snapshot: 'customer',
    surface: 'system',
    action: 'menu_items.updated',
    entity_label: name,
    summary: `Jojo Makaraeg updated ${name}`,
    before_data: { updated_at: '2026-10-23' },
    after_data: { updated_at: '2026-10-24' },
  }))
  const displayed = events.map(presentAuditEvent)
  assert.equal(displayed.length, events.length)
  displayed.forEach((event, index) => {
    assert.equal(event.actor_name_snapshot, 'System')
    assert.equal(event.actor_role_snapshot, 'system')
    assert.equal(event.summary, `System updated ${events[index].entity_label}`)
    assert.equal(event.action, events[index].action)
    assert.deepEqual(event.before_data, events[index].before_data)
    assert.deepEqual(event.after_data, events[index].after_data)
    assert.equal(events[index].actor_name_snapshot, 'Jojo Makaraeg')
    assert.deepEqual(presentAuditEvent(event), event)
  })
})

test('internal employee and system attribution stays intact', () => {
  for (const role of ['admin', 'staff', 'operational_staff', 'cashier', null]) {
    const event = { actor_role_snapshot: role, actor_name_snapshot: 'Operator', summary: 'Operator updated Latte' }
    assert.equal(presentAuditEvent(event), event)
  }
})

test('existing system summaries and missing names remain readable', () => {
  const event = { actor_role_snapshot: 'customer', surface: 'system', summary: 'System updated Latte' }
  assert.equal(presentAuditEvent(event).summary, event.summary)
  assert.equal(presentAuditEvent(event).actor_name_snapshot, 'System')
})
