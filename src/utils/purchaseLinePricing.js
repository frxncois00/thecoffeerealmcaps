export function pricePerPurchaseUnit(line) {
  if (line.priceInput === 'unit') return line.purchaseUnitPrice ?? ''
  const quantity = Number(line.quantityOrdered)
  return quantity > 0 && line.estimatedTotalCost !== ''
    ? String(Number((Number(line.estimatedTotalCost) / quantity).toFixed(6)))
    : ''
}

export function updatePurchaseLine(line, key, value) {
  const next = { ...line, [key]: value }
  if (key === 'purchaseUnitPrice') next.priceInput = 'unit'
  if (key === 'estimatedTotalCost') next.priceInput = 'total'
  if (next.priceInput === 'unit' && ['purchaseUnitPrice', 'quantityOrdered'].includes(key)) {
    const quantity = Number(next.quantityOrdered)
    const price = Number(next.purchaseUnitPrice)
    next.estimatedTotalCost = next.purchaseUnitPrice !== '' && quantity > 0 && Number.isFinite(price * quantity)
      ? (price * quantity).toFixed(2)
      : ''
  }
  return next
}
