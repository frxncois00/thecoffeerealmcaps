/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { customerSupabase, isPortalSecurityEnabled, isSupabaseConfigured, portalSupabase } from '../lib/supabase'
import { closePortalSession, getPortalSecurityStatus, recordPortalSession } from '../services/portalSessionService'
import { readProfileWithRetry } from '../lib/profileRetry'

const AuthContext = createContext(null)
const emptyAuthState = { session: null, profile: null, loading: true }
const isPortalPath = (pathname) => pathname === '/portal' || /^\/(admin|staff|cashier)(\/|$)/.test(pathname)

export function AuthProvider({ children }) {
  const { pathname } = useLocation()
  const [customerState, setCustomerState] = useState(emptyAuthState)
  const [portalState, setPortalState] = useState(emptyAuthState)
  const portalUserId = portalState.session?.user?.id

  useEffect(() => {
    let active = true
    const subscriptions = []

    const bindClient = (client, setState, scope) => {
      async function hydrate(nextSession) {
        if (!active) return
        if (!nextSession) {
          setState({ session: null, profile: null, loading: false })
          return
        }
        let data, error
        if (scope === 'portal' && isPortalSecurityEnabled) {
          try {
            const security = await getPortalSecurityStatus(nextSession.user.id)
            data = security.profile
          } catch (failure) { error = failure }
        } else {
          const result = await readProfileWithRetry(client, nextSession.user.id, '*')
          data = result.data
          error = result.error
        }
        if (!active) return
        if (error) {
          if (error.revoked) {
            window.setTimeout(() => client.auth.signOut({ scope: 'local' }), 0)
            setState({ session: null, profile: null, loading: false })
            return
          }
          // A transient Data API failure must not invalidate a valid Auth session.
          setState({ session: nextSession, profile: null, loading: false })
          return
        }
        const role = String(data?.role || nextSession.user.user_metadata?.role || '').trim().toLowerCase().replace(/[ -]+/g, '_')
        const roleAllowed = scope === 'customer'
          ? role === 'customer'
          : ['admin', 'staff', 'operational_staff', 'cashier'].includes(role)
        if (!roleAllowed) {
          window.setTimeout(() => client.auth.signOut({ scope: 'local' }), 0)
          if (active) setState({ session: null, profile: null, loading: false })
          return
        }
        setState({
          session: nextSession,
          profile: { id: nextSession.user.id, email: nextSession.user.email, ...nextSession.user.user_metadata, ...(data || {}) },
          loading: false,
        })
      }

      client.auth.getSession().then(({ data }) => hydrate(data.session))
      const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => hydrate(nextSession))
      subscriptions.push(listener.subscription)
    }

    if (!isSupabaseConfigured) {
      setCustomerState({ session: null, profile: null, loading: false })
      setPortalState({ session: null, profile: null, loading: false })
      return undefined
    }

    bindClient(customerSupabase, setCustomerState, 'customer')
    bindClient(portalSupabase, setPortalState, 'portal')
    return () => {
      active = false
      subscriptions.forEach((subscription) => subscription.unsubscribe())
    }
  }, [])

  useEffect(() => {
    if (!isPortalSecurityEnabled || !portalUserId) return undefined
    let active = true
    const heartbeat = () => recordPortalSession().catch((error) => {
      if (active && error.revoked) portalSupabase.auth.signOut({ scope: 'local' })
    })
    heartbeat()
    const timer = window.setInterval(heartbeat, 30_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [portalUserId])

  const portal = isPortalPath(pathname)
  const activeState = portal ? portalState : customerState
  const activeClient = portal ? portalSupabase : customerSupabase
  const updateProfile = useCallback((update) => {
    const setState = portal ? setPortalState : setCustomerState
    setState((current) => ({ ...current, profile: typeof update === 'function' ? update(current.profile) : update }))
  }, [portal])
  const value = useMemo(() => ({
    session: activeState.session,
    user: activeState.session?.user || null,
    profile: activeState.profile,
    loading: activeState.loading,
    updateProfile,
    signOut: async () => {
      if (portal) {
        try { await closePortalSession() } catch { /* Authentication sign-out must continue if session history is unavailable. */ }
      }
      return activeClient?.auth.signOut({ scope: 'local' })
    },
    authScope: portal ? 'portal' : 'customer',
  }), [activeClient, activeState, portal, updateProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

