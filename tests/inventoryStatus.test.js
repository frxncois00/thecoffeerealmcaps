import test from 'node:test'
import assert from 'node:assert/strict'
import { inventoryStatus } from '../src/utils/inventoryStatus.js'

const item = (quantity, extra = {}) => ({
  quantity,
  criticalStockLevel: 20,
  minStockLevel: 45,
  highStockLevel: 100,
  ...extra,
})

test('inventory status follows the 0/20/45/100 threshold model', () => {
  assert.equal(inventoryStatus(item(0)), 'out')
  assert.equal(inventoryStatus(item(20)), 'critical')
  assert.equal(inventoryStatus(item(21)), 'low')
  assert.equal(inventoryStatus(item(45)), 'low')
  assert.equal(inventoryStatus(item(46)), 'stocked')
  assert.equal(inventoryStatus(item(125)), 'stocked')
})

test('archived inventory remains archived regardless of quantity', () => {
  assert.equal(inventoryStatus(item(0, { isArchived: true })), 'archived')
})
