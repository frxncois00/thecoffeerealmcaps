import { availableQuantityToAdd } from './cartStock.js'

export function createLiveStockAvailability(client, calculate = availableQuantityToAdd) {
  const cache = new Map()
  const pending = new Map()
  const versions = new Map()
  const listeners = new Set()
  let channel = null

  const currentVersion = (productId) => versions.get(productId) || 0
  const cached = (key, productId) => {
    const entry = cache.get(key)
    return entry && entry.version === currentVersion(productId) ? entry.limit : null
  }

  const load = (key, cartItems, productId, variationId, maxQuantity, force = false) => {
    const version = currentVersion(productId)
    if (!force) {
      const limit = cached(key, productId)
      if (limit !== null) return Promise.resolve(limit)
    }
    const requestKey = `${version}:${key}`
    if (pending.has(requestKey)) return pending.get(requestKey)

    const request = calculate(client, cartItems, productId, variationId, maxQuantity)
      .then((limit) => {
        if (version === currentVersion(productId)) {
          cache.set(key, { productId, version, limit })
          if (cache.size > 300) cache.delete(cache.keys().next().value)
        }
        return limit
      })
      .finally(() => { if (pending.get(requestKey) === request) pending.delete(requestKey) })
    pending.set(requestKey, request)
    return request
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    if (!channel) {
      const nextChannel = client.channel(`customer-live-stock-availability-${crypto.randomUUID()}`)
      channel = nextChannel
      nextChannel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, ({ new: row }) => {
          if (channel !== nextChannel) return
          const productId = row?.id
          if (!productId) return
          versions.set(productId, currentVersion(productId) + 1)
          for (const [key, entry] of cache) {
            if (entry.productId === productId) cache.delete(key)
          }
          for (const notify of listeners) notify(productId)
        })
      nextChannel.subscribe((status) => {
        if (channel === nextChannel && status === 'SUBSCRIBED') for (const notify of listeners) notify(null)
      })
    }
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0 && channel) {
        const oldChannel = channel
        channel = null
        void client.removeChannel(oldChannel)
      }
    }
  }

  return { cached, load, subscribe }
}
