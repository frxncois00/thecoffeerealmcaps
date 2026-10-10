export default function PageIndicator({ pages, page, spread = false }) {
  const last = page === null ? null : Math.min(pages.length - 1, page + (spread ? 1 : 0))
  const title = index => typeof pages[index] === 'string' ? pages[index] : pages[index]?.title

  return <div className="rp-page-indicator" aria-live="polite" aria-atomic="true">
    <span>{page === null ? 'Cover' : last > page ? `Pages ${page + 1}–${last + 1} of ${pages.length}` : `Page ${page + 1} of ${pages.length}`}</span>
    {page !== null && <small className="rp-sr-only">{last > page ? `${title(page)} · ${title(last)}` : title(page)}</small>}
  </div>
}
