const RETURN_KEY = 'tcr.customer.auth-return'

function sessionStorage() {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

export function safeCustomerReturnPath(value, fallback = '/menu') {
  const path = String(value || '').trim()
  return path.startsWith('/') && !path.startsWith('//') ? path : fallback
}

export function rememberCustomerReturnTo(value) {
  const path = safeCustomerReturnPath(value)
  sessionStorage()?.setItem(RETURN_KEY, path)
  return path
}

export function readCustomerReturnTo(fallback = '/menu') {
  return safeCustomerReturnPath(sessionStorage()?.getItem(RETURN_KEY), fallback)
}

export function consumeCustomerReturnTo(fallback = '/menu') {
  const path = readCustomerReturnTo(fallback)
  sessionStorage()?.removeItem(RETURN_KEY)
  return path
}
