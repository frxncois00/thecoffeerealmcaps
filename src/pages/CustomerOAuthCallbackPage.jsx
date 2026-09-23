import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isCustomerRole, normalizeRole, roleRoutes } from '../lib/auth'
import { queueAuthWelcome } from '../lib/authFeedback'
import { supabase } from '../lib/supabase'

const pause = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

function clearOAuthState() {
  window.sessionStorage.removeItem('tcr.oauth.returnTo')
  window.sessionStorage.removeItem('tcr.oauth.mode')
}

export default function CustomerOAuthCallbackPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Finishing your Google sign-in…')

  useEffect(() => {
    let active = true

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
      if (sessionError || !sessionData.session?.user) throw sessionError || new Error('Google did not return a valid session.')

      const user = sessionData.session.user
      const oauthMode = window.sessionStorage.getItem('tcr.oauth.mode')
      let profile = null
      let profileError = null
      for (let attempt = 0; attempt < 4 && !profile; attempt += 1) {
        const result = await supabase.from('profiles').select('id, role, full_name, username, email, phone').eq('id', user.id).maybeSingle()
        profile = result.data
        profileError = result.error
        if (!profile && !profileError) await pause(250 * (attempt + 1))
      }

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('We could not finish setting up this customer account. Please try again or contact support.')
      }

      if (!isCustomerRole(profile.role)) {
        const portalRoute = roleRoutes[normalizeRole(profile.role)] || '/portal'
        await supabase.auth.signOut()
        navigate('/login', {
          replace: true,
          state: { authError: `This email belongs to a staff account. Please use the staff login at ${portalRoute}.` },
        })
        return
      }

      if (oauthMode !== 'link-google') {
        const identities = user.identities || []
        const isGoogleOnlyAccount = identities.length === 1 && identities[0]?.provider === 'google'
        const profileNeedsDetails = !profile.username || !profile.phone || profile.full_name === 'Coffee Realm Customer'
        if (isGoogleOnlyAccount && profileNeedsDetails) {
          const { count, error: orderCountError } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', user.id)
          if (orderCountError) throw orderCountError
          if (!count) {
            clearOAuthState()
            if (active) navigate('/complete-profile', { replace: true })
            return
          }
        }
      }

      queueAuthWelcome({ ...user.user_metadata, full_name: profile.full_name || user.user_metadata?.full_name })
      clearOAuthState()
      if (active) navigate(oauthMode === 'link-google' ? '/profile?google=linked' : '/menu', { replace: true })
    }

    finishGoogleSignIn().catch(async (error) => {
      if (!active) return
      setMessage(error?.message || 'Google sign-in could not be completed.')
      window.setTimeout(() => {
        if (active) navigate('/login', { replace: true, state: { authError: error?.message || 'Google sign-in could not be completed.' } })
      }, 1800)
    })

    return () => { active = false }
  }, [navigate])

  return <main className="customer-oauth-callback" aria-live="polite">
    <section>
      <LoaderCircle className="spin" size={30} aria-hidden="true" />
      <h1>Welcome to The Coffee Realm</h1>
      <p>{message}</p>
    </section>
  </main>
}
