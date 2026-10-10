import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Stamp from './Stamp'

export default function StampPage({ chapter, active, loading, claimStamp, claimReward }) {
  const [celebrate, setCelebrate] = useState(false)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (active && !loading && chapter.status === 'unlocked' && claimReward(chapter.number)) setCelebrate(true)
  }, [active, loading, chapter.status, chapter.number, claimReward])
  const statusText = loading ? 'Loading purchases…' : chapter.status === 'in-progress' ? 'In progress' : 'Locked'
  return <div className={`rp-stamp-page is-${chapter.status}`}>
    <div className="rp-chapter-line"><span className="rp-kicker">Reward {String(chapter.number).padStart(2, '0')}</span><span className="rp-purchase-milestone">{chapter.milestone} purchases</span></div>
    <h2>{chapter.title}</h2>
    <div className="rp-progress-line">
      {!loading && chapter.status === 'unlocked'
        ? <motion.div className="rp-reward-ribbon" initial={false} animate={celebrate && !reducedMotion ? { opacity: [0, 1], scale: [.92, 1], y: [6, 0] } : { opacity: 1, scale: 1, y: 0 }} transition={{ duration: .4 }} onAnimationComplete={() => { if (celebrate) setCelebrate(false) }}><span aria-hidden="true">✦</span> Reward unlocked</motion.div>
        : <span className="rp-reward-status">{statusText}</span>}
      <span>{loading ? '—' : chapter.progress} / 5 stamps</span>
    </div>
    <ol className="rp-stamp-grid" aria-label={`Five purchase stamps for ${chapter.title}`}>
      {chapter.slots.map(slot => <Stamp key={slot.key} slot={slot} artwork={chapter.artwork} active={active} loading={loading} claimStamp={claimStamp} />)}
    </ol>
    {!loading && chapter.number === 1 && chapter.progress === 0 && <div className="rp-chapter-note"><p>Your first stamp is one order away.</p></div>}
  </div>
}
