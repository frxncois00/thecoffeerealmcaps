import { useEffect, useId, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Empty impressions use the original PNG's alpha silhouette. Filled impressions
// always render that same, unmodified PNG at full color and opacity.
function StampImpression({ artwork }) {
  const filterId = `stamp-outline-${useId().replace(/:/g, '')}`
  return <svg className="rp-stamp-impression" viewBox="0 0 1280 1280" aria-hidden="true" focusable="false">
    <defs><filter id={filterId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="outer" />
      <feMorphology in="SourceAlpha" operator="erode" radius="3" result="inner" />
      <feComposite in="outer" in2="inner" operator="out" result="outline" />
      <feFlood floodColor="#74654b" /><feComposite in2="outline" operator="in" />
    </filter></defs>
    <image href={artwork} width="1280" height="1280" filter={`url(#${filterId})`} />
  </svg>
}

export default function Stamp({ slot, artwork, active, loading, claimStamp }) {
  const [thump, setThump] = useState(false)
  const tooltipId = useId()
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (active && slot.earned && !loading) {
      const unseen = claimStamp(slot.orderId)
      if (unseen) setThump(true)
    }
  }, [active, slot.earned, slot.orderId, loading, claimStamp])
  const label = loading ? `Stamp ${slot.position} of 5, loading` : slot.label
  const ink = <motion.span className="rp-stamp-ink" initial={false}
    animate={thump && !reducedMotion ? { scale: [1.2, .95, 1.025, 1], opacity: [0, 1, 1, 1] } : { scale: 1, opacity: 1 }}
    transition={{ duration: reducedMotion ? 0 : .38, times: [0, .48, .76, 1], ease: 'easeOut' }}
    onAnimationComplete={() => { if (thump) setThump(false) }}
    data-thump={thump && !reducedMotion ? 'true' : 'false'}>
    <img src={artwork} alt="" width="1280" height="1280" draggable="false" decoding="async" />
  </motion.span>
  return <li className={`rp-stamp-slot ${slot.earned ? 'is-earned' : 'is-empty'} ${slot.position === 5 ? 'is-milestone' : ''}`} data-order-id={slot.orderId || undefined}>
    <div className="rp-stamp-placement">
      {slot.earned && !loading ? <>
        <button className="rp-stamp-button" aria-label={label} aria-describedby={tooltipId}>
          {thump && !reducedMotion && <motion.span className="rp-ink-impact" aria-hidden="true" initial={{ opacity: .2, scale: .82 }} animate={{ opacity: 0, scale: 1.12 }} transition={{ duration: .4 }} />}
          {ink}
        </button>
        <span className="rp-stamp-tooltip" role="tooltip" id={tooltipId}><b>Order {slot.orderNumber}</b><span>{slot.date}</span></span>
      </> : <span className={`rp-empty-stamp ${loading ? 'rp-loading-stamp' : ''}`} role="img" aria-label={label}><StampImpression artwork={artwork} /></span>}
    </div>
    <span className="rp-slot-caption" aria-hidden="true"><span>{String(slot.purchaseNumber).padStart(2, '0')}</span>{slot.position === 5 && <small>Reward</small>}</span>
  </li>
}
