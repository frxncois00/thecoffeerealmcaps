export const stockKey = (item) => `${item.itemType}:${item.id}`
export const needsRestock = (item) => item.itemType === 'ingredient' && Number(item.quantity || 0) <= Number(item.minStockLevel || 0)
export function suggestedQuantity(item) {
  const target = Math.max(Number(item.highStockLevel || 0), Number(item.minStockLevel || 0) + 1)
  return Math.max(target - Number(item.quantity || 0), 1)
}

export function suggestedPurchaseAmount(item) {
  const needed = suggestedQuantity(item)
  const unit = String(item.unit || '').toLowerCase()
  // Keep purchase quantities easy to enter while never ordering below the stock shortfall.
  if (['g', 'gram', 'grams'].includes(unit)) return { unit: 'kg', quantity: Math.ceil(needed / 10 - 1e-9) / 100 }
  if (['ml', 'milliliter', 'milliliters'].includes(unit)) return { unit: 'L', quantity: Math.ceil(needed / 10 - 1e-9) / 100 }
  if (['kg', 'kilogram', 'kilograms', 'l', 'liter', 'liters'].includes(unit)) return { unit: item.unit, quantity: Math.ceil(needed * 100 - 1e-9) / 100 }
  return { unit: item.unit || 'piece', quantity: Math.ceil(needed) }
}
export function groupStockBySupplier(items, getSupplier) {
  return Array.from(items.reduce((groups, item) => {
    const name = getSupplier(item) || ''
    groups.set(name, [...(groups.get(name) || []), item])
    return groups
  }, new Map()), ([name, items]) => ({ name, items }))
}
