import { withFixedPurchasePrice } from './purchaseLinePricing.js'

export const blankPurchaseOrderLine = () => ({
  itemType: 'ingredient', itemId: '', purchaseUnit: '', quantityOrdered: '', estimatedTotalCost: '',
})

export function supplierOrderLines(supplier, options, purchaseUnitFor = (option) => option.unit) {
  const catalog = new Map(options.map((option) => [`${option.itemType}:${option.id}`, option]))
  const lines = (supplier?.items || []).map((item) => {
    const itemType = item.item_type === 'finished_product' ? 'finished_product' : 'ingredient'
    const option = catalog.get(`${itemType}:${item.ingredient_id || item.finished_product_id}`)
    const line = option ? {
      itemType: option.itemType,
      itemId: option.id,
      purchaseUnit: purchaseUnitFor(option),
      quantityOrdered: '',
      estimatedTotalCost: '',
    } : null
    const price = option ? supplierPriceForItem(supplier, option) : null
    return line && price != null ? withFixedPurchasePrice(line, price) : line
  }).filter(Boolean)
  return lines.length ? lines : [blankPurchaseOrderLine()]
}

export function supplierPriceForItem(supplier, item) {
  const link = (supplier?.items || []).find((entry) =>
    (entry.item_type === item.itemType || (!entry.item_type && item.itemType === 'ingredient'))
    && String(entry.ingredient_id || entry.finished_product_id) === String(item.id))
  const price = Number(link?.unit_price)
  return link?.unit_price != null && Number.isFinite(price) && price > 0 ? price : null
}

export function suppliersForPurchaseItem(item, suppliers) {
  const linked = suppliers.filter((supplier) => (supplier.items || []).some((entry) =>
    (entry.item_type === item.itemType || (!entry.item_type && item.itemType === 'ingredient'))
    && String(entry.ingredient_id || entry.finished_product_id) === String(item.id)))
  if (linked.length) return linked
  return suppliers.filter((supplier) => supplier.name === item.supplier)
}

export function prioritizeSupplierItems(options, selected, query = '') {
  const linked = new Set(selected)
  const search = query.trim().toLowerCase()
  return options
    .filter((item) => !search || item.name.toLowerCase().includes(search))
    .sort((a, b) => Number(linked.has(`${b.itemType}:${b.id}`)) - Number(linked.has(`${a.itemType}:${a.id}`)))
}
