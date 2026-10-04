import test from 'node:test'
import assert from 'node:assert/strict'
import { pricePerPurchaseUnit, updatePurchaseLine } from '../src/utils/purchaseLinePricing.js'

test('prices synchronize in both directions and retain the last edited basis', () => {
  let line = { quantityOrdered: '3', estimatedTotalCost: '30' }
  assert.equal(pricePerPurchaseUnit(line), '10')
  line = updatePurchaseLine(line, 'purchaseUnitPrice', '12.50')
  assert.equal(line.estimatedTotalCost, '37.50')
  line = updatePurchaseLine(line, 'quantityOrdered', '4')
  assert.equal(line.estimatedTotalCost, '50.00')
  line = updatePurchaseLine(line, 'estimatedTotalCost', '60')
  assert.equal(pricePerPurchaseUnit(line), '15')
  line = updatePurchaseLine(line, 'quantityOrdered', '3')
  assert.equal(pricePerPurchaseUnit(line), '20')
})

test('handles empty quantities, cleared prices, zero prices, and fractional quantities', () => {
  let line = updatePurchaseLine({ quantityOrdered: '', estimatedTotalCost: '' }, 'purchaseUnitPrice', '10')
  assert.equal(line.estimatedTotalCost, '')
  line = updatePurchaseLine(line, 'quantityOrdered', '1.25')
  assert.equal(line.estimatedTotalCost, '12.50')
  line = updatePurchaseLine(line, 'purchaseUnitPrice', '')
  assert.equal(line.estimatedTotalCost, '')
  line = updatePurchaseLine(line, 'purchaseUnitPrice', '0')
  assert.equal(line.estimatedTotalCost, '0.00')
  assert.equal(pricePerPurchaseUnit({ quantityOrdered: '0', estimatedTotalCost: '10' }), '')
})
