import { useCallback, useEffect, useRef, useState } from 'react'
import { deliveryChatClient, listDeliveryChats } from '../services/deliveryChatService'

export function useDeliveryChats(role, userId) {
  const [threads, setThreads] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const sequence = useRef(0)
  const refresh = useCallback(async () => {
    if (!userId) return
    const request = ++sequence.current
    try {
      const data = await listDeliveryChats(role)
      if (request !== sequence.current) return
      setThreads(data); setError('')
    } catch (cause) {
      if (request === sequence.current) setError(cause.message || 'Messages are unavailable. Try again.')
    } finally { if (request === sequence.current) setLoading(false) }
  }, [role, userId])

  useEffect(() => {
    setThreads([]); setLoading(Boolean(userId)); setError('')
    if (!userId) return undefined
    let active = true
    let timer
    const client = deliveryChatClient(role)
    const schedule = () => { clearTimeout(timer); timer = setTimeout(() => { if (active) void refresh() }, 180) }
    const channel = client.channel(`delivery-inbox-${role}-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_chat_messages' }, schedule)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', ...(role === 'customer' ? { filter: `customer_id=eq.${userId}` } : {}) }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_chat_reads', filter: `user_id=eq.${userId}` }, schedule)
      .subscribe(status => { if (active) { setConnected(status === 'SUBSCRIBED'); if (status === 'SUBSCRIBED') schedule() } })
    void refresh()
    const poll = setInterval(() => { if (document.visibilityState === 'visible') schedule() }, 15000)
    window.addEventListener('focus', schedule)
    return () => { active = false; sequence.current++; clearTimeout(timer); clearInterval(poll); window.removeEventListener('focus', schedule); void client.removeChannel(channel) }
  }, [refresh, role, userId])
  return { threads, error, loading, connected, refresh }
}
