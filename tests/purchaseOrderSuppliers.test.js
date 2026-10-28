import test from 'node:test'
import assert from 'node:assert/strict'
import { supplierOrderLines, suppliersForPurchaseItem } from '../src/utils/purchaseOrderSuppliers.js'

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
