export function purchaseOrderToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${date.year}-${date.month}-${date.day}`
}

export function isPastPurchaseOrderDeliveryDate(value, now = new Date()) {
  return Boolean(value) && value < purchaseOrderToday(now)
}
