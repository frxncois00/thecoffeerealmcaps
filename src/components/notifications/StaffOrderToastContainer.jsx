import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Ban, Bell, Bike, Coffee, Package, PackageCheck, Volume2, VolumeX, X } from 'lucide-react'
import { money } from '../../utils/money'
import { isSoundMuted, toggleSoundMuted } from '../../utils/notificationSound'

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

  const handleDismiss = () => {
    if (isDismissing) return
    setIsDismissing(true)
    setTimeout(() => onDismiss(id), 300)
  }

  const handleView = () => {
    if (isDismissing) return
    setIsDismissing(true)
    setTimeout(() => {
      onDismiss(id)
      onViewOrder(order)
    }, 150)
  }

  const { label: fulfillmentLabel, Icon: FulfillmentIcon, tone } = fulfillmentLabelAndIcon(order.order_type)
  const itemsTotal = getItemCount(order)
  const orderNumber = order.order_number || `#${String(order.id).slice(0, 8)}`
  const customerName = order.customer_name || 'Customer'
  const totalAmount = order.final_total != null ? money(Number(order.final_total)) : money(Number(order.total_amount || 0))

  return (
    <div
      className={`staff-order-toast ${isDismissing ? 'is-dismissing' : ''}`}
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
            title={`Dismiss order ${orderNumber} notification`}
            aria-label={`Dismiss order ${orderNumber} notification`}
          >
            <X size={16} aria-hidden="true" />
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

    </div>
  )
}

function ActivityToast({ notification, onDismiss, onView, muted, onToggleMute }) {
  const [isDismissing, setIsDismissing] = useState(false)
  const isRestock = notification.target?.kind === 'daily-restock'
  const isCancellation = notification.category === 'cancellations'
  const Icon = isRestock ? PackageCheck : isCancellation ? Ban : AlertTriangle
  const action = isRestock ? 'View products' : isCancellation ? 'View order' : 'View stock'

  const dismiss = () => {
    if (isDismissing) return
    setIsDismissing(true)
    window.setTimeout(() => onDismiss(notification.id), 300)
  }
  const view = () => {
    if (isDismissing) return
    setIsDismissing(true)
    window.setTimeout(() => {
      onDismiss(notification.id)
      onView(notification)
    }, 150)
  }

  return <div className={`staff-order-toast staff-activity-toast${isDismissing ? ' is-dismissing' : ''}`} data-category={notification.category} data-kind={notification.target?.kind} role="alert" aria-live="assertive">
    <div className="staff-order-toast-header">
      <div className="staff-order-toast-badge"><Icon size={15} aria-hidden="true" /><span>{notification.title}</span></div>
      <div className="staff-order-toast-controls">
        <button type="button" className="staff-order-toast-mute-btn" onClick={onToggleMute} title={muted ? 'Unmute notification sound' : 'Mute notification sound'} aria-label={muted ? 'Unmute notification sound' : 'Mute notification sound'}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
        <button type="button" className="staff-order-toast-close-btn" onClick={dismiss} title={`Dismiss ${notification.title} notification`} aria-label={`Dismiss ${notification.title} notification`}><X size={16} aria-hidden="true" /></button>
      </div>
    </div>
    <div className="staff-activity-toast-copy">{notification.message}</div>
    <div className="staff-order-toast-footer"><button type="button" className="staff-order-toast-view-btn" onClick={view}>{action}<ArrowRight size={14} aria-hidden="true" /></button></div>
  </div>
}

export default function StaffOrderToastContainer({ toasts, activityToasts = [], onDismiss, onDismissActivity, onViewOrder, onViewActivity }) {
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

  if ((!toasts || toasts.length === 0) && activityToasts.length === 0) return null

  const visibleToasts = [
    ...(toasts || []).map((toast) => ({ kind: 'order', item: toast })),
    ...activityToasts.map((notification) => ({ kind: 'activity', item: notification })),
  ].sort((a, b) => new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime())

  return (
    <aside
      className="staff-order-toast-container"
      aria-label="Staff activity alerts"
    >
      {visibleToasts.map(({ kind, item }) => kind === 'order'
        ? <SingleOrderToast key={`order:${item.id}`} toast={item} onDismiss={onDismiss} onViewOrder={onViewOrder} muted={muted} onToggleMute={handleToggleMute} />
        : <ActivityToast key={`activity:${item.id}`} notification={item} onDismiss={onDismissActivity} onView={onViewActivity} muted={muted} onToggleMute={handleToggleMute} />)}
    </aside>
  )
}
