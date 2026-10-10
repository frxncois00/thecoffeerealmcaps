import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ensureRealmId } from '../../services/realmPassportService'

export default function RealmPassportProfileLink() {
  const { user } = useAuth()
  const [identity, setIdentity] = useState(null)
  useEffect(() => {
    let active = true
    ensureRealmId().then(id => { if (active) setIdentity({ userId: user.id, id }) }).catch(() => {})
    return () => { active = false }
  }, [user.id])
  return <Link to="/realm-passport" style={{ display: 'grid', gap: 4, textAlign: 'right', fontSize: 13 }}><span>Check Realm ID</span>{identity?.userId === user.id && <small style={{ fontFamily: 'monospace', letterSpacing: '.08em', opacity: .75 }}>{identity.id}</small>}</Link>
}
