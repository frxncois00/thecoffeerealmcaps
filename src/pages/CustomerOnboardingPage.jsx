import { Check, Eye, EyeOff, Lock, Phone, User, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { queueAuthWelcome } from '../lib/authFeedback'
import { customerSupabase as supabase } from '../lib/supabase'
import { saveProfile } from '../services/customerService'
import { EMAIL_MAX_LENGTH, isValidPassword, isValidPhone, sanitizePersonName, sanitizeUsername } from '../utils/inputValidation'

export default function CustomerOnboardingPage() {
  const navigate = useNavigate()
  const { user, profile, updateProfile } = useAuth()
  const [values, setValues] = useState({ full_name: '', username: '', phone: '' })
  const [addPassword, setAddPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setValues({
      full_name: profile?.full_name === 'Coffee Realm Customer' ? (user?.user_metadata?.full_name || user?.user_metadata?.name || '') : (profile?.full_name || ''),
      username: profile?.username || '',
      phone: profile?.phone || '',
    })
  }, [profile, user])

  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    const fullName = sanitizePersonName(values.full_name, 60).trim()
    const username = sanitizeUsername(values.username.trim(), 24)
    const phone = values.phone.replace(/\D/g, '').slice(0, 11)
    if (fullName.length < 2 || fullName !== values.full_name.trim()) return setError('Enter a valid full name using letters only.')
    if (username.length < 3 || username !== values.username.trim()) return setError('Username must contain 3-24 letters, numbers, periods, underscores, or hyphens.')
    if (!isValidPhone(phone)) return setError('Phone number must contain 11 digits and start with 09.')
    if (addPassword) {
      if (!isValidPassword(password)) return setError('Password must be 8-32 characters and include at least 1 number.')
      if (password !== confirmPassword) return setError('The passwords do not match.')
    }

    setBusy(true)
    try {
      const saved = await saveProfile(user.id, { full_name: fullName, username, email: String(user.email || '').slice(0, EMAIL_MAX_LENGTH), phone })
      if (addPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password })
        if (passwordError) throw passwordError
      }
      updateProfile((current) => ({ ...current, ...saved }))
      queueAuthWelcome({ ...user.user_metadata, full_name: saved.full_name || fullName })
      navigate('/menu', { replace: true })
    } catch (cause) {
      setError(cause?.message || 'Could not finish setting up your account.')
      setBusy(false)
    }
  }

  return <main className="customer-main onboarding-page">
    <section className="onboarding-card">
      <header>
        <span className="settings-kicker">One last step</span>
        <h1>Complete your account</h1>
        <p>Tell us how to identify and contact you for your orders.</p>
      </header>
      <form onSubmit={submit} aria-busy={busy}>
        <label className="onboarding-field"><span>Full name</span><div><UserRound size={18}/><input value={values.full_name} onChange={(event)=>set('full_name',sanitizePersonName(event.target.value,60))} maxLength={60} autoComplete="name" required/></div></label>
        <label className="onboarding-field"><span>Username</span><div><User size={18}/><input value={values.username} onChange={(event)=>set('username',sanitizeUsername(event.target.value,24))} minLength={3} maxLength={24} pattern="[A-Za-z0-9._-]{3,24}" autoComplete="username" autoCapitalize="none" spellCheck="false" required/></div><small>Use 3-24 letters, numbers, periods, underscores, or hyphens.</small></label>
        <label className="onboarding-field"><span>Phone number</span><div><Phone size={18}/><input value={values.phone} onChange={(event)=>set('phone',event.target.value.replace(/\D/g,'').slice(0,11))} inputMode="numeric" autoComplete="tel" maxLength={11} pattern="09[0-9]{9}" placeholder="09XXXXXXXXX" required/></div></label>

        <label className="onboarding-password-choice"><input type="checkbox" checked={addPassword} onChange={(event)=>{setAddPassword(event.target.checked);setError('')}}/><span><b>Add a password</b><small>Sign in using your email when Google is unavailable.</small></span></label>
        {addPassword?<div className="onboarding-password-fields">
          <label className="onboarding-field"><span>Password</span><div><Lock size={18}/><input type={showPassword?'text':'password'} value={password} onChange={(event)=>setPassword(event.target.value.slice(0,32))} minLength={8} maxLength={32} pattern="(?=.*[0-9]).{8,32}" autoComplete="new-password" required/><button type="button" onClick={()=>setShowPassword((shown)=>!shown)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
          <label className="onboarding-field"><span>Confirm password</span><div><Lock size={18}/><input type={showPassword?'text':'password'} value={confirmPassword} onChange={(event)=>setConfirmPassword(event.target.value.slice(0,32))} minLength={8} maxLength={32} autoComplete="new-password" required/></div></label>
        </div>:null}

        {error?<p className="form-error" role="alert">{error}</p>:null}
        <button className="primary-button onboarding-submit" type="submit" disabled={busy}><Check size={18}/>{busy?'Saving…':'Finish setup'}</button>
      </form>
    </section>
  </main>
}
