export function pickPurchaseOrderUpdate(previousOrders, nextOrders, isAdmin) {
  const previousById = new Map(previousOrders.map((order) => [order.id, order]))
  const changed = nextOrders.find((order) => previousById.has(order.id) && previousById.get(order.id).status !== order.status)
  if (changed) return { type: 'status', order: changed }
  const arrived = isAdmin && nextOrders.find((order) => !previousById.has(order.id))
  return arrived ? { type: 'new', order: arrived } : null
}

export function hasBellPurchaseOrderToast(update, isAdmin) {
  if (!update) return false
  const status = update.order.status
  return isAdmin
    ? ['pending_approval', 'returned'].includes(status)
    : update.type === 'status' && ['approved', 'rejected'].includes(status)
}
