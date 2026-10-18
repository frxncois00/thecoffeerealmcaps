import test from 'node:test'
import assert from 'node:assert/strict'
import { needsRestock, suggestedQuantity, suggestedPurchaseAmount, groupStockBySupplier, stockKey } from '../src/utils/purchaseStock.js'

test('includes ingredients at threshold and excludes products', () => {
  assert.equal(needsRestock({ itemType: 'finished_product', quantity: 5, minStockLevel: 5 }), false)
  assert.equal(needsRestock({ itemType: 'ingredient', quantity: 0, minStockLevel: 0 }), true)
  assert.equal(needsRestock({ itemType: 'ingredient', quantity: 6, minStockLevel: 5 }), false)
})
test('suggestion restores target stock and handles missing or inconsistent targets', () => {
  assert.equal(suggestedQuantity({ quantity: 470, minStockLevel: 500, highStockLevel: 2000 }), 1530)
  assert.equal(suggestedQuantity({ quantity: 10, minStockLevel: 50 }), 41)
  assert.equal(suggestedQuantity({ quantity: 0, minStockLevel: 0 }), 1)
})
test('purchase suggestions round stock shortfalls up in useful supplier units', () => {
  assert.deepEqual(suggestedPurchaseAmount({ unit: 'g', quantity: 104.51, minStockLevel: 250, highStockLevel: 1000 }), { unit: 'kg', quantity: 0.9 })
  assert.deepEqual(suggestedPurchaseAmount({ unit: 'ml', quantity: 875, minStockLevel: 900, highStockLevel: 1000 }), { unit: 'L', quantity: 0.13 })
  assert.deepEqual(suggestedPurchaseAmount({ unit: 'piece', quantity: 7.8, minStockLevel: 8, highStockLevel: 10 }), { unit: 'piece', quantity: 3 })
})
test('supplier grouping preserves selected items without mixing supplier orders', () => {
  const items = [{ id: '1', itemType: 'ingredient', supplier: 'A' }, { id: '1', itemType: 'finished_product', supplier: 'B' }, { id: '2', itemType: 'ingredient' }]
  assert.notEqual(stockKey(items[0]), stockKey(items[1]))
  const groups = groupStockBySupplier(items, (item) => item.supplier)
  assert.deepEqual(groups.map((group) => group.name), ['A', 'B', ''])
  assert.deepEqual(groups.flatMap((group) => group.items), items)
})
