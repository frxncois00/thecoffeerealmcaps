export const blankPurchaseOrderLine = () => ({
  itemType: 'ingredient', itemId: '', purchaseUnit: '', quantityOrdered: '', estimatedTotalCost: '',
})

export function supplierOrderLines(supplier, options, purchaseUnitFor = (option) => option.unit) {
  const catalog = new Map(options.map((option) => [`${option.itemType}:${option.id}`, option]))
  const lines = (supplier?.items || []).map((item) => {
    const itemType = item.item_type === 'finished_product' ? 'finished_product' : 'ingredient'
    const option = catalog.get(`${itemType}:${item.ingredient_id || item.finished_product_id}`)
    return option ? {
      itemType: option.itemType,
      itemId: option.id,
      purchaseUnit: purchaseUnitFor(option),
      quantityOrdered: '',
      estimatedTotalCost: '',
    } : null
  }).filter(Boolean)
  return lines.length ? lines : [blankPurchaseOrderLine()]
}

export function suppliersForPurchaseItem(item, suppliers) {
  const linked = suppliers.filter((supplier) => (supplier.items || []).some((entry) =>
    (entry.item_type === item.itemType || (!entry.item_type && item.itemType === 'ingredient'))
    && String(entry.ingredient_id || entry.finished_product_id) === String(item.id)))
  if (linked.length) return linked
  return suppliers.filter((supplier) => supplier.name === item.supplier)
}
