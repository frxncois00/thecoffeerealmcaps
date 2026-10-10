import { useState } from 'react'
import { ShieldCheck, UserRound } from 'lucide-react'

function MemberPhoto({ url, username }) {
  const [failed, setFailed] = useState(false)
  return <div className="rp-photo">
    {url && !failed
      ? <img src={url} alt={`Member photo for @${username}`} onError={() => setFailed(true)} draggable="false" />
      : <span role="img" aria-label={`Member photo placeholder for @${username}`}><UserRound strokeWidth={1} aria-hidden="true" /></span>}
  </div>
}

export default function IdentityPage({ identity, loading }) {
  return <div className="rp-identity">
    <div className="rp-page-heading"><h2>Member details</h2></div>
    <div className="rp-member-row">
      <MemberPhoto key={identity.photoUrl || 'empty'} url={identity.photoUrl} username={identity.username} />
      <div className="rp-member-name"><span className="rp-field-label">Username</span><strong title={`@${identity.username}`}>@{identity.username}</strong></div>
    </div>
    <div className={`rp-id-field ${loading ? 'is-loading' : ''}`}>
      <span className="rp-field-label">Realm ID</span>
      {loading && identity.id === 'Issuing…' ? <span className="rp-skeleton rp-id-skeleton" aria-label="Loading Realm ID" /> : <strong>{identity.id || 'Unavailable'}</strong>}
    </div>
    <dl className="rp-details">
      <div><dt>Birth date</dt><dd>{identity.birthDate}</dd></div>
      <div><dt>Member since</dt><dd>{identity.memberSince}</dd></div>
      <div><dt>Favorite drink</dt><dd title={identity.favoriteDrink}>{identity.favoriteDrink}</dd></div>
      <div><dt>Favorite food</dt><dd title={identity.favoriteFood}>{identity.favoriteFood}</dd></div>
    </dl>
    {identity.verification && <div className="rp-identity-note"><span className="rp-verification"><ShieldCheck size={17} aria-hidden="true" />{identity.verification.label}</span></div>}
  </div>
}
