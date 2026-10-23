import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentPortalSession, normalizeRole, roleRoutes } from '../lib/auth'
import './portal-loading.css'

export default function ProtectedRoute({ allowedRoles, children, allowMfaPending = false }) {
  const location = useLocation()
  const [state, setState] = useState({ loading: true, profile: null, security: null })

  useEffect(() => {
    let active = true
    getCurrentPortalSession().then(({ profile, security }) => {
      if (!active) return
      setState({ loading: false, profile, security })
    })
    return () => { active = false }
  }, [location.pathname])

  if (state.loading) return (
    <div className="auth-loading portal-access-loading" role="status" aria-live="polite">
      <div className="portal-access-loading__content">
        <span className="portal-access-loading__spinner" aria-hidden="true" />
        <p>Checking portal access...</p>
      </div>
    </div>
  )
  if (!state.profile) return <Navigate to="/portal" replace state={{ from: location.pathname }} />

  const actualRole = normalizeRole(state.profile.role)
  const allowed = allowedRoles.map(normalizeRole)
  if (!allowed.includes(actualRole)) return <Navigate to={roleRoutes[actualRole] || '/portal'} replace />
  if (actualRole === 'admin' && state.security && !state.security.authorized && !allowMfaPending) {
    return <Navigate to="/admin/mfa" replace />
  }

  return children
}
