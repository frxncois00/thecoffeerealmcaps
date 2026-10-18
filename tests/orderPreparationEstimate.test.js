import test from 'node:test'
import assert from 'node:assert/strict'
import { orderPreparationRange } from '../src/utils/orderPreparationEstimate.js'

const made = (minutes, quantity = 1, itemType = 'drink') => ({
  quantity,
  menu_items: { prep_time_minutes: minutes, item_type: itemType, inventory_source: 'ingredients' },
})
const ready = (minutes, quantity = 1) => ({
  quantity,
  menu_items: { prep_time_minutes: minutes, item_type: 'food', inventory_source: 'products' },
})

test('three made-to-order drinks take 30–45 minutes rather than one drink time', () => {
  assert.deepEqual(orderPreparationRange({ order_items: [made(8), made(8), made(8)] }), { min: 30, max: 45 })
  assert.deepEqual(orderPreparationRange({ order_items: [made(8, 3)] }), { min: 30, max: 45 })
})

test('meal and drink quantity increases the order estimate', () => {
  assert.deepEqual(orderPreparationRange({ order_items: [made(8)] }), { min: 10, max: 15 })
  assert.deepEqual(orderPreparationRange({ order_items: [made(15, 2, 'food')] }), { min: 20, max: 30 })
  assert.deepEqual(orderPreparationRange({ order_items: [made(8), made(15, 2, 'food')] }), { min: 30, max: 45 })
})

test('ready-made products remain short and do not drive the made-to-order count', () => {
  assert.deepEqual(orderPreparationRange({ order_items: [ready(3, 3)] }), { min: 5, max: 10 })
  assert.deepEqual(orderPreparationRange({ order_items: [ready(null, 3)] }), { min: 5, max: 10 })
  assert.deepEqual(orderPreparationRange({ order_items: [made(8, 2), ready(3)] }), { min: 20, max: 30 })
})

test('longer configured timing is respected and missing metadata gets a conservative estimate', () => {
  assert.deepEqual(orderPreparationRange({ order_items: [made(40, 3)] }), { min: 40, max: 55 })
  assert.deepEqual(orderPreparationRange({ order_items: [{ quantity: 3, menu_items: null }] }), { min: 30, max: 45 })
  assert.equal(orderPreparationRange({ order_items: [] }), null)
})
