import { useCallback, useEffect, useState } from 'react'
import { fetchCustomerOrders } from '../../../services/customerService'
import { fetchBenefitApplication } from '../../../services/benefitsService'
import { ensureRealmId } from '../../../services/realmPassportService'

export function useRealmPassportData(userId) {
  const [state, setState] = useState({ id: null, orders: [], benefit: null, loading: true, errors: [] })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  useEffect(() => {
    let active = true
    setState(previous => ({ ...previous, loading: true, errors: [] }))
    Promise.allSettled([ensureRealmId(), fetchCustomerOrders(userId), fetchBenefitApplication(userId)]).then(([identity, purchases, benefit]) => {
      if (!active) return
      const errors = []
      if (identity.status === 'rejected') errors.push('Your Realm ID could not be loaded.')
      if (purchases.status === 'rejected') errors.push('Purchase history could not be loaded.')
      if (benefit.status === 'rejected') errors.push('Verification status could not be loaded.')
      setState({
        id: identity.status === 'fulfilled' ? identity.value : null,
        orders: purchases.status === 'fulfilled' ? purchases.value : [],
        benefit: benefit.status === 'fulfilled' ? benefit.value : null,
        loading: false,
        errors,
        purchasesUnavailable: purchases.status === 'rejected',
      })
    })
    return () => { active = false }
  }, [userId, attempt])
  return { ...state, retry }
}
