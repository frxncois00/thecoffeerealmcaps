import test from 'node:test'
import assert from 'node:assert/strict'
import { filterMenu, selectBestsellers } from '../src/utils/menuFilters.js'

test('homepage and full menu select the same five ranked bestsellers', () => {
  const catalog = [6, 3, 1, 5, 2, 4].map(rank => ({ id: rank, isBestseller: true, bestsellerRank: rank }))
  catalog.push({ id: 'featured-only', isFeatured: true })
  assert.deepEqual(selectBestsellers(catalog).map(item => item.id), [1, 2, 3, 4, 5])
  assert.deepEqual(selectBestsellers(filterMenu(catalog)).map(item => item.id), [1, 2, 3, 4, 5])
  assert.equal(catalog[0].id, 6)
  assert.deepEqual(selectBestsellers([]), [])
})

const products = [
  { id: 'cake', name: 'Chocolate Cake', description: 'Rich cocoa', category: 'Desserts', basePrice: 800, variations: [{ price: 150 }, { price: 800 }], available: true },
  { id: 'latte', name: 'Latte', description: 'Espresso and milk', category: 'Coffee', basePrice: 120, available: false },
  { id: 'matcha', name: 'Matcha', description: 'Green tea', category: 'Drinks', basePrice: 150, available: true, isBestseller: true },
]
test('combines search, category, availability and inclusive starting-price limits', () => {
  assert.deepEqual(filterMenu(products, { query: ' COCOA ', category: 'Desserts', min: '150', max: '150', available: true }).map(p => p.id), ['cake'])
  assert.equal(filterMenu(products, { query: 'latte', available: true }).length, 0)
  assert.equal(filterMenu(products, { min: '151', max: '799' }).length, 0)
})
test('includes sold-out items by default and sorts without modifying catalog order', () => {
  assert.deepEqual(filterMenu(products, { sort: 'price-low' }).map(p => p.id), ['latte', 'cake', 'matcha'])
  assert.deepEqual(filterMenu(products, { sort: 'price-high' }).map(p => p.id), ['cake', 'matcha', 'latte'])
  assert.deepEqual(filterMenu(products).map(p => p.id), ['matcha', 'cake', 'latte'])
  assert.deepEqual(products.map(p => p.id), ['cake', 'latte', 'matcha'])
})
test('blank prices are unbounded while zero is a real limit', () => {
  assert.equal(filterMenu(products).length, 3)
  assert.equal(filterMenu(products, { max: '0' }).length, 0)
  assert.equal(filterMenu(products, { category: 'Missing' }).length, 0)
})
