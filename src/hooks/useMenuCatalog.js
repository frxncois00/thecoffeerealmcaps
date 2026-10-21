import { useEffect, useState } from 'react'
import { customerSupabase as supabase } from '../lib/supabase'
import { fetchMenuCatalog } from '../services/menuService'

export function useMenuCatalog() {
  const [state, setState] = useState({ products: [], categories: ['All'], loading: true, error: '' })

  useEffect(() => {
    let active = true
    let refreshTimer
    let latestRequest = 0
    const refresh = () => {
      const requestId = ++latestRequest
      fetchMenuCatalog()
        .then((data) => { if (active && requestId === latestRequest) setState({ ...data, loading: false, error: '' }) })
        .catch((error) => { if (active && requestId === latestRequest) setState((current) => ({ ...current, loading: false, error: error.message || 'Unable to load the menu.' })) })
    }
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(refresh, 150)
    }

    refresh()
    window.addEventListener('focus', scheduleRefresh)
    window.addEventListener('online', scheduleRefresh)
    const fallbackTimer = window.setInterval(scheduleRefresh, 30000)
    const channel = supabase.channel('customer-menu-availability')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, scheduleRefresh)
      .subscribe((status) => { if (status === 'SUBSCRIBED') scheduleRefresh() })

    return () => {
      active = false
      window.clearTimeout(refreshTimer)
      window.clearInterval(fallbackTimer)
      window.removeEventListener('focus', scheduleRefresh)
      window.removeEventListener('online', scheduleRefresh)
      supabase.removeChannel(channel)
    }
  }, [])

  return state
}
