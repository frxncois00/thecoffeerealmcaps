import { isPortalSecurityEnabled, isSupabaseConfigured, supabase } from '../lib/supabase'
import { readProfileWithRetry } from './profileRetry'
import { closePortalSession, getPortalSecurityStatus } from '../services/portalSessionService'

export const roleRoutes = {
  admin: '/admin',
  cashier: '/cashier',
  staff: '/staff',
  operational_staff: '/staff',
}

export function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  if (value === 'operations_staff') return 'operational_staff'
  if (value === 'operation_staff') return 'operational_staff'
  return value
}

export function isCustomerRole(role) {
  return normalizeRole(role) === 'customer'
}

const portalProfileSelect = 'id, role, full_name, username, email'

export async function getCurrentPortalSession() {
  if (!isSupabaseConfigured) return { session: null, profile: null, error: new Error('Supabase is not configured.') }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session) return { session: null, profile: null, error: sessionError || null }

  const userId = sessionData.session.user.id
  if (isPortalSecurityEnabled) {
    try {
      const security = await getPortalSecurityStatus(userId)
      return { session: sessionData.session, profile: security.profile, security, error: null }
    } catch (error) {
      return { session: sessionData.session, profile: null, security: null, error }
    }
  }
  const { data: profile, error: profileError } = await readProfileWithRetry(supabase, userId, portalProfileSelect)
  return { session: sessionData.session, profile, error: profileError || null }
}

export async function signInPortal({ identifier, email, password, role }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.')
  const requestedRole = normalizeRole(role)
  const loginIdentifier = String(identifier || email || '').trim()
  let loginEmail = loginIdentifier

  // Email logins should go straight through Supabase Auth. The Edge Function is
  // only needed to resolve an internal username to its backing Auth account.
  // Routing email logins through the username lookup can reject valid portal
  // accounts when their profile email/role is legacy or out of sync.
  if (['admin', 'staff', 'operational_staff', 'cashier'].includes(requestedRole) && !loginIdentifier.includes('@')) {
    const { data: loginResult, error: loginError } = await supabase.functions.invoke('staff-username-login', {
      body: { username: loginIdentifier, password, role: requestedRole },
    })
    if (loginError) throw new Error('Unable to complete staff sign-in. Please try again.')
    if (!loginResult?.success || !loginResult.session) throw new Error(loginResult?.error || 'Invalid email, username, or password.')
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession(loginResult.session)
    if (sessionError) throw sessionError
    return verifyPortalRole(sessionData, role)
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
  if (error) throw error

  return verifyPortalRole(data, role)
}

async function verifyPortalRole(data, role) {
  const requestedRole = normalizeRole(role)
  const userId = data.user?.id
  const security = isPortalSecurityEnabled ? await getPortalSecurityStatus(userId) : null
  const { data: profile, error: profileError } = security
    ? { data: security.profile, error: null }
    : await readProfileWithRetry(supabase, userId, portalProfileSelect)

  if (profileError) throw profileError
  if (!profile) throw new Error('Login succeeded, but no staff profile was found for this account.')
  const actualRole = normalizeRole(profile.role)
  const roleMatches = requestedRole === actualRole || (requestedRole === 'staff' && actualRole === 'operational_staff')
  if (!roleMatches) {
    await supabase.auth.signOut()
    throw new Error(`This account is registered as ${profile.role || 'another role'}, not ${role}.`)
  }

  if (!isPortalSecurityEnabled) await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', userId)
  return { session: data.session, profile, security }
}

export async function signOutPortal() {
  if (!isSupabaseConfigured) return
  if (isPortalSecurityEnabled) {
    try { await closePortalSession() } catch { /* Auth sign-out must still proceed. */ }
  }
  await supabase.auth.signOut({ scope: 'local' })
}



