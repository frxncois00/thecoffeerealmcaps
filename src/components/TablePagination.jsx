import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { slidingPageNumbers } from '../utils/pagination'
import './table-pagination.css'

export default function TablePagination({
  page, totalPages, onPageChange, pageSize, onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100], total, label = 'Table pages', disabled = false, loading = false,
}) {
  const pages = Math.max(1, totalPages)
  const current = Math.max(1, Math.min(page, pages))
  const sizes = [...new Set([pageSize, ...pageSizeOptions])].filter((size) => size > 0).sort((a, b) => a - b)
  disabled = disabled || loading
  const go = (next) => {
    if (!disabled && next !== current) onPageChange(Math.max(1, Math.min(next, pages)))
  }
  return <footer className="table-pagination" aria-busy={loading}>
    <span className="table-pagination-summary">Page {current} of {pages}<small role="status" aria-live="polite">{loading ? 'Loading page…' : total !== undefined ? `${total.toLocaleString()} ${total === 1 ? 'record' : 'records'}` : ''}</small></span>
    {onPageSizeChange && <label>Rows<select aria-label="Rows per page" value={pageSize} disabled={disabled} onChange={(event) => { onPageSizeChange(Number(event.target.value)); onPageChange(1) }}>{sizes.map((size) => <option value={size} key={size}>{size}</option>)}</select></label>}
    <nav aria-label={label}>
      <button type="button" onClick={() => go(1)} disabled={disabled || current <= 1} aria-label="First page"><ChevronsLeft/></button>
      <button type="button" onClick={() => go(current - 1)} disabled={disabled || current <= 1} aria-label="Previous page"><ChevronLeft/></button>
      {slidingPageNumbers(current, pages).map((number) => <button type="button" key={number} onClick={() => go(number)} disabled={disabled} aria-label={`Page ${number}`} aria-current={current === number ? 'page' : undefined}>{number}</button>)}
      <button type="button" onClick={() => go(current + 1)} disabled={disabled || current >= pages} aria-label="Next page"><ChevronRight/></button>
      <button type="button" onClick={() => go(pages)} disabled={disabled || current >= pages} aria-label="Last page"><ChevronsRight/></button>
    </nav>
  </footer>
}
