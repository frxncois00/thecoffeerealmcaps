import { Coffee, LogIn, UserPlus, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function GuestAuthPrompt({ open, onClose, returnTo = '/menu' }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      previouslyFocused?.focus?.()
    }
  }, [onClose, open])

  if (!open) return null

  const authState = { from: returnTo }

  return (
    <div className="guest-auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="guest-auth-prompt" role="dialog" aria-modal="true" aria-labelledby="guest-auth-title" aria-describedby="guest-auth-copy">
        <button ref={closeButtonRef} className="guest-auth-close" type="button" onClick={onClose} aria-label="Close account prompt">
          <X size={19} />
        </button>
        <div className="guest-auth-icon" aria-hidden="true"><Coffee size={27} /></div>
        <span className="guest-auth-kicker">Your order, your account</span>
        <h2 id="guest-auth-title">Already have an account?</h2>
        <p id="guest-auth-copy">Log in to customize this item and continue your order. New to The Coffee Realm? Creating an account only takes a moment.</p>
        <div className="guest-auth-actions">
          <Link className="guest-auth-login" to="/login" state={authState} onClick={onClose}>
            <LogIn size={18} /> Log in
          </Link>
          <Link className="guest-auth-register" to="/register" state={authState} onClick={onClose}>
            <UserPlus size={18} /> Create account
          </Link>
        </div>
        <button className="guest-auth-continue" type="button" onClick={onClose}>Continue browsing</button>
      </section>
    </div>
  )
}
