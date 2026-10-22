export const NOTIFICATION_PAGE_SIZE = 20

export function normalizeNotification(row) {
  return { ...row, eventKey: row.event_key, createdAt: row.created_at, read: Boolean(row.read_at) }
}

export function mergeNotifications(current, incoming) {
  const byId = new Map(current.map(item => [item.id, item]))
  incoming.forEach(item => item.cleared_at ? byId.delete(item.id) : byId.set(item.id, item))
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
}

// These events already have designed operational toasts and existing chimes.
// New events use silent toasts; never replay history on login or pagination.
export function needsSilentToast(notification, role, visible = globalThis.document?.visibilityState !== 'hidden') {
  if (!visible) return false
  if (!notification.toast || notification.read || notification.cleared_at) return false
  const age = Date.now() - new Date(notification.createdAt).getTime()
  if (age < -5000 || age > 60000) return false
  if (notification.event_type === 'daily_restock') return false
  if (role === 'staff' && ['new_order', 'low_stock', 'out_of_stock', 'customer_cancelled', 'cancellation_requested'].includes(notification.event_type)) return false
  return true
}

export function notificationDestination(target, role) {
  if (!target) return null
  if (role === 'customer') {
    if (target.kind === 'order') return { path: '/orders', state: { notificationOrderId: target.id } }
    if (target.kind === 'benefits') return { path: '/profile/benefits' }
    return null
  }
  if (target.kind === 'purchase-order') return { path: `/${role}/purchase-orders`, state: { notificationPurchaseOrderId: target.id } }
  if (target.kind === 'menu-approval') return { path: role === 'admin' ? '/admin/menu-approvals' : '/staff/menu' }
  if (target.kind === 'benefits' && role === 'admin') return { path: '/admin/benefits-verification' }
  if (target.kind === 'message' && role === 'admin') return { path: '/admin/messages', state: { notificationMessageId: target.id } }
  if (['order', 'refund', 'cancellation'].includes(target.kind) && role === 'admin') return { path: '/admin/transactions', state: { notificationOrderId: target.id, notificationOrderNumber: target.orderNumber } }
  return null // Staff order/inventory targets use the existing detailed navigation.
}
