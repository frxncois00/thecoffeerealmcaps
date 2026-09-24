import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck, User, UserPlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isCustomerRole } from '../lib/auth'
import { queueAuthWelcome } from '../lib/authFeedback'
import { customerSupabase as supabase, isSupabaseConfigured } from '../lib/supabase'
import { EMAIL_MAX_LENGTH, isValidEmail, isValidPassword, sanitizeUsername } from '../utils/inputValidation'

const otpDigits = 6
const productionSiteUrl = String(import.meta.env.VITE_PUBLIC_SITE_URL || 'https://thecoffeerealm.store').replace(/\/$/, '')

function googleCallbackUrl() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const siteUrl = isLocal ? window.location.origin : productionSiteUrl
  return `${siteUrl}/auth/callback`
}

export default function CustomerLoginPage({ initialMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const authContainerRef = useRef(null)
  const verificationOtpRefs = useRef([])
  const forgotOtpRefs = useRef([])
  const [mode, setMode] = useState(initialMode)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState('email')
  const [forgotOtp, setForgotOtp] = useState(Array(otpDigits).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpOpen, setOtpOpen] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [pendingUsername, setPendingUsername] = useState('')
  const [otpCode, setOtpCode] = useState(Array(otpDigits).fill(''))
  const [authMessage, setAuthMessage] = useState(location.state?.authMessage || '')
  const [authError, setAuthError] = useState(location.state?.authError || '')
  const [loading, setLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  useEffect(() => {
    let resizeTimer

    const handleResize = () => {
      const container = authContainerRef.current
      if (!container) return

      container.classList.add('is-resizing')
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => container.classList.remove('is-resizing'), 180)
    }

    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(resizeTimer)
    }
  }, [])

  async function continueWithGoogle() {
    setAuthError('')
    setAuthMessage('')
    if (!isSupabaseConfigured) return setAuthError('Supabase is not configured yet.')

    window.sessionStorage.setItem('tcr.oauth.returnTo', '/menu')
    window.sessionStorage.setItem('tcr.oauth.mode', mode)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: googleCallbackUrl(),
        queryParams: { prompt: 'select_account' },
      },
    })

    if (error) {
      setLoading(false)
      setAuthError(error.message || 'Unable to continue with Google. Please try again.')
    }
  }

  useEffect(() => {
    if (!location.state?.openForgotPassword) return
    setAuthError('')
    setAuthMessage(location.state?.authMessage || '')
    setForgotEmail(location.state?.forgotEmail || '')
    setForgotStep('email')
    setForgotOtp(Array(otpDigits).fill(''))
    setNewPassword('')
    setConfirmPassword('')
    setForgotOpen(true)
  }, [location.state])

  useEffect(() => {
    if (!otpOpen) return
    focusOtpGroup(verificationOtpRefs, otpCode)
  }, [otpCode, otpOpen])

  useEffect(() => {
    if (forgotStep !== 'otp') return
    focusOtpGroup(forgotOtpRefs, forgotOtp)
  }, [forgotOtp, forgotStep])

  async function submitLogin(event) {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')
    if (!isSupabaseConfigured) return setAuthError('Supabase is not configured yet.')
    const data = new FormData(event.currentTarget)
    const identifier = String(data.get('identifier') || '').trim()
    const password = String(data.get('password') || '')
    if (!identifier || !password) return setAuthError('Please enter your username or email and password.')
    if (identifier.includes('@') && !isValidEmail(identifier)) return setAuthError('Enter a valid email address or username.')
    if (!identifier.includes('@') && sanitizeUsername(identifier, 24) !== identifier) return setAuthError('Enter a valid email address or username.')
    setLoading(true)
    let authData
    const isUsernameLogin = !identifier.includes('@')
    if (identifier.includes('@')) {
      const { data: emailAuthData, error } = await supabase.auth.signInWithPassword({ email: identifier, password })
      if (error) {
        setLoading(false)
        return setAuthError(error.message)
      }
      authData = emailAuthData
    } else {
      const { data: loginResult, error: loginError } = await supabase.functions.invoke('customer-username-login', {
        body: { username: identifier, password },
      })
      if (loginError) {
        setLoading(false)
        return setAuthError('Unable to complete username sign-in. Please try again.')
      }
      if (!loginResult?.success || !loginResult.session) {
        setLoading(false)
        return setAuthError(loginResult?.error || 'Invalid username, email, or password.')
      }
      const { data: usernameAuthData, error: sessionError } = await supabase.auth.setSession(loginResult.session)
      if (sessionError) {
        setLoading(false)
        return setAuthError('Unable to complete username sign-in. Please try again.')
      }
      authData = usernameAuthData
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle()
    setLoading(false)

    // Username sign-in can authenticate legacy accounts whose profile row is
    // still being backfilled. The Edge Function has already verified the
    // account as a customer, so use its signup metadata as a temporary role
    // fallback while keeping email sign-in strict about the profile record.
    const resolvedRole = profile?.role || (isUsernameLogin ? authData.user.user_metadata?.role : '')
    if (profileError || (!profile && !isCustomerRole(resolvedRole))) {
      await supabase.auth.signOut()
      return setAuthError('Invalid username, email, or password.')
    }

    if (!isCustomerRole(resolvedRole)) {
      await supabase.auth.signOut()
      return setAuthError('Invalid username, email, or password.')
    }

    queueAuthWelcome(authData?.user?.user_metadata)
    navigate('/menu', { replace: true })
  }

  async function submitRegister(event) {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')
    if (!isSupabaseConfigured) return setAuthError('Supabase is not configured yet.')
    const data = new FormData(event.currentTarget)
    const username = sanitizeUsername(String(data.get('username') || '').trim(), 24)
    const email = String(data.get('email') || '').trim()
    const password = String(data.get('password') || '')
    if (username.length < 3) return setAuthError('Username must be at least 3 characters long.')
    if (!isValidEmail(email)) return setAuthError('Enter a valid email address.')
    if (!isValidPassword(password)) return setAuthError('Password must be 8–32 characters and include at least 1 number.')
    setLoading(true)
    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, full_name: username, role: 'customer' } },
    })
    setLoading(false)
    if (error) return setAuthError(error.message || 'Unable to send OTP right now.')
    if (signupData.session) {
      queueAuthWelcome(signupData.user?.user_metadata, username)
      return navigate('/menu', { replace: true })
    }
    setRegisteredEmail(email)
    setPendingUsername(username)
    setOtpCode(Array(otpDigits).fill(''))
    setOtpOpen(true)
    setAuthMessage('We sent a 6-digit The Coffee Realm verification code to your email. Check your inbox to complete registration.')
  }

  async function verifyOtp() {
    setAuthError('')
    if (!registeredEmail) return setAuthError('Missing email address for verification.')
    const token = otpCode.join('')
    if (token.length !== otpDigits) return setAuthError('Enter the 6-digit OTP code.')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: registeredEmail,
      token,
      type: 'signup',
    })
    setLoading(false)
    if (error) return setAuthError(error.message || 'Unable to verify OTP right now.')
    setOtpOpen(false)
    setAuthMessage(`Account verified. Welcome, ${pendingUsername || 'customer'}!`)
    queueAuthWelcome(pendingUsername)
    navigate('/menu', { replace: true })
  }

  async function resendOtp() {
    setAuthError('')
    if (!registeredEmail) return setAuthError('Missing email address for verification.')
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email: registeredEmail })
    setLoading(false)
    if (error) return setAuthError(error.message || 'Unable to resend OTP right now.')
    setAuthMessage('A new 6-digit verification code was sent.')
  }
  async function submitForgotPassword(event) {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')
    if (!isSupabaseConfigured) return setAuthError('Supabase is not configured yet.')
    const trimmedEmail = forgotEmail.trim()
    if (!trimmedEmail) return setAuthError('Enter your email address first.')
    if (!isValidEmail(trimmedEmail)) return setAuthError('Enter a valid email address.')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail)
    setLoading(false)
    // Supabase intentionally does not reveal whether the email is registered
    // (avoids account enumeration) — a success response here does not mean
    // the address exists, only that the request was accepted.
    if (error) return setAuthError(error.message || 'Could not send the reset code. Please try again.')
    setForgotOtp(Array(otpDigits).fill(''))
    setForgotStep('otp')
    setAuthMessage('A 6-digit password reset code was sent to your email.')
  }

  async function verifyForgotOtp() {
    setAuthError('')
    const token = forgotOtp.join('')
    if (token.length !== otpDigits) return setAuthError('Enter the 6-digit OTP code.')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email: forgotEmail.trim(), token, type: 'recovery' })
    setLoading(false)
    if (error) return setAuthError(error.message || 'Unable to verify the reset code.')
    setForgotStep('password')
    setAuthMessage('')
  }

  async function submitNewPassword(event) {
    event.preventDefault()
    setAuthError('')
    if (!isValidPassword(newPassword)) return setAuthError('Password must be 8–32 characters and include at least 1 number.')
    if (newPassword !== confirmPassword) return setAuthError('The passwords do not match.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) await supabase.auth.signOut()
    setLoading(false)
    if (error) return setAuthError(error.message || 'Unable to update your password.')
    closeForgotPassword()
    setAuthMessage('Password changed successfully. You can now log in with your new password.')
  }

  async function resendForgotOtp() {
    setAuthError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim())
    setLoading(false)
    if (error) return setAuthError(error.message || 'Unable to resend the reset code.')
    setAuthMessage('A new 6-digit password reset code was sent.')
  }

  function openForgotPassword() {
    setAuthError('')
    setAuthMessage('')
    setForgotStep('email')
    setForgotOtp(Array(otpDigits).fill(''))
    setNewPassword('')
    setConfirmPassword('')
    setForgotOpen(true)
  }

  function closeForgotPassword() {
    setForgotOpen(false)
    setForgotStep('email')
    setForgotOtp(Array(otpDigits).fill(''))
    setNewPassword('')
    setConfirmPassword('')
  }
  function setVerificationOtpDigit(index, value) {
    setOtpCode((current) => current.map((digit, digitIndex) => digitIndex === index ? value : digit))
  }

  function setForgotOtpDigit(index, value) {
    setForgotOtp((current) => current.map((digit, digitIndex) => digitIndex === index ? value : digit))
  }

  return (
    <main className="legacy-customer-auth-page">
      <Link className="legacy-auth-home" to="/"><ArrowLeft size={17} /> Back to Home</Link>

      <section ref={authContainerRef} className={`legacy-auth-container ${mode === 'register' ? 'active' : ''}`}>
        <div className="legacy-auth-form login">
          <form onSubmit={submitLogin} autoComplete="off">
            <h1>Customer Login</h1>
            {authError && mode === 'login' ? <AuthNotice variant="error" message={authError} /> : null}
            {authMessage && mode === 'login' ? <AuthNotice variant="success" message={authMessage} /> : null}
            <label className="legacy-auth-input">
              <span>Username or email</span>
              <div><User size={19} /><input name="identifier" type="text" maxLength={EMAIL_MAX_LENGTH} autoComplete="username" placeholder="Enter your username or email" /></div>
            </label>
            <label className="legacy-auth-input">
              <span>Password <button type="button" onClick={openForgotPassword}>Forgot Password?</button></span>
              <div><Lock size={19} /><input name="password" type={showLoginPassword ? 'text' : 'password'} minLength="8" maxLength="32" pattern="(?=.*[0-9]).{8,32}" placeholder="Enter your password" /><button type="button" aria-label="Toggle password visibility" onClick={() => setShowLoginPassword((value) => !value)}>{showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            </label>
            <button type="submit" className="legacy-auth-submit" disabled={loading}>{loading ? 'PLEASE WAIT...' : 'LOGIN'}</button>
            <AuthDivider />
            <GoogleAuthButton onClick={continueWithGoogle} disabled={loading} />
          </form>
        </div>

        <div className="legacy-auth-form register">
          <form onSubmit={submitRegister}>
            <h1>Registration</h1>
            {authError && mode === 'register' ? <AuthNotice variant="error" message={authError} /> : null}
            {authMessage && mode === 'register' ? <AuthNotice variant="success" message={authMessage} /> : null}
            <label className="legacy-auth-input">
              <span>Username</span>
              <div><User size={19} /><input name="username" type="text" placeholder="Choose a username" minLength="3" maxLength="24" pattern="[A-Za-z0-9._-]+" onInput={(event) => { event.currentTarget.value = sanitizeUsername(event.currentTarget.value, 24) }} /></div>
            </label>
            <label className="legacy-auth-input">
              <span>Email address</span>
              <div><Mail size={19} /><input name="email" type="email" maxLength={EMAIL_MAX_LENGTH} autoComplete="email" placeholder="Enter your email" /></div>
            </label>
            <label className="legacy-auth-input">
              <span>Password</span>
              <div><Lock size={19} /><input name="password" type={showRegisterPassword ? 'text' : 'password'} minLength="8" maxLength="32" pattern="(?=.*[0-9]).{8,32}" placeholder="Create a password" /><button type="button" aria-label="Toggle password visibility" onClick={() => setShowRegisterPassword((value) => !value)}>{showRegisterPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            </label>
            <button type="submit" className="legacy-auth-submit" disabled={loading}><UserPlus size={18} /> {loading ? 'SENDING...' : 'CREATE ACCOUNT'}</button>
            <AuthDivider />
            <GoogleAuthButton onClick={continueWithGoogle} disabled={loading} />
          </form>
        </div>

        <div className="legacy-auth-toggle">
          <div className="legacy-auth-panel toggle-left">
            <img src="/images/coffeerealmlogo.png" alt="The Coffee Realm logo" />
            <h2>Hello, Welcome!</h2>
            <p>Don't have an account?</p>
            <button type="button" onClick={() => { setAuthError(''); setAuthMessage(''); setMode('register') }}>Register Now!</button>
          </div>
          <div className="legacy-auth-panel toggle-right">
            <img src="/images/coffeerealmlogo.png" alt="The Coffee Realm logo" />
            <h2>Welcome Back!</h2>
            <p>Already have an account?</p>
            <button type="button" onClick={() => { setAuthError(''); setAuthMessage(''); setMode('login') }}>Login!</button>
          </div>
        </div>
      </section>

      {forgotOpen ? <AuthModal title="Reset Password" onClose={closeForgotPassword}>
        {forgotStep === 'email' ? <form onSubmit={submitForgotPassword}>
          <p>Enter your account email and we will send a 6-digit password reset code.</p>
          {authError ? <AuthNotice variant="error" message={authError} /> : null}
          <label className="legacy-auth-input"><span>Email address</span><div><Mail size={19} /><input type="email" value={forgotEmail} maxLength={EMAIL_MAX_LENGTH} onChange={(event) => setForgotEmail(event.target.value.slice(0, EMAIL_MAX_LENGTH))} placeholder="Enter your email" /></div></label>
          <button type="submit" className="legacy-auth-submit" disabled={loading}>{loading ? 'SENDING...' : 'SEND OTP CODE'}</button>
        </form> : null}
        {forgotStep === 'otp' ? <div>
          <div className="legacy-otp-icon"><ShieldCheck size={30} /></div>
          <p>Enter the 6-digit password reset code sent to <b>{forgotEmail}</b>.</p>
          {authError ? <AuthNotice variant="error" message={authError} /> : null}
          {authMessage ? <AuthNotice variant="success" message={authMessage} /> : null}
          <div className="legacy-otp-inputs" aria-label="Password reset OTP inputs" onPaste={(event) => handleOtpPaste(event, forgotOtp, setForgotOtpDigit, forgotOtpRefs)}>{forgotOtp.map((digit, index) => <input key={index} ref={(element) => { forgotOtpRefs.current[index] = element }} value={digit} onChange={(event) => handleOtpInput(index, event.target.value, forgotOtp, setForgotOtpDigit, forgotOtpRefs)} onKeyDown={(event) => handleOtpKeyDown(index, event, forgotOtp, setForgotOtpDigit, forgotOtpRefs)} onFocus={(event) => event.target.select()} inputMode="numeric" maxLength={otpDigits} aria-label={`Reset OTP digit ${index + 1}`} />)}</div>
          <button type="button" className="legacy-auth-submit" onClick={verifyForgotOtp} disabled={loading}>{loading ? 'VERIFYING...' : 'VERIFY OTP'}</button>
          <button type="button" className="legacy-auth-link-button" onClick={resendForgotOtp} disabled={loading}>Resend code</button>
        </div> : null}
        {forgotStep === 'password' ? <form onSubmit={submitNewPassword}>
          <p>Your code is verified. Create a new password for your account.</p>
          {authError ? <AuthNotice variant="error" message={authError} /> : null}
          <label className="legacy-auth-input"><span>New password</span><div><Lock size={19} /><input type="password" value={newPassword} minLength="8" maxLength="32" pattern="(?=.*[0-9]).{8,32}" onChange={(event) => setNewPassword(event.target.value.slice(0, 32))} placeholder="Enter new password" /></div></label>
          <label className="legacy-auth-input"><span>Confirm new password</span><div><Lock size={19} /><input type="password" value={confirmPassword} minLength="8" maxLength="32" pattern="(?=.*[0-9]).{8,32}" onChange={(event) => setConfirmPassword(event.target.value.slice(0, 32))} placeholder="Repeat new password" /></div></label>
          <p className="legacy-auth-hint">Use 8–32 characters with at least 1 number.</p>
          <button type="submit" className="legacy-auth-submit" disabled={loading}>{loading ? 'UPDATING...' : 'UPDATE PASSWORD'}</button>
        </form> : null}
      </AuthModal> : null}
      {otpOpen ? <AuthModal title="Verify your account" onClose={() => setOtpOpen(false)}>
        <div className="legacy-otp-icon"><ShieldCheck size={30} /></div>
        <p>We sent a 6-digit verification code to <b>{registeredEmail}</b>. Enter the code here to create your account.</p>
        {authError ? <AuthNotice variant="error" message={authError} /> : null}
        {authMessage ? <AuthNotice variant="success" message={authMessage} /> : null}
        <div className="legacy-otp-inputs" aria-label="OTP code inputs" onPaste={(event) => handleOtpPaste(event, otpCode, setVerificationOtpDigit, verificationOtpRefs)}>{otpCode.map((digit, index) => <input key={index} ref={(element) => { verificationOtpRefs.current[index] = element }} value={digit} onChange={(event) => handleOtpInput(index, event.target.value, otpCode, setVerificationOtpDigit, verificationOtpRefs)} onKeyDown={(event) => handleOtpKeyDown(index, event, otpCode, setVerificationOtpDigit, verificationOtpRefs)} onFocus={(event) => event.target.select()} inputMode="numeric" maxLength={otpDigits} aria-label={`OTP digit ${index + 1}`} />)}</div>
        <button type="button" className="legacy-auth-submit" onClick={verifyOtp} disabled={loading}>{loading ? 'VERIFYING...' : 'VERIFY OTP'}</button>
        <button type="button" className="legacy-auth-link-button" onClick={resendOtp} disabled={loading}>Resend code</button>
      </AuthModal> : null}
    </main>
  )
}

function AuthNotice({ variant, message }) {
  return <div className={`legacy-auth-notice ${variant}`}>{message}</div>
}

function AuthDivider() {
  return <div className="legacy-auth-divider" role="separator"><span>or</span></div>
}

function GoogleAuthButton({ onClick, disabled }) {
  return <button type="button" className="legacy-google-auth-button" onClick={onClick} disabled={disabled}>
    <GoogleMark />
    <span>{disabled ? 'Connecting…' : 'Continue with Google'}</span>
  </button>
}

function GoogleMark() {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.35l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.12-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.55l3.35-2.62Z" />
    <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
  </svg>
}

function AuthModal({ title, children, onClose }) {
  return <div className="legacy-auth-modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
    <section className="legacy-auth-modal">
      <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close">&times;</button></header>
      {children}
    </section>
  </div>
}

function focusOtpInput(refs, index) {
  refs.current[index]?.focus()
  refs.current[index]?.select?.()
}

function focusOtpGroup(refs, digits) {
  const targetIndex = Math.min(digits.findIndex((digit) => !digit), digits.length - 1)
  const safeIndex = targetIndex === -1 ? digits.length - 1 : targetIndex
  focusOtpInput(refs, safeIndex)
}

function handleOtpInput(index, value, otp, onOtpChange, refs) {
  const digits = value.replace(/\D/g, '')
  if (!digits) {
    onOtpChange(index, '')
    return
  }
  digits.slice(0, otp.length - index).split('').forEach((digit, offset) => onOtpChange(index + offset, digit))
  const nextIndex = Math.min(index + digits.length, otp.length - 1)
  focusOtpInput(refs, nextIndex)
}

function handleOtpKeyDown(index, event, otp, onOtpChange, refs) {
  if (event.key === 'Backspace') {
    if (otp[index]) {
      event.preventDefault()
      onOtpChange(index, '')
      return
    }
    if (index > 0) {
      event.preventDefault()
      focusOtpInput(refs, index - 1)
    }
  }
  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    focusOtpInput(refs, index - 1)
  }
  if (event.key === 'ArrowRight' && index < otp.length - 1) {
    event.preventDefault()
    focusOtpInput(refs, index + 1)
  }
}

function handleOtpPaste(event, otp, onOtpChange, refs) {
  const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, otp.length)
  if (!digits) return
  event.preventDefault()
  digits.split('').forEach((digit, index) => onOtpChange(index, digit))
  const focusIndex = Math.min(digits.length, otp.length) - 1
  focusOtpInput(refs, Math.max(focusIndex, 0))
}




