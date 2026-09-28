import test from 'node:test'
import assert from 'node:assert/strict'
import { menuItemAddons } from '../src/utils/menuAddons.js'

const names = ['Plain Rice', 'Scrambled Egg', 'Sunny Side Up Egg', 'Cheese Sauce', 'Salsa']
const prices = [25, 20, 20, 30, 30]
const addons = names.flatMap((name, index) => [
  { id: `addon-${index}`, name, price: prices[index], subcategoryIds: ['meals'] },
  { id: `duplicate-${index}`, name: ` ${name.toUpperCase()} `, price: prices[index], subcategoryIds: ['meals'] },
])

for (const item of ['Bangus', 'Chicken Tenders']) {
  test(`${item} lists each add-on once with its original price`, () => {
    const visible = menuItemAddons(addons, { name: item, item_type: 'food', subcategory_id: 'meals' })
    assert.deepEqual(visible.map((addon) => addon.name), names)
    assert.deepEqual(visible.map((addon) => addon.price), prices)
    assert.deepEqual(visible.map((addon) => addon.id), names.map((_, index) => `addon-${index}`))
  })
}
