import { useState } from 'react'
import { submitCustomerMessage } from '../../services/customerMessageService'
import { EMAIL_MAX_LENGTH, isValidEmail, sanitizeCustomerText, sanitizeEmail, sanitizePersonName } from '../../utils/inputValidation'

export default function ContactPage() {
  const [values, setValues] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    if (values.name.trim().length < 2 || !isValidEmail(values.email) || !values.message.trim()) {
      setStatus('Enter your name, a valid email, and a message.')
      return
    }
    setSending(true)
    setStatus('')
    try {
      await submitCustomerMessage({
        category: 'general_inquiry', source: 'help',
        name: values.name.trim(), email: values.email.trim(),
        subject: 'Website contact', message: values.message.trim(),
      })
      setValues({ name: '', email: '', message: '' })
      setStatus('Message sent. We’ll reply by email.')
    } catch (error) {
      setStatus(error.message || 'Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return <main className="customer-main"><section className="editorial-page">
    <div><span>Visit or say hello</span><h1>Find us in North Fairview.</h1><p>Lot 1 Block 210 Mark Street corner Dollar Street, Quezon City</p><p>Open daily, 10:00 AM–12:00 MN</p><p>main.thecoffeerealm@gmail.com · +63 997 533 7958</p></div>
    <form className="account-card" onSubmit={submit}>
      <label className="field"><span>Name</span><input required minLength={2} maxLength={60} value={values.name} onChange={(event) => set('name', sanitizePersonName(event.target.value, 60))}/></label>
      <label className="field"><span>Email</span><input required type="email" maxLength={EMAIL_MAX_LENGTH} value={values.email} onChange={(event) => set('email', sanitizeEmail(event.target.value))}/></label>
      <label className="field"><span>Message</span><textarea required maxLength={2000} value={values.message} onChange={(event) => set('message', sanitizeCustomerText(event.target.value, 2000))}/></label>
      {status && <p role="status" aria-live="polite">{status}</p>}
      <button className="primary-button" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
    </form>
  </section></main>
}
