import { useCallback, useEffect, useState } from 'react'
import { ensureRealmId, fetchRealmPassportClaims, fetchRealmPassportPurchases } from '../../../services/realmPassportService'

export function useRealmPassportData(userId) {
  const [state, setState] = useState({ id: null, orders: [], claims: [], loading: true, errors: [] })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  useEffect(() => {
    let active = true
    let fetching = false
    setState(previous => ({ ...previous, loading: true, errors: [] }))
    const refresh = () => {
      if (fetching || !active) return
      fetching = true
      Promise.allSettled([ensureRealmId(), fetchRealmPassportPurchases(userId), fetchRealmPassportClaims()]).then(([identity, purchases, claims]) => {
        fetching = false
        if (!active) return
        const errors = []
        if (identity.status === 'rejected') errors.push('Your Realm ID could not be loaded.')
        if (purchases.status === 'rejected') errors.push('Purchase history could not be loaded.')
        if (claims.status === 'rejected') errors.push('Reward claims could not be loaded.')
        setState({
          id: identity.status === 'fulfilled' ? identity.value : null,
          orders: purchases.status === 'fulfilled' ? purchases.value : [],
          claims: claims.status === 'fulfilled' ? claims.value : [],
          loading: false,
          errors,
          purchasesUnavailable: purchases.status === 'rejected',
        })
      })
    }
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') refresh() }
    refresh()
    // Polling also works when database realtime publication is not enabled.
    const interval = window.setInterval(refreshWhenVisible, 15000)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshWhenVisible)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [userId, attempt])
  return { ...state, retry }
}
