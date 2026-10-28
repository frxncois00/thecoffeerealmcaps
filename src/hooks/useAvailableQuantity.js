import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { customerSupabase } from '../lib/supabase'
import { createLiveStockAvailability } from '../services/liveStockAvailability'

const availability = createLiveStockAvailability(customerSupabase)

export function useAvailableQuantity(productId, variationId, maxQuantity = 99, includeCart = true) {
  const { items } = useCart()
  const cartKey = includeCart ? JSON.stringify(items.map((item) => [
    item.productId || item.id,
    item.quantity ?? item.qty,
    item.variation?.id || item.customizations?.variation_id || item.customizations?.variantKey || null,
  ])) : '[]'
  const key = JSON.stringify([productId || null, variationId || null, maxQuantity, cartKey])
  const [state, setState] = useState(() => {
    const limit = productId ? availability.cached(key, productId) : null
    return { key, limit, loading: limit === null, error: false }
  })

  useEffect(() => {
    if (!productId) return undefined
    let active = true
    let latestRequest = 0
    const cartItems = JSON.parse(cartKey).map(([id, quantity, variantId]) => ({
      productId: id,
      quantity,
      variation: variantId ? { id: variantId } : null,
    }))
    const refresh = (force = false) => {
      const request = ++latestRequest
      const limit = availability.cached(key, productId)
      setState((current) => current.key === key && current.limit !== null
        ? { ...current, loading: false, error: false }
        : { key, limit, loading: limit === null, error: false })
      void availability.load(key, cartItems, productId, variationId, maxQuantity, force)
        .then((nextLimit) => {
          if (active && request === latestRequest) setState({ key, limit: nextLimit, loading: false, error: false })
        })
        .catch(() => {
          if (active && request === latestRequest) setState({ key, limit: null, loading: false, error: true })
        })
    }
    const refreshWhenVisible = () => { if (!document.hidden) refresh(true) }
    refresh()
    const unsubscribe = availability.subscribe((changedProductId) => {
      if (!changedProductId || changedProductId === productId) refresh(true)
    })
    const timer = window.setInterval(refreshWhenVisible, 30000)
    window.addEventListener('focus', refreshWhenVisible)
    window.addEventListener('online', refreshWhenVisible)
    return () => {
      active = false
      unsubscribe()
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshWhenVisible)
      window.removeEventListener('online', refreshWhenVisible)
    }
  }, [cartKey, key, productId, variationId, maxQuantity])

  if (state.key === key) return state
  const limit = productId ? availability.cached(key, productId) : null
  return { key, limit, loading: limit === null, error: false }
}
