// Each addition validates the entire current cart, including earlier additions.
export async function reorderItems(order, { fetchCatalog, addItem }) {
  const unavailable = []
  let addedCount = 0
  try {
    const { products } = await fetchCatalog({ strict: true })
    for (const item of order.order_items || []) {
      const name = item.display_name || item.item_name || item.product_name || item.name || 'Item'
      const product = products.find(product => product.id === item.menu_item_id)
      if (!product?.available) { unavailable.push(`${name}: currently unavailable`); continue }
      const custom = item.customizations || {}
      const variation = custom.variation_id ? product.variations.find(option => option.id === custom.variation_id) : null
      if (custom.variation_id && !variation) { unavailable.push(`${name}: option no longer available`); continue }
      const addons = (item.addons || []).map(id => product.addons.find(addon => addon.id === id)).filter(Boolean)
      if (addons.length !== (item.addons || []).length) {
        unavailable.push(`${name}: add-ons have changed; please choose this item from the menu`)
        continue
      }
      const result = await addItem({ productId: product.id, slug: product.slug, name: product.name,
        image: product.image, variation, temperature: custom.temperature || '', ice: '', sugar: '',
        addons, instructions: '', quantity: item.quantity, unitPrice: variation?.price ?? product.basePrice,
        onlineBenefitEligible: product.onlineBenefitEligible }, { openDrawer: false })
      if (result?.ok) addedCount += 1
      else unavailable.push(`${name}: ${result?.error || 'Could not add this item.'}`)
    }
  } catch {
    unavailable.push('Could not verify current availability. Please try again.')
  }
  return { unavailable, addedCount }
}
