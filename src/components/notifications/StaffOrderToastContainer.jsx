import { useEffect, useRef, useState } from 'react'
import { Bell, Bike, Coffee, Package, Volume2, VolumeX, X, ArrowRight } from 'lucide-react'
import { money } from '../../utils/money'
import { isSoundMuted, toggleSoundMuted } from '../../utils/notificationSound'

const TOAST_DURATION_MS = 8000

function fulfillmentLabelAndIcon(type) {
  if (type === 'delivery') {
    return { label: 'Delivery', Icon: Bike, tone: 'delivery' }
  }
  if (type === 'dine-in') {
    return { label: 'Dine-in', Icon: Coffee, tone: 'dine-in' }
  }
  if (type === 'walk-in') {
    return { label: 'Walk-in', Icon: Package, tone: 'walk-in' }
  }
  return { label: 'Pickup', Icon: Package, tone: 'pickup' }
}

function getItemCount(order) {
  if (Array.isArray(order?.order_items) && order.order_items.length > 0) {
    return order.order_items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }
  return Number(order?.total_items || order?.item_count || 1)
}

function SingleOrderToast({ toast, onDismiss, onViewOrder, muted, onToggleMute }) {
  const { order, id } = toast
  const [isDismissing, setIsDismissing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const remainingTimeRef = useRef(TOAST_DURATION_MS)
  const lastStartTimeRef = useRef(Date.now())
  const timerRef = useRef(null)

  const handleDismiss = () => {
    if (isDismissing) return
    setIsDismissing(true)
    setTimeout(() => {
      onDismiss(id)
    }, 320)
  }

  const handleView = () => {
    setIsDismissing(true)
    setTimeout(() => {
      onDismiss(id)
      onViewOrder(order)
    }, 150)
  }

  // Handle timer with pause/resume on hover
  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const elapsed = Date.now() - lastStartTimeRef.current
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
    } else {
      lastStartTimeRef.current = Date.now()
      timerRef.current = setTimeout(() => {
        handleDismiss()
      }, remainingTimeRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isHovered, isDismissing])

  const { label: fulfillmentLabel, Icon: FulfillmentIcon, tone } = fulfillmentLabelAndIcon(order.order_type)
  const itemsTotal = getItemCount(order)
  const orderNumber = order.order_number || `#${String(order.id).slice(0, 8)}`
  const customerName = order.customer_name || 'Customer'
  const totalAmount = order.final_total != null ? money(Number(order.final_total)) : money(Number(order.total_amount || 0))

  return (
    <div
      className={`staff-order-toast ${isDismissing ? 'is-dismissing' : ''} ${isHovered ? 'is-paused' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="alert"
      aria-live="assertive"
    >
      <div className="staff-order-toast-header">
        <div className="staff-order-toast-badge">
          <span className="staff-order-toast-bell-wrap" aria-hidden="true">
            <Bell size={15} className="staff-order-toast-bell-icon" />
          </span>
          <span className="staff-order-toast-title">New Order</span>
        </div>
        <div className="staff-order-toast-controls">
          <button
            type="button"
            className="staff-order-toast-mute-btn"
            onClick={onToggleMute}
            title={muted ? 'Unmute notification sound' : 'Mute notification sound'}
            aria-label={muted ? 'Unmute notification sound' : 'Mute notification sound'}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            type="button"
            className="staff-order-toast-close-btn"
            onClick={handleDismiss}
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="staff-order-toast-body">
        <div className="staff-order-toast-primary-row">
          <strong className="staff-order-toast-number">{orderNumber}</strong>
          <span className="staff-order-toast-amount">{totalAmount}</span>
        </div>

        <div className="staff-order-toast-customer">
          <span className="staff-order-toast-customer-name">{customerName}</span>
        </div>

        <div className="staff-order-toast-meta-row">
          <span className={`staff-order-toast-fulfillment-pill tone-${tone}`}>
            <FulfillmentIcon size={12} aria-hidden="true" />
            <span>{fulfillmentLabel}</span>
          </span>
          <span className="staff-order-toast-items">
            {itemsTotal} {itemsTotal === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      <div className="staff-order-toast-footer">
        <button
          type="button"
          className="staff-order-toast-view-btn"
          onClick={handleView}
        >
          <span>View Order</span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="staff-order-toast-progress-track">
        <div
          className="staff-order-toast-progress-bar"
          style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
        />
      </div>
    </div>
  )
}

export default function StaffOrderToastContainer({ toasts, onDismiss, onViewOrder }) {
  const [muted, setMuted] = useState(() => isSoundMuted())

  useEffect(() => {
    const handleMuteChange = (event) => {
      setMuted(Boolean(event.detail?.muted))
    }
    window.addEventListener('tcr:sound-mute-change', handleMuteChange)
    return () => window.removeEventListener('tcr:sound-mute-change', handleMuteChange)
  }, [])

  const handleToggleMute = () => {
    const next = toggleSoundMuted()
    setMuted(next)
  }

  if (!toasts || toasts.length === 0) return null

  // Stack up to 3 toasts at a time
  const visibleToasts = toasts.slice(0, 3)

  return (
    <aside
      className="staff-order-toast-container"
      aria-label="New order alerts"
    >
      {visibleToasts.map((toast) => (
        <SingleOrderToast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onViewOrder={onViewOrder}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      ))}
    </aside>
  )
}
