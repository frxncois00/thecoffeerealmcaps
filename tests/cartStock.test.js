import test from 'node:test'
import assert from 'node:assert/strict'
import { checkCartStock } from '../src/services/cartStock.js'

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
