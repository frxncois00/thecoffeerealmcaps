import { useEffect, useState } from 'react'
import { Cookie } from 'lucide-react'
import { Link } from 'react-router-dom'
import './cookie-notice.css'

const STORAGE_KEY = 'tcr:cookie-notice'
let dismissedThisVisit = false

function wasDismissed() {
  if (dismissedThisVisit) return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

export default function CookieNotice() {
  const [visible, setVisible] = useState(() => !wasDismissed())

  useEffect(() => {
    const sync = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) setVisible(!wasDismissed())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const dismiss = () => {
    dismissedThisVisit = true
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ acknowledgedAt: new Date().toISOString(), version: 1 }))
    } catch {
      // Keep the notice dismissed during this visit if storage is unavailable.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <section className="realm-cookie-notice" aria-labelledby="realm-cookie-title" aria-describedby="realm-cookie-description">
      <span className="realm-cookie-notice__icon" aria-hidden="true"><Cookie size={24} /></span>
      <div className="realm-cookie-notice__copy">
        <h2 id="realm-cookie-title">Your visit, made smoother</h2>
        <p id="realm-cookie-description">Cookies and browser storage keep your account and cart working. Learn more in our <Link to="/privacy-policy">Privacy Policy</Link>.</p>
      </div>
      <button type="button" className="realm-cookie-notice__button" onClick={dismiss}>Understood</button>
    </section>
  )
}
