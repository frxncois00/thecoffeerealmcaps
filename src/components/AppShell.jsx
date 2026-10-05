import { BarChart3, Bell, Bot, Boxes, CalendarDays, CheckCheck, ClipboardCheck, ClipboardList, Coffee, FileBarChart, LayoutDashboard, LogOut, MenuSquare, Moon, PackageCheck, ReceiptText, RefreshCw, Settings, ShieldCheck, Sun, Trash2, Users, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const rememberedSidebarNavScroll = { admin: null, staff: null }
import { signOutPortal } from '../lib/auth'
import LogoutConfirmModal from './auth/LogoutConfirmModal'
import { useLogoutTransition } from '../context/LogoutTransitionContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { fetchOpsOrdersByIds } from '../services/opsOrderService'
import { fetchFinishedProducts, fetchIngredients } from '../services/opsInventoryService'
import { money } from '../utils/money'
import { DEFAULT_STAFF_PREFERENCES, fetchStaffPreferences, getCachedStaffPreferences, rememberStaffFilters, subscribeToStaffPreferences } from '../services/staffSettingsService'
import {
  addStaffNotification, clearStaffNotifications, getStaffNotifications, markAllStaffNotificationsRead,
  markStaffNotificationRead, subscribeToStaffNotifications,
} from '../services/notificationCenterService'
import { clearManagementSessionState, requestManagementDataRefresh, useManagementSessionState, writeManagementSessionState } from '../hooks/useManagementSessionState'
import StaffOrderToastContainer from './notifications/StaffOrderToastContainer'
import { playOrderChime } from '../utils/notificationSound'
import { raimu } from './raimu/raimuMachine'
import { readRaimuPreference, saveRaimuPreference } from './raimu/useRaimu'


const adminGroups = [
  { label: 'Main', links: [['Dashboard','/admin',LayoutDashboard]] },
  { label: 'Operations', links: [['Inventory Monitoring','/admin/inventory',Boxes],['Purchase Orders','/admin/purchase-orders',ClipboardCheck],['Menu Approvals','/admin/menu-approvals',ClipboardCheck],['Benefits Verification','/admin/benefits-verification',ShieldCheck],['Transaction History','/admin/transactions',ReceiptText]] },
  { label: 'Reports', links: [['Sales Reports','/admin/reports',FileBarChart],['Inventory Report','/admin/inventory-report',ClipboardList],['Cancellation & Refunds','/admin/cancellations',ShieldCheck]] },
  { label: '', links: [['Analytics','/admin/analytics',BarChart3]] },
  { label: 'Administration', links: [['Content Management','/admin/content',MenuSquare],['Raimu Knowledge','/admin/raimu-knowledge',Bot],['Users & Access','/admin/users-access',Users],['System Settings','/admin/settings',Settings]] },
  { label: '', links: [['Settings','/admin/preferences',Settings]] },
]
const staffGroups = [{ label:'', links:[['Order Preparation','/staff',ClipboardList],['Inventory Management','/staff/inventory',Boxes],['Purchase Orders','/staff/purchase-orders',ClipboardCheck],['Manage Menu','/staff/menu',Coffee],['Transactions','/staff/transactions',ReceiptText],['Settings','/staff/settings',Settings]] }]

function notificationTime(value) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (elapsed < 60000) return 'Just now'
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function submittedTime(value) {
  return value ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'just now'
}

async function submitterName(id) {
  if (!id) return 'a staff member'
  const { data } = await supabase.from('profiles').select('full_name,username').eq('id', id).maybeSingle()
  return data?.full_name || data?.username || 'a staff member'
}

export default function AppShell({ role, title, eyebrow, children, actions, titleActions, onRefresh, onNotifications, notificationCount = 0, reportMode = false, hidePageHeader = false, activeOrderId = null }) {
  const groups = role === 'admin' ? adminGroups : staffGroups
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { setTransition: setLogoutTransition } = useLogoutTransition()
  const [logoutError, setLogoutError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [notificationsOpen, setNotificationsOpen] = useManagementSessionState(`${role}:shell:notifications-open`, false)
  const [refreshing, setRefreshing] = useState(false)
  const [raimuVisible, setRaimuVisible] = useState(() => readRaimuPreference('raimu-visible', 'true') !== 'false')
  const [notifications, setNotifications] = useState([])
  const [staffPreferences, setStaffPreferences] = useState(getCachedStaffPreferences)
  const notificationAnchorRef = useRef(null)
  const navRef = useRef(null)
  const { preference, resolvedTheme, setPreference } = useTheme()
  const { profile, user } = useAuth()
  const accountRoleLabel = role === 'admin' ? 'Administrator' : 'Operation Staff'
  const accountDisplayName = profile?.full_name || profile?.username || profile?.email || user?.email || accountRoleLabel
  const accountInitials = accountDisplayName
    .replace(/@.*$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ST'
  const visibleNotifications = notifications.filter((item) => role === 'admin' ? item.category !== 'orders' : item.category !== 'approvals')
  const unreadNotificationCount = visibleNotifications.filter((item) => !item.read).length
  const visibleNotificationCount = Math.max(notificationCount, unreadNotificationCount)
  const [orderToasts, setOrderToasts] = useManagementSessionState(`${role}:shell:order-toasts`, [])

  useEffect(() => {
    if (role !== 'staff' || pathname !== '/staff' || !activeOrderId) return
    setOrderToasts((current) => current.filter((toast) => toast.id !== activeOrderId))
  }, [activeOrderId, pathname, role, setOrderToasts])

  useEffect(() => {
    if (role !== 'staff') return undefined
    const dismissHandledOrder = (event) => {
      const orderId = event.detail?.orderId
      if (orderId) setOrderToasts((current) => current.filter((toast) => toast.id !== orderId))
    }
    window.addEventListener('tcr:staff-order-handled', dismissHandledOrder)
    return () => window.removeEventListener('tcr:staff-order-handled', dismissHandledOrder)
  }, [role, setOrderToasts])
  const [restockToast, setRestockToast] = useState(null)
  const [bellAnimated, setBellAnimated] = useState(false)
  const seenOrderIdsRef = useRef(new Set())
  const prevNotificationCountRef = useRef(visibleNotificationCount)

  const triggerBellRing = () => {
    setBellAnimated(true)
    setTimeout(() => setBellAnimated(false), 800)
  }

  useEffect(() => {
    if (visibleNotificationCount > prevNotificationCountRef.current) {
      triggerBellRing()
      raimu.reactTo('notification')
      if (raimuVisible) raimu.say('New store activity needs a look. Check your notifications.', { duration: 4500, id: `notification-${visibleNotificationCount}` })
    }
    prevNotificationCountRef.current = visibleNotificationCount
  }, [visibleNotificationCount, raimuVisible])

  useEffect(() => {
    const syncRaimu = (event) => setRaimuVisible(event.detail?.visible !== false)
    window.addEventListener('raimu-visibility-change', syncRaimu)
    return () => window.removeEventListener('raimu-visibility-change', syncRaimu)
  }, [])


  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const scrollKey = `tcr:management-scroll:${pathname}`
    const savedPosition = Number(window.sessionStorage.getItem(scrollKey) || 0)
    const restoreFrame = window.requestAnimationFrame(() => window.scrollTo({ top: savedPosition, behavior: 'auto' }))
    let saveFrame = 0
    const rememberPosition = () => {
      window.cancelAnimationFrame(saveFrame)
      saveFrame = window.requestAnimationFrame(() => window.sessionStorage.setItem(scrollKey, String(window.scrollY)))
    }
    window.addEventListener('scroll', rememberPosition, { passive: true })
    return () => {
      window.cancelAnimationFrame(restoreFrame)
      window.cancelAnimationFrame(saveFrame)
      window.removeEventListener('scroll', rememberPosition)
    }
  }, [pathname])

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const saved = rememberedSidebarNavScroll[role] ?? (window.sessionStorage.getItem(`tcr:sidebar-nav-scroll:${role}`) ? Number(window.sessionStorage.getItem(`tcr:sidebar-nav-scroll:${role}`)) : null)
    if (saved !== null && !Number.isNaN(saved)) {
      nav.scrollTop = saved
    }
    const activeLink = nav.querySelector('a.active')
    if (activeLink) {
      activeLink.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      rememberedSidebarNavScroll[role] = nav.scrollTop
      try {
        window.sessionStorage.setItem(`tcr:sidebar-nav-scroll:${role}`, String(nav.scrollTop))
      } catch { /* Session storage may be unavailable. */ }
    }
  }, [pathname, role])

  const handleNavScroll = (e) => {
    const top = e.currentTarget.scrollTop
    rememberedSidebarNavScroll[role] = top
    try {
      window.sessionStorage.setItem(`tcr:sidebar-nav-scroll:${role}`, String(top))
    } catch { /* Session storage may be unavailable. */ }
  }

  useEffect(() => {
    if (!['staff', 'admin'].includes(role) || !user?.id) return undefined
    setNotifications(getStaffNotifications(user.id))
    const unsubscribeNotifications = subscribeToStaffNotifications(user.id, setNotifications)
    const unsubscribePreferences = subscribeToStaffPreferences(setStaffPreferences)
    fetchStaffPreferences(user.id).then(setStaffPreferences).catch(() => setStaffPreferences(DEFAULT_STAFF_PREFERENCES))
    return () => {
      unsubscribeNotifications()
      unsubscribePreferences()
    }
  }, [role, user?.id])

  useEffect(() => {
    if (!['staff', 'admin'].includes(role) || !user?.id || !isSupabaseConfigured) return undefined
    let active = true
    let checking = false
    const checkDailyRestock = async () => {
      if (checking) return
      checking = true
      try {
        const { data: settings, error } = await supabase.from('daily_opening_stock_settings')
          .select('last_run_date,last_run_at').eq('id', true).maybeSingle()
        if (error) throw error
        if (!active || !settings?.last_run_at) return
        const dateParts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(({ type, value }) => [type, value]))
        const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`
        if (settings.last_run_date !== today) return
        const eventKey = `daily-opening-stock-run:${settings.last_run_at}`
        if (getStaffNotifications(user.id).some((item) => item.eventKey === eventKey)) return
        const notification = {
          category: 'inventory', title: 'Daily restock complete',
          message: 'Opening stock has been set for today’s products.',
          target: { kind: 'daily-restock' }, eventKey,
          createdAt: settings.last_run_at,
        }
        const saved = addStaffNotification(user.id, notification).find((item) => item.eventKey === eventKey)
        const justRan = Date.now() - new Date(settings.last_run_at).getTime() < 120000
        if (staffPreferences.system_change_popups && saved && justRan) {
          setRestockToast(saved)
          playOrderChime()
        }
      } catch (error) {
        console.error('[Notification Center] Daily restock check failed:', error)
      } finally {
        checking = false
      }
    }
    void checkDailyRestock()
    const timer = window.setInterval(checkDailyRestock, 10000)
    return () => { active = false; window.clearInterval(timer) }
  }, [role, user?.id, staffPreferences.system_change_popups])

  useEffect(() => {
    if (!restockToast) return undefined
    const timer = window.setTimeout(() => setRestockToast(null), 8000)
    return () => window.clearTimeout(timer)
  }, [restockToast])

  useEffect(() => {
    if (!['staff', 'admin'].includes(role)) return undefined
    const root = document.documentElement
    root.dataset.staffFontSize = staffPreferences.font_size
    root.dataset.staffMotion = staffPreferences.reduced_motion
    return () => {
      delete root.dataset.staffFontSize
      delete root.dataset.staffMotion
    }
  }, [role, staffPreferences.font_size, staffPreferences.reduced_motion])

  useEffect(() => {
    if (!notificationsOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!notificationAnchorRef.current?.contains(event.target)) setNotificationsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [notificationsOpen, setNotificationsOpen])

  useEffect(() => {
    if (!['staff', 'admin'].includes(role) || !user?.id || !isSupabaseConfigured) return undefined
    const add = (notification) => {
      try { return addStaffNotification(user.id, notification) }
      catch (error) { console.error('[Notification Center] Could not save alert:', error); return null }
    }
    const channel = supabase.channel(`management-notification-center-${user.id}`)
    let active = true
    const stockByKey = new Map()
    let stockReady = false
    const pendingStockEvents = []

    const handleStock = async (payload, itemType) => {
      const stock = payload.new
      if (!stock || payload.eventType === 'DELETE') return
      const itemId = itemType === 'ingredient' ? stock.ingredient_id : stock.id
      if (!itemId) return
      const key = `${itemType}:${itemId}`
      const saved = stockByKey.get(key)
      const old = payload.old?.quantity == null ? saved : {
        ...saved, quantity: Number(payload.old.quantity), minimum: Number(payload.old.min_stock_level ?? saved?.minimum ?? 0),
      }
      const quantity = Number(stock.quantity)
      const minimum = Number(stock.min_stock_level)
      if (!Number.isFinite(quantity) || !Number.isFinite(minimum)) return
      let name = stock.name || saved?.name
      let unit = stock.unit || saved?.unit
      if (!name) {
        const table = itemType === 'ingredient' ? 'ingredients' : 'finished_products'
        const { data } = await supabase.from(table).select('name,unit,is_archived').eq('id', itemId).maybeSingle()
        if (!active || data?.is_archived) return
        name = data?.name || 'Inventory item'
        unit = data?.unit || 'units'
      }
      stockByKey.set(key, { quantity, minimum, name, unit })
      const wasLow = old && old.quantity <= old.minimum
      if (!staffPreferences.notify_low_stock || quantity > minimum || wasLow || (payload.eventType !== 'INSERT' && !old)) return
      add({
        category: 'inventory', title: quantity <= 0 ? 'Out of stock' : 'Low stock',
        message: `${name} running low — ${quantity} ${unit || 'units'} left`,
        target: { kind: 'inventory', itemType, itemId, name },
        eventKey: `stock:${key}:${payload.commit_timestamp || stock.updated_at || Date.now()}`,
        createdAt: payload.commit_timestamp,
      })
    }

    const receiveStock = (payload, itemType) => {
      if (!stockReady) pendingStockEvents.push([payload, itemType])
      else void handleStock(payload, itemType)
    }

    Promise.all([fetchIngredients(), fetchFinishedProducts()]).then(([ingredients, products]) => {
      if (!active) return
      ingredients.forEach((item) => stockByKey.set(`ingredient:${item.id}`, { quantity: item.quantity, minimum: item.minStockLevel, name: item.name, unit: item.unit }))
      products.forEach((item) => stockByKey.set(`finished_product:${item.id}`, { quantity: item.quantity, minimum: item.minStockLevel, name: item.name, unit: item.unit }))
      stockReady = true
      pendingStockEvents.splice(0).forEach(([payload, itemType]) => void handleStock(payload, itemType))
    }).catch((error) => {
      console.error('[Notification Center] Stock baseline failed:', error)
      stockReady = true
      pendingStockEvents.splice(0).forEach(([payload, itemType]) => void handleStock(payload, itemType))
    })

    // A single wildcard binding receives the same postgres_changes stream as
    // Order Preparation. Multiple table/event bindings on one channel were
    // reporting SUBSCRIBED but did not deliver any events in the live project.
    channel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (!active) return
      const { table, eventType, new: row, old, commit_timestamp: createdAt } = payload
      if (table === 'orders') {
        if (eventType === 'INSERT' && role === 'staff') {
          const orderId = row?.id
          if (orderId && !seenOrderIdsRef.current.has(orderId)) {
            seenOrderIdsRef.current.add(orderId)
            playOrderChime()
            triggerBellRing()
            const initialToast = {
              id: orderId,
              order: {
                id: orderId,
                order_number: row.order_number,
                customer_name: row.customer_name,
                order_type: row.order_type,
                total_items: row.total_items,
                final_total: row.final_total,
                created_at: row.created_at || createdAt,
              },
              createdAt: Date.now(),
            }
            setOrderToasts((current) => [initialToast, ...current.filter((t) => t.id !== orderId)])

            fetchOpsOrdersByIds([orderId]).then(([fullOrder]) => {
              if (fullOrder && active) {
                setOrderToasts((current) => current.map((t) => t.id === orderId ? { ...t, order: fullOrder } : t))
              }
            }).catch(() => {})
          }

          if (staffPreferences.notify_new_orders) {
            add({
              category: 'orders', title: 'New order',
              message: `New order ${row.order_number || ''} from ${row.customer_name || 'Customer'} · ${money(Number(row.final_total || 0))}`,
              target: { kind: 'order', id: row.id }, eventKey: `order:${row.id}`, createdAt,
            })
          }
        }
        if (eventType === 'UPDATE' && staffPreferences.notify_payment_proofs && row?.payment_proof_path && row.payment_proof_path !== old?.payment_proof_path) {
          add({ category: 'payments', title: 'Payment proof received', message: row.order_number ? `${row.order_number} needs payment verification.` : 'A payment proof needs verification.' })
        }
        if (eventType === 'UPDATE' && staffPreferences.notify_customer_cancellations) {
          const reviewRequested = row?.cancellation_status === 'requested' && old?.cancellation_status !== 'requested' && row.cancellation_requested_by_role === 'Customer'
          const cancelled = row?.status === 'Cancelled' && old?.status !== 'Cancelled' && row.cancelled_by_role === 'Customer'
          if (reviewRequested || cancelled) {
            const label = row.order_number || 'An order'
            const reason = row.cancellation_reason ? ` Reason: ${row.cancellation_reason}.` : ''
            add({ category: 'cancellations', title: reviewRequested ? 'Cancellation review requested' : 'Customer cancellation',
              message: reviewRequested ? `${label} is on hold while payment and refund requirements are reviewed.${reason}` : `${label} was cancelled by the customer. No verified payment was recorded.${reason}` })
          }
        }
      } else if (staffPreferences.notify_low_stock && table === 'inventory_stock') receiveStock(payload, 'ingredient')
      else if (staffPreferences.notify_low_stock && table === 'finished_products') receiveStock(payload, 'finished_product')
      else if (role === 'admin' && table === 'purchase_orders' && eventType !== 'DELETE' && row) {
        const status = row.status
        if (!['pending_approval', 'returned'].includes(status)) return
        const when = status === 'pending_approval' ? row.submitted_at : row.closed_at
        if (!when) return
        void submitterName(status === 'pending_approval' ? row.submitted_by : row.closed_by).then((submitter) => {
          if (!active) return
          const returned = status === 'returned'
          add({ category: returned ? 'inventory' : 'approvals', title: returned ? 'Purchase order returned' : 'Purchase Order approval needed',
            message: returned ? `${row.po_number || 'Purchase order'} was returned by ${submitter} on ${submittedTime(when)}. No stock was added.` : `Purchase Order ${row.po_number || ''} submitted by ${submitter} on ${submittedTime(when)}, needs approval`,
            target: { kind: 'purchase-order', id: row.id }, eventKey: `approval:po:${row.id}:${status}:${when}`, createdAt: createdAt || when })
        })
      } else if (role === 'admin' && table === 'menu_change_approvals' && eventType === 'INSERT' && row?.state === 'pending' && !['set_availability', 'bulk_availability'].includes(row.operation)) {
        void submitterName(row.submitted_by).then((submitter) => {
          if (!active) return
          add({ category: 'approvals', title: 'Menu approval needed',
            message: `${row.item_name || 'Menu edit'} (${row.action || 'change'}) submitted by ${submitter} on ${submittedTime(row.created_at)}, needs approval`,
            target: { kind: 'menu-approval', id: row.id }, eventKey: `approval:menu:${row.id}`, createdAt: createdAt || row.created_at })
        })
      } else if (table === 'menu_items' && staffPreferences.notify_menu_changes) {
        const name = row?.name || old?.name || 'A menu item'
        const action = eventType === 'INSERT' ? 'was added' : eventType === 'DELETE' ? 'was removed' : 'was updated'
        add({ category: 'menu', title: 'Menu changed', message: `${name} ${action}.` })
      }
    })

    channel.subscribe((status) => {
      if (!active) return
      if (status === 'SUBSCRIBED') console.info('[Notification Center] Realtime channel:', status)
      else console.warn('[Notification Center] Realtime channel:', status)
    })
    return () => { active = false; supabase.removeChannel(channel) }
  }, [role, setOrderToasts, staffPreferences.notify_customer_cancellations, staffPreferences.notify_low_stock, staffPreferences.notify_menu_changes, staffPreferences.notify_new_orders, staffPreferences.notify_payment_proofs, user?.id])

  useEffect(() => {
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (!themeColor) return undefined
    const previous = themeColor.getAttribute('content')
    themeColor.setAttribute('content', resolvedTheme === 'dark' ? '#080E0E' : '#ffffff')
    return () => themeColor.setAttribute('content', previous || '#1b2f22')
  }, [resolvedTheme])

  const refreshPage = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      if (onRefresh) await onRefresh()
      else requestManagementDataRefresh(pathname)
    } finally {
      window.setTimeout(() => setRefreshing(false), 350)
    }
  }

  const openNotifications = () => {
    if (onNotifications) onNotifications()
    else if (role === 'staff' || role === 'admin') setNotificationsOpen((current) => !current)
  }

  const readNotification = (notificationId) => markStaffNotificationRead(user?.id, notificationId)
  const openNotification = async (notification) => {
    readNotification(notification.id)
    const target = notification.target
    if (!target) return
    setNotificationsOpen(false)
    writeManagementSessionState(`${role}:shell:notifications-open`, false)
    if (target.kind === 'order' && role === 'staff') {
      try {
        const [order] = await fetchOpsOrdersByIds([target.id])
        if (order) writeManagementSessionState('staff:orders:drawer', order)
      } catch (error) { console.error('[Notification Center] Could not open order:', error) }
      navigate('/staff')
    } else if (target.kind === 'inventory' || target.kind === 'daily-restock') {
      const itemType = target.kind === 'daily-restock' ? 'finished_product' : target.itemType
      const name = target.kind === 'daily-restock' ? '' : target.name
      if (role === 'admin') {
        writeManagementSessionState('admin:inventory:entity', itemType)
        writeManagementSessionState('admin:inventory:search', name)
        writeManagementSessionState('admin:inventory:category', 'all')
        writeManagementSessionState('admin:inventory:status', 'all')
        writeManagementSessionState('admin:inventory:type', 'all')
        writeManagementSessionState('admin:inventory:page', 1)
        navigate('/admin/inventory')
      } else {
        rememberStaffFilters('inventory', { activeEntity: itemType, search: name, categoryFilter: 'all', statusFilter: 'all', typeFilter: 'all', sortBy: 'name' })
        navigate('/staff/inventory', { state: { notificationInventory: { itemType, name, openedAt: Date.now() } } })
      }
    } else if (role === 'admin' && target.kind === 'purchase-order') navigate('/admin/purchase-orders')
    else if (role === 'admin' && target.kind === 'menu-approval') navigate('/admin/menu-approvals')
  }
  const readAllNotifications = () => markAllStaffNotificationsRead(user?.id)
  const clearNotifications = () => clearStaffNotifications(user?.id)
  const toggleRaimu = () => {
    const visible = !raimuVisible
    setRaimuVisible(visible)
    saveRaimuPreference('raimu-visible', visible)
    window.dispatchEvent(new CustomEvent('raimu-visibility-change', { detail: { visible } }))
  }

  async function confirmLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutOpen(false)
    setLogoutError('')

    const fullName = (profile?.full_name || user?.user_metadata?.full_name || '').trim()
    const firstName = fullName && fullName !== 'Coffee Realm Customer'
      ? fullName.split(/\s+/)[0]
      : (profile?.username || user?.email?.split('@')[0] || '')

    setLogoutTransition({
      active: true,
      statusText: 'Signing you out…',
      isExiting: false,
      isComplete: false,
    })

    const startTime = Date.now()
    try {
      await signOutPortal()
      clearManagementSessionState()
    } catch (error) {
      console.error('Portal logout failed:', error)
      setLogoutTransition(null)
      setLoggingOut(false)
      setLogoutError(error?.message || 'Unable to log out right now. Please try again.')
      return
    }

    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, 1500 - elapsed)
    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime))
    }

    setLogoutTransition((prev) => (prev ? {
      ...prev,
      statusText: firstName ? `See you next time, ${firstName}` : 'See you next time',
      isComplete: true,
    } : null))
    await new Promise((resolve) => setTimeout(resolve, 650))

    // Navigate to /portal while root overlay is 100% opaque!
    navigate('/portal', { replace: true })

    // Give React Router 60ms to mount PortalPage under the overlay
    await new Promise((resolve) => setTimeout(resolve, 60))

    setLogoutTransition((prev) => (prev ? { ...prev, isExiting: true } : null))
    await new Promise((resolve) => setTimeout(resolve, 320))

    setLogoutTransition(null)
    setLoggingOut(false)
  }

  const handleDismissOrderToast = (id) => {
    setOrderToasts((current) => current.filter((t) => t.id !== id))
  }

  const handleViewOrderToast = async (order) => {
    if (!order) return
    try {
      const fullOrder = order.order_items ? order : (await fetchOpsOrdersByIds([order.id]))[0] || order
      writeManagementSessionState('staff:orders:drawer', fullOrder)
    } catch {
      writeManagementSessionState('staff:orders:drawer', order)
    }
    if (pathname !== '/staff') {
      navigate('/staff')
    }
  }

  const themeOptions = [
    ['light', 'Light theme', Sun],
    ['dark', 'Dark theme', Moon],
  ]

  return <div className={`app-layout legacy-${role}${reportMode ? ' report-workspace' : ''}`} data-theme={resolvedTheme} data-staff-density={staffPreferences.table_density} data-staff-contrast={String(staffPreferences.high_contrast)} data-staff-overdue={role === 'staff' ? String(staffPreferences.overdue_highlighting) : undefined}>
    <aside className="sidebar internal-sidebar">
      <div className="internal-brand"><img src="/images/coffeerealmlogo.png" alt="The Coffee Realm logo"/><div><h2>The Coffee Realm</h2>{role === 'admin' && <p>Admin Portal</p>}</div></div>
      <nav ref={navRef} onScroll={handleNavScroll} aria-label={`${role} navigation`}>{groups.map(group => <div className="internal-nav-group" key={group.label || group.links[0][1]}>{group.label && <span className="internal-group-label">{group.label}</span>}{group.links.map(([label,to,Icon]) => <NavLink key={to} to={to} end={to === `/${role}`} title={label} onClick={() => { if (navRef.current) { rememberedSidebarNavScroll[role] = navRef.current.scrollTop } }}><Icon size={20}/><span>{label}</span></NavLink>)}</div>)}</nav>
      <div className="sidebar-footer-stack">
        <div className="sidebar-theme-switcher" role="group" aria-label="Theme options">
          {themeOptions.map(([value, label, Icon]) => <button key={value} type="button" className={resolvedTheme === value ? 'active' : ''} aria-label={label} aria-pressed={resolvedTheme === value} title={`${label}${preference ? '' : ' (system preference)'}`} onClick={() => setPreference(value)}><Icon size={18} aria-hidden="true"/></button>)}
        </div>
        <button type="button" className="sidebar-staff-profile" onClick={() => navigate(role === 'admin' ? '/admin/preferences' : '/staff/settings')} title={`Open profile for ${accountDisplayName}`} aria-label={`Open profile for ${accountDisplayName}, ${accountRoleLabel}`}>
          <span className="sidebar-staff-avatar" aria-hidden="true">{accountInitials}</span>
          <span className="sidebar-staff-profile-copy"><strong>{accountDisplayName}</strong><small>{accountRoleLabel}</small></span>
        </button>
        <button className="sidebar-exit" type="button" onClick={() => setLogoutOpen(true)}><LogOut size={19}/><span>Logout</span></button>
      </div>
    </aside>
    <main className="app-main internal-main">{!hidePageHeader && <header className={`page-header internal-page-header${eyebrow ? '' : ' is-compact'}${role === 'admin' ? ' is-admin-surface-header' : ''}`}><div><div className={`internal-title-row${titleActions ? ' has-title-actions' : ''}`}><h1>{title}</h1>{titleActions}</div>{eyebrow && <span>{eyebrow}</span>}</div><div className="header-actions"><div className="internal-utility-bar" aria-label="Workspace utilities"><div className="internal-live-datetime">{role === 'admin' && title === 'Dashboard' && <CalendarDays size={16} aria-hidden="true" />}<div className="internal-live-datetime-copy"><span>{new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', ...(reportMode ? { timeZone: 'Asia/Manila' } : {}) }).format(now)}</span><b>{new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, ...(reportMode ? { timeZone: 'Asia/Manila' } : {}) }).format(now)} PHT</b></div></div><button type="button" className={`internal-utility-button raimu-toggle${raimuVisible ? ' is-active' : ''}`} aria-label={reportMode ? 'AI assistant' : raimuVisible ? 'Close Raimu support assistant' : 'Open Raimu support assistant'} aria-pressed={raimuVisible} title={raimuVisible ? 'Close Raimu support assistant' : 'Open Raimu support assistant'} onClick={toggleRaimu}><Bot size={18} aria-hidden="true" /></button><div className={`internal-notification-anchor ${bellAnimated ? 'is-ringing' : ''}`} ref={notificationAnchorRef}><button type="button" className="internal-utility-button" aria-label={reportMode ? `Notifications${visibleNotificationCount ? `, ${visibleNotificationCount} unread` : ''}` : `Open notifications${visibleNotificationCount ? `, ${visibleNotificationCount} unread` : ''}`} aria-expanded={['staff', 'admin'].includes(role) ? notificationsOpen : undefined} aria-controls={role === 'staff' ? 'staff-notification-center' : undefined} title="Notifications" onClick={openNotifications}><Bell size={18} />{visibleNotificationCount > 0 && <span className={`internal-utility-badge ${bellAnimated ? 'is-popping' : ''}`}>{visibleNotificationCount > 99 ? '99+' : visibleNotificationCount}</span>}</button>{['staff', 'admin'].includes(role) && notificationsOpen && <aside className="staff-notification-center" id="staff-notification-center" role="dialog" aria-modal="false" aria-labelledby="staff-notification-title"><header><div><span>Notification center</span><h2 id="staff-notification-title">Recent activity</h2></div><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={18} /></button></header><div className="staff-notification-actions"><button type="button" onClick={readAllNotifications} disabled={!unreadNotificationCount}><CheckCheck size={16} />Read all</button><button type="button" className="is-destructive" onClick={clearNotifications} disabled={!visibleNotifications.length}><Trash2 size={16} />Clear</button></div><div className="staff-notification-list">{visibleNotifications.length ? visibleNotifications.map((notification) => <button type="button" className={notification.read ? 'is-read' : 'is-unread'} data-category={notification.category} key={notification.id} onClick={() => void openNotification(notification)}><i aria-hidden="true" /><span><b>{notification.title}</b><small>{notification.message}</small><time dateTime={notification.createdAt}>{notificationTime(notification.createdAt)}</time></span></button>) : <div className="staff-notification-empty"><Bell size={22} /><b>{role === 'admin' && notificationCount > 0 ? `${notificationCount} items need attention` : 'You’re all caught up'}</b><span>{role === 'admin' && notificationCount > 0 ? 'Review the dashboard attention cards for details.' : 'Operational alerts will stack here as they arrive.'}</span></div>}</div><footer><button type="button" onClick={() => { setNotificationsOpen(false); navigate(role === 'admin' ? '/admin/preferences' : '/staff/settings') }}>Notification settings</button></footer></aside>}</div><button type="button" className="internal-utility-button" aria-label={reportMode ? 'Refresh data' : refreshing ? 'Refreshing current page data' : 'Refresh current page data'} aria-busy={refreshing} title={refreshing ? 'Refreshing data…' : 'Refresh data'} onClick={refreshPage} disabled={refreshing}><RefreshCw size={18} className={refreshing ? 'spin' : ''} /></button></div>{actions}</div></header>}{children}</main>
    {role === 'staff' && (
      <StaffOrderToastContainer
        toasts={orderToasts}
        onDismiss={handleDismissOrderToast}
        onViewOrder={handleViewOrderToast}
      />
    )}
    {restockToast && <div className="daily-restock-toast" role="alert" aria-live="assertive">
      <span className="daily-restock-toast-icon" aria-hidden="true"><PackageCheck size={24} /></span>
      <div className="daily-restock-toast-copy"><small>DAILY RESTOCK</small><b>{restockToast.title}</b><span>{restockToast.message}</span></div>
      <button type="button" className="daily-restock-toast-view" onClick={() => { setRestockToast(null); void openNotification(restockToast) }}>View products</button>
      <button type="button" className="daily-restock-toast-close" aria-label="Dismiss daily restock notification" onClick={() => setRestockToast(null)}><X size={16} /></button>
    </div>}
    <LogoutConfirmModal open={logoutOpen} busy={loggingOut} onCancel={() => setLogoutOpen(false)} onConfirm={confirmLogout} />
    {logoutError && (
      <div className="customer-logout-error-banner" role="alert">
        <span>{logoutError}</span>
        <button type="button" onClick={() => setLogoutError('')} aria-label="Dismiss error">
          <X size={16} />
        </button>
      </div>
    )}

  </div>
}
