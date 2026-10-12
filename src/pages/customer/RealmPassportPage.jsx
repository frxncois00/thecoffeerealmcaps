import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { buildPassportPresentation } from '../../utils/realmPassportPresentation'
import { useRealmPassportData } from '../../components/customer/realm-passport/useRealmPassportData'
import { useSeenStamps } from '../../components/customer/realm-passport/useSeenStamps'
import Cover from '../../components/customer/realm-passport/Cover'
import PassportPaper from '../../components/customer/realm-passport/PassportPaper'
import PageTurnBook from '../../components/customer/realm-passport/PageTurnBook'
import './realm-passport.css'

export function RealmPassportBook({ profile, id, orders = [], benefit, claims = [], loading = false, purchasesUnavailable = false, errors = [], retry, memberKey }) {
  const pending = loading || purchasesUnavailable
  const presentation = useMemo(() => buildPassportPresentation({ profile, id, orders, benefit, claims, loading: pending }), [profile, id, orders, benefit, claims, pending])
  const seen = useSeenStamps(memberKey || profile?.id || id)
  const pages = presentation.pages
  return <main className="realm-scene">
    <div className="rp-topbar"><Link to="/profile"><ArrowLeft size={16} aria-hidden="true" /> Back to profile</Link></div>
    <header className="rp-scene-heading"><h1>Realm Passport ID</h1></header>

    {errors.length > 0 && <div className="rp-error" role="alert"><div><strong>Some passport details couldn’t load.</strong><p>{errors.join(' ')}</p></div>{retry && <button type="button" onClick={retry} disabled={loading}><RotateCcw size={16} aria-hidden="true" /> Retry</button>}</div>}
    {loading && <p className="rp-loading-note" role="status">Loading passport…</p>}
    <div className="rp-passport-layout">
      <div className="rp-book-area">
        <PageTurnBook pages={pages} loading={pending}
          renderCover={props => <Cover {...props} />}
          renderPage={(index, { active }) => <PassportPaper index={index} page={pages[index]} presentation={presentation} active={active} loading={pending} seen={seen} />} />
      </div>
      <aside className="rp-guide" aria-labelledby="rp-guide-title">
        <span className="rp-kicker">Passport guide</span>
        <h2 id="rp-guide-title">How to use it</h2>
        <dl>
          <div><dt>Who</dt><dd>Signed-in Realm members.</dd></div>
          <div><dt>Where</dt><dd>Online or at the Coffee Realm counter.</dd></div>
          <div><dt>Earn</dt><dd>1 stamp per completed, paid order.</dd></div>
          <div><dt>Redeem</dt><dd>Show your Realm ID. Staff verifies rewards.</dd></div>
        </dl>
        <p><strong>Please don’t</strong> share your ID or request stamps for unpaid, voided, or refunded orders.</p>
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
