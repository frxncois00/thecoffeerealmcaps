import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { portalSupabase } from '../lib/supabase'
import { getPortalSecurityStatus, portalSecurityRequest } from '../services/portalSessionService'
import '../pages/admin-mfa.css'

export default function AdminMfaModal({ userId, onClose, onUpdated }) {
  const dialog = useRef(null)
  const [status, setStatus] = useState(null)
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [setup, setSetup] = useState(null)
  const [codes, setCodes] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    let active = true
    getPortalSecurityStatus(userId).then((result) => {
      if (!active) return
      if (!result.authorized) throw new Error('Verify your sign-in before managing MFA.')
      setStatus(result); setFactorId(result.factors?.[0]?.id || '')
    }).catch((failure) => { if (active) setError(failure.message) })
    return () => { active = false; element.close() }
  }, [userId])
  async function verifyExisting() {
    if (!factorId && status?.authorized && !status.factors?.length) return
    if (!factorId) throw new Error('An existing authenticator is required. Contact your administrator.')
    const { error: failure } = await portalSupabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() })
    if (failure) throw failure
    const result = await portalSecurityRequest('authorize')
    if (!result.authorized) throw new Error('Authenticator verification required.')
  }
  async function run(action) {
    setBusy(true); setError(''); setMessage('')
    try {
      if (action === 'add') {
        await verifyExisting()
        const { data, error: failure } = await portalSupabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Admin ${crypto.randomUUID().slice(0, 8)}` })
        if (failure) throw failure
        setSetup(data); setCode('')
      } else if (action === 'activate') {
        const { error: failure } = await portalSupabase.auth.mfa.challengeAndVerify({ factorId: setup.id, code: code.trim() })
        if (failure) throw failure
        setSetup(null); setCode(''); setMessage('Authenticator added. Existing keys still work.')
        const result = await getPortalSecurityStatus(userId)
        setStatus(result); onUpdated(Boolean(result.factors?.length))
      } else {
        await verifyExisting()
        const result = await portalSecurityRequest('generate_backup')
        setCodes(result.codes); setCode(''); setConfirm(false)
      }
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }
  return createPortal(<dialog ref={dialog} className="admin-mfa-dialog admin-mfa-card" aria-labelledby="manage-mfa-title" onCancel={(event) => { event.preventDefault(); if (!busy) { if (confirm) setConfirm(false); else onClose() } }}>
    <header className="admin-mfa-modal-header"><h2 id="manage-mfa-title">Manage MFA</h2><button type="button" aria-label="Close MFA management" disabled={busy} onClick={onClose}><X size={20} /></button></header>
    {error && <p className="admin-mfa-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {!status && !error && <p role="status">Loading…</p>}
    {codes ? <><p>Save these codes. Previous codes are invalid.</p><div className="admin-mfa-backups">{codes.map((value) => <code key={value}>{value.match(/.{1,4}/g).join('-')}</code>)}</div>
      <button type="button" className="admin-mfa-secondary" onClick={async () => { try { await navigator.clipboard.writeText(codes.join('\n')); setMessage('Codes copied.') } catch { setError('Could not copy codes. Save them manually.') } }}>Copy codes</button>
      <button type="button" className="admin-mfa-primary" onClick={onClose}>Done</button>
    </> : status && <>
      {setup && <div className="admin-mfa-setup"><img src={setup.totp.qr_code} alt="Scan with your authenticator app" width="210" height="210" /><code>{setup.totp.secret}</code></div>}
      <form inert={confirm} onSubmit={(event) => { event.preventDefault(); if (setup) void run('activate') }}>
        {!setup && status.factors?.length > 1 && <><label htmlFor="manage-factor">Authenticator</label><select id="manage-factor" value={factorId} onChange={(event) => setFactorId(event.target.value)}>{status.factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.friendly_name || 'Authenticator'}</option>)}</select></>}
        {(setup || factorId) && <><label htmlFor="manage-code">{setup ? 'New authenticator code' : 'Current authenticator code'}</label>
        <input id="manage-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required disabled={busy} /></>}
        {setup ? <button type="submit" className="admin-mfa-primary" disabled={busy || !/^\d{6}$/.test(code)}>Activate key</button> : <>
          <button type="button" className="admin-mfa-primary" disabled={busy || (Boolean(factorId) && !/^\d{6}$/.test(code))} onClick={() => run('add')}>Generate new key</button>
          {factorId && <button type="button" className="admin-mfa-secondary" disabled={busy || !/^\d{6}$/.test(code)} onClick={() => setConfirm(true)}>Replace backup codes</button>}
        </>}
      </form>
    </>}
    {confirm && <section className="admin-mfa-confirm" role="alertdialog" aria-labelledby="replace-codes-title"><h3 id="replace-codes-title">Replace backup codes?</h3><p>All previous backup codes will stop working.</p><button type="button" className="admin-mfa-secondary" disabled={busy} onClick={() => setConfirm(false)}>Cancel</button><button type="button" className="admin-mfa-primary" disabled={busy} onClick={() => run('replace')}>{busy ? 'Replacing…' : 'Confirm replacement'}</button></section>}
  </dialog>, document.body)
}
