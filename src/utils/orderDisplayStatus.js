const READY_STATUSES = new Set(['ready for pickup', 'ready to claim', 'ready'])

export function isDeliveryReady(order) {
  return (order?.order_type || order?.fulfillment) === 'delivery'
    && READY_STATUSES.has(String(order?.status || '').trim().toLowerCase())
}

export function orderDisplayStatus(order) {
  const status = String(order?.status || '').trim()
  if (!READY_STATUSES.has(status.toLowerCase())) return status
  return (order?.order_type || order?.fulfillment) === 'delivery'
    ? 'Ready for Delivery'
    : 'Ready to Claim'
}

export function customerOrderDisplayStatus(order) {
  return isDeliveryReady(order) ? 'Preparing' : orderDisplayStatus(order)
}

export function orderTrackingSteps(order, initialStatus) {
  const shared = [initialStatus, 'Confirmed', 'Preparing']
  return (order?.order_type || order?.fulfillment) === 'pickup'
    ? [...shared, 'Ready to Claim', 'Completed']
    : [...shared, 'Out for Delivery', 'Received']
}
