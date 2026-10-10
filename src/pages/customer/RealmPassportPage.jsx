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

export function RealmPassportBook({ profile, id, orders = [], benefit, loading = false, purchasesUnavailable = false, errors = [], retry, memberKey }) {
  const pending = loading || purchasesUnavailable
  const presentation = useMemo(() => buildPassportPresentation({ profile, id, orders, benefit, loading: pending }), [profile, id, orders, benefit, pending])
  const seen = useSeenStamps(memberKey || profile?.id || id)
  const currentPage = presentation.summary.nextReward?.number || (presentation.summary.complete ? presentation.chapters.length : 1)
  return <main className="realm-scene">
    <div className="rp-topbar"><Link to="/profile"><ArrowLeft size={16} aria-hidden="true" /> Back to profile</Link></div>
    <header className="rp-scene-heading"><h1>Realm Passport</h1></header>
    {errors.length > 0 && <div className="rp-error" role="alert"><div><strong>Some passport details couldn’t load.</strong><p>{errors.join(' ')}</p></div>{retry && <button type="button" onClick={retry} disabled={loading}><RotateCcw size={16} aria-hidden="true" /> Retry</button>}</div>}
    {loading && <p className="rp-loading-note" role="status">Loading passport…</p>}
    <PageTurnBook pages={presentation.pages} currentPage={currentPage}
      renderCover={props => <Cover {...props} />}
      renderPage={(index, { active }) => <PassportPaper index={index} page={presentation.pages[index]} presentation={presentation} active={active} loading={pending} seen={seen} />} />
    <p className="rp-membership-note">One stamp per completed purchase. One reward every five stamps.</p>
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
