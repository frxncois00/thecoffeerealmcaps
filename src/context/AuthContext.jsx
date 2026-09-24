/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { customerSupabase, isSupabaseConfigured, portalSupabase } from '../lib/supabase'
import { closePortalSession } from '../services/portalSessionService'

const AuthContext = createContext(null)
const emptyAuthState = { session: null, profile: null, loading: true }
const isPortalPath = (pathname) => pathname === '/portal' || /^\/(admin|staff|cashier)(\/|$)/.test(pathname)

export function AuthProvider({ children }) {
  const { pathname } = useLocation()
  const [customerState, setCustomerState] = useState(emptyAuthState)
  const [portalState, setPortalState] = useState(emptyAuthState)

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
        const { data } = await client.from('profiles').select('*').eq('id', nextSession.user.id).maybeSingle()
        if (!active) return
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

  const portal = isPortalPath(pathname)
  const activeState = portal ? portalState : customerState
  const activeClient = portal ? portalSupabase : customerSupabase
  const updateProfile = portal
    ? (update) => setPortalState((current) => ({ ...current, profile: typeof update === 'function' ? update(current.profile) : update }))
    : (update) => setCustomerState((current) => ({ ...current, profile: typeof update === 'function' ? update(current.profile) : update }))
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
  }), [activeClient, activeState, portal])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

