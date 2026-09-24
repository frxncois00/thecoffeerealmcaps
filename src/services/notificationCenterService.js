const CENTER_EVENT = 'tcr:notification-center-changed'
const MAX_NOTIFICATIONS = 50
const MAX_SEEN_EVENTS = 500

function storageKey(userId) {
  return `tcr:staff-notifications:${userId || 'anonymous'}`
}

function seenKey(userId) {
  return `tcr:staff-notification-events:${userId || 'anonymous'}`
}

function readStored(userId) {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(userId)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStored(userId, notifications) {
  if (typeof window === 'undefined') return notifications
  window.localStorage.setItem(storageKey(userId), JSON.stringify(notifications))
  window.dispatchEvent(new CustomEvent(CENTER_EVENT, { detail: { userId, notifications } }))
  return notifications
}

export function getStaffNotifications(userId) {
  return readStored(userId)
}

export function addStaffNotification(userId, notification) {
  const existing = readStored(userId)
  if (notification.eventKey) {
    let seen = []
    try { seen = JSON.parse(window.localStorage.getItem(seenKey(userId)) || '[]') } catch { /* Ignore corrupt browser storage. */ }
    if (seen.includes(notification.eventKey)) return existing
    window.localStorage.setItem(seenKey(userId), JSON.stringify([notification.eventKey, ...seen].slice(0, MAX_SEEN_EVENTS)))
  }
  const item = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: notification.title,
    message: notification.message,
    category: notification.category || 'general',
    target: notification.target || null,
    eventKey: notification.eventKey || null,
    createdAt: notification.createdAt || new Date().toISOString(),
    read: false,
  }
  return writeStored(userId, [item, ...existing].slice(0, MAX_NOTIFICATIONS))
}

export function markStaffNotificationRead(userId, notificationId) {
  return writeStored(userId, readStored(userId).map((item) => item.id === notificationId ? { ...item, read: true } : item))
}

export function markAllStaffNotificationsRead(userId) {
  return writeStored(userId, readStored(userId).map((item) => ({ ...item, read: true })))
}

export function clearStaffNotifications(userId) {
  return writeStored(userId, [])
}

export function subscribeToStaffNotifications(userId, callback) {
  if (typeof window === 'undefined') return () => {}
  const receiveCustomEvent = (event) => {
    if (event.detail?.userId === userId) callback(event.detail.notifications)
  }
  const receiveStorageEvent = (event) => {
    if (event.key === storageKey(userId)) callback(readStored(userId))
  }
  window.addEventListener(CENTER_EVENT, receiveCustomEvent)
  window.addEventListener('storage', receiveStorageEvent)
  return () => {
    window.removeEventListener(CENTER_EVENT, receiveCustomEvent)
    window.removeEventListener('storage', receiveStorageEvent)
  }
}
