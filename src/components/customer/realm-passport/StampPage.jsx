import Stamp from './Stamp'

export default function StampPage({ chapter, active, loading, claimStamp }) {
  const status = chapter.status === 'unlocked' ? 'Unlocked' : chapter.status === 'in-progress' ? 'In progress' : 'Locked'
  return <div className={`rp-stamp-page is-${chapter.status}`}>
    <div className="rp-chapter-line"><span className="rp-kicker">Reward {String(chapter.number).padStart(2, '0')}</span><span className="rp-purchase-milestone">{chapter.milestone} purchases</span></div>
    <h2>{chapter.title}</h2>
    <div className="rp-progress-line"><span className="rp-reward-status">{status}</span><span>{chapter.progress} / 5 stamps</span></div>
    <ol className="rp-stamp-grid" aria-label={`Five purchase stamps for ${chapter.title}`}>
      {chapter.slots.map(slot => <Stamp key={slot.key} slot={slot} artwork={chapter.artwork} active={active} loading={loading} claimStamp={claimStamp} />)}
    </ol>
  </div>
}
