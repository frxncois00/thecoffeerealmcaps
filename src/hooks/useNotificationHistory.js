import { useCallback, useEffect, useRef, useState } from 'react'
import { customerSupabase, supabase } from '../lib/supabase'
import { mergeNotifications, normalizeNotification, NOTIFICATION_PAGE_SIZE } from '../utils/notifications'

export function useNotificationHistory(userId, role, onLive) {
  const client = role === 'customer' ? customerSupabase : supabase
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const cursor = useRef(null)
  const busy = useRef(false)
  const live = useRef(onLive)
  live.current = onLive
  const alive = useRef(true)
  const version = useRef(0)
  const loadedPages = useRef(1)

  const countUnread = useCallback(async () => {
    let query = client.from('user_notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('read_at', null).is('cleared_at', null)
    if (role === 'staff') query = query.neq('event_type', 'menu_changed')
    const { count, error: cause } = await query
    if (cause) throw cause
    if (alive.current) setUnread(count || 0)
  }, [client, userId, role])

  const load = useCallback(async (more = false) => {
    if (!userId || !client || busy.current) return
    busy.current = true
    const requestVersion = version.current
    setLoading(true)
    try {
      const data = []
      let last = more ? cursor.current : null
      let pageLength = 0
      // Refresh every loaded page in bounded requests, even beyond the API's
      // row limit, so refocusing never discards older history.
      for (let page = 0; page < (more ? 1 : loadedPages.current); page += 1) {
        let query = client.from('user_notifications').select('*').eq('user_id', userId).is('cleared_at', null)
          .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(NOTIFICATION_PAGE_SIZE)
        if (role === 'staff') query = query.neq('event_type', 'menu_changed')
        if (last) query = query.or(`created_at.lt.${last.created_at},and(created_at.eq.${last.created_at},id.lt.${last.id})`)
        const { data: rows, error: cause } = await query
        if (cause) throw cause
        if (!alive.current || requestVersion !== version.current) return
        data.push(...rows)
        pageLength = rows.length
        last = rows.at(-1)
        if (pageLength < NOTIFICATION_PAGE_SIZE) break
      }
      if (!alive.current || requestVersion !== version.current) return
      cursor.current = data.at(-1) || cursor.current
      setItems(current => mergeNotifications(more ? current : [], data.map(normalizeNotification)))
      setHasMore(pageLength === NOTIFICATION_PAGE_SIZE)
      if (more && data.length) loadedPages.current += 1
      setError('')
      await countUnread()
    } catch {
      if (alive.current) setError('Could not load notifications.')
    } finally {
      busy.current = false
      if (alive.current) setLoading(false)
      // A live read/clear/insert may have overtaken this request. Reconcile
      // without letting its older snapshot overwrite the newer state.
      if (alive.current && requestVersion !== version.current) void load()
    }
  }, [client, userId, role, countUnread])

  useEffect(() => {
    alive.current = true
    void load()
    if (!userId || !client) return undefined
    const seen = new Set()
    const channel = client.channel(`notification-history:${role}:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${userId}` }, ({ eventType, new: row }) => {
        if (!row?.id || !alive.current || (role === 'staff' && row.event_type === 'menu_changed')) return
        const item = normalizeNotification(row)
        version.current += 1
        setItems(current => mergeNotifications(current, [item]))
        void countUnread().catch(() => {})
        if (eventType === 'INSERT' && !seen.has(row.id)) {
          seen.add(row.id)
          live.current?.(item)
        }
      }).subscribe(status => { if (status === 'SUBSCRIBED') void load() })
    const onFocus = () => { void load() }
    window.addEventListener('focus', onFocus)
    // Generate scheduled overdue alerts only in the active staff workspace.
    const checkOverdue = () => {
      if (role === 'staff' && document.visibilityState === 'visible') void client.rpc('check_overdue_notifications').then(() => {}).catch(() => {})
    }
    checkOverdue()
    const timer = window.setInterval(checkOverdue, 60000)
    return () => {
      alive.current = false
      window.removeEventListener('focus', onFocus)
      window.clearInterval(timer)
      client.removeChannel(channel)
    }
  }, [client, userId, role, load, countUnread])

  const markRead = async (id = null) => {
    const through = new Date().toISOString()
    const { error: cause } = await client.rpc('mark_notifications_read', { p_id: id, p_through: through })
    if (cause) { setError('Could not mark as read.'); return false }
    version.current += 1
    setItems(current => current.map(item => (!id || item.id === id) && Date.parse(item.createdAt) <= Date.parse(through) ? { ...item, read: true } : item))
    await countUnread().catch(() => {})
    setError('')
    return true
  }
  const clear = async () => {
    const through = new Date().toISOString()
    const { error: cause } = await client.rpc('clear_customer_notifications', { p_through: through })
    if (cause) { setError('Could not clear notifications.'); return false }
    version.current += 1
    setItems(current => current.filter(item => Date.parse(item.createdAt) > Date.parse(through)))
    cursor.current = null
    loadedPages.current = 1
    setHasMore(false)
    await countUnread().catch(() => {})
    setError('')
    return true
  }
  return { items, unread, loading, hasMore, error, load, markRead, clear }
}
