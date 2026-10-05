import { useState } from 'react'
import { ArrowRight, Check, Package, Search, AlertTriangle } from 'lucide-react'
import { stockKey, suggestedQuantity, groupStockBySupplier } from '../utils/purchaseStock'
import './purchase-stock-board.css'

const number = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })

export default function PurchaseStockBoard({ items, loading, isAdmin, getSupplier, onCreate, selected, setSelected }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(false)
  const out = items.filter((item) => Number(item.quantity) <= 0).length
  const matching = items.filter((item) => (filter === 'all' || (filter === 'out' ? Number(item.quantity) <= 0 : Number(item.quantity) > 0)) && `${item.name} ${getSupplier(item)}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => Number(a.quantity > 0) - Number(b.quantity > 0) || a.name.localeCompare(b.name))
  const visible = expanded ? matching : matching.slice(0, 6)
  const chosen = items.filter((item) => selected.includes(stockKey(item)))
  const groups = groupStockBySupplier(chosen, getSupplier)
  const allVisibleSelected = matching.length > 0 && matching.every((item) => selected.includes(stockKey(item)))
  function toggle(key) { setSelected((current) => current.includes(key) ? current.filter((entry) => entry !== key) : [...current, key]) }
  return <section className="stock-board" aria-labelledby="stock-board-title" aria-busy={loading}>
    <header className="stock-board-header">
      <div><span className="stock-eyebrow"><Package size={15} /> REPLENISHMENT</span><h2 id="stock-board-title">A clear view of what’s running low.</h2>{isAdmin && <p>Monitor stock needs and orders already in progress.</p>}</div>
      <div className="stock-totals"><span><b>{out}</b><small><i className="stock-dot out" />Out of stock</small></span><span><b>{items.length - out}</b><small><i className="stock-dot" />Low stock</small></span></div>
    </header>
    <div className="stock-controls"><div className="stock-filters" aria-label="Stock filters">{[['all', 'All items'], ['out', 'Out of stock'], ['low', 'Low stock']].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setExpanded(false) }}>{label}</button>)}</div><label className="stock-search"><Search size={16} /><input aria-label="Search low stock items or suppliers" placeholder="Find an item or supplier" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
    {!isAdmin && matching.length > 0 && <div className="stock-selection-tools"><label><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelected((current) => allVisibleSelected ? current.filter((key) => !matching.some((item) => stockKey(item) === key)) : [...new Set([...current, ...matching.map(stockKey)])])} />Select all {matching.length} matching items</label><span>Suggested quantities are editable in your order</span></div>}
    <div className={`stock-workspace ${isAdmin ? 'is-readonly' : ''}`}><div className="stock-items-column">
    {loading && !items.length ? <div className="stock-empty" role="status">Loading stock levels…</div> : !matching.length ? <div className="stock-empty"><Check size={28} /><h3>{items.length ? 'No matching items' : 'Stock is looking healthy'}</h3><p>{items.length ? 'Try another filter or search.' : 'Ingredients that need replenishment will appear here.'}</p></div> : <div className="stock-grid">{visible.map((item, index) => {
      const key = stockKey(item), isOut = Number(item.quantity) <= 0, checked = selected.includes(key)
      const ratio = Math.min(100, Math.max(0, Number(item.quantity) / Math.max(Number(item.minStockLevel), 1) * 100))
      return <label key={key} className={`stock-card ${checked ? 'is-selected' : ''} ${isOut ? 'is-out' : ''}`} style={{ '--stock-delay': `${Math.min(index, 5) * 35}ms` }}>
        <div className="stock-card-top"><h3><span className="stock-severity" role="img" aria-label={isOut ? 'Out of stock' : 'Low stock'} title={isOut ? 'Out of stock' : 'Low stock'}><AlertTriangle size={15} /></span>{item.name}</h3>{!isAdmin && <input type="checkbox" aria-label={`Select ${item.name}`} checked={checked} onChange={() => toggle(key)} />}</div>
        <p className="stock-supplier">{getSupplier(item) || 'Choose supplier when ordering'}</p>
        <div className="stock-meter" role="progressbar" aria-label={`${item.name} stock relative to minimum`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={ratio} aria-valuetext={`${number(item.quantity)} ${item.unit} remaining; minimum ${number(item.minStockLevel)}; suggested order ${number(suggestedQuantity(item))} ${item.unit}`} title={`${number(item.quantity)} ${item.unit} remaining · Min. ${number(item.minStockLevel)} · Suggested +${number(suggestedQuantity(item))} ${item.unit}`}><span style={{ width: `${ratio}%` }} /></div>

      </label>
    })}</div>}
    {matching.length > 6 && <button type="button" className="stock-show-more" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer items' : `Show all ${matching.length} items`}</button>}
    </div>
    {!isAdmin && <aside aria-label="Review selected suppliers" className={`stock-order-tray ${chosen.length ? 'has-selection' : ''}`}><div><strong aria-live="polite">{chosen.length ? `${chosen.length} items selected` : 'Build your next purchase order'}</strong><p>{chosen.length ? `${groups.length} supplier ${groups.length === 1 ? 'group' : 'groups'} · review and submit one order per supplier.` : 'Select the stock cards above to get started.'}</p></div>{chosen.length > 0 && <button type="button" className="stock-clear" onClick={() => setSelected([])}>Clear</button>}<div className="stock-order-buttons" role="region" aria-label="Supplier orders" tabIndex={groups.length > 4 ? 0 : undefined}>{groups.map((group) => <button type="button" className="ops-main-action" key={group.name} onClick={() => onCreate(group.name, group.items)}>Review {group.name || 'unassigned items'} ({group.items.length})<ArrowRight size={16} /></button>)}</div></aside>}
    </div>
  </section>
}
