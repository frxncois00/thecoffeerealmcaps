export const DELIVERY_PROOF_LIMIT = 3
export const DELIVERY_MESSAGE_LIMIT = 2000

export function deliveryChatIsOpen(thread, now = Date.now()) {
  if (!thread || thread.closed_at || thread.delivery_chat_closed_at || thread.fulfillment_hold || thread.cancellation_status === 'requested') return false
  if (['Completed', 'Received', 'Cancelled'].includes(thread.status)) return false
  const deadline = thread.confirmation_deadline || thread.delivery_confirmation_deadline
  return !deadline || (Number.isFinite(Date.parse(deadline)) && Date.parse(deadline) > now)
}

export function hasDeliveryChat(order) {
  return order?.order_type === 'delivery' && Boolean(order.delivery_chat_opened_at || ['Ready for Pickup', 'Out for Delivery'].includes(order.status))
}

export function dispatchNeedsTracking(order) {
  return order?.order_type === 'delivery' && order.rider_booking !== 'customer'
}

export function deliveryCountdown(deadline, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000))
  if (!Number.isFinite(seconds)) return ''
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function mergeDeliveryMessages(previous, incoming) {
  const messages = new Map(previous.map(message => [String(message.id), message]))
  incoming.forEach(message => messages.set(String(message.id), message))
  return [...messages.values()].sort((a, b) => BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0)
}

export function openDeliveryChat(orderId) {
  window.dispatchEvent(new CustomEvent('tcr:open-delivery-chat', { detail: { orderId } }))
}
