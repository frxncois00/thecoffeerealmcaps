import { useEffect, useId, useState } from 'react'
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import AppShell from '../AppShell'
import '../../report-theme.css'

export function ReportShell({ rangeLabel, children, ...props }) {
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    const previous = viewport?.getAttribute('content')
    viewport?.setAttribute('content', `${previous || 'width=device-width, initial-scale=1.0'}, viewport-fit=cover`)
    return () => { if (viewport && previous) viewport.setAttribute('content', previous) }
  }, [])
  return <AppShell {...props} reportMode eyebrow={<span className="rp-subline"><b className="rp-live">● LIVE</b>{rangeLabel}</span>}><div className="rp-body">{children}</div></AppShell>
}

export function Segments({ label, options, value, onChange }) {
  const id = useId()
  return <div className="rp-segments" role="group" aria-label={label} onKeyDown={(event) => {
    const index = options.findIndex(([key]) => key === value)
    const next = event.key === 'ArrowRight' ? (index + 1) % options.length : event.key === 'ArrowLeft' ? (index - 1 + options.length) % options.length : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : -1
    if (next < 0) return
    event.preventDefault(); onChange(options[next][0]); document.getElementById(`${id}-${next}`)?.focus()
  }}>{options.map(([key, text], index) => <button id={`${id}-${index}`} key={key} type="button" aria-pressed={key === value} tabIndex={key === value ? 0 : -1} className={key === value ? 'active' : ''} onClick={() => onChange(key)}>{text}</button>)}</div>
}

export function Insights({ items }) {
  return null
}

export function Metric({ label, value, detail, hero = false }) {
  return <article className={`rp-metric${hero ? ' rp-hero' : ''}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

export function Card({ title, subtitle, actions, children, className = '' }) {
  return <section className={`rp-card ${className}`}><header><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{actions}</header>{children}</section>
}

export function Empty({ children = 'No records in this period.' }) {
  return <p className="rp-empty"><Inbox size={18} aria-hidden="true" />{children}</p>
}

export function RankedBars({ entries, tone = '' }) {
  const max = Math.max(1, ...entries.map((entry) => entry.value))
  return entries.length ? <ul className={`rp-ranked ${tone}`}>{entries.map((entry, index) => <li key={entry.key || entry.label}>
    <div className="rp-rank-label"><span className={`rp-square series-${index % 3}`} /><b>{entry.label}</b></div>
    <div className="rp-track" role="img" aria-label={`${entry.label}: ${entry.display}${entry.detail ? `, ${entry.detail}` : ''}`}><i className={`series-${index % 3}`} style={{ width: `${Math.max(0, entry.value / max * 100)}%` }} /></div>
    <div className="rp-rank-value"><b>{entry.display}</b><small>{entry.detail}</small></div>
  </li>)}</ul> : <Empty />
}

export function DataTable({ title, subtitle, rows, columns, actions, showSearch = true, searchPlaceholder = 'Search…', searchText = (row) => Object.values(row).join(' ') }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const filtered = rows.filter((row) => searchText(row).toLowerCase().includes(query.toLowerCase()))
  const pages = Math.max(1, Math.ceil(filtered.length / size))
  const current = Math.min(page, pages)
  const start = (current - 1) * size
  return <Card title={title} subtitle={subtitle} actions={(actions || showSearch) ? <div className="rp-table-tools">{actions}{showSearch && <input type="search" placeholder={searchPlaceholder} aria-label={`Search ${title.toLowerCase()}`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />}</div> : null}>
    <div className="rp-table-scroll"><table><thead><tr>{columns.map((column) => <th className={column.numeric ? 'rp-num' : ''} key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>{filtered.slice(start, start + size).map((row, index) => <tr key={row.id || row.name || index}>{columns.map((column) => <td className={column.numeric ? 'rp-num' : ''} key={column.key}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>
    {!filtered.length && <Empty />}
    <footer className="rp-pagination"><label>Rows per page <select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(1) }}>{[10, 20, 50].map((value) => <option key={value}>{value}</option>)}</select></label><span>Showing {filtered.length ? start + 1 : 0}–{Math.min(start + size, filtered.length)} of {filtered.length}</span><div><button type="button" aria-label={`Previous ${title.toLowerCase()} page`} disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={16} /></button><span>{current} / {pages}</span><button type="button" aria-label={`Next ${title.toLowerCase()} page`} disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={16} /></button></div></footer>
  </Card>
}
