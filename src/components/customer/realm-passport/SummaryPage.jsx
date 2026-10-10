export default function SummaryPage({ summary, loading }) {
  return <div className="rp-summary">
    <h2>Summary</h2>
    <dl className="rp-journey-counts">
      <div><dd>{loading ? '—' : summary.totalPurchases}</dd><dt>Total purchases</dt></div>
      <div><dd>{loading ? '—' : summary.rewardsEarned}</dd><dt>Rewards earned</dt></div>
    </dl>
    <div className="rp-next-reward">
      <span className="rp-field-label">{summary.complete ? 'Passport complete' : 'Next reward'}</span>
      <strong>{loading ? 'Loading purchases…' : summary.complete ? '50 stamps collected' : summary.nextReward?.title}</strong>
      {!loading && <p>{summary.complete ? 'Additional purchases count toward your total.' : `${summary.remaining} ${summary.remaining === 1 ? 'purchase' : 'purchases'} remaining.`}</p>}
    </div>
  </div>
}
