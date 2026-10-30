import test from 'node:test'
import assert from 'node:assert/strict'
import { changeReceived, receivingBreakdown, receivingLines, returnAllReceived, validateReceivingReport } from '../src/utils/purchaseReceiving.js'

const allYes = { 0: 'yes', 1: 'yes', 2: 'yes', 3: 'yes' }
const checks = { 0: 'no', 1: 'no', 2: 'no', 3: 'yes' }
const item = (id, ordered, price, received = ordered, issues = []) => ({ id, item_name: id, quantityOrdered: ordered, estimatedUnitCost: price, receivedQuantity: received, selected: issues.length > 0, issues })
const example = () => [
  item('beans', 10, 850, 10, [{ type: 'damaged', quantity: 2 }]),
  item('milk', 24, 95, 20, [{ type: 'missing_quantity', quantity: 4 }]),
  item('matcha', 6, 620, 6, [{ type: 'wrong_item', quantity: 1 }]),
  item('syrup', 3, 280, 0, [{ type: 'not_received', quantity: 3 }]),
]

test('reference rows calculate actual values and preserve the financial identity', () => {
  const values = receivingBreakdown(example())
  assert.deepEqual(values, { orderTotal: 15340, acceptedValue: 11800, returnValue: 2320, missingValue: 380, notReceivedValue: 840 })
  assert.equal(values.orderTotal, values.acceptedValue + values.returnValue + values.missingValue + values.notReceivedValue)
  assert.deepEqual(validateReceivingReport(example(), checks), {})
})

test('received quantity switches between partial, zero, and complete delivery', () => {
  let line = changeReceived(item('milk', 24, 95), '20')
  assert.deepEqual(line.issues, [{ type: 'missing_quantity', quantity: 4 }])
  line = changeReceived(line, '0')
  assert.deepEqual(line.issues, [{ type: 'not_received', quantity: 24 }])
  line = changeReceived(line, '24')
  assert.deepEqual(line.issues, [])
})

test('multiple return issues and missing units are disjoint and summed', () => {
  const line = changeReceived(item('milk', 24, 95, 24, [{ type: 'damaged', quantity: 2 }, { type: 'wrong_item', quantity: 1 }]), 20)
  assert.deepEqual(validateReceivingReport([line], checks), {})
  assert.deepEqual(receivingBreakdown([line]), { orderTotal: 2280, acceptedValue: 1615, returnValue: 285, missingValue: 380, notReceivedValue: 0 })
})

test('return all never includes absent or missing units in physical returns', () => {
  const lines = returnAllReceived(example())
  assert.deepEqual(receivingBreakdown(lines), { orderTotal: 15340, acceptedValue: 0, returnValue: 14120, missingValue: 380, notReceivedValue: 840 })
  assert.deepEqual(lines[3].issues, [{ type: 'not_received', quantity: 3 }])
  assert.deepEqual(validateReceivingReport(lines, checks), {})
  lines[0].issues[0].quantity = 1
  assert.match(validateReceivingReport(lines, checks).beans, /every physically delivered unit/)
})

test('all checks and affected-item selection are mandatory', () => {
  assert.match(validateReceivingReport(example(), { 0: 'no' }).form, /every/)
  assert.match(validateReceivingReport([item('milk', 24, 95)], checks).form, /Select at least/)
  assert.match(validateReceivingReport([{ ...example()[1], selected: false }], { ...allYes, 1: 'no' }).milk, /Select this item/)
  assert.match(validateReceivingReport([item('milk', 24, 95)], { ...allYes, 1: 'no' }, false).form, /All delivery checks/)
})

test('invalid quantities, issue reasons, and combined excessive returns are rejected', () => {
  for (const received of ['', -1, 25, 'NaN', Infinity]) assert.ok(validateReceivingReport([item('milk', 24, 95, received)], checks).milk)
  for (const quantity of [0, -1, 'NaN', Infinity, 25]) assert.ok(validateReceivingReport([item('milk', 24, 95, 20, [{ type: 'damaged', quantity }])], checks).milk)
  assert.ok(validateReceivingReport([item('milk', 24, 95, 20, [{ type: 'missing_quantity', quantity: 3 }])], { ...allYes, 1: 'no' }).milk)
  assert.ok(validateReceivingReport([item('milk', 24, 95, 20, [{ type: 'not_received', quantity: 24 }])], checks).milk)
  assert.ok(validateReceivingReport([item('milk', 24, 95, 24, [{ type: 'damaged', quantity: 15 }, { type: 'wrong_item', quantity: 10 }])], checks).milk)
  assert.ok(validateReceivingReport([item('milk', 24, 95, 24, [{ type: '', quantity: 1 }])], checks).milk)
  assert.ok(validateReceivingReport([item('milk', 24, 95, 24, [{ type: 'damaged', quantity: 1 }])], allYes).milk)
})

test('each failed check must identify affected items', () => {
  assert.match(validateReceivingReport([example()[0]], checks).form, /Identify the affected/)
})

test('fractional inventory quantities retain precision', () => {
  const line = changeReceived(item('beans', 1.25, 850), 1.1)
  assert.deepEqual(validateReceivingReport([line], { ...allYes, 1: 'no' }), {})
  assert.equal(receivingBreakdown([line]).missingValue, 127.5)
})

test('replacement cycles include only quantities not yet accepted', () => {
  const lines = receivingLines({ status: 'awaiting_replacement', items: [
    { ...item('milk', 24, 95), acceptedQuantity: 20 }, { ...item('beans', 10, 850), acceptedQuantity: 10 },
  ] })
  assert.equal(lines.length, 1)
  assert.equal(lines[0].quantityOrdered, 4)
  assert.equal(lines[0].receivedQuantity, 4)
  assert.deepEqual(validateReceivingReport(lines, allYes, false), {})
})

test('corrections preserve the previously submitted delivery without mutating history', () => {
  const previous = example()
  const lines = receivingLines({ status: 'receiving_correction', reports: [{ lines: previous }] })
  lines[0].issues[0].quantity = 5
  assert.equal(previous[0].issues[0].quantity, 2)
})
