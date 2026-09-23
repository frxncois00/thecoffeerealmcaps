import { ArrowRight, Coffee, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { normalizeRole, roleRoutes, signInPortal } from '../lib/auth'
import { queueAuthWelcome } from '../lib/authFeedback'
import { fetchStaffPreferences } from '../services/staffSettingsService'
import { EMAIL_MAX_LENGTH } from '../utils/inputValidation'

export default function PortalLoginPage() {
  const [role, setRole] = useState('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  async function submit(event) {
    event.preventDefault()
    setMessage('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const identifier = String(form.get('identifier') || '').trim()
    const password = String(form.get('password') || '')

    try {
      const { profile } = await signInPortal({ identifier, password, role })
      const normalizedRole = normalizeRole(profile.role || role)
      let target = location.state?.from || roleRoutes[normalizedRole] || roleRoutes[role] || '/portal'
      if (!location.state?.from && ['staff', 'operational_staff'].includes(normalizedRole)) {
        try {
          const preferences = await fetchStaffPreferences(profile.id)
          const workspaceRoutes = { orders: '/staff', inventory: '/staff/inventory', transactions: '/staff/transactions', menu: '/staff/menu' }
          target = workspaceRoutes[preferences.landing_view] || target
        } catch { /* The standard staff landing page remains available before the preference migration is deployed. */ }
      }
      window.localStorage.setItem('raimu-visible', 'false')
      window.dispatchEvent(new CustomEvent('raimu-visibility-change', { detail: { visible: false } }))
      queueAuthWelcome(profile)
      navigate(target, { replace: true })
    } catch (error) {
      setMessage(error.message || 'Unable to sign in. Please check the account and role.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="legacy-portal">
    <header className="legacy-portal-header"><div className="legacy-portal-brand"><span className="legacy-portal-brand-icon"><Coffee size={16}/></span><span>The Coffee Realm</span></div><button className="legacy-portal-lock" type="button" aria-label="Secure internal portal"><Lock size={16}/></button></header>
    <main className="legacy-login-card">
      <div className="legacy-login-heading"><span className="legacy-login-icon"><ShieldCheck size={24}/></span><h1>Internal Portal Login</h1><p>Private access for admin, staff, and cashier</p></div>
      <form onSubmit={submit} autoComplete="off">
        <label>Role</label><div className="legacy-role-picker" role="group" aria-label="Choose portal role">
          {[['admin', 'Admin'], ['staff', 'Staff'], ['cashier', 'Cashier']].map(([value, label]) => <button key={value} type="button" className={role === value ? 'active' : ''} aria-pressed={role === value} onClick={() => setRole(value)}>{label}</button>)}
        </div>
        <label htmlFor="portal-identifier">Email</label><div className="legacy-input"><Mail size={17}/><input id="portal-identifier" name="identifier" type={role === 'staff' ? 'text' : 'email'} maxLength={EMAIL_MAX_LENGTH} pattern={role === 'staff' ? '[A-Za-z0-9._@+-]+' : undefined} placeholder="name@example.com" required autoComplete="username" autoCapitalize="none" spellCheck="false"/></div>
        <label htmlFor="portal-password">Password</label><div className="legacy-input"><Lock size={17}/><input id="portal-password" name="password" type={showPassword ? 'text' : 'password'} minLength="8" maxLength="32" placeholder="••••••••" required autoComplete="current-password"/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
        {message ? <p className="portal-message portal-message-error">{message}</p> : null}
        <button className="legacy-sign-in" type="submit" disabled={loading}><Coffee size={16}/><span>{loading ? 'Signing in...' : 'Sign In'}</span><ArrowRight size={17}/></button>
      </form>
    </main>
    <footer className="legacy-portal-footer"><div><ShieldCheck size={15}/><span>Secure internal network</span></div><div><strong>The Coffee Realm</strong><span>© 2026 internal systems</span></div></footer>
  </div>
}


