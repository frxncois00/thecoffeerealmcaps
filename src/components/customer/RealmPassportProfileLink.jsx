import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ensureRealmId } from '../../services/realmPassportService'

export default function RealmPassportProfileLink() {
  return <Link to="/realm-passport" style={{ textAlign: 'right', fontSize: 13 }}>Check Realm ID</Link>
}

export function RealmIdProfileField() {
  const { user } = useAuth()
  const [identity, setIdentity] = useState(null)
  useEffect(() => {
    let active = true
    ensureRealmId().then(id => { if (active) setIdentity({ userId: user.id, id }) }).catch(() => {})
    return () => { active = false }
  }, [user.id])
  return <label className="field locked-field"><span>Realm ID</span><input readOnly aria-readonly="true" value={identity?.userId === user.id ? identity.id : ''}/></label>
}
