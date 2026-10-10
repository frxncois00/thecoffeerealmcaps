import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { portalSupabase } from '../lib/supabase'
import { signOutPortal } from '../lib/auth'
import { getPortalSecurityStatus, portalSecurityRequest, trustCurrentBrowser } from '../services/portalSessionService'
import './admin-mfa.css'

export default function AdminMfaPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [backupMode, setBackupMode] = useState(false)
  const [trustBrowser, setTrustBrowser] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    portalSupabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) throw new Error('Sign in to continue.')
      return getPortalSecurityStatus(data.user.id)
    }).then((result) => {
      if (!active) return
      if (result.authorized) { navigate('/admin', { replace: true }); return }
      setStatus(result); setFactorId(result.factors?.[0]?.id || '')
    }).catch((failure) => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [navigate])
  async function verify(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (backupMode) await portalSecurityRequest('verify_backup', { code })
      else {
        if (!factorId) throw new Error('No authenticator is available. Contact your administrator.')
        const { error: failure } = await portalSupabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() })
        if (failure) throw failure
        const result = await portalSecurityRequest('authorize')
        if (!result.authorized) throw new Error('Sign-in verification failed.')
        if (trustBrowser) await trustCurrentBrowser(status.profile.id)
      }
      navigate('/admin', { replace: true })
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  return <main className="admin-mfa-page"><section className="admin-mfa-card">
    <span className="admin-mfa-icon"><ShieldCheck size={26} /></span><h1>Verify your sign-in</h1>
    <p>{backupMode ? 'Enter a one-time security code.' : 'Enter the code from your authenticator app.'}</p>
    {!status && !error && <p role="status">Checking your account…</p>}
    {error && <p className="admin-mfa-error" role="alert">{error}</p>}
    {status && <><form onSubmit={verify}>
      {!backupMode && status.factors?.length > 1 && <><label htmlFor="signin-factor">Authenticator</label><select id="signin-factor" value={factorId} onChange={(event) => setFactorId(event.target.value)}>{status.factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.friendly_name || 'Authenticator'}</option>)}</select></>}
      {!backupMode && !factorId && <p role="alert">No authenticator is available. Contact your administrator or use a security code.</p>}
      <label htmlFor="admin-mfa-code">{backupMode ? 'Security code' : 'Authenticator code'}</label>
      <input id="admin-mfa-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" inputMode={backupMode ? 'text' : 'numeric'} maxLength={backupMode ? 39 : 6} required disabled={busy} />
      {!backupMode && <label className="admin-mfa-check"><input type="checkbox" checked={trustBrowser} onChange={(event) => setTrustBrowser(event.target.checked)} />Trust this browser for 30 days</label>}
      <button className="admin-mfa-primary" disabled={busy || (!backupMode && !factorId)} type="submit">{busy ? 'Verifying…' : 'Verify and continue'}</button>
    </form><button type="button" className="admin-mfa-secondary" disabled={busy} onClick={() => { setBackupMode((value) => !value); setCode(''); setError('') }}>{backupMode ? 'Use authenticator app' : 'Use a security code'}</button></>}
    <button type="button" className="admin-mfa-secondary" disabled={busy} onClick={async () => { await signOutPortal(); navigate('/portal', { replace: true }) }}>Sign out</button>
  </section></main>
}
