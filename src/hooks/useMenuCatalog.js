import { useEffect, useState } from 'react'
import { customerSupabase as supabase } from '../lib/supabase'
import { fetchMenuCatalog } from '../services/menuService'

export function useMenuCatalog() {
  const [state, setState] = useState({ products: [], categories: ['All'], loading: true, error: '' })

  useEffect(() => {
    let active = true
    let refreshTimer
    const refresh = () => {
      fetchMenuCatalog()
        .then((data) => { if (active) setState({ ...data, loading: false, error: '' }) })
        .catch((error) => { if (active) setState((current) => ({ ...current, loading: false, error: error.message || 'Unable to load the menu.' })) })
    }
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(refresh, 150)
    }

    refresh()
    window.addEventListener('focus', scheduleRefresh)
    const channel = supabase.channel('customer-menu-availability')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, scheduleRefresh)
      .subscribe()

    return () => {
      active = false
      window.clearTimeout(refreshTimer)
      window.removeEventListener('focus', scheduleRefresh)
      supabase.removeChannel(channel)
    }
  }, [])

  return state
}
