import { Coffee, LogOut, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { lockBodyScroll, unlockBodyScroll } from '../../utils/bodyScrollLock'

export default function LogoutConfirmModal({ open, busy = false, onCancel, onConfirm }) {
  const modalRef = useRef(null)
  const cancelButtonRef = useRef(null)
  const previousFocusRef = useRef(null)
  const scrollLockRef = useRef(Symbol('logout-confirmation'))
  const reduceMotion = useReducedMotion()

  // Track and restore previous active element on open / close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement
      const frame = window.requestAnimationFrame(() => {
        cancelButtonRef.current?.focus()
      })
      return () => window.cancelAnimationFrame(frame)
    } else if (previousFocusRef.current) {
      try {
        previousFocusRef.current.focus?.()
      } catch {
        // Fallback if target element unmounted
      }
      previousFocusRef.current = null
    }
  }, [open])

  // Focus trap, body scroll lock, and Escape key listener
  useEffect(() => {
    if (!open) return undefined
    const scrollLock = scrollLockRef.current
    lockBodyScroll(scrollLock)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      unlockBodyScroll(scrollLock)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [busy, onCancel, open])

  const backdropMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } }

  const modalMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.95, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 6, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
      }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="payment-modal-backdrop auth-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) onCancel()
          }}
          {...backdropMotion}
        >
          <motion.section
            ref={modalRef}
            className="auth-logout-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            aria-describedby="logout-confirm-copy"
            {...modalMotion}
          >
            {/* Top-right close button */}
            <button
              className="auth-logout-card__close"
              type="button"
              onClick={onCancel}
              disabled={busy}
              aria-label="Close logout confirmation"
            >
              <X size={18} />
            </button>

            {/* Circular badge with TCR logo and decorative leaf accents */}
            <div className="auth-logout-card__badge-wrap" aria-hidden="true">
              <svg
                className="auth-logout-card__leaf auth-logout-card__leaf--left"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M4 20C4 20 6 12 14 8C14 8 10 16 4 20Z" fill="#a4b89d" />
                <path d="M9 13C12 9 18 5 21 3C21 3 19 10 13 15" stroke="#7e9678" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <div className="auth-logout-card__badge">
                <img
                  src="/images/coffeerealmlogo.png"
                  alt=""
                  className="auth-logout-card__logo"
                />
              </div>

              <svg
                className="auth-logout-card__leaf auth-logout-card__leaf--right"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M20 20C20 20 18 12 10 8C10 8 14 16 20 20Z" fill="#a4b89d" />
                <path d="M15 13C12 9 6 5 3 3C3 3 5 10 11 15" stroke="#7e9678" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* Large Serif Heading */}
            <h2 id="logout-confirm-title" className="auth-logout-card__title">Log out?</h2>

            {/* Subtext */}
            <p id="logout-confirm-copy" className="auth-logout-card__copy">
              Are you sure you want to log out from your account?
            </p>

            {/* Action buttons side by side */}
            <div className="auth-logout-card__actions">
              <button
                ref={cancelButtonRef}
                className="auth-logout-btn auth-logout-btn--cancel"
                type="button"
                onClick={onCancel}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="auth-logout-btn auth-logout-btn--confirm"
                type="button"
                onClick={onConfirm}
                disabled={busy}
              >
                <LogOut size={16} aria-hidden="true" />
                {busy ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
