import { Bell, Check, CheckCheck, ChevronRight, X } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useNotificationHistory } from '../../hooks/useNotificationHistory'
import { needsSilentToast, notificationDestination } from '../../utils/notifications'
import { shouldShowSystemNotification } from '../../services/staffSettingsService'
import './notification-history.css'

function timeLabel(value) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function customerTimeLabel(value) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }).format(new Date(value))
}

export default function NotificationBell({ userId, role, onOpen, animated = false }) {
  const [open, setOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [customerFilter, setCustomerFilter] = useState('all')
  const [toasts, setToasts] = useState([])
  const panel = useRef(null)
  const anchor = useRef(null)
  const button = useRef(null)
  const closeButton = useRef(null)
  const timers = useRef(new Set())
  const panelId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const feed = useNotificationHistory(userId, role, item => {
    if (!needsSilentToast(item, role) || (role !== 'customer' && !shouldShowSystemNotification('success'))) return
    setToasts(current => [item, ...current].slice(0, 3))
    const timer = window.setTimeout(() => {
      setToasts(current => current.filter(value => value.id !== item.id))
      timers.current.delete(timer)
    }, 8000)
    timers.current.add(timer)
  })
  useEffect(() => {
    const pending = timers.current
    const receive = event => {
      if (role !== 'customer' || event.detail?.userId !== userId) return
      const item = { id: crypto.randomUUID(), title: event.detail.title, message: event.detail.message }
      setToasts(current => [item, ...current].slice(0, 3))
      const timer = window.setTimeout(() => {
        setToasts(current => current.filter(value => value.id !== item.id))
        pending.delete(timer)
      }, 5000)
      pending.add(timer)
    }
    window.addEventListener('tcr:customer-toast', receive)
    return () => { pending.forEach(window.clearTimeout); window.removeEventListener('tcr:customer-toast', receive) }
  }, [role, userId])
  useEffect(() => { setOpen(false); setConfirmClear(false) }, [location.key])
  useEffect(() => {
    if (!open) return undefined
    closeButton.current?.focus()
    const outside = event => { if (!anchor.current?.contains(event.target)) { setOpen(false); setConfirmClear(false) } }
    const escape = event => {
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); setConfirmClear(false); button.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])

  // The top layer escapes page stacking contexts while retaining theme inheritance.
  useLayoutEffect(() => {
    if (!open || role === 'customer') return undefined
    const element = panel.current
    if (!element?.showPopover) return undefined
    const position = () => {
      const rect = button.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(380, window.innerWidth - 24)
      element.style.left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)) + 'px'
      element.style.top = (rect.bottom + 12) + 'px'
      element.style.maxHeight = Math.max(0, window.innerHeight - rect.bottom - 24) + 'px'
    }
    element.showPopover()
    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
      if (element.matches(':popover-open')) element.hidePopover()
    }
  }, [open, role])

  const visit = item => {
    void feed.markRead(item.id)
    setToasts(current => current.filter(value => value.id !== item.id))
    const destination = notificationDestination(item.target, role)
    if (!destination && !item.target) return
    setOpen(false)
    if (destination) navigate(destination.path, { state: destination.state })
    else onOpen?.(item)
  }
  const run = async action => { if (working) return; setWorking(true); try { await action() } finally { setWorking(false) } }
  const clearNotifications = async () => {
    if (working) return
    setWorking(true)
    try { if (await feed.clear()) setConfirmClear(false) } finally { setWorking(false) }
  }
  const visibleItems = role === 'customer' && customerFilter === 'unread' ? feed.items.filter(item => !item.read) : feed.items
  const toastList = <div className={`notification-silent-toasts${role === 'customer' ? ' is-customer' : ' is-internal'}`} aria-live="polite" aria-relevant="additions">
    {toasts.map(item => <div className="notification-silent-toast" key={item.id} role="status"><div><strong>{item.title}</strong>{item.message && <p>{item.message}</p>}{item.target && <button type="button" onClick={() => visit(item)}>View<ChevronRight size={14} /></button>}</div><button type="button" aria-label={`Dismiss ${item.title}`} onClick={() => setToasts(current => current.filter(value => value.id !== item.id))}><X size={17} /></button></div>)}
  </div>
  return <>
    <div ref={anchor} className={`notification-anchor ${animated ? 'is-ringing' : ''}`}>
      <button ref={button} type="button" className={role === 'customer' ? 'notification-bell-button' : 'internal-utility-button notification-bell-button'} aria-label={`Notifications${feed.unread ? `, ${feed.unread} unread` : ''}`} aria-expanded={open} aria-controls={panelId} onClick={() => { setConfirmClear(false); setOpen(value => !value) }}>
        <Bell size={19} />{feed.unread > 0 && <span className="notification-badge">{feed.unread > 99 ? '99+' : feed.unread}</span>}
      </button>
      {open && <section ref={panel} popover={role === 'customer' ? undefined : 'manual'} id={panelId} className={`notification-panel${role === 'customer' ? ' is-customer' : ''}`} role="dialog" aria-label="Notifications">
        <header><strong>Notifications{role === 'customer' && <span className="notification-header-count" aria-label={`${feed.unread} unread`}>{feed.unread}</span>}</strong><button ref={closeButton} type="button" aria-label="Close notifications" onClick={() => { setOpen(false); setConfirmClear(false); button.current?.focus() }}><X size={role === 'customer' ? 20 : 18} /></button></header>
        <div className="notification-tools">
          {role === 'customer' && <div className="notification-filters" role="group" aria-label="Filter notifications"><button type="button" className={customerFilter === 'all' ? 'is-active' : ''} aria-pressed={customerFilter === 'all'} onClick={() => setCustomerFilter('all')}>All</button><button type="button" className={customerFilter === 'unread' ? 'is-active' : ''} aria-pressed={customerFilter === 'unread'} onClick={() => setCustomerFilter('unread')}>Unread</button></div>}
          <div className="notification-tool-actions">
          <button type="button" disabled={!feed.unread || working} onClick={() => void run(() => feed.markRead())}><CheckCheck size={15} />Mark all as read</button>
          {role === 'customer' && <button type="button" disabled={!feed.items.length || working} onClick={() => setConfirmClear(true)}>Clear</button>}
          </div>
        </div>
        {role === 'customer' && confirmClear && <div className="notification-clear-confirm" role="group" aria-label="Confirm clear notifications">
          <p aria-live="polite">Clear all notifications? This can't be undone.</p>
          <div><button type="button" disabled={working} onClick={() => setConfirmClear(false)}>Cancel</button><button type="button" disabled={working} onClick={() => void clearNotifications()}>{working ? 'Clearing…' : 'Clear all'}</button></div>
        </div>}
        <div className="notification-scroll" aria-busy={feed.loading}>
          {feed.error && <div className="notification-empty" role="status">{feed.error}<button type="button" disabled={feed.loading} onClick={() => void feed.load()}>Retry</button></div>}
          {!visibleItems.length && !feed.error && <p className="notification-empty">{feed.loading ? 'Loading…' : customerFilter === 'unread' && role === 'customer' ? feed.hasMore ? 'No unread notifications here. Load more to check older ones.' : 'No unread notifications' : 'No notifications yet'}</p>}
          {visibleItems.map(item => <article key={item.id} className={`notification-row ${item.read ? 'is-read' : 'is-unread'}`}>
            <button type="button" className="notification-content" onClick={() => visit(item)} aria-label={`${item.read ? '' : 'Unread: '}${item.title}${item.message ? `, ${item.message}` : ''}${item.target ? ', view details' : ', mark as read'}`}>
              {role === 'customer' ? <span className="notification-copy"><span className="notification-title-line"><b>{item.title}</b>{item.target?.orderNumber && <span className="notification-order-number">{item.target.orderNumber}</span>}</span><time dateTime={item.createdAt}>{customerTimeLabel(item.createdAt)}</time></span> : <><span className="notification-dot" /><span className="notification-copy"><b>{item.title}</b>{item.message && <small>{item.message}</small>}<time dateTime={item.createdAt}>{timeLabel(item.createdAt)}</time></span>{item.target && <ChevronRight size={15} />}</>}
            </button>
            {!item.read && role !== 'customer' && <button type="button" className="notification-read" aria-label={`Mark ${item.title} as read`} disabled={working} onClick={() => void run(() => feed.markRead(item.id))}><Check size={15} /></button>}
          </article>)}
          {feed.hasMore && <button className="notification-load" type="button" disabled={feed.loading} onClick={() => void feed.load(true)}>{feed.loading ? 'Loading…' : 'Load more'}</button>}
        </div>
      </section>}
      {role !== 'customer' && !open && toasts.length > 0 && toastList}
    </div>
    {role === 'customer' && createPortal(toastList, document.body)}
  </>
}
