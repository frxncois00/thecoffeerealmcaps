import { PASSPORT_ASSETS } from '../../../utils/realmPassport'

export default function Cover({ onOpen, interactive = true }) {
  const artwork = <img src={`${PASSPORT_ASSETS}realm-passport-cover-v3.png`} alt="Realm Passport, member’s edition" width="1024" height="1536" draggable="false" fetchPriority="high" />
  return interactive
    ? <button className="rp-cover" onClick={onOpen} aria-label="Open Realm Passport">{artwork}<span className="rp-cover-light" aria-hidden="true" /></button>
    : <div className="rp-cover">{artwork}</div>
}
