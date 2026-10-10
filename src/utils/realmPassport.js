export const PASSPORT_ASSETS = '/images/realm-passport/'
export const PASSPORT_REWARDS = [
  ['Free Add-on', 'stamp-05-free-addon.png'],
  ['₱50 off next purchase', 'stamp-10-50-off.png'],
  ['Free Biscoff Cookie', 'stamp-15-free-biscoff.png'],
  ['Free Sandwich', 'stamp-20-free-sandwich.png'],
  ['₱150 off ₱1,000+ order', 'stamp-25-150-off.png'],
  ['Free Drink + 1 Add-on', 'stamp-30-drink-addon.png'],
  ['Free Any Crookie', 'stamp-35-any-crookie.png'],
  ['Free 1 Snack', 'stamp-40-free-snack.png'],
  ['Free Any Pasta', 'stamp-45-any-pasta.png'],
  ['Free Drink + Any Meal', 'stamp-50-drink-meal.png'],
]

export function completedPassportOrders(orders) {
  return [...new Map(orders.filter(order =>
    ['completed', 'received'].includes(String(order.status).trim().toLowerCase()) &&
    !['refunded', 'partially_refunded', 'fully_refunded'].includes(String(order.refund_status).toLowerCase())
  ).map(order => [order.id, order])).values()]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

export function rewardProgress(count, milestone) {
  return Math.min(5, Math.max(0, count - (milestone - 1) * 5))
}

export function passportDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—'
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', options)
}
