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
