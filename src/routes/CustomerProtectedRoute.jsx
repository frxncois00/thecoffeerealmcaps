import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCustomerRole } from '../lib/auth'

export default function CustomerProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <main className="customer-state">Checking your account...</main>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (isCustomerRole(profile?.role)) {
    const incomplete = !profile?.username || !profile?.phone || profile?.full_name === 'Coffee Realm Customer'
    if (incomplete && location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />
    }
    if (!incomplete && location.pathname === '/complete-profile') {
      return <Navigate to="/menu" replace />
    }
    return children
  }

  return (
    <Navigate
      to="/login"
      replace
      state={{ authMessage: 'Your customer session is invalid. Please sign in again.' }}
    />
  )
}
