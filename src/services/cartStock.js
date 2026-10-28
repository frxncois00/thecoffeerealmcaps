export const STOCK_MESSAGE = 'The selected quantity is unavailable. Please reduce the quantity or choose another item.'

// Only a yes/no result crosses the customer boundary; inventory counts stay private.
export async function checkCartStock(client, items) {
  if (!items.length) return true
  const { data, error } = await client.rpc('cart_stock_available', {
    p_items: items.map((item) => ({
      menu_item_id: item.productId || item.id,
      quantity: item.quantity ?? item.qty,
      variant_key: item.variation?.id || item.customizations?.variation_id || item.customizations?.variantKey || null,
    })),
  })
  if (error) throw new Error('We could not verify current stock. Please try again.')
  return data === true
}

export async function availableQuantityToAdd(client, cartItems, productId, variationId, maxQuantity = 99) {
  const fits = (quantity) => checkCartStock(client, [
    ...cartItems,
    { productId, quantity, variation: variationId ? { id: variationId } : null },
  ])
  if (await fits(maxQuantity)) return maxQuantity

  let low = 0
  let high = maxQuantity - 1
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (await fits(middle)) low = middle
    else high = middle - 1
  }
  return low
}
