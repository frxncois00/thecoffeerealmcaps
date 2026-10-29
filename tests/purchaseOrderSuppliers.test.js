import test from 'node:test'
import assert from 'node:assert/strict'
import { prioritizeSupplierItems, supplierOrderLines, supplierPriceForItem, suppliersForPurchaseItem } from '../src/utils/purchaseOrderSuppliers.js'

const options = [
  { id: 'coffee', itemType: 'ingredient', name: 'Espresso Beans', unit: 'gram' },
  { id: 'rice', itemType: 'ingredient', name: 'Rice', unit: 'kilogram' },
  { id: 'egg', itemType: 'ingredient', name: 'Egg', unit: 'piece' },
]
const suppliers = [
  { name: 'Coffee Supply', items: [{ item_type: 'ingredient', ingredient_id: 'coffee' }] },
  { name: 'Harvest Lane', items: [{ item_type: 'ingredient', ingredient_id: 'rice' }, { item_type: 'ingredient', ingredient_id: 'egg' }] },
]

test('switching suppliers replaces the previous supplier items with the new list', () => {
  const coffeeLines = supplierOrderLines(suppliers[0], options)
  const harvestLines = supplierOrderLines(suppliers[1], options)
  assert.deepEqual(coffeeLines.map((line) => line.itemId), ['coffee'])
  assert.deepEqual(harvestLines.map((line) => line.itemId), ['rice', 'egg'])
  assert.ok(harvestLines.every((line) => line.quantityOrdered === '' && line.estimatedTotalCost === ''))
  assert.deepEqual(supplierOrderLines(null, options).map((line) => line.itemId), [''])
})

test('selecting an item identifies its linked supplier without guessing when shared', () => {
  assert.deepEqual(suppliersForPurchaseItem(options[1], suppliers).map((supplier) => supplier.name), ['Harvest Lane'])
  const shared = [...suppliers, { name: 'Another Harvest', items: [{ item_type: 'ingredient', ingredient_id: 'rice' }] }]
  assert.deepEqual(suppliersForPurchaseItem(options[1], shared).map((supplier) => supplier.name), ['Harvest Lane', 'Another Harvest'])
  assert.deepEqual(suppliersForPurchaseItem({ id: 'other', itemType: 'ingredient', supplier: 'Coffee Supply' }, suppliers).map((supplier) => supplier.name), ['Coffee Supply'])
})

test('linked supplier items come first, including after searching or switching suppliers', () => {
  assert.deepEqual(prioritizeSupplierItems(options, ['ingredient:egg']).map((item) => item.id), ['egg', 'coffee', 'rice'])
  assert.deepEqual(prioritizeSupplierItems(options, ['ingredient:rice']).map((item) => item.id), ['rice', 'coffee', 'egg'])
  assert.deepEqual(prioritizeSupplierItems(options, ['ingredient:rice'], 'e').map((item) => item.id), ['rice', 'coffee', 'egg'])
})

test('the same ingredient can have a different fixed unit price per supplier', () => {
  const first = { items: [{ item_type: 'ingredient', ingredient_id: 'coffee', unit_price: 0.75 }] }
  const second = { items: [{ item_type: 'ingredient', ingredient_id: 'coffee', unit_price: 0.82 }] }
  assert.equal(supplierPriceForItem(first, options[0]), 0.75)
  assert.equal(supplierPriceForItem(second, options[0]), 0.82)
  assert.equal(supplierOrderLines(first, options)[0].fixedUnitPrice, '0.75')
  assert.equal(supplierOrderLines(second, options)[0].fixedUnitPrice, '0.82')
})
