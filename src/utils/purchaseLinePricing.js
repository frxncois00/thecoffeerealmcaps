export function pricePerPurchaseUnit(line) {
  if (line.fixedUnitPrice != null) return String(line.fixedUnitPrice)
  if (line.priceInput === 'unit') return line.purchaseUnitPrice ?? ''
  const quantity = Number(line.quantityOrdered)
  return quantity > 0 && line.estimatedTotalCost !== ''
    ? String(Number((Number(line.estimatedTotalCost) / quantity).toFixed(6)))
    : ''
}

export function withFixedPurchasePrice(line, baseUnitPrice, factor = 1) {
  const unitPrice = Number((Number(baseUnitPrice) * factor).toFixed(10))
  const quantity = Number(line.quantityOrdered)
  return {
    ...line,
    fixedBaseUnitPrice: Number(baseUnitPrice),
    fixedUnitPrice: String(unitPrice),
    purchaseUnitPrice: String(unitPrice),
    priceInput: 'unit',
    estimatedTotalCost: line.quantityOrdered !== '' && quantity > 0
      ? (quantity * unitPrice).toFixed(2) : '',
  }
}

export function updatePurchaseLine(line, key, value) {
  if (line.fixedUnitPrice != null && key !== 'quantityOrdered') return line
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

export function changePurchaseUnit(line, unit, fromFactor, toFactor) {
  const quantity = Number(line.quantityOrdered)
  if (line.quantityOrdered === '' || !Number.isFinite(quantity) || quantity <= 0) {
    const next = { ...line, purchaseUnit: unit }
    return line.fixedBaseUnitPrice == null ? next : withFixedPurchasePrice(next, line.fixedBaseUnitPrice, toFactor)
  }
  const converted = quantity * fromFactor / toFactor
  if (line.fixedBaseUnitPrice != null) {
    return withFixedPurchasePrice({ ...line, purchaseUnit: unit, quantityOrdered: String(Number(converted.toFixed(6))) }, line.fixedBaseUnitPrice, toFactor)
  }
  return {
    ...line,
    purchaseUnit: unit,
    quantityOrdered: String(Number(converted.toFixed(6))),
    // Keep the line total fixed; the displayed unit price follows the new unit.
    priceInput: 'total',
  }
}
