import { Bell, Check, CheckCheck, ChevronRight, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useNotificationHistory } from '../../hooks/useNotificationHistory'
import { needsSilentToast, notificationDestination } from '../../utils/notifications'
import { shouldShowSystemNotification } from '../../services/staffSettingsService'
import './notification-history.css'

function timeLabel(value) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export default function NotificationBell({ userId, role, onOpen, animated = false }) {
  const [open, setOpen] = useState(false)
  const [working, setWorking] = useState(false)
  const [toasts, setToasts] = useState([])
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
  useEffect(() => { setOpen(false) }, [location.key])
  useEffect(() => {
    if (!open) return undefined
    closeButton.current?.focus()
    const outside = event => { if (!anchor.current?.contains(event.target)) setOpen(false) }
    const escape = event => {
      if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); button.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])

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
  return <>
    <div ref={anchor} className={`notification-anchor ${animated ? 'is-ringing' : ''}`}>
      <button ref={button} type="button" className={role === 'customer' ? 'notification-bell-button' : 'internal-utility-button notification-bell-button'} aria-label={`Notifications${feed.unread ? `, ${feed.unread} unread` : ''}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
        <Bell size={19} />{feed.unread > 0 && <span className="notification-badge">{feed.unread > 99 ? '99+' : feed.unread}</span>}
      </button>
      {open && <section id={panelId} className="notification-panel" role="dialog" aria-label="Notifications">
        <header><strong>Notifications</strong><button ref={closeButton} type="button" aria-label="Close notifications" onClick={() => { setOpen(false); button.current?.focus() }}><X size={18} /></button></header>
        <div className="notification-tools">
          <button type="button" disabled={!feed.unread || working} onClick={() => void run(() => feed.markRead())}><CheckCheck size={15} />Mark all as read</button>
          {role === 'customer' && <button type="button" disabled={!feed.items.length || working} onClick={() => void run(feed.clear)}>Clear all</button>}
        </div>
        <div className="notification-scroll" aria-busy={feed.loading}>
          {feed.error && <div className="notification-empty" role="status">{feed.error}<button type="button" disabled={feed.loading} onClick={() => void feed.load()}>Retry</button></div>}
          {!feed.items.length && !feed.error && <p className="notification-empty">{feed.loading ? 'Loading…' : 'No notifications yet'}</p>}
          {feed.items.map(item => <article key={item.id} className={`notification-row ${item.read ? 'is-read' : 'is-unread'}`}>
            <button type="button" className="notification-content" onClick={() => visit(item)} aria-label={`${item.read ? '' : 'Unread: '}${item.title}${item.target ? ', view details' : ', mark as read'}`}>
              <span className="notification-dot" /><span><b>{item.title}</b>{item.message && <small>{item.message}</small>}<time dateTime={item.createdAt}>{timeLabel(item.createdAt)}</time></span>{item.target && <ChevronRight size={15} />}
            </button>
            {!item.read && <button type="button" className="notification-read" aria-label={`Mark ${item.title} as read`} disabled={working} onClick={() => void run(() => feed.markRead(item.id))}><Check size={15} /></button>}
          </article>)}
          {feed.hasMore && <button className="notification-load" type="button" disabled={feed.loading} onClick={() => void feed.load(true)}>{feed.loading ? 'Loading…' : 'Load more'}</button>}
        </div>
      </section>}
    </div>
    <div className="notification-silent-toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map(item => <div className="notification-silent-toast" key={item.id} role="status"><div><strong>{item.title}</strong>{item.message && <p>{item.message}</p>}{item.target && <button type="button" onClick={() => visit(item)}>View<ChevronRight size={14} /></button>}</div><button type="button" aria-label={`Dismiss ${item.title}`} onClick={() => setToasts(current => current.filter(value => value.id !== item.id))}><X size={17} /></button></div>)}
    </div>
  </>
}
