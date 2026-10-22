import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, FileCheck2, Info, Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBenefitApplication } from '../../hooks/useBenefitApplication'
import { BENEFIT_STATUS, benefitKind, submitBenefitApplication, validateBenefitInformation } from '../../services/benefitsService'
import { IMAGE_UPLOAD_ACCEPT, validateImageFile } from '../../utils/imageUpload'
import { sanitizePersonName } from '../../utils/inputValidation'
import { validateBenefitPersonalInformation } from '../../utils/benefits'
import BenefitDocument from '../../components/BenefitDocument'
import BenefitBirthDateField from '../../components/customer/BenefitBirthDateField'
import '../../benefits.css'

const STEPS = ['Personal details', 'ID & photo', 'Review & submit']
const dateLabel = value => new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

export default function BenefitsPage() {
  const { user, profile } = useAuth()
  const { application, loading, error, reload } = useBenefitApplication(user?.id)
  const [submitted, setSubmitted] = useState(null)
  const current = submitted && (!application || submitted.submitted_at > application.submitted_at) ? submitted : application
  return <main className="customer-main benefits-page">
    <Link className="benefit-back" to="/profile"><ArrowLeft size={18} />Back to account</Link>
    <header className="benefit-heading"><h1>Senior Citizen / PWD Verification</h1><p>Apply for verification and track your application in one place.</p></header>
    <div className="benefit-page-columns">
      <div className="benefit-application-column">
        {loading ? <p role="status">Loading your application…</p> : error ? <div className="benefit-error" role="alert"><p>{error}</p><button className="secondary-button" onClick={reload}>Try again</button></div> : (!current || current.status === 'resubmission') ? <ApplicationForm key={`${current?.id || 'new'}-${current?.revision || 0}`} application={current} fullName={profile?.full_name || ''} accountBirthdate={profile?.birthdate || ''} onSubmitted={value => { setSubmitted(value); reload() }} /> : <section className="benefit-submitted-card" aria-labelledby="benefit-submitted-title"><h2 id="benefit-submitted-title">Your submitted application</h2><p>Your information and ID have been submitted. Check the application status for updates from our administrators.</p><ApplicationDetails values={current}/><BenefitDocument path={current.document_path}/></section>}
      </div>
      <aside className="benefit-sidebar" aria-label="Verification information and status">
        <section className="benefit-info" aria-labelledby="benefit-about-title"><Info size={22} aria-hidden="true"/><div><h2 id="benefit-about-title">About verification</h2><ul><li>Choose Senior Citizen or Person with Disability (PWD) and provide a valid ID.</li><li>Our administrators will review your information and update your application status.</li><li>Your ID is private and accessible only to you and authorized administrators. You may be asked to present your original ID when collecting an order.</li></ul></div></section>
      <section className="benefit-status-card" aria-labelledby="benefit-status-title" aria-live="polite"><header><div><h2 id="benefit-status-title">Application status</h2><p>Check the progress of your verification here.</p></div><button className="benefit-text-button" type="button" onClick={reload}>Refresh status</button></header>
        {loading ? <p role="status">Loading status…</p> : error ? <p className="benefit-error" role="alert">Application status could not be loaded. Please try refreshing.</p> : !current ? <div className="benefit-empty"><FileCheck2 size={30}/><div><h3>No application submitted yet</h3><p>Complete the three steps to apply for verification.</p></div></div> : <>
          <div className="benefit-status-summary"><FileCheck2 size={30}/><div><span className={`benefit-badge is-${current.status}`}>{BENEFIT_STATUS[current.status]}</span><h3>{current.status === 'approved' ? `Verified as ${benefitKind(current.kind)}` : `${benefitKind(current.kind)} application`}</h3><p>Submitted {dateLabel(current.submitted_at)}{current.reviewed_at && ` · Reviewed ${dateLabel(current.reviewed_at)}`}</p></div></div>
          {current.status === 'pending' && <p>Your application is awaiting admin review. Check back here for the decision.</p>}
          {current.status === 'resubmission' && <p>Please update the information requested below, then resubmit using the application form.</p>}
          {current.review_note && <div className="benefit-review-note"><b>Message from admin</b><p>{current.review_note}</p></div>}
        </>}
      </section>
      </aside>
    </div>
  </main>
}

function ApplicationDetails({ values }) {
  return <dl className="benefit-details"><div><dt>Applicant type</dt><dd>{benefitKind(values.kind)}</dd></div><div><dt>Full name</dt><dd>{values.full_name}</dd></div><div><dt>Date of birth</dt><dd>{values.date_of_birth}</dd></div><div><dt>ID number</dt><dd>{values.id_number}</dd></div></dl>
}

function ApplicationForm({ application, fullName, accountBirthdate, onSubmitted }) {
  const accountDate = accountBirthdate ? new Date(`${accountBirthdate}T00:00:00`) : null
  const now = new Date()
  const accountAge = accountDate ? now.getFullYear() - accountDate.getFullYear() - (now.getMonth() < accountDate.getMonth() || (now.getMonth() === accountDate.getMonth() && now.getDate() < accountDate.getDate()) ? 1 : 0) : null
  const canApplySenior = accountAge !== null && accountAge >= 60
  const [values, setValues] = useState({ kind: application?.kind || (canApplySenior ? 'senior' : 'pwd'), full_name: application?.full_name || fullName, date_of_birth: application?.date_of_birth || accountBirthdate, id_number: application?.id_number || '' })
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [checkingFile, setCheckingFile] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef(null)
  const uploadRef = useRef(null)
  const fileVersion = useRef(0)
  const update = (key, value) => setValues(current => ({ ...current, [key]: value }))
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const move = next => { setError(''); setDirection(next > step ? 'forward' : 'backward'); setStep(next); requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true })) }
  const chooseFile = async event => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return
    const version = ++fileVersion.current
    setCheckingFile(true); setError('')
    try { await validateImageFile(selected, { label: 'ID image' }); if (version === fileVersion.current) setFile(selected) }
    catch (cause) { if (version === fileVersion.current) setError(cause.message) }
    finally { if (version === fileVersion.current) setCheckingFile(false) }
  }
  const next = async event => {
    event.preventDefault(); setError('')
    if (busy || checkingFile) return
    if (step === 0) {
      const personalError = validateBenefitPersonalInformation(values, new Date(), accountBirthdate)
      if (personalError) { setError(personalError); return }
      move(1); return
    }
    const validation = validateBenefitInformation(values, new Date(), accountBirthdate)
    if (validation) { setError(validation); return }
    if (!file && !application?.document_path) { setError('Upload a clear photo of your valid ID.'); return }
    if (step === 1) { setConsent(false); move(2); return }
    if (!consent) { setError('Confirm your information and consent to verification.'); return }
    setBusy(true)
    try { onSubmitted(await submitBenefitApplication(values, file, application?.document_path, consent, accountBirthdate)) }
    catch (cause) { setError(cause.message || 'Your application could not be submitted. Please try again.') }
    finally { setBusy(false) }
  }
  return <section className="benefit-wizard" aria-label="Verification application">
    <ol className="benefit-steps" aria-label="Application steps">{STEPS.map((title, index) => <li key={title} className={index === step ? 'is-current' : index < step ? 'is-complete' : ''} aria-current={index === step ? 'step' : undefined}><span className="benefit-step-number">{index + 1}</span><b>{title}</b></li>)}</ol>
    <form className="benefit-form" onSubmit={next}>
      <div className="benefit-step-panel" key={step} data-direction={direction}>
      <h2 tabIndex={-1} ref={titleRef}>{STEPS[step]}</h2>
      {step === 0 && <>
        <fieldset className="benefit-kind"><legend>I am applying as <span aria-hidden="true">*</span></legend>{['senior','pwd'].map(kind => <label key={kind}><input type="radio" name="benefit-kind" checked={values.kind === kind} disabled={kind === 'senior' && !canApplySenior} onChange={() => update('kind', kind)}/>{benefitKind(kind)}{kind === 'senior' && !canApplySenior ? ' (requires age 60+)' : ''}</label>)}</fieldset>
        <label className="field"><span>Full name *</span><input required minLength={2} maxLength={60} autoComplete="name" value={values.full_name} onChange={event => update('full_name', sanitizePersonName(event.target.value))}/></label>
        <BenefitBirthDateField value={values.date_of_birth} onChange={value => update('date_of_birth', value)} max={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })}/>
        {values.kind === 'senior' && accountBirthdate && <p className="benefit-field-hint">Your birthdate must match your account and show that you are at least 60 years old.</p>}
      </>}
      {step === 1 && <>
        <label className="field"><span>ID number *</span><input required type="text" inputMode="numeric" pattern="[0-9]{3,20}" minLength={3} maxLength={20} title="Enter 3–20 digits only." value={values.id_number} onChange={event => update('id_number', event.target.value.replace(/[^0-9]/g, '').slice(0,20))}/><small>Numbers only · Maximum 20 digits</small></label>
        <p>Upload a clear, complete image showing your name, photo and ID number.</p>
        <input ref={uploadRef} hidden type="file" accept={IMAGE_UPLOAD_ACCEPT} onChange={chooseFile} disabled={checkingFile} aria-label="Upload valid ID"/>
        {file || application?.document_path ? <div className="benefit-selected-photo" aria-busy={checkingFile}>
          {preview ? <img className="benefit-image-preview" src={preview} alt="Selected ID preview"/> : file ? <p role="status">Preparing preview…</p> : <BenefitDocument path={application.document_path}/>}
          <div className="benefit-photo-toolbar">
            <div className="benefit-photo-details"><span className="benefit-photo-label"><Check size={16} aria-hidden="true"/>Photo selected</span><b title={file?.name || 'Previously submitted ID'}>{file?.name || 'Previously submitted ID'}</b><small>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · ` : ''}JPG, PNG or WEBP · Up to 5 MB</small></div>
            <button className="secondary-button" type="button" onClick={() => uploadRef.current?.click()} disabled={checkingFile}><Upload size={16} aria-hidden="true"/>{checkingFile ? 'Checking…' : 'Change photo'}</button>
          </div>
        </div> : <div className="benefit-upload"><Upload size={28} aria-hidden="true"/><b>Choose your ID image</b><span>JPG, PNG or WEBP · Up to 5 MB</span><button className="secondary-button" type="button" onClick={() => uploadRef.current?.click()} disabled={checkingFile}>{checkingFile ? 'Checking…' : 'Choose photo'}</button></div>}
        {checkingFile && <p role="status">Checking image…</p>}
      </>}
      {step === 2 && <><ApplicationDetails values={values}/>{preview ? <img className="benefit-image-preview" src={preview} alt="ID ready for submission"/> : <BenefitDocument path={application?.document_path}/>}<label className="benefit-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy}/><span>I confirm that these details are accurate, the ID belongs to me, and I consent to its use for verification by the store.</span></label></>}
      </div>
      {error && <p className="benefit-error" role="alert">{error}</p>}
      <footer className="benefit-form-actions">{step > 0 && <button className="secondary-button" type="button" onClick={() => move(step - 1)} disabled={busy || checkingFile}><ArrowLeft size={18}/>Previous</button>}<button className="primary-button" type="submit" disabled={busy || checkingFile}>{busy ? 'Submitting…' : step < 2 ? 'Next' : application ? 'Resubmit' : 'Submit'}<ArrowRight size={18}/></button></footer>
    </form>
  </section>
}
