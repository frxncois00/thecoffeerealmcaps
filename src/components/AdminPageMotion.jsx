import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import '../admin-motion.css'

export default function AdminPageMotion() {
  const { pathname } = useLocation()
  // Leave the dashboard's existing animations unchanged.
  const isAdmin = pathname.startsWith('/admin/') && pathname !== '/admin/'

  useLayoutEffect(() => {
    if (!isAdmin) return
    // Body scope also includes admin dialogs rendered through a portal.
    document.body.setAttribute('data-admin-motion', '')
    return () => document.body.removeAttribute('data-admin-motion')
  }, [isAdmin])

  useLayoutEffect(() => {
    if (!isAdmin) return
    // Replay child surfaces on navigation; the page and sidebar stay stationary.
    const surfaces = document.querySelectorAll(
      '.legacy-admin > .internal-main, .admin-mfa-page',
    )
    surfaces.forEach(surface => surface.setAttribute('data-admin-fade-reset', ''))
    if (surfaces.length) void document.body.offsetWidth
    surfaces.forEach(surface => surface.removeAttribute('data-admin-fade-reset'))
  }, [isAdmin, pathname])

  return null
}
