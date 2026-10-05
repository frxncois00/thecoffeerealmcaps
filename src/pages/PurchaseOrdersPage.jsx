import { useEffect, useId, useMemo, useState } from 'react'
import { AlertTriangle, Check, ClipboardCheck, FileImage, FileText, ImagePlus, Package, PackageCheck, Plus, Send, ShieldAlert, Store, Trash2, Upload, X } from 'lucide-react'
import PurchaseStockBoard from '../components/PurchaseStockBoard'
import { pricePerPurchaseUnit, updatePurchaseLine } from '../utils/purchaseLinePricing'
import { needsRestock, suggestedQuantity } from '../utils/purchaseStock'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { describeError } from '../utils/describeError'
import { money } from '../utils/money'
import {
  approvePurchaseOrder, cancelPurchaseOrder, fetchPurchaseOrderOptions,
  fetchPurchaseOrders, fetchSuppliers, getPurchaseOrderDocumentUrl, markPurchaseOrderSent, receivePurchaseOrder, reportPurchaseOrderIssue, savePurchaseOrder, saveSupplier, uploadPurchaseOrderDocument,
} from '../services/purchaseOrderService'

const STATUS_META = {
  draft: ['Draft', 'neutral'], pending_approval: ['Pending Approval', 'amber'], approved: ['Ready to send', 'blue'],
  rejected: ['Needs revision', 'red'], sent: ['Awaiting delivery', 'purple'], closed: ['Completed', 'green'], returned: ['Returned', 'red'], cancelled: ['Cancelled', 'neutral'],
}
const LEGACY_STATUSES = new Set(['partially_received', 'received', 'pending_receiving_review', 'approved_for_payment', 'payment_review', 'disputed'])

const RECEIVING_CHECKS = [
  { question: 'Are all items the correct products?', issue: 'Some delivered products do not match the order.', reason: 'Wrong items' },
  { question: 'Are all quantities complete?', issue: 'The delivered quantities are incomplete.', reason: 'Quantity mismatch' },
  { question: 'Are all items free from damage?', issue: 'Some items are damaged.', reason: 'Damaged items' },
  { question: 'Are all items within acceptable expiry dates?', issue: 'Some items have unacceptable expiry dates.', reason: 'Expired items' },
  { question: 'Were all items stored properly during delivery?', issue: 'Some items were not stored properly during delivery.', reason: 'Quality issue' },
]
const RECEIVING_UPLOAD_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx'

function tableActionsFor(order, isAdmin) {
  if (isAdmin) {
    if (order.status === 'pending_approval') return [{ label: 'Approve', type: 'approve' }, { label: 'Reject', type: 'reject' }]
    if (order.status === 'approved') return [{ label: 'Mark Sent', type: 'send' }]
    return []
  }
  if (order.status === 'draft') return [{ label: 'Edit', type: 'edit' }, { label: 'Submit', type: 'submit' }]
  if (order.status === 'rejected') return [{ label: 'Revise', type: 'edit' }]
  if (order.status === 'approved') return [{ label: 'Mark Sent', type: 'send' }]
  if (order.status === 'sent') return [{ label: 'Submit', type: 'receive' }]
  return []
}

const EMPTY_DRAFT = { id: '', supplierName: '', supplierContact: '', requestedDeliveryDate: '', items: [{ itemType: 'ingredient', itemId: '', purchaseUnit: '', quantityOrdered: '', estimatedTotalCost: '' }] }

function unitChoices(baseUnit = '') {
  const unit = baseUnit.toLowerCase()
  if (unit === 'g' || unit === 'gram' || unit === 'grams') return [{ value: 'g', label: 'gram (g)', factor: 1 }, { value: 'kg', label: 'kilogram (kg)', factor: 1000 }]
  if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') return [{ value: 'kg', label: 'kilogram (kg)', factor: 1 }, { value: 'g', label: 'gram (g)', factor: 0.001 }]
  if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') return [{ value: 'ml', label: 'milliliter (ml)', factor: 1 }, { value: 'L', label: 'liter (L)', factor: 1000 }]
  if (unit === 'l' || unit === 'liter' || unit === 'liters') return [{ value: 'L', label: 'liter (L)', factor: 1 }, { value: 'ml', label: 'milliliter (ml)', factor: 0.001 }]
  if (['piece', 'pieces', 'pc', 'pcs'].includes(unit)) return [{ value: baseUnit || 'piece', label: baseUnit || 'piece', factor: 1 }, { value: 'dozen', label: 'dozen (12 pieces)', factor: 12 }]
  return [{ value: baseUnit || 'piece', label: baseUnit || 'piece', factor: 1 }]
}

function unitFactor(baseUnit, purchaseUnit) {
  return unitChoices(baseUnit).find((choice) => choice.value === purchaseUnit)?.factor || 1
}

function purchaseDisplay(baseUnit, baseQuantity) {
  const quantity = Number(baseQuantity || 0)
  const larger = unitChoices(baseUnit).filter((choice) => choice.factor > 1).sort((a, b) => b.factor - a.factor)[0]
  return larger && quantity >= larger.factor ? { unit: larger.value, quantity: quantity / larger.factor } : { unit: unitChoices(baseUnit)[0].value, quantity }
}

function labelFor(status) { return STATUS_META[status]?.[0] || status }
function toneFor(status) { return STATUS_META[status]?.[1] || 'neutral' }
function dateLabel(value) { return value ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : '—' }
function dateTimeLabel(value) { return value ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '—' }
function qty(value) { const number = Number(value || 0); return Number.isInteger(number) ? String(number) : number.toFixed(2) }
function totalFor(order) { return order.items.reduce((sum, item) => sum + item.quantityOrdered * item.estimatedUnitCost, 0) }
function emptyDraftFromOrder(order) {
  return { id: order.id, supplierName: order.supplierName, supplierContact: order.supplierContact, requestedDeliveryDate: order.requestedDeliveryDate, items: order.items.map((item) => { const display = purchaseDisplay(item.unit, item.quantityOrdered); return { itemType: item.itemType, itemId: item.itemId, purchaseUnit: display.unit, quantityOrdered: display.quantity, estimatedTotalCost: item.quantityOrdered * item.estimatedUnitCost } }) }
}

export default function PurchaseOrdersPage({ role = 'staff' }) {
  const isAdmin = role === 'admin'
  const [orders, setOrders] = useState([])
  const [stockSelection, setStockSelection] = useState([])
  const [options, setOptions] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated-desc')
  const [dateFrom, setDateFrom] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [shortcutOrderId, setShortcutOrderId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formOpen, setFormOpen] = useState(false)

  const [supplierOpen, setSupplierOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [action, setAction] = useState(null)
  const [receivingOpen, setReceivingOpen] = useState(false)
  const [receivingIntent, setReceivingIntent] = useState('receive')

  useEffect(() => {
    const dialogs = document.querySelectorAll('.po-modal[role="dialog"], .po-drawer[role="dialog"]')
    const dialog = dialogs[dialogs.length - 1]
    if (!dialog) return
    const previous = document.activeElement
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter((element) => element.getClientRects().length)
    focusable()[0]?.focus()
    function trap(event) {
      if (event.key !== 'Tab') return
      const elements = focusable(), first = elements[0], last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    dialog.addEventListener('keydown', trap)
    return () => { dialog.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus() }
  }, [selectedId, formOpen, receivingOpen, supplierOpen, action?.type])

  const load = async () => {
    setLoading(true)
    try {
      const [nextOrders, nextOptions, nextSuppliers] = await Promise.all([fetchPurchaseOrders(), fetchPurchaseOrderOptions(), fetchSuppliers()])
      setOrders(nextOrders)
      setOptions(nextOptions)
      setSuppliers(nextSuppliers)
      setError('')
    } catch (cause) {
      setError(describeError(cause, 'Purchase orders could not be loaded.'))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const selected = orders.find((order) => order.id === (shortcutOrderId || selectedId)) || null
  function openShortcut(order, type) {
    setSelectedId('')
    setShortcutOrderId(order.id)
    if (type === 'edit') { setShortcutOrderId(''); openEdit(order) }
    if (type === 'submit') setAction({ type: 'submit', title: 'Submit purchase order for approval', label: 'Submit for Approval', note: '' })
    if (type === 'receive' || type === 'report') { setReceivingIntent(type); setReceivingOpen(true) }
    if (type === 'approve') setAction({ type: 'approve', title: 'Approve purchase order', label: 'Approve', note: '' })
    if (type === 'reject') setAction({ type: 'reject', title: 'Reject purchase order', label: 'Reject', note: '' })
    if (type === 'send') setAction({ type: 'send', title: 'Mark as sent', label: 'Mark Sent', note: order.supplierReference || '' })
  }
  const lowStockItems = useMemo(() => options.filter(needsRestock), [options])
  const lowStockCount = lowStockItems.length
  const visibleOrders = useMemo(() => orders.filter((order) => !LEGACY_STATUSES.has(order.status)), [orders])
  const counts = useMemo(() => visibleOrders.reduce((acc, order) => { acc[order.status] = (acc[order.status] || 0) + 1; return acc }, {}), [visibleOrders])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const result = visibleOrders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      if (supplierFilter !== 'all' && order.supplierName !== supplierFilter) return false
      if (dateFrom && (!order.requestedDeliveryDate || order.requestedDeliveryDate < dateFrom)) return false
      return !term || [order.po_number, order.supplierName].some((value) => String(value || '').toLowerCase().includes(term))
    })
    return result.sort((left, right) => {
      if (sortBy === 'name') return String(left.supplierName || '').localeCompare(String(right.supplierName || ''))
      if (sortBy === 'status') return labelFor(left.status).localeCompare(labelFor(right.status))
      if (sortBy === 'delivery-asc') return String(left.requestedDeliveryDate || '9999').localeCompare(String(right.requestedDeliveryDate || '9999'))
      return new Date(right.updatedAt || right.created_at || 0) - new Date(left.updatedAt || left.created_at || 0)
    })
  }, [visibleOrders, query, statusFilter, supplierFilter, sortBy, dateFrom])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageOrders = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => { setPage(1) }, [query, statusFilter, supplierFilter, sortBy, dateFrom, pageSize])
  const suppliersInOrders = useMemo(() => [...new Set(visibleOrders.map((order) => order.supplierName).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [visibleOrders])

  function announce(message) { setNotice(message); window.setTimeout(() => setNotice(''), 4500) }
  function getSupplierForItem(item) {
    const match = suppliers.find((s) =>
      (s.items || []).some((si) => {
        const isIng = item.itemType === 'ingredient' && (String(si.ingredient_id) === String(item.id) || (si.item_type === 'ingredient' && String(si.item_id) === String(item.id)))
        const isFin = item.itemType === 'finished_product' && (String(si.finished_product_id) === String(item.id) || (si.item_type === 'finished_product' && String(si.item_id) === String(item.id)))
        return isIng || isFin
      })
    )
    return match?.name || item.supplier || ''
  }

  function openCreateForSupplier(supplierName, lowStock) {
    const supplier = suppliers.find((entry) => entry.name === supplierName)
    const suggested = (lowStock || []).map((item) => ({
      itemType: item.itemType, itemId: item.id, purchaseUnit: purchaseDisplay(item.unit, suggestedQuantity(item)).unit,
      quantityOrdered: purchaseDisplay(item.unit, suggestedQuantity(item)).quantity, estimatedTotalCost: '',
    }))
    setDraft({ ...EMPTY_DRAFT, supplierName: supplierName === 'Unassigned supplier' ? '' : supplierName, supplierContact: supplier?.contact || '', items: suggested.length ? suggested : EMPTY_DRAFT.items })
    setFormOpen(true)
  }
  function openCreate() { openCreateForSupplier('', []) }
  async function saveSupplierRecord(payload) { await saveSupplier(payload); await load(); announce('Supplier saved.') }
  function openEdit(order) { setDraft(emptyDraftFromOrder(order)); setFormOpen(true) }
  async function saveDraft(payload) {
    try {
      await savePurchaseOrder({ ...payload, options })
      setFormOpen(false)
      setShortcutOrderId('')
      setStockSelection((current) => current.filter((key) => !payload.items.some((item) => `${item.itemType}:${item.itemId}` === key)))
      await load()
      announce(payload.submit ? 'Purchase order submitted.' : 'Draft saved.')
    } catch (cause) { throw new Error(describeError(cause, 'Purchase order could not be saved.')) }
  }
  async function runAction() {
    if (!action || !selected) return
    try {
      if (action.type === 'approve') await approvePurchaseOrder(selected.id, true)
      if (action.type === 'reject') await approvePurchaseOrder(selected.id, false, action.note)
      if (action.type === 'submit') await savePurchaseOrder({ ...emptyDraftFromOrder(selected), submit: true, options })
      if (action.type === 'send') await markPurchaseOrderSent(selected.id, action.note)
      if (action.type === 'cancel') await cancelPurchaseOrder(selected.id, action.note)
      setAction(null)
      setShortcutOrderId('')
      await load()
      announce(action.type === 'approve' ? 'Purchase order approved.' : action.type === 'submit' ? 'Purchase order submitted for approval.' : `${action.type[0].toUpperCase()}${action.type.slice(1)} action saved.`)
    } catch (cause) { setError(describeError(cause, 'Purchase order action could not be completed.')) }
  }
  async function submitReceiving(lines, notes, documents = {}) {
    try {
      for (const file of documents.proof || []) await uploadPurchaseOrderDocument(selected.id, 'receiving_proof', file)
      for (const file of documents.invoice || []) await uploadPurchaseOrderDocument(selected.id, 'supplier_invoice', file)
      for (const file of documents.receipt || []) await uploadPurchaseOrderDocument(selected.id, 'supplier_receipt', file)
      await receivePurchaseOrder(selected.id, lines, notes)
      setReceivingOpen(false)
      setShortcutOrderId('')
      await load()
      announce('Order completed. Ingredients have been restocked.')
      return true
    } catch (cause) { setError(describeError(cause, 'Receiving could not be submitted.')); return false }
  }
  async function reportIssue(issues) {
    try {
      await reportPurchaseOrderIssue(selected.id, issues[0].reason, 'Return affected items', issues.map((issue) => issue.issue).join(' '))
      setReceivingOpen(false)
      setShortcutOrderId('')
      await load()
      announce('Order returned and closed. Admin has been notified.')
      return true
    } catch (cause) { setError(describeError(cause, 'Issue could not be reported.')); return false }
  }

  return (
    <AppShell role={role} title="Purchase Orders" eyebrow={isAdmin ? 'Approval queue' : 'Inventory purchasing'} onRefresh={load} actions={<button type="button" className="ops-icon-button" aria-label="Refresh purchase orders" title="Refresh" onClick={load} disabled={loading}><ClipboardCheck size={18} /></button>}>
      {error ? <div className="po-alert is-error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div> : null}
      {notice ? <div className="po-alert is-success" role="status"><Check size={15} />{notice}</div> : null}

      <PurchaseStockBoard selected={stockSelection} setSelected={setStockSelection} items={lowStockItems} loading={loading} isAdmin={isAdmin} getSupplier={getSupplierForItem} onCreate={openCreateForSupplier} />

      <section className="po-summary" aria-label="Purchase order summary">
        <Summary label="Pending Approval" value={counts.pending_approval || 0} tone="amber" icon={<AlertTriangle size={18} />} detail="Needs review" />
        <Summary label="Approved" value={counts.approved || 0} tone="blue" icon={<Check size={18} />} detail="Ready to send" />
        <Summary label="Awaiting delivery" value={counts.sent || 0} tone="purple" icon={<PackageCheck size={18} />} detail="Open deliveries" />
        <Summary label="Completed" value={counts.closed || 0} tone="green" icon={<Package size={18} />} detail="Completed orders" />
        <Summary label="Returned" value={counts.returned || 0} tone="red" icon={<ShieldAlert size={18} />} detail="Closed returns" />
      </section>

      <section className="po-toolbar">
        <div className="po-toolbar-search"><FileText size={16} /><input value={query} onChange={(event) => setQuery(event.target.value.slice(0, 80))} placeholder="Search PO or supplier" aria-label="Search purchase orders" /></div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter purchase orders by status"><option value="all">All statuses</option>{Object.entries(STATUS_META).map(([value, [label]]) => <option value={value} key={value}>{label}</option>)}</select>
        <select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} aria-label="Filter purchase orders by supplier"><option value="all">All suppliers</option>{suppliersInOrders.map((supplier) => <option value={supplier} key={supplier}>{supplier}</option>)}</select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort purchase orders"><option value="updated-desc">Sort: Recently updated</option><option value="delivery-asc">Sort: Delivery date</option><option value="name">Sort: Supplier name</option><option value="status">Sort: Status</option></select>
        <label className="po-date-filter"><span>Delivery from</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Show purchase orders from delivery date" /></label>
        {!isAdmin ? <><button type="button" className="ops-secondary-action" onClick={() => setSupplierOpen(true)}><Store size={16} /> Suppliers</button><button type="button" className="ops-main-action" onClick={openCreate}><Plus size={16} /> Create custom order</button></> : null}
      </section>

        <section className="po-table-panel">
        <div className="po-table-scroll"><table className="po-table"><thead><tr><th>PO number</th><th>Supplier</th><th>Delivery</th><th>Items</th><th>Estimated total</th><th>Status</th><th className="po-actions-heading">Actions</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="7" className="po-empty">Loading…</td></tr> : pageOrders.length ? pageOrders.map((order) => <tr key={order.id} className={selectedId === order.id ? 'is-selected' : ''}><td><b>{order.po_number}</b><small>{dateTimeLabel(order.created_at)}</small></td><td>{order.supplierName}</td><td>{dateLabel(order.requestedDeliveryDate)}</td><td>{order.items.length}</td><td>{money(totalFor(order))}</td><td><StatusBadge status={order.status} /></td><td className="po-row-actions"><div><button type="button" className="ops-secondary-action compact" onClick={() => { setShortcutOrderId(''); setSelectedId(order.id) }}>View</button>{tableActionsFor(order, isAdmin).map((shortcut) => <button type="button" key={shortcut.type} className={`${['reject', 'report'].includes(shortcut.type) ? 'ops-destructive-action' : 'ops-main-action'} compact`} onClick={() => openShortcut(order, shortcut.type)}>{shortcut.label}</button>)}</div></td></tr>) : <tr><td colSpan="7" className="po-empty">No purchase orders found.</td></tr>}
        </tbody></table></div>
      </section>
      <footer className="po-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><label>Rows<select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label><div><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>‹</button><b>Page {page} of {pageCount}</b><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>›</button></div></footer>

      {selectedId && selected ? <PurchaseOrderDrawer order={selected} isAdmin={isAdmin} onClose={() => setSelectedId('')} onEdit={() => openEdit(selected)} onSubmit={() => saveDraft({ ...emptyDraftFromOrder(selected), submit: true })} onApprove={() => setAction({ type: 'approve', title: 'Approve purchase order', label: 'Approve', note: '' })} onReject={() => setAction({ type: 'reject', title: 'Reject purchase order', label: 'Reject', note: '' })} onSend={() => setAction({ type: 'send', title: 'Mark as sent', label: 'Mark Sent', note: selected.supplierReference || '' })} onReceive={() => { setReceivingIntent('receive'); setReceivingOpen(true) }} onCancel={() => setAction({ type: 'cancel', title: 'Cancel purchase order', label: 'Cancel PO', note: '' })} /> : null}

      {formOpen ? <PurchaseOrderForm draft={draft} options={options.filter((option) => option.itemType === 'ingredient')} suppliers={suppliers} onClose={() => setFormOpen(false)} onSave={saveDraft} /> : null}
      {supplierOpen ? <SupplierModal options={options.filter((option) => option.itemType === 'ingredient')} suppliers={suppliers} onClose={() => setSupplierOpen(false)} onSave={async (payload) => { await saveSupplierRecord(payload); setSupplierOpen(false) }} /> : null}
      {receivingOpen && selected ? <ReceivingModal order={selected} intent={receivingIntent} onClose={() => { setReceivingOpen(false); setShortcutOrderId('') }} onSave={submitReceiving} onReport={reportIssue} /> : null}
      {action ? <ActionModal action={action} onClose={() => { setAction(null); setShortcutOrderId('') }} onChange={(note) => setAction((current) => ({ ...current, note }))} onConfirm={runAction} /> : null}
    </AppShell>
  )
}

function Summary({ label, value, tone, icon, detail }) { return <article className={`inv-summary-card tone-${tone} po-summary-card`}><span className="inv-summary-icon">{icon}</span><span className="inv-summary-copy"><span>{label}</span><small>{detail}</small></span><b>{value}</b></article> }
function StatusBadge({ status }) { return <span className={`po-status po-status-${toneFor(status)}`}>{labelFor(status)}</span> }

function PurchaseOrderDrawer({ order, isAdmin, onClose, onEdit, onSubmit, onApprove, onReject, onSend, onReceive, onCancel }) {
  const canEdit = !isAdmin && ['draft', 'rejected'].includes(order.status)
  const canSend = order.status === 'approved'
  const canReceive = !isAdmin && order.status === 'sent'
  const canCancel = ['draft', 'pending_approval', 'approved', 'rejected'].includes(order.status)
  return <><button type="button" className="po-drawer-backdrop" onClick={onClose} aria-label="Close purchase order details" /><aside className="po-drawer" role="dialog" aria-modal="true" aria-label={`Purchase order ${order.po_number}`} onClick={(event) => event.stopPropagation()}>
    <header><button type="button" className="po-close" onClick={onClose} aria-label="Close purchase order"><X size={18} /></button><div className="po-drawer-title"><div><span>Purchase order</span><h2>{order.po_number}</h2></div><StatusBadge status={order.status} /></div></header>
    <div className="po-drawer-body">
      <div className="po-stage-guidance"><strong>{labelFor(order.status)}</strong><p>{{ draft: 'Staff: complete the order and submit it for approval.', pending_approval: 'Admin: review quantities, estimated costs, and the requested delivery date.', approved: 'Staff or admin: send the approved order to the supplier, then record it as sent.', sent: 'Staff: inspect the delivery. Receive all correct items or report problems and return the order.', closed: 'Delivery completed and inventory restocked.', returned: 'Delivery reported and order closed. No stock was added.', rejected: 'Staff: revise the order using the admin feedback, then resubmit.' }[order.status] || 'Review the activity and documents for this order.'}</p>{order.rejection_reason && <p>Review note: {order.rejection_reason}</p>}</div>
      <div className="po-detail-grid"><div><span>Supplier</span><b>{order.supplierName}</b></div><div><span>Delivery date</span><b>{dateLabel(order.requestedDeliveryDate)}</b></div><div><span>Created by</span><b>{order.createdByName || '—'}</b></div><div><span>Estimated total</span><b>{money(totalFor(order))}</b></div></div>
      <div className="po-section-heading"><h3>Items</h3><span>{order.items.length} lines</span></div>
      <div className="po-lines"><table><thead><tr><th>Item</th><th>Ordered</th><th>Accepted</th><th>Cost</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id}><td><b>{item.item_name}</b><small>{item.unit}</small></td><td>{qty(item.quantityOrdered)}</td><td>{qty(item.acceptedQuantity)}</td><td>{money(item.actualUnitCost === '' ? item.estimatedUnitCost : item.actualUnitCost)}</td></tr>)}</tbody></table></div>
      {order.documents?.length ? <div className="po-document-list"><div className="po-section-heading"><h3>Attached documents</h3></div>{Array.from(new Map(order.documents.map((document) => [`${String(document.file_name || '').trim().toLowerCase()}|${String(document.document_type || '').trim().toLowerCase()}`, document])).values()).map((document) => <div key={`${document.file_name}|${document.document_type}`}><DocumentLink document={document} /><small>{document.document_type.replaceAll('_', ' ')}</small></div>)}</div> : null}
      <div className="po-section-heading"><h3>Activity</h3></div>
      <div className="po-events">{order.events.length ? order.events.map((event) => <div key={event.id}><i /><span><b>{event.action}</b><small>{dateTimeLabel(event.created_at)}{event.note ? ` · ${event.note}` : ''}</small></span></div>) : <span>No activity recorded.</span>}</div>
    </div>
    <div className="po-actions po-drawer-actions">
      {canEdit ? <button type="button" className="ops-secondary-action" onClick={onEdit}>{order.status === 'rejected' ? 'Revise order' : 'Edit draft'}</button> : null}
      {canEdit ? <button type="button" className="ops-main-action" onClick={onSubmit}>Submit for approval</button> : null}
      {isAdmin && order.status === 'pending_approval' ? <><button type="button" className="ops-destructive-action" onClick={onReject}>Reject</button><button type="button" className="ops-main-action" onClick={onApprove}>Approve</button></> : null}
      {canSend ? <button type="button" className="ops-main-action" onClick={onSend}><Send size={15} /> Mark Sent</button> : null}
      {canReceive ? <button type="button" className="ops-main-action" onClick={onReceive}><PackageCheck size={15} /> Receive</button> : null}
      {canCancel ? <button type="button" className="ops-destructive-action" onClick={onCancel}>Cancel</button> : null}
    </div>
  </aside></>
}

function ReceivingModal({ order, intent, onClose, onSave, onReport }) {
  const [lines] = useState(order.items.map((item) => ({ ...item })))
  const [answers, setAnswers] = useState({})
  const [confirmReport, setConfirmReport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [proof, setProof] = useState([])
  const [invoice, setInvoice] = useState([])
  const [receipt, setReceipt] = useState([])
  const issues = RECEIVING_CHECKS.filter((_, index) => answers[index] === 'no')
  const checksComplete = RECEIVING_CHECKS.every((_, index) => answers[index] === 'yes')
  useEffect(() => {
    if (!confirmReport) return undefined
    const dialog = document.querySelector('.po-report-confirm')
    const previous = document.activeElement
    const buttons = [...dialog.querySelectorAll('button:not(:disabled)')]
    buttons[0]?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); setConfirmReport(false); return }
      if (event.key !== 'Tab') return
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    dialog.addEventListener('keydown', onKeyDown)
    return () => { dialog.removeEventListener('keydown', onKeyDown); if (previous?.isConnected) previous.focus() }
  }, [confirmReport])
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!checksComplete) { setError('Confirm Yes for every delivery check, or report the issues to Admin.'); return }
    if (!proof.length || !invoice.length || !receipt.length) { const message = 'Upload proof, invoice, and receipt before submitting.'; setError(message); return }
    setSaving(true)
    const receivedLines = lines.map((line) => ({ ...line, receivedQuantity: line.quantityOrdered, acceptedQuantity: line.quantityOrdered, damagedQuantity: 0, missingQuantity: 0, actualUnitCost: line.estimatedUnitCost }))
    try { if (!await onSave(receivedLines, '', { proof, invoice, receipt })) setError('Receiving could not be completed. Check the error and try again.') } finally { setSaving(false) }
  }
  return <div className="po-modal-backdrop">
    <section className="po-modal po-receiving-modal po-receiving-guide" role="dialog" aria-modal="true" aria-label={intent === 'report' ? 'Report purchase order delivery issue' : 'Receive purchase order'}>
      <header><div><h2>{intent === 'report' ? `Report delivery issue for ${order.po_number}` : `Receive delivery for ${order.po_number}`}</h2><p className="po-modal-intro">Check the delivery against the order before adding the items to stock.</p></div><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
      <form onSubmit={submit}>
        <div className="po-receiving-steps">
          <div className="po-receiving-step is-active"><b>1</b><span><strong>Review items</strong><small>Compare with the order</small></span></div>
          <div className="po-receiving-step"><b>2</b><span><strong>Check delivery</strong><small>Answer all questions</small></span></div>
          <div className="po-receiving-step"><b>3</b><span><strong>Finish</strong><small>Receive or return the order</small></span></div>
        </div>
        <div className="po-receive-body-grid"><div className="po-receive-left"><div className="po-receive-items-table-wrap"><table className="po-receive-items-table"><thead><tr><th>Item</th><th>Quantity</th><th>Cost per unit</th><th>Total price</th></tr></thead><tbody>{lines.map((line) => <tr key={line.id}><td>{line.item_name}</td><td>{qty(line.quantityOrdered)} {line.unit}</td><td>{money(line.estimatedUnitCost)}</td><td>{money(Number(line.quantityOrdered || 0) * Number(line.estimatedUnitCost || 0))}</td></tr>)}</tbody></table></div><div className="po-receive-grand-total"><span>Final total</span><strong>{money(lines.reduce((sum, line) => sum + Number(line.quantityOrdered || 0) * Number(line.estimatedUnitCost || 0), 0))}</strong></div><DocumentUpload label="Proof of items received" hint="Images or documents" accept={RECEIVING_UPLOAD_ACCEPT} files={proof} onChange={setProof} multiple limit={5} required /></div><div className="po-receive-right"><fieldset className="po-receiving-checklist"><legend>Delivery checks</legend>{RECEIVING_CHECKS.map((check, index) => <div className="po-receiving-check" key={check.question}><span>{check.question}</span><div role="group" aria-label={check.question}><button type="button" className={answers[index] === 'yes' ? 'is-selected' : ''} aria-pressed={answers[index] === 'yes'} onClick={() => setAnswers((current) => ({ ...current, [index]: 'yes' }))}>Yes</button><button type="button" className={answers[index] === 'no' ? 'is-selected is-no' : ''} aria-pressed={answers[index] === 'no'} onClick={() => setAnswers((current) => ({ ...current, [index]: 'no' }))}>No</button></div></div>)}</fieldset>{issues.length > 0 ? <p className="po-receiving-report-prompt" role="status">Report to Admin and return this order. No items will be added to stock.</p> : null}<DocumentUpload label="Invoice" hint="Images or documents" accept={RECEIVING_UPLOAD_ACCEPT} files={invoice} onChange={setInvoice} multiple limit={5} required /><DocumentUpload label="Supplier delivery receipt" hint="Images or documents" accept={RECEIVING_UPLOAD_ACCEPT} files={receipt} onChange={setReceipt} multiple limit={5} required /></div></div>
        {error ? <p className="po-inline-error" role="alert">{error}</p> : null}
        <footer><button type="button" className="ops-destructive-action" onClick={() => setConfirmReport(true)} disabled={!issues.length || saving}>Report to Admin</button><button type="submit" className="ops-main-action" disabled={!checksComplete || saving}>{saving ? 'Submitting…' : 'Submit as Received'}</button><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button></footer>
      </form>
    </section>
    {confirmReport ? <div className="po-report-confirm-backdrop"><section className="po-modal po-report-confirm" role="dialog" aria-modal="true" aria-labelledby="po-report-confirm-title"><header><div><span>{order.po_number}</span><h2 id="po-report-confirm-title">Return this order?</h2></div><button type="button" onClick={() => setConfirmReport(false)} aria-label="Close confirmation"><X size={18} /></button></header><div className="po-report-confirm-body"><ul>{issues.map((issue) => <li key={issue.question}>{issue.issue}</li>)}</ul><p>Admin will be notified. The order will close as Returned and no stock will be added.</p></div>{error ? <p className="po-inline-error" role="alert">{error}</p> : null}<footer><button type="button" className="ops-secondary-action" onClick={() => setConfirmReport(false)} disabled={saving}>Back to review</button><button type="button" className="ops-destructive-action" disabled={saving} onClick={async () => { setSaving(true); setError(''); try { const reported = await onReport(issues); if (reported) setConfirmReport(false); else setError('Report could not be sent. Try again.') } finally { setSaving(false) } }}>{saving ? 'Sending…' : 'Confirm return'}</button></footer></section></div> : null}
  </div>
}

function FilePreview({ file }) {
  const [url, setUrl] = useState('')
  useEffect(() => { if (!file?.type?.startsWith('image/')) return undefined; const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next) }, [file])
  return url ? <img src={url} alt="" /> : <FileImage size={22} aria-hidden="true" />
}

function DocumentUpload({ label, hint, files = [], onChange, accept = 'image/*,application/pdf', multiple = false, limit = 1, required = false }) {
  const inputId = useId()
  function selectFiles(event) {
    const picked = Array.from(event.target.files || [])
    onChange(multiple ? [...files, ...picked].slice(0, limit) : picked.slice(0, 1))
    event.target.value = ''
  }
  return <section className="po-upload-card">
    <div className="po-upload-heading"><span>{label}{required ? ' *' : ''}</span>{multiple ? <small>{files.length}/{limit}</small> : null}</div>
    {files.length ? <div className="po-upload-files">{files.map((file, index) => <div className="po-upload-file" key={`${file.name}-${file.lastModified}-${index}`}><FilePreview file={file} /><span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></span><button type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`}><Trash2 size={16} /></button></div>)}</div> : null}
    {files.length < limit ? <label className="po-upload-drop" htmlFor={inputId}><ImagePlus size={24} aria-hidden="true" /><span><b>{files.length ? 'Add another file' : 'Choose a file'}</b><small>{hint}</small></span><input id={inputId} className="po-upload-input" type="file" accept={accept} multiple={multiple} onChange={selectFiles} /></label> : null}
  </section>
}

function DocumentLink({ document }) {
  const [url, setUrl] = useState('')
  const isImage = /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(document.file_name || '') || String(document.mime_type || '').startsWith('image/')
  useEffect(() => { let active = true; getPurchaseOrderDocumentUrl(document.storage_path).then((nextUrl) => { if (active) setUrl(nextUrl || '') }).catch(() => {}); return () => { active = false } }, [document.storage_path])
  function open() { if (url) window.open(url, '_blank', 'noopener,noreferrer') }
  return <span className="po-document-entry">{isImage && url ? <button type="button" className="po-document-preview" onClick={open} aria-label={`Preview ${document.file_name}`}><img src={url} alt={document.file_name} loading="lazy" /></button> : <Upload size={14} />}<button type="button" className="po-document-link" onClick={open} disabled={!url}>{document.file_name}</button></span>
}

function ActionModal({ action, onClose, onChange, onConfirm }) {
  const [busy, setBusy] = useState(false)
  async function perform(callback) { if (busy) return; setBusy(true); try { await callback() } finally { setBusy(false) } }

  const needsNote = ['reject', 'send', 'cancel'].includes(action.type)
  return <div className="po-modal-backdrop"><section className="po-modal po-action-modal" role="dialog" aria-modal="true" aria-label={action.title}><header><h2>{action.title}</h2><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>{needsNote ? <Field label={action.type === 'send' ? 'Supplier reference' : action.type === 'reject' ? 'Rejection reason' : 'Note'} required={action.type === 'reject'}><textarea rows="3" value={action.note} onChange={(event) => onChange(event.target.value)} required={action.type === 'reject'} /></Field> : <p className="po-confirm-line">Confirm {action.title.toLowerCase()}.</p>}<footer><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button><button type="button" className={action.type === 'reject' || action.type === 'cancel' ? 'ops-destructive-action' : 'ops-main-action'} disabled={busy || (action.type === 'reject' && !action.note.trim())} onClick={() => perform(onConfirm)}>{busy ? 'Saving…' : action.label}</button></footer></section></div>
}
function PurchaseOrderForm({ draft, options, suppliers, onClose, onSave }) {
  const [values, setValues] = useState(draft)
  const [itemSearches, setItemSearches] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const selectedSupplier = suppliers.find((supplier) => supplier.name === values.supplierName) || null
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const setLine = (index, key, value) => setValues((current) => ({ ...current, items: current.items.map((line, itemIndex) => itemIndex === index ? updatePurchaseLine(line, key, value) : line) }))
  useEffect(() => {
    const hasSelectedItems = values.items.some((item) => item.itemId)
    const isBlankPlaceholder = values.items.length === 1 && !values.items[0].itemId
    if (values.id || hasSelectedItems || !isBlankPlaceholder || !selectedSupplier?.items?.length) return
    const savedItems = selectedSupplier.items.map((item) => {
      const itemType = item.item_type === 'finished_product' ? 'finished_product' : 'ingredient'
      const itemId = item.ingredient_id || item.finished_product_id
      const option = options.find((entry) => entry.itemType === itemType && String(entry.id) === String(itemId))
      return option ? { itemType: option.itemType, itemId: option.id, purchaseUnit: unitChoices(option.unit)[0].value, quantityOrdered: '', estimatedTotalCost: '' } : null
    }).filter(Boolean)
    if (savedItems.length) {
      setValues((current) => ({ ...current, items: savedItems }))
      setItemSearches({})
    }
  }, [options, selectedSupplier, values.id, values.items])
  async function submit(event, shouldSubmit) {
    event.preventDefault(); setError('')
    if (!values.supplierName.trim()) { setError('Select a supplier.'); return }
    if (values.items.some((item) => !item.itemId)) { setError('Select an ingredient from the list for every line.'); return }
    if (values.items.some((item) => !item.purchaseUnit || (!Number.isFinite(Number(item.quantityOrdered)) || Number(item.quantityOrdered) <= 0) || item.estimatedTotalCost === '' || (!Number.isFinite(Number(item.estimatedTotalCost)) || Number(item.estimatedTotalCost) < 0))) { setError('Complete the unit, quantity, and total price for every item line.'); return }
    if (shouldSubmit) { setPreviewOpen(true); return }
    setSubmitting(true)
    try { await onSave({ ...values, submit: shouldSubmit }) } catch (cause) { setError(cause.message || 'Could not save purchase order.') } finally { setSubmitting(false) }
  }
  if (previewOpen) return <PurchaseOrderPreview values={values} options={options.filter((option) => option.itemType === 'ingredient')} onBack={() => setPreviewOpen(false)} onConfirm={async () => { setPreviewOpen(false); setSubmitting(true); try { await onSave({ ...values, submit: true }) } catch (cause) { setError(cause.message || 'Could not submit purchase order.') } finally { setSubmitting(false) } }} submitting={submitting} />
  return <div className="po-modal-backdrop">
    <section className="po-modal po-form-modal" role="dialog" aria-modal="true" aria-label={values.id ? 'Edit purchase order' : 'New purchase order'}>
      <header><div><span>Inventory purchasing</span><h2>{values.id ? 'Edit purchase order' : 'New Purchase Order'}</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
      <form onSubmit={(event) => submit(event, false)}>
        <div className="po-create-grid">
          <section className="po-create-supplier">
            <div className="po-create-section-heading"><span>Supplier</span><h3>Select supplier</h3></div>
            <Field label="Supplier" required><select value={values.supplierName} onChange={(event) => { const supplier = suppliers.find((entry) => entry.name === event.target.value); set('supplierName', event.target.value); set('supplierContact', supplier?.contact || '') }} required><option value="">Select supplier</option>{suppliers.map((supplier) => <option value={supplier.name} key={supplier.id}>{supplier.name}</option>)}<option value="Other">Other supplier</option></select></Field>
            <Field label="Contact number or email"><input value={values.supplierContact} onChange={(event) => set('supplierContact', event.target.value)} maxLength={120} /></Field>
            <div className="po-supplier-info">{selectedSupplier ? <><b>{selectedSupplier.name}</b><span>{selectedSupplier.contact || 'No contact saved'}</span><small>{selectedSupplier.items?.length || 0} saved supplied items</small></> : <span>Select a saved supplier to view contact and supply history.</span>}</div>
          </section>
          <section className="po-create-order">
            <div className="po-create-section-heading"><span>Purchase order</span><h3>Order information</h3></div>
            <div className="po-form-grid"><Field label="Requested delivery"><input type="date" value={values.requestedDeliveryDate} onChange={(event) => set('requestedDeliveryDate', event.target.value)} /></Field></div>
            <div className="po-section-heading"><div><h3>Items to order</h3><small>Enter the supplier quantity and unit. Inventory conversion happens automatically.</small></div><button type="button" className="ops-secondary-action compact" onClick={() => setValues((current) => ({ ...current, items: [...current.items, { itemType: 'ingredient', itemId: '', purchaseUnit: '', quantityOrdered: '', estimatedTotalCost: '' }] }))}><Plus size={14} /> Add line</button></div>
            <div className="po-order-columns" aria-hidden="true"><span>Item name</span><span>Unit</span><span>Quantity</span><span>Total price</span><span>Price / unit</span><span /></div>
            <div className="po-form-lines">{values.items.map((line, index) => {
              const selectedOption = options.find((option) => option.id === line.itemId && option.itemType === line.itemType)
              const choices = unitChoices(selectedOption?.unit)
              const purchaseUnit = line.purchaseUnit || selectedOption?.unit || ''
              const perUnit = Number(line.quantityOrdered) > 0 ? Number(line.estimatedTotalCost || 0) / Number(line.quantityOrdered) : 0
              const factor = unitFactor(selectedOption?.unit, purchaseUnit)
              return <div className="po-form-line po-order-line" key={`${index}-${line.itemId}`}>
                <div className="po-line-item"><IngredientCombobox options={options.filter((option) => option.itemType === 'ingredient')} value={itemSearches[index] || selectedOption?.name || ''} placeholder="Select item" ariaLabel={`Select item for line ${index + 1}`} onChange={(value) => setItemSearches((current) => ({ ...current, [index]: value }))} onSelect={(item) => { setLine(index, 'itemType', item.itemType); setLine(index, 'itemId', item.id); setLine(index, 'purchaseUnit', unitChoices(item.unit)[0].value); setItemSearches((current) => ({ ...current, [index]: item.name })) }} /></div>
                <select value={purchaseUnit} onChange={(event) => setLine(index, 'purchaseUnit', event.target.value)} aria-label="Purchase unit" required disabled={!selectedOption}><option value="">Unit</option>{choices.map((choice) => <option value={choice.value} key={choice.value}>{choice.value}</option>)}</select>
                <input type="number" min="0.001" step="0.001" placeholder="Qty" aria-label="Purchase quantity" value={line.quantityOrdered} onChange={(event) => setLine(index, 'quantityOrdered', event.target.value)} required />
                <input type="number" min="0" step="0.01" placeholder="₱ Total" aria-label="Estimated total price" value={line.estimatedTotalCost} onChange={(event) => setLine(index, 'estimatedTotalCost', event.target.value)} required />
                <input type="number" min="0" step="any" inputMode="decimal" placeholder={`₱ / ${purchaseUnit || 'unit'}`} aria-label="Price per purchase unit" title={`Price per ${purchaseUnit || 'purchase unit'}`} value={pricePerPurchaseUnit(line)} onChange={(event) => setLine(index, 'purchaseUnitPrice', event.target.value)} />
                <button type="button" className="po-line-remove" onClick={() => setValues((current) => ({ ...current, items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index) }))} aria-label="Remove line"><X size={16} /></button>
              </div>
            })}</div>
            {error ? <p className="po-inline-error">{error}</p> : null}
          </section>
        </div>
        <footer className="po-form-footer"><button type="submit" className="ops-secondary-action" disabled={submitting}>Save Draft</button><div className="po-form-footer-right"><button type="button" className="ops-main-action" disabled={submitting} onClick={(event) => submit(event, true)}>Submit for Approval</button><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button></div></footer>
      </form>
    </section>
  </div>
}

function PurchaseOrderPreview({ values, options, onBack, onConfirm, submitting }) {
  return <div className="po-modal-backdrop"><section className="po-modal po-preview-modal" role="dialog" aria-modal="true" aria-label="Review purchase order"><header><div><span>Review before sending</span><h2>Submit for approval?</h2><p>Check the supplier, delivery date, and order lines before sending this request.</p></div><button type="button" onClick={onBack} aria-label="Close preview"><X size={18} /></button></header><div className="po-preview-body"><div className="po-preview-summary"><div><span>Supplier</span><strong>{values.supplierName || '—'}</strong></div><div><span>Requested delivery</span><strong>{values.requestedDeliveryDate ? dateLabel(values.requestedDeliveryDate) : 'Not specified'}</strong></div></div><div className="po-preview-section"><h3>Items</h3><div className="po-preview-lines">{values.items.map((line, index) => { const option = options.find((entry) => entry.id === line.itemId && entry.itemType === line.itemType); const total = Number(line.estimatedTotalCost || 0); const unitPrice = Number(line.quantityOrdered) > 0 ? total / Number(line.quantityOrdered) : 0; return <div className="po-preview-line" key={`${index}-${line.itemId}`}><div><strong>{option?.name || 'Item not selected'}</strong><small>{line.quantityOrdered || 0} {line.purchaseUnit || option?.unit || ''}</small></div><div><span>Total price</span><strong>₱{total.toFixed(2)}</strong></div><div><span>Price / unit</span><strong>₱{unitPrice.toFixed(2)}</strong></div></div> })}</div></div></div><footer><button type="button" className="ops-secondary-action" onClick={onBack}>Back to edit</button><button type="button" className="ops-main-action" onClick={onConfirm} disabled={submitting}>{submitting ? 'Submitting…' : 'Confirm & Submit'}</button></footer></section></div>
}

function IngredientCombobox({ options, value, placeholder, ariaLabel, onChange, onSelect }) {
  const [open, setOpen] = useState(false)
  const query = value.trim().toLowerCase()
  const visible = options.filter((option) => !query || option.name.toLowerCase().includes(query))
  return <div className="po-combobox"><div className="po-item-search"><FileText size={14} /><input value={value} onFocus={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true) }} placeholder={placeholder} aria-label={ariaLabel} required /><button type="button" aria-label="Show ingredient options" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpen((current) => !current)}>⌄</button></div>{open ? <div className="po-combobox-menu" role="listbox">{visible.length ? visible.map((option) => <button type="button" role="option" key={`${option.itemType}:${option.id}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelect(option); setOpen(false) }}><span>{option.name}</span><small>{option.unit} · stock {qty(option.quantity)}</small></button>) : <span className="po-combobox-empty">No items found</span>}</div> : null}</div>
}

function SupplierModal({ options, suppliers = [], onClose, onSave }) {
  const [activeId, setActiveId] = useState('')
  const [name, setName] = useState(''); const [contact, setContact] = useState(''); const [selected, setSelected] = useState([]); const [search, setSearch] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const visible = options.filter((item) => !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase()))
  function startNew() { setActiveId(''); setName(''); setContact(''); setSelected([]); setSearch(''); setError('') }
  function editSupplier(supplier) { setActiveId(supplier.id); setName(supplier.name); setContact(supplier.contact || ''); setSelected((supplier.items || []).map((item) => `${item.item_type}:${item.ingredient_id || item.finished_product_id}`)); setSearch(''); setError('') }
  function toggleItem(item) { const key = `${item.itemType}:${item.id}`; setSelected((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key]) }
  async function submit(event) { event.preventDefault(); setError(''); if (!name.trim()) { setError('Supplier name is required.'); return } setSaving(true); try { await onSave({ id: activeId, name, contact, items: options.filter((item) => selected.includes(`${item.itemType}:${item.id}`)) }) } catch (cause) { setError(cause.message || 'Supplier could not be saved.') } finally { setSaving(false) } }
  return <div className="po-modal-backdrop"><section className="po-modal po-supplier-modal" role="dialog" aria-modal="true" aria-label="Manage suppliers"><header><div><span>Inventory purchasing</span><h2>Suppliers</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header><div className="po-supplier-layout"><aside className="po-supplier-list"><div className="po-supplier-list-head"><b>Saved suppliers</b><button type="button" className="ops-secondary-action compact" onClick={startNew}><Plus size={14} /> Add</button></div>{suppliers.length ? suppliers.map((supplier) => <button type="button" className={`po-supplier-row ${activeId === supplier.id ? 'is-active' : ''}`} key={supplier.id} onClick={() => editSupplier(supplier)}><span><b>{supplier.name}</b><small>{supplier.contact || 'No contact saved'}</small></span><span className="po-supplier-edit">Edit</span></button>) : <p className="po-supplier-empty">No suppliers saved.</p>}</aside><form className="po-supplier-form" onSubmit={submit}><div className="po-supplier-form-title"><div><span>{activeId ? 'Edit supplier' : 'Add supplier'}</span><h3>{activeId ? name : 'New supplier'}</h3></div>{activeId ? <button type="button" className="ops-secondary-action compact" onClick={startNew}>New</button> : null}</div><Field label="Supplier name" required><input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></Field><Field label="Contact number or email"><input value={contact} onChange={(event) => setContact(event.target.value)} maxLength={160} /></Field><Field label="Previously supplied ingredients"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ingredients" aria-label="Search supplied ingredients" /></Field><div className="po-supplier-items">{visible.map((item) => <label key={`${item.itemType}:${item.id}`}><input type="checkbox" checked={selected.includes(`${item.itemType}:${item.id}`)} onChange={() => toggleItem(item)} /><span>{item.name}</span><small>{item.unit}</small></label>)}</div>{error ? <p className="po-inline-error">{error}</p> : null}<footer><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button><button type="submit" className="ops-main-action" disabled={saving}>{activeId ? 'Save Changes' : 'Save Supplier'}</button></footer></form></div></section></div>
}
function Field({ label, required, children }) { return <label className="po-field"><span>{label}{required ? ' *' : ''}</span>{children}</label> }
