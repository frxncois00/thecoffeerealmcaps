import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'

export default function RiderPickupCard({ store, delivery }) {
  const [copied, setCopied] = useState('')
  const [copyError, setCopyError] = useState('')
  const copy = async (key, value) => {
    try { await navigator.clipboard.writeText(value); setCopied(key); setCopyError(''); window.setTimeout(()=>setCopied(''),1800) }
    catch { setCopyError('Could not copy. Select the text to copy.') }
  }
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${delivery.storeLat},${delivery.storeLng}`
  return <div className={`pickup-location-card rider-pickup-card${delivery.pickupImageUrl?' has-image':''}`}>
    {delivery.pickupImageUrl&&<div className="rider-pickup-media"><img className="rider-pickup-image" src={delivery.pickupImageUrl} alt="The Coffee Realm pickup location"/></div>}
    <div className="rider-pickup-details">
    <div className="pickup-location-main"><div><span>Rider pickup</span><strong>{store.name}</strong><p>{store.address}</p></div></div>
    <div className="pickup-location-actions">
      <button type="button" onClick={()=>copy('name',store.name)}><Copy size={14}/>{copied==='name'?'Copied':'Copy name'}</button>
      <button type="button" onClick={()=>copy('phone',store.phone)}><Copy size={14}/>{copied==='phone'?'Copied':store.phone}</button>
      <a href={mapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Store map</a>
    </div>
    {copyError&&<p className="field-hint error" role="alert">{copyError}</p>}
    </div>
  </div>
}
