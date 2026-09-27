import { isSupabaseConfigured, portalSupabase } from '../lib/supabase'

const SESSION_KEY = 'tcr:portal-session-key'

function getSessionKey() {
  if (typeof window === 'undefined') return null
  let value = window.sessionStorage.getItem(SESSION_KEY)
  if (!value) {
    value = crypto.randomUUID()
    window.sessionStorage.setItem(SESSION_KEY, value)
  }
  return value
}

function describeBrowser(userAgent) {
  if (/Edg\//.test(userAgent)) return 'Microsoft Edge'
  if (/OPR\//.test(userAgent)) return 'Opera'
  if (/Firefox\//.test(userAgent)) return 'Firefox'
  if (/Chrome\//.test(userAgent)) return 'Google Chrome'
  if (/Safari\//.test(userAgent)) return 'Safari'
  return 'Unknown browser'
}

function describeSystem(userAgent) {
  if (/Windows NT/.test(userAgent)) return 'Windows'
  if (/Android/.test(userAgent)) return 'Android'
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS'
  if (/Mac OS X/.test(userAgent)) return 'macOS'
  if (/Linux/.test(userAgent)) return 'Linux'
  return 'Unknown system'
}

function describeDevice(userAgent) {
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet'
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return 'Mobile'
  return 'Desktop'
}

export async function recordPortalSession() {
  if (!isSupabaseConfigured || typeof navigator === 'undefined') return null
  const userAgent = navigator.userAgent || ''
  const { data, error } = await portalSupabase.functions.invoke('record-portal-session', {
    body: {
      sessionKey: getSessionKey(),
      browser: describeBrowser(userAgent),
      operatingSystem: describeSystem(userAgent),
      deviceType: describeDevice(userAgent),
      userAgent,
    },
  })
  if (error) throw error
  return data?.session || null
}

export async function closePortalSession() {
  if (!isSupabaseConfigured) return
  const sessionKey = getSessionKey()
  if (!sessionKey) return
  const { error } = await portalSupabase.functions.invoke('record-portal-session', {
    body: { action: 'close', sessionKey },
  })
  if (error) throw error
}

export async function fetchPortalSessions(userId) {
  if (!isSupabaseConfigured || !userId) return []
  const { data, error } = await portalSupabase.from('internal_user_sessions')
    .select('id, session_key, ip_address, browser, operating_system, device_type, signed_in_at, last_seen_at, signed_out_at')
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false })
  if (error) throw error
  const currentKey = getSessionKey()
  return (data || []).map((item) => ({ ...item, isCurrent: item.session_key === currentKey }))
}
