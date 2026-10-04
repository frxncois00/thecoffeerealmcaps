export const stockKey = (item) => `${item.itemType}:${item.id}`
export const needsRestock = (item) => item.itemType === 'ingredient' && Number(item.quantity || 0) <= Number(item.minStockLevel || 0)
export function suggestedQuantity(item) {
  const target = Math.max(Number(item.highStockLevel || 0), Number(item.minStockLevel || 0) + 1)
  return Math.max(target - Number(item.quantity || 0), 1)
}
export function groupStockBySupplier(items, getSupplier) {
  return Array.from(items.reduce((groups, item) => {
    const name = getSupplier(item) || ''
    groups.set(name, [...(groups.get(name) || []), item])
    return groups
  }, new Map()), ([name, items]) => ({ name, items }))
}
