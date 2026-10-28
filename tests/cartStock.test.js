import test from 'node:test'
import assert from 'node:assert/strict'
import { availableQuantityToAdd, checkCartStock } from '../src/services/cartStock.js'

test('cashier and customer carts send all lines without trusting client stock counts', async () => {
  const client = { rpc: async (name, args) => {
    assert.equal(name, 'cart_stock_available')
    assert.deepEqual(args.p_items, [
      { menu_item_id: 'cake', quantity: 1, variant_key: 'whole' },
      { menu_item_id: 'cake', quantity: 2, variant_key: 'slice' },
    ])
    return { data: false }
  } }
  assert.equal(await checkCartStock(client, [
    { id: 'cake', qty: 1, customizations: { variantKey: 'whole' }, stockInfo: { quantity: 100 } },
    { productId: 'cake', quantity: 2, variation: { id: 'slice' } },
  ]), false)
})

test('stock verification fails closed on RPC failure or a non-boolean result', async () => {
  await assert.rejects(checkCartStock({ rpc: async () => ({ error: { message: 'private stock detail' } }) }, [{ id: 'cake', qty: 1 }]), /could not verify current stock/)
  assert.equal(await checkCartStock({ rpc: async () => ({ data: null }) }, [{ id: 'cake', qty: 1 }]), false)
  assert.equal(await checkCartStock({}, []), true)
})

test('available quantity uses the BOM stock RPC and reserves items already in the cart', async () => {
  const queries = []
  const client = { rpc: async (name, { p_items: items }) => {
    assert.equal(name, 'cart_stock_available')
    queries.push(items)
    const sharedDemand = items.reduce((sum, item) => sum + item.quantity * (item.variant_key === 'whole' ? 8 : 1), 0)
    return { data: sharedDemand <= 12 }
  } }
  assert.equal(await availableQuantityToAdd(client, [{ productId: 'cake', quantity: 2, variation: { id: 'slice' } }], 'cake', 'whole'), 1)
  assert.ok(queries.every((items) => items.length === 2 && items[1].variant_key === 'whole'))
})

test('available quantity returns zero for no BOM stock and caps display at 99', async () => {
  assert.equal(await availableQuantityToAdd({ rpc: async () => ({ data: false }) }, [], 'cake', null), 0)
  assert.equal(await availableQuantityToAdd({ rpc: async () => ({ data: true }) }, [], 'cake', null), 99)
  await assert.rejects(availableQuantityToAdd({ rpc: async () => ({ error: true }) }, [], 'cake', null), /could not verify current stock/)
})

test('menu cards can show the full available count and still identify low stock', async () => {
  const client = { rpc: async (_, { p_items: items }) => ({ data: items.at(-1).quantity <= 13 }) }
  assert.equal(await availableQuantityToAdd(client, [], 'meal', null), 13)
  const lowStockClient = { rpc: async (_, { p_items: items }) => ({ data: items.at(-1).quantity <= 3 }) }
  assert.equal(await availableQuantityToAdd(lowStockClient, [], 'meal', null), 3)
})

test('adding to cart does not reduce public stock, but checkout makes another cart unavailable', async () => {
  let stock = 1
  const client = { rpc: async (_, { p_items: items }) => ({
    data: items.reduce((quantity, item) => quantity + item.quantity, 0) <= stock,
  }) }
  const customerCart = [{ productId: 'meal', quantity: 1 }]

  assert.equal(await availableQuantityToAdd(client, [], 'meal', null), 1)
  assert.equal(await checkCartStock(client, customerCart), true)
  assert.equal(await availableQuantityToAdd(client, [], 'meal', null), 1)
  assert.equal(await availableQuantityToAdd(client, customerCart, 'meal', null), 0)

  stock = 0 // The first customer's completed checkout commits the last unit.
  assert.equal(await availableQuantityToAdd(client, [], 'meal', null), 0)
  assert.equal(await checkCartStock(client, customerCart), false)
})
