import test from 'node:test'
import assert from 'node:assert/strict'
import { reorderItems } from '../src/utils/reorderItems.js'

const product = { id: 'coffee', name: 'Coffee', available: true, variations: [], addons: [], basePrice: 100 }
const line = (quantity = 2) => ({ menu_item_id: 'coffee', quantity, name: 'Coffee' })
const fetchCatalog = async options => {
  assert.equal(options.strict, true)
  return { products: [product] }
}

test('reorder waits for stock validation and never reports rejected additions as successful', async () => {
  let resolve
  const validation = new Promise(done => { resolve = done })
  let completed = false
  const pending = reorderItems({ order_items: [line()] }, { fetchCatalog, addItem: () => validation })
    .then(result => { completed = true; return result })
  await new Promise(done => setImmediate(done))
  assert.equal(completed, false)
  resolve({ ok: false, error: 'Insufficient stock' })
  const result = await pending
  assert.equal(result.addedCount, 0)
  assert.match(result.unavailable[0], /Insufficient stock/)
})

test('sequential additions include existing cart quantities and report partial success', async () => {
  let cartQuantity = 1
  const result = await reorderItems({ order_items: [line(2), line(2)] }, {
    fetchCatalog,
    addItem: async item => {
      await Promise.resolve()
      if (cartQuantity + item.quantity > 4) return { ok: false, error: 'Insufficient stock' }
      cartQuantity += item.quantity
      return { ok: true }
    },
  })
  assert.equal(cartQuantity, 3)
  assert.equal(result.addedCount, 1)
  assert.equal(result.unavailable.length, 1)
})

test('sold-out products, removed options and removed add-ons are not added', async () => {
  for (const [products, item] of [
    [[{ ...product, available: false }], line()],
    [[product], { ...line(), customizations: { variation_id: 'removed' } }],
    [[product], { ...line(), addons: ['removed'] }],
  ]) {
    const result = await reorderItems({ order_items: [item] }, {
      fetchCatalog: async () => ({ products }), addItem: () => assert.fail('Must not add unavailable choices'),
    })
    assert.equal(result.addedCount, 0)
    assert.equal(result.unavailable.length, 1)
  }
})

test('catalog failure does not reuse stale availability', async () => {
  const result = await reorderItems({ order_items: [line()] }, {
    fetchCatalog: async () => { throw new Error('Offline') }, addItem: () => assert.fail('Must not add'),
  })
  assert.equal(result.addedCount, 0)
  assert.match(result.unavailable[0], /Could not verify/)
})
