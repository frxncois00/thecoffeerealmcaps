import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, RotateCcw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { buildPassportPresentation } from '../../utils/realmPassportPresentation'
import { useRealmPassportData } from '../../components/customer/realm-passport/useRealmPassportData'
import { useSeenStamps } from '../../components/customer/realm-passport/useSeenStamps'
import Cover from '../../components/customer/realm-passport/Cover'
import PassportPaper from '../../components/customer/realm-passport/PassportPaper'
import PageTurnBook from '../../components/customer/realm-passport/PageTurnBook'
import './realm-passport.css'

export function RealmPassportBook({ profile, id, orders = [], claims = [], loading = false, purchasesUnavailable = false, errors = [], retry, memberKey }) {
  const pending = loading || purchasesUnavailable
  const presentation = useMemo(() => buildPassportPresentation({ profile, id, orders, claims, loading: pending }), [profile, id, orders, claims, pending])
  const seen = useSeenStamps(memberKey || profile?.id || id)
  const pages = presentation.pages
  const exportingRef = useRef(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  async function downloadPassport() {
    if (exportingRef.current) return
    exportingRef.current = true
    setExporting(true)
    setExportError('')
    try {
      const { exportPassport } = await import('../../components/customer/realm-passport/exportPassport')
      await exportPassport(presentation)
    } catch {
      setExportError('Your passport couldn’t be downloaded. Please try again.')
    } finally {
      exportingRef.current = false
      setExporting(false)
    }
  }
  return <main className="realm-scene">
    <div className="rp-topbar"><Link to="/profile"><ArrowLeft size={16} aria-hidden="true" /> Back to profile</Link></div>
    {exportError && <p className="rp-loading-note" role="alert">{exportError}</p>}
    <header className="rp-scene-heading"><h1>Realm Passport ID</h1></header>

    {errors.length > 0 && <div className="rp-error" role="alert"><div><strong>Some passport details couldn’t load.</strong><p>{errors.join(' ')}</p></div>{retry && <button type="button" onClick={retry} disabled={loading}><RotateCcw size={16} aria-hidden="true" /> Retry</button>}</div>}
    {loading && <p className="rp-loading-note" role="status">Loading passport…</p>}
    <div className="rp-passport-layout">
      <div className="rp-book-area">
        <PageTurnBook pages={pages} loading={pending}
          navigationStart={<button type="button" onClick={downloadPassport} disabled={exporting || pending || errors.length > 0 || !id}>
            <Download size={16} aria-hidden="true" /><span aria-live="polite">{exporting ? 'Preparing…' : 'Download'}</span>
          </button>}
          renderCover={props => <Cover {...props} />}
          renderPage={(index, { active }) => <PassportPaper index={index} page={pages[index]} presentation={presentation} active={active} loading={pending} seen={seen} />} />
      </div>
      <aside className="rp-guide" aria-labelledby="rp-guide-title">
        <span className="rp-kicker" id="rp-guide-title">Passport guide</span>
        <dl>
          <div><dt>Who can use the Realm Passport?</dt><dd>The owner of the official tcr account.</dd></div>
          <div><dt>Where can I use it?</dt><dd>Online or at The Coffee Realm counter.</dd></div>
          <div><dt>How do I collect stamps?</dt><dd>Earn 1 stamp for every completed, paid order. For counter orders, show your Realm ID when ordering.</dd></div>
          <div><dt>How do I unlock rewards?</dt><dd>Every 5 stamps unlocks your next reward.</dd></div>
          <div><dt>How do I claim my reward?</dt><dd>Show your Realm ID to our staff. They’ll check and help you redeem it.</dd></div>
          <div><dt>Can I save my passport?</dt><dd>Yes! Tap Download to save a copy with your current stamps.</dd></div>
        </dl>
      </aside>
    </div>

  </main>
}

function MemberPassport({ user, profile }) {
  const data = useRealmPassportData(user.id)
  return <RealmPassportBook profile={profile} memberKey={user.id} {...data} />
}

export default function RealmPassportPage() {
  const { user, profile } = useAuth()
  return <MemberPassport key={user.id} user={user} profile={profile} />
}
