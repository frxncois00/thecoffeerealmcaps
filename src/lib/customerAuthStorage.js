const preferenceKey = 'coffee-realm-remember-me'
const authKey = 'coffee-realm-customer-auth'

export function rememberCustomer() {
  return localStorage.getItem(preferenceKey) === 'true'
}

export function setRememberCustomer(remember) {
  localStorage.setItem(preferenceKey, String(remember))
  const target = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  const session = other.getItem(authKey)
  if (session !== null) target.setItem(authKey, session)
  other.removeItem(authKey)
}

export const customerAuthStorage = {
  getItem(key) {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key)
  },
  setItem(key, value) {
    const target = rememberCustomer() ? localStorage : sessionStorage
    const other = rememberCustomer() ? sessionStorage : localStorage
    target.setItem(key, value)
    other.removeItem(key)
  },
  removeItem(key) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}
