import IdentityPage from './IdentityPage'
import StampPage from './StampPage'
import SummaryPage from './SummaryPage'

export default function PassportPaper({ index, page, presentation, active, loading, seen }) {
  return <section className={`rp-paper rp-paper-${page.kind}`} aria-label={page.title} aria-busy={loading} data-page-index={index}>
    {page.kind === 'identity' ? <IdentityPage identity={presentation.identity} loading={loading} />
      : page.kind === 'stamps' ? <StampPage chapter={presentation.chapters[page.chapterIndex]} active={active} loading={loading} {...seen} />
        : <SummaryPage summary={presentation.summary} loading={loading} />}
    <footer className="rp-folio" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')}</span></footer>
  </section>
}
