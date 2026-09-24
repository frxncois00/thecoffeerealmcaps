/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { fetchMenuCatalog } from '../services/menuService'
import { customerSupabase as supabase } from '../lib/supabase'

const CartContext = createContext(null)
const LEGACY_GUEST_KEY = 'coffee-realm-guest-cart-v1'
const GUEST_KEY = 'coffee-realm-guest-cart-v2'
const customerKey = (userId) => `coffee-realm-customer-cart-v2:${userId}`
const signature = (item) => [item.productId, item.variation?.id || '', item.temperature || '', item.ice || '', item.sugar || '', item.instructions || '', ...(item.addons || []).map((addon) => addon.id).sort()].join('|')

const readCart = (storageKey) => {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const mergeCarts = (savedItems, incomingItems) => {
  const merged = savedItems.map((item) => ({ ...item }))
  for (const incoming of incomingItems) {
    const match = merged.find((item) => signature(item) === signature(incoming))
    if (match) match.quantity = Number(match.quantity || 0) + Number(incoming.quantity || 0)
    else merged.push(incoming)
  }
  return merged
}

const applyCatalogAvailability = (items, products) => {
  const catalog = new Map(products.map((product) => [String(product.id), product]))
  return items.map((item) => {
    const product = catalog.get(String(item.productId))
    const available = Boolean(product?.available)
    const availabilityReason = available ? '' : product ? 'Ingredients or product stock is currently unavailable' : 'No longer available'
    const onlineBenefitEligible = Boolean(product?.onlineBenefitEligible)
    return item.available === available && item.availabilityReason === availabilityReason && item.onlineBenefitEligible === onlineBenefitEligible
      ? item
      : { ...item, available, availabilityReason, onlineBenefitEligible }
  })
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const ownerKey = authLoading ? null : user?.id ? customerKey(user.id) : GUEST_KEY
  const [cartState, setCartState] = useState({ ownerKey: null, items: [] })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const stateRef = useRef(cartState)
  const availabilityRequestRef = useRef(0)
  stateRef.current = cartState

  // A signed-in cart is scoped to that customer. Logout immediately exposes an
  // empty guest cart, and signing back in restores only that customer's items.
  useEffect(() => {
    if (!ownerKey) return
    const current = stateRef.current
    if (current.ownerKey === ownerKey) return
    let nextItems
    if (ownerKey.startsWith('coffee-realm-customer-cart-v2:')) {
      const savedItems = readCart(ownerKey)
      const guestItems = current.ownerKey === GUEST_KEY
        ? current.items
        : current.ownerKey === null
          ? [...readCart(GUEST_KEY), ...readCart(LEGACY_GUEST_KEY)]
          : []
      nextItems = mergeCarts(savedItems, guestItems)
      if (guestItems.length) {
        localStorage.removeItem(GUEST_KEY)
        localStorage.removeItem(LEGACY_GUEST_KEY)
      }
    } else if (current.ownerKey?.startsWith('coffee-realm-customer-cart-v2:')) {
      nextItems = []
      localStorage.removeItem(GUEST_KEY)
      setDrawerOpen(false)
    } else {
      nextItems = readCart(GUEST_KEY)
      if (!nextItems.length) nextItems = readCart(LEGACY_GUEST_KEY)
      localStorage.removeItem(LEGACY_GUEST_KEY)
    }
    setAvailabilityError('')
    setCartState({ ownerKey, items: nextItems })
  }, [ownerKey])

  useEffect(() => {
    if (!ownerKey || cartState.ownerKey !== ownerKey) return
    localStorage.setItem(ownerKey, JSON.stringify(cartState.items))
  }, [cartState, ownerKey])

  const items = cartState.ownerKey === ownerKey ? cartState.items : []
  const setItems = useCallback((update) => {
    if (!ownerKey) return
    setCartState((current) => {
      const currentItems = current.ownerKey === ownerKey ? current.items : []
      const nextItems = typeof update === 'function' ? update(currentItems) : update
      return { ownerKey, items: nextItems }
    })
  }, [ownerKey])

  const refreshAvailability = useCallback(async () => {
    if (!ownerKey) return { ok: false, available: false }
    const requestId = ++availabilityRequestRef.current
    setCheckingAvailability(true)
    setAvailabilityError('')
    try {
      const { products } = await fetchMenuCatalog()
      const current = stateRef.current
      const currentItems = current.ownerKey === ownerKey ? current.items : []
      const nextItems = applyCatalogAvailability(currentItems, products)
      if (requestId === availabilityRequestRef.current) setCartState({ ownerKey, items: nextItems })
      return { ok: true, available: nextItems.every((item) => item.available !== false) }
    } catch {
      if (requestId === availabilityRequestRef.current) setAvailabilityError('We could not verify current stock. Please try again.')
      return { ok: false, available: false }
    } finally {
      if (requestId === availabilityRequestRef.current) setCheckingAvailability(false)
    }
  }, [ownerKey])

  useEffect(() => {
    if (!ownerKey || cartState.ownerKey !== ownerKey) return undefined
    refreshAvailability()
    const scheduleRefresh = () => refreshAvailability()
    window.addEventListener('focus', scheduleRefresh)
    const channel = supabase.channel(`customer-cart-availability-${user?.id || 'guest'}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, scheduleRefresh)
      .subscribe()
    return () => {
      window.removeEventListener('focus', scheduleRefresh)
      supabase.removeChannel(channel)
    }
  }, [cartState.ownerKey, ownerKey, refreshAvailability, user?.id])

  useEffect(() => {
    if (drawerOpen && items.length) refreshAvailability()
  }, [drawerOpen, items.length, refreshAvailability])

  const addItem = (next) => {
    setItems((current) => {
      const candidate = { ...next, available: true, availabilityReason: '' }
      const itemSignature = signature(candidate)
      const found = current.find((item) => signature(item) === itemSignature)
      return found
        ? current.map((item) => signature(item) === itemSignature ? { ...item, ...candidate, quantity: item.quantity + candidate.quantity } : item)
        : [...current, { ...candidate, lineId: crypto.randomUUID() }]
    })
    setDrawerOpen(true)
  }
  const updateQuantity = (lineId, quantity) => setItems((current) => current.map((item) => item.lineId === lineId ? { ...item, quantity } : item).filter((item) => item.quantity > 0))
  const removeItem = (lineId) => setItems((current) => current.filter((item) => item.lineId !== lineId))
  const clearCart = () => setItems([])
  const openCart = () => setDrawerOpen(true)
  const closeCart = () => setDrawerOpen(false)
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)
  const subtotal = items.reduce((total, item) => total + ((item.unitPrice + (item.addons || []).reduce((sum, addon) => sum + addon.price, 0)) * item.quantity), 0)
  const unavailableItems = items.filter((item) => item.available === false)
  const hasUnavailableItems = unavailableItems.length > 0
  const value = { items, addItem, updateQuantity, removeItem, clearCart, itemCount, subtotal, unavailableItems, hasUnavailableItems, checkingAvailability, availabilityError, refreshAvailability, drawerOpen, openCart, closeCart }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
