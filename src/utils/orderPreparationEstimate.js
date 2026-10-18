const roundUpToFive = (minutes) => Math.ceil(minutes / 5) * 5

function itemPrepMinutes(item, menuItem) {
  const value = menuItem?.prep_time_minutes ?? item?.prep_time_minutes
  const configured = value === null || value === undefined || value === '' ? NaN : Number(value)
  if (Number.isFinite(configured) && configured >= 0) return configured
  if (menuItem?.inventory_source === 'products') return 5
  if (menuItem?.item_type === 'drink') return 8
  if (menuItem?.item_type === 'food') return 15
  return 10
}

export function orderPreparationRange(order) {
  const items = order?.order_items
  if (!Array.isArray(items) || items.length === 0) return null

  let madeToOrderUnits = 0
  let readyMadeUnits = 0
  let longestMadeToOrder = 0
  let longestReadyMade = 0

  for (const item of items) {
    const menuItem = Array.isArray(item?.menu_items) ? item.menu_items[0] : item?.menu_items
    const quantity = Math.max(1, Math.floor(Number(item?.quantity) || 1))
    const minutes = itemPrepMinutes(item, menuItem)
    if (menuItem?.inventory_source === 'products') {
      readyMadeUnits += quantity
      longestReadyMade = Math.max(longestReadyMade, minutes)
    } else {
      madeToOrderUnits += quantity
      longestMadeToOrder = Math.max(longestMadeToOrder, minutes)
    }
  }

  if (!madeToOrderUnits) {
    const min = Math.max(5, roundUpToFive(longestReadyMade), Math.ceil(readyMadeUnits / 3) * 5)
    return { min, max: min + 5 }
  }

  const [baseMin, spread] = madeToOrderUnits >= 5 ? [45, 15]
    : madeToOrderUnits >= 3 ? [30, 15]
      : madeToOrderUnits === 2 ? [20, 10] : [10, 5]
  const readyMadeHandling = readyMadeUnits >= 4 ? 5 : 0
  const min = Math.max(baseMin, roundUpToFive(longestMadeToOrder), roundUpToFive(longestReadyMade)) + readyMadeHandling
  return { min, max: min + spread }
}
