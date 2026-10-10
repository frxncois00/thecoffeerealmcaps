import { isPortalSecurityEnabled, isSupabaseConfigured, portalSupabase } from '../lib/supabase'
import { createSingleFlight, uniquePortalSessions } from '../utils/portalSessions'

const sessionRequests = createSingleFlight()

const TRUST_PREFIX = 'tcr:trusted-admin-browser:'
const LEGACY_SESSION_KEY = 'tcr:portal-session-key'

function legacySessionKey() {
  if (typeof window === 'undefined') return null
  let value = window.sessionStorage.getItem(LEGACY_SESSION_KEY)
  if (!value) {
    value = crypto.randomUUID()
    window.sessionStorage.setItem(LEGACY_SESSION_KEY, value)
  }
  return value
}

function browserDetails() {
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent || ''
  const browser = /Edg\//.test(userAgent) ? 'Microsoft Edge'
    : /OPR\//.test(userAgent) ? 'Opera'
      : /Firefox\//.test(userAgent) ? 'Firefox'
        : /Chrome\//.test(userAgent) ? 'Google Chrome'
          : /Safari\//.test(userAgent) ? 'Safari' : 'Unknown browser'
  const operatingSystem = /Windows NT/.test(userAgent) ? 'Windows'
    : /Android/.test(userAgent) ? 'Android'
      : /iPhone|iPad|iPod/.test(userAgent) ? 'iOS'
        : /Mac OS X/.test(userAgent) ? 'macOS'
          : /Linux/.test(userAgent) ? 'Linux' : 'Unknown system'
  const deviceType = /iPad|Tablet/i.test(userAgent) ? 'Tablet'
    : /Mobi|Android|iPhone|iPod/i.test(userAgent) ? 'Mobile' : 'Desktop'
  return { browser, operatingSystem, deviceType }
}

export async function portalSecurityRequest(action, body = {}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.')
  if (['status', 'heartbeat', 'sessions'].includes(action)) {
    const { data } = await portalSupabase.auth.getSession()
    // A refreshed token or another login must not reuse the previous request.
    return sessionRequests(JSON.stringify([data.session?.access_token, action, body]), () => invokeSecurity(action, body))
  }
  return invokeSecurity(action, body)
}

async function invokeSecurity(action, body) {
  const { data, error } = await portalSupabase.functions.invoke('portal-security', {
    body: { action, ...browserDetails(), ...body },
  })
  if (error) {
    const response = error.context
    let detail = null
    try { detail = await response?.json() } catch { /* Keep the transport error. */ }
    const failure = new Error(detail?.error || error.message || 'Portal security request failed.')
    failure.revoked = Boolean(detail?.revoked)
    throw failure
  }
  return data
}

export async function getPortalSecurityStatus(userId) {
  const trustedBrowserToken = userId && typeof localStorage !== 'undefined'
    ? localStorage.getItem(`${TRUST_PREFIX}${userId}`) : null
  return portalSecurityRequest('status', { trustedBrowserToken })
}

export async function trustCurrentBrowser(userId) {
  const result = await portalSecurityRequest('trust_browser')
  if (userId && result?.browserToken && typeof localStorage !== 'undefined') {
    localStorage.setItem(`${TRUST_PREFIX}${userId}`, result.browserToken)
  }
  return result
}

export function forgetTrustedBrowser(userId) {
  if (userId && typeof localStorage !== 'undefined') localStorage.removeItem(`${TRUST_PREFIX}${userId}`)
}

export async function recordPortalSession() {
  if (!isPortalSecurityEnabled) {
    const { data, error } = await portalSupabase.functions.invoke('record-portal-session', {
      body: { sessionKey: legacySessionKey(), ...browserDetails() },
    })
    if (error) throw error
    return data?.session || null
  }
  return portalSecurityRequest('heartbeat')
}

export async function closePortalSession(previousSession) {
  if (isPortalSecurityEnabled && previousSession?.access_token) {
    const { data, error } = await portalSupabase.functions.invoke('portal-security', {
      headers: { Authorization: `Bearer ${previousSession.access_token}` },
      body: { action: 'close' },
    })
    if (error) throw error
    return data
  }
  if (!isPortalSecurityEnabled) {
    const { error } = await portalSupabase.functions.invoke('record-portal-session', {
      body: { action: 'close', sessionKey: legacySessionKey() },
    })
    if (error) throw error
    return
  }
  return portalSecurityRequest('close')
}

export async function fetchPortalSessions(userId) {
  if (!isPortalSecurityEnabled) {
    const { data, error } = await portalSupabase.from('internal_user_sessions')
      .select('id,session_key,ip_address,browser,operating_system,device_type,signed_in_at,last_seen_at,signed_out_at')
      .eq('user_id', userId).order('last_seen_at', { ascending: false })
    if (error) throw error
    return uniquePortalSessions(data || [], legacySessionKey()).map((item) => ({
      ...item, status: item.signed_out_at ? 'Signed out' : 'Active',
      isCurrent: item.session_key === legacySessionKey(),
    }))
  }
  const data = await portalSecurityRequest('sessions')
  const recentAfter = Date.now() - 2 * 60 * 1000
  return uniquePortalSessions(data?.sessions || [], data.currentSessionId).map((item) => {
    const status = item.revoked_at ? 'Revoked'
      : item.signed_out_at || !item.auth_session_exists ? 'Signed out'
        : new Date(item.last_seen_at).getTime() >= recentAfter ? 'Active' : 'Idle'
    return { ...item, status, isCurrent: item.auth_session_id === data.currentSessionId }
  })
}

export async function revokePortalSession(sessionId) {
  return portalSecurityRequest('revoke_session', { sessionId })
}

export async function clearPortalSessionHistory() {
  return portalSecurityRequest('clear_history')
}
