import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isCustomerRole } from '../lib/auth'

export default function CustomerProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <main className="customer-state">Checking your account...</main>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (isCustomerRole(profile?.role)) return children

  return (
    <Navigate
      to="/login"
      replace
      state={{ authMessage: 'Your customer session is invalid. Please sign in again.' }}
    />
  )
}
