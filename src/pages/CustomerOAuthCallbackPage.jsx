import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthWelcomeScreen from '../components/auth/AuthWelcomeScreen'
import { isCustomerRole, normalizeRole, roleRoutes } from '../lib/auth'
import { customerSupabase as supabase } from '../lib/supabase'
import { retryJwtTimingRequest } from '../lib/supabaseRetry'

const pause = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

function clearOAuthState() {
  window.sessionStorage.removeItem('tcr.oauth.returnTo')
  window.sessionStorage.removeItem('tcr.oauth.mode')
}

export default function CustomerOAuthCallbackPage() {
  const navigate = useNavigate()
  const [statusText, setStatusText] = useState('Finishing your Google sign-in…')
  const [isExiting, setIsExiting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let active = true
    const startTime = Date.now()

    async function finishGoogleSignIn() {
      const params = new URLSearchParams(window.location.search)
      const oauthError = params.get('error_description') || params.get('error')
      if (oauthError) throw new Error(oauthError)

      let { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const code = params.get('code')
      if (!sessionData.session && code) {
        const exchanged = await supabase.auth.exchangeCodeForSession(code)
        sessionData = exchanged.data
        sessionError = exchanged.error
      }
      if (sessionError || !sessionData.session?.user) {
        throw sessionError || new Error('Google did not return a valid session.')
      }

      const user = sessionData.session.user
      const oauthMode = window.sessionStorage.getItem('tcr.oauth.mode')
      let profile = null
      let profileError = null
      for (let attempt = 0; attempt < 4 && !profile; attempt += 1) {
        const result = await retryJwtTimingRequest(() =>
          supabase
            .from('profiles')
            .select('id, role, full_name, username, email, phone, birthdate')
            .eq('id', user.id)
            .maybeSingle()
        )
        profile = result.data
        profileError = result.error
        if (profileError) break
        if (!profile && !profileError) await pause(250 * (attempt + 1))
      }

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('We could not finish setting up this customer account. Please try again or contact support.')
      }

      if (!isCustomerRole(profile.role)) {
        const portalRoute = roleRoutes[normalizeRole(profile.role)] || '/portal'
        await supabase.auth.signOut()
        if (!active) return
        navigate('/login', {
          replace: true,
          state: { authError: `This email belongs to a staff account. Please use the staff login at ${portalRoute}.` },
        })
        return
      }

      let destination = oauthMode === 'link-google'
        ? '/profile?google=linked'
        : (window.sessionStorage.getItem('tcr.oauth.returnTo') || '/menu')

      if (oauthMode !== 'link-google') {
        const profileNeedsDetails = !profile?.username || !profile?.phone || !profile?.birthdate || profile?.full_name === 'Coffee Realm Customer'
        if (profileNeedsDetails) {
          destination = '/complete-profile'
        }
      }

      // Enforce minimum 1.5 seconds for animation visibility
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, 1500 - elapsed)
      if (remainingTime > 0) {
        await pause(remainingTime)
      }
      if (!active) return

      // Optional welcome back greeting if profile is complete
      const rawName = (profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '').trim()
      const firstName = rawName && rawName !== 'Coffee Realm Customer' ? rawName.split(/\s+/)[0] : ''
      if (firstName && destination !== '/complete-profile') {
        setStatusText(`Welcome back, ${firstName}`)
        await pause(450)
        if (!active) return
      }

      setIsComplete(true)
      setIsExiting(true)
      await pause(320)
      if (!active) return

      clearOAuthState()
      navigate(destination, { replace: true })
    }

    finishGoogleSignIn().catch(async (error) => {
      if (!active) return
      setStatusText(error?.message || 'Google sign-in could not be completed.')
      await pause(1800)
      if (active) {
        navigate('/login', {
          replace: true,
          state: { authError: error?.message || 'Google sign-in could not be completed.' },
        })
      }
    })

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <AuthWelcomeScreen
      statusText={statusText}
      isExiting={isExiting}
      isComplete={isComplete}
    />
  )
}
