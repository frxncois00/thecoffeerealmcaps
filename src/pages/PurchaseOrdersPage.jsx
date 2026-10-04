import { useEffect, useId, useMemo, useState } from 'react'
import { AlertTriangle, Check, ClipboardCheck, FileImage, FileText, ImagePlus, Package, PackageCheck, Plus, ReceiptText, Send, ShieldAlert, Store, Trash2, Upload, X } from 'lucide-react'
import PurchaseStockBoard from '../components/PurchaseStockBoard'
import { pricePerPurchaseUnit, updatePurchaseLine } from '../utils/purchaseLinePricing'
import { needsRestock, suggestedQuantity } from '../utils/purchaseStock'
import AppShell from '../components/AppShell'
import { useAuth } from '../context/AuthContext'
import { describeError } from '../utils/describeError'
import { money } from '../utils/money'
import {
  approvePurchaseOrder, cancelPurchaseOrder, closePurchaseOrder, fetchPurchaseOrderOptions,
  fetchPurchaseOrders, fetchSuppliers, getPurchaseOrderDocumentUrl, markPurchaseOrderSent, receivePurchaseOrder, reportPurchaseOrderIssue, reviewPurchaseOrderReceiving, savePurchaseOrder, saveSupplier, submitPurchaseOrderPayment, uploadPurchaseOrderDocument, verifyPurchaseOrderPayment,
} from '../services/purchaseOrderService'

const STATUS_META = {
  draft: ['Draft', 'neutral'], pending_approval: ['Pending Approval', 'amber'], approved: ['Ready to send', 'blue'],
  rejected: ['Needs revision', 'red'], sent: ['Awaiting delivery', 'purple'], partially_received: ['Awaiting delivery (legacy)', 'amber'],
  received: ['Received (legacy)', 'neutral'], pending_receiving_review: ['Inspection review', 'amber'], approved_for_payment: ['Awaiting payment', 'blue'], payment_review: ['Payment verification', 'amber'], disputed: ['Disputed', 'red'], closed: ['Completed', 'green'], cancelled: ['Cancelled', 'neutral'],
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formOpen, setFormOpen] = useState(false)

  const [supplierOpen, setSupplierOpen] = useState(false)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [action, setAction] = useState(null)
  const [receivingOpen, setReceivingOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)

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
  }, [selectedId, formOpen, receivingOpen, paymentOpen, issueOpen, supplierOpen, action?.type])

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

  const selected = orders.find((order) => order.id === selectedId) || null
  const lowStockItems = useMemo(() => options.filter(needsRestock), [options])
  const lowStockCount = lowStockItems.length
  const counts = useMemo(() => orders.reduce((acc, order) => { acc[order.status] = (acc[order.status] || 0) + 1; return acc }, {}), [orders])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const result = orders.filter((order) => {
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
  }, [orders, query, statusFilter, supplierFilter, sortBy, dateFrom])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageOrders = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => { setPage(1) }, [query, statusFilter, supplierFilter, sortBy, dateFrom, pageSize])
  const suppliersInOrders = useMemo(() => [...new Set(orders.map((order) => order.supplierName).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [orders])

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
      const id = await savePurchaseOrder({ ...payload, options })
      setFormOpen(false)
      setStockSelection((current) => current.filter((key) => !payload.items.some((item) => `${item.itemType}:${item.itemId}` === key)))
      await load()
      setSelectedId(id)
      announce(payload.submit ? 'Purchase order submitted.' : 'Draft saved.')
    } catch (cause) { throw new Error(describeError(cause, 'Purchase order could not be saved.')) }
  }
  async function runAction() {
    if (!action || !selected) return
    try {
      if (action.type === 'approve') await approvePurchaseOrder(selected.id, true)
      if (action.type === 'reject') await approvePurchaseOrder(selected.id, false, action.note)
      if (action.type === 'send') await markPurchaseOrderSent(selected.id, action.note)
      if (action.type === 'close') await closePurchaseOrder(selected.id, action.note)
      if (action.type === 'cancel') await cancelPurchaseOrder(selected.id, action.note)
      if (action.type === 'receiving-review') { await reviewReceiving(true, action.note); return }
      if (action.type === 'payment-review') { await verifyPayment(true, action.note); return }
      setAction(null)
      await load()
      announce(action.type === 'approve' ? 'Purchase order approved.' : `${action.type[0].toUpperCase()}${action.type.slice(1)} action saved.`)
    } catch (cause) { setError(describeError(cause, 'Purchase order action could not be completed.')) }
  }
  async function submitReceiving(lines, notes, documents = {}) {
    try {
      if (documents.proof) await uploadPurchaseOrderDocument(selected.id, 'receiving_proof', documents.proof)
      if (documents.invoice) await uploadPurchaseOrderDocument(selected.id, 'supplier_invoice', documents.invoice)
      await receivePurchaseOrder(selected.id, lines, notes)
      setReceivingOpen(false)
      await load()
      announce('Receiving submitted for admin review. Inventory has not been updated yet.')
    } catch (cause) { setError(describeError(cause, 'Receiving could not be submitted.')) }
  }
  async function reviewReceiving(approved, note) { try { await reviewPurchaseOrderReceiving(selected.id, approved, note); await load(); announce(approved ? 'Receiving approved for payment.' : 'Receiving returned for correction.'); setAction(null) } catch (cause) { setError(describeError(cause, 'Receiving review could not be completed.')) } }
  async function submitPayment(payload) { try { if (payload.receipt) await uploadPurchaseOrderDocument(selected.id, 'payment_receipt', payload.receipt); await submitPurchaseOrderPayment(selected.id, payload.amount, payload.method, payload.reference); setPaymentOpen(false); await load(); announce('Payment submitted for admin verification.'); } catch (cause) { setError(describeError(cause, 'Payment could not be submitted.')) } }
  async function verifyPayment(approved, note) { try { await verifyPurchaseOrderPayment(selected.id, approved, note); await load(); announce(approved ? 'Payment verified. Inventory updated and PO closed.' : 'Payment returned for correction.'); setAction(null) } catch (cause) { setError(describeError(cause, 'Payment review could not be completed.')) } }
  async function reportIssue(payload) { try { for (const file of payload.evidenceFiles || []) await uploadPurchaseOrderDocument(selected.id, 'issue_evidence', file); await reportPurchaseOrderIssue(selected.id, payload.reason, payload.resolution, payload.note); setIssueOpen(false); setReceivingOpen(false); await load(); announce('Issue reported to admin with the affected items recorded.'); } catch (cause) { setError(describeError(cause, 'Issue could not be reported.')) } }

  return (
    <AppShell role={role} title="Purchase Orders" eyebrow={isAdmin ? 'Approval queue' : 'Inventory purchasing'} onRefresh={load} actions={<button type="button" className="ops-icon-button" aria-label="Refresh purchase orders" title="Refresh" onClick={load} disabled={loading}><ClipboardCheck size={18} /></button>}>
      {error ? <div className="po-alert is-error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div> : null}
      {notice ? <div className="po-alert is-success" role="status"><Check size={15} />{notice}</div> : null}

      <PurchaseStockBoard selected={stockSelection} setSelected={setStockSelection} items={lowStockItems} loading={loading} isAdmin={isAdmin} getSupplier={getSupplierForItem} onCreate={openCreateForSupplier} />

      <section className="po-summary" aria-label="Purchase order summary">
        <Summary label="Pending Approval" value={counts.pending_approval || 0} tone="amber" icon={<AlertTriangle size={18} />} detail="Needs review" />
        <Summary label="Approved" value={counts.approved || 0} tone="blue" icon={<Check size={18} />} detail="Ready to send" />
        <Summary label="In Receiving" value={(counts.sent || 0) + (counts.partially_received || 0)} tone="purple" icon={<PackageCheck size={18} />} detail="Open deliveries" />
        <Summary label="Completed" value={counts.closed || 0} tone="green" icon={<Package size={18} />} detail="Completed orders" />
        <Summary label="Inspection review" value={counts.pending_receiving_review || 0} tone="amber" icon={<ShieldAlert size={18} />} detail="Admin checks delivery" />
        <Summary label="Payments" value={(counts.approved_for_payment || 0) + (counts.payment_review || 0)} tone="blue" icon={<ReceiptText size={18} />} detail="Admin records and verifies" />
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
        <div className="po-table-scroll"><table className="po-table"><thead><tr><th>PO number</th><th>Supplier</th><th>Delivery</th><th>Items</th><th>Estimated total</th><th>Status</th><th>Updated</th><th className="po-actions-heading">Actions</th></tr></thead><tbody>
          {loading ? <tr><td colSpan="8" className="po-empty">Loading…</td></tr> : pageOrders.length ? pageOrders.map((order) => <tr key={order.id} onClick={() => setSelectedId(order.id)} className={selectedId === order.id ? 'is-selected' : ''}><td><b>{order.po_number}</b><small>{dateTimeLabel(order.created_at)}</small></td><td>{order.supplierName}</td><td>{dateLabel(order.requestedDeliveryDate)}</td><td>{order.items.length}</td><td>{money(totalFor(order))}</td><td><StatusBadge status={order.status} /></td><td>{dateTimeLabel(order.updatedAt)}</td><td><button type="button" className="ops-secondary-action compact" onClick={(event) => { event.stopPropagation(); setSelectedId(order.id) }}>View</button></td></tr>) : <tr><td colSpan="8" className="po-empty">No purchase orders found.</td></tr>}
        </tbody></table></div>
      </section>
      <footer className="po-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><label>Rows<select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label><div><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>‹</button><b>Page {page} of {pageCount}</b><button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>›</button></div></footer>

      {selected ? <PurchaseOrderDrawer order={selected} isAdmin={isAdmin} onClose={() => setSelectedId('')} onEdit={() => openEdit(selected)} onSubmit={() => saveDraft({ ...emptyDraftFromOrder(selected), submit: true })} onApprove={() => setAction({ type: 'approve', title: 'Approve purchase order', label: 'Approve', note: '' })} onReject={() => setAction({ type: 'reject', title: 'Reject purchase order', label: 'Reject', note: '' })} onSend={() => setAction({ type: 'send', title: 'Mark as sent', label: 'Mark Sent', note: selected.supplierReference || '' })} onReceive={() => setReceivingOpen(true)} onPayment={() => setPaymentOpen(true)} onReviewReceiving={() => setAction({ type: 'receiving-review', title: 'Review receiving', label: 'Approve receiving', note: '' })} onReviewPayment={() => setAction({ type: 'payment-review', title: 'Verify payment', label: 'Verify payment', note: '' })} onCloseOrder={() => setAction({ type: 'close', title: 'Close purchase order', label: 'Close PO', note: '' })} onCancel={() => setAction({ type: 'cancel', title: 'Cancel purchase order', label: 'Cancel PO', note: '' })} /> : null}

      {formOpen ? <PurchaseOrderForm draft={draft} options={options.filter((option) => option.itemType === 'ingredient')} suppliers={suppliers} onClose={() => setFormOpen(false)} onSave={saveDraft} /> : null}
      {supplierOpen ? <SupplierModal options={options.filter((option) => option.itemType === 'ingredient')} suppliers={suppliers} onClose={() => setSupplierOpen(false)} onSave={async (payload) => { await saveSupplierRecord(payload); setSupplierOpen(false) }} /> : null}
      {receivingOpen && selected ? <ReceivingModal order={selected} onClose={() => setReceivingOpen(false)} onSave={submitReceiving} onReport={() => setIssueOpen(true)} /> : null}
      {issueOpen && selected ? <IssueReportModal order={selected} onClose={() => setIssueOpen(false)} onSave={reportIssue} /> : null}
      {paymentOpen && selected ? <PaymentModal order={selected} onClose={() => setPaymentOpen(false)} onSave={submitPayment} /> : null}
      {action ? <ActionModal action={action} onClose={() => setAction(null)} onChange={(note) => setAction((current) => ({ ...current, note }))} onConfirm={runAction} onReturn={action.type === 'receiving-review' ? () => reviewReceiving(false, action.note) : action.type === 'payment-review' ? () => verifyPayment(false, action.note) : null} /> : null}
    </AppShell>
  )
}

function Summary({ label, value, tone, icon, detail }) { return <article className={`inv-summary-card tone-${tone} po-summary-card`}><span className="inv-summary-icon">{icon}</span><span className="inv-summary-copy"><span>{label}</span><small>{detail}</small></span><b>{value}</b></article> }
function StatusBadge({ status }) { return <span className={`po-status po-status-${toneFor(status)}`}>{labelFor(status)}</span> }

function PurchaseOrderDrawer({ order, isAdmin, onClose, onEdit, onSubmit, onApprove, onReject, onSend, onReceive, onPayment, onReviewReceiving, onReviewPayment, onCloseOrder, onCancel }) {
  const canEdit = !isAdmin && ['draft', 'rejected'].includes(order.status)
  const canSend = order.status === 'approved'
  const canReceive = !isAdmin && ['sent', 'partially_received', 'disputed'].includes(order.status)
  const canPayment = isAdmin && order.status === 'approved_for_payment'
  const canReviewReceiving = isAdmin && order.status === 'pending_receiving_review'
  const canReviewPayment = isAdmin && order.status === 'payment_review'
  const canClose = false
  return <><button type="button" className="po-drawer-backdrop" onClick={onClose} aria-label="Close purchase order details" /><aside className="po-drawer" role="dialog" aria-modal="true" aria-label={`Purchase order ${order.po_number}`} onClick={(event) => event.stopPropagation()}>
    <header><button type="button" className="po-close" onClick={onClose} aria-label="Close purchase order"><X size={18} /></button><div className="po-drawer-title"><div><span>Purchase order</span><h2>{order.po_number}</h2></div><StatusBadge status={order.status} /></div></header>
    <div className="po-drawer-body">
      <div className="po-stage-guidance"><strong>{labelFor(order.status)}</strong><p>{{ draft: 'Staff: complete the order and submit it for approval.', pending_approval: 'Admin: review quantities, estimated costs, and the requested delivery date.', approved: 'Staff or admin: send the approved order to the supplier, then record it as sent.', sent: 'Staff: inspect the delivery and attach the invoice and delivery evidence.', pending_receiving_review: 'Admin: compare accepted quantities and delivery evidence with the supplier invoice.', approved_for_payment: 'Admin: record the supplier payment and attach the receipt.', payment_review: 'Admin: verify the payment. Accepted quantities will be added to inventory once.', closed: 'Payment verified. Accepted items have been added to inventory.', rejected: 'Staff: revise the order using the admin feedback, then resubmit.', disputed: 'Staff: resolve delivery issues with the supplier, then submit the corrected inspection.' }[order.status] || 'Review the activity and documents for this order.'}</p>{order.rejection_reason && <p>Review note: {order.rejection_reason}</p>}{order.receiving_review_note && <p>Inspection note: {order.receiving_review_note}</p>}</div>
      {order.status === 'payment_review' && <div className="po-payment-summary"><span>Payment to verify · {order.payment_method}</span><strong>{money(order.payment_amount)}</strong><small>{order.payment_reference || 'No reference recorded'}</small></div>}

      <div className="po-detail-grid"><div><span>Supplier</span><b>{order.supplierName}</b></div><div><span>Delivery date</span><b>{dateLabel(order.requestedDeliveryDate)}</b></div><div><span>Created by</span><b>{order.createdByName || '—'}</b></div><div><span>Estimated total</span><b>{money(totalFor(order))}</b></div></div>
      <div className="po-section-heading"><h3>Items</h3><span>{order.items.length} lines</span></div>
      <div className="po-lines"><table><thead><tr><th>Item</th><th>Ordered</th><th>Accepted</th><th>Cost</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id}><td><b>{item.item_name}</b><small>{item.unit}</small></td><td>{qty(item.quantityOrdered)}</td><td>{qty(item.acceptedQuantity)}</td><td>{money(item.actualUnitCost === '' ? item.estimatedUnitCost : item.actualUnitCost)}</td></tr>)}</tbody></table></div>
      {order.documents?.length ? <div className="po-document-list"><div className="po-section-heading"><h3>Attached documents</h3></div>{Array.from(new Map(order.documents.map((document) => [`${String(document.file_name || '').trim().toLowerCase()}|${String(document.document_type || '').trim().toLowerCase()}`, document])).values()).map((document) => <div key={`${document.file_name}|${document.document_type}`}><DocumentLink document={document} /><small>{document.document_type.replaceAll('_', ' ')}</small></div>)}</div> : null}
      <div className="po-actions">
        {canEdit ? <button type="button" className="ops-secondary-action" onClick={onEdit}>{order.status === 'rejected' ? 'Revise order' : 'Edit draft'}</button> : null}
        {canEdit ? <button type="button" className="ops-main-action" onClick={onSubmit}>Submit for approval</button> : null}
        {isAdmin && order.status === 'pending_approval' ? <><button type="button" className="ops-destructive-action" onClick={onReject}>Reject</button><button type="button" className="ops-main-action" onClick={onApprove}>Approve</button></> : null}
        {canSend ? <button type="button" className="ops-main-action" onClick={onSend}><Send size={15} /> Mark Sent</button> : null}
        {canReceive ? <button type="button" className="ops-main-action" onClick={onReceive}><PackageCheck size={15} /> Receive</button> : null}
        {canPayment ? <button type="button" className="ops-main-action" onClick={onPayment}><ReceiptText size={15} /> Submit payment</button> : null}
        {canReviewReceiving ? <button type="button" className="ops-main-action" onClick={onReviewReceiving}><ShieldAlert size={15} /> Review receiving</button> : null}
        {canReviewPayment ? <button type="button" className="ops-main-action" onClick={onReviewPayment}><ReceiptText size={15} /> Verify payment</button> : null}
        {canClose ? <button type="button" className="ops-main-action" onClick={onCloseOrder}>Close PO</button> : null}
        {!['closed', 'cancelled', 'received'].includes(order.status) ? <button type="button" className="ops-destructive-action" onClick={onCancel}>Cancel</button> : null}
      </div>
      <div className="po-section-heading"><h3>Activity</h3></div>
      <div className="po-events">{order.events.length ? order.events.map((event) => <div key={event.id}><i /><span><b>{event.action}</b><small>{dateTimeLabel(event.created_at)}{event.note ? ` · ${event.note}` : ''}</small></span></div>) : <span>No activity recorded.</span>}</div>
    </div>
  </aside></>
}

function ReceivingModal({ order, onClose, onSave, onReport }) {
  const [lines, setLines] = useState(order.items.map((item) => ({ ...item })))
  const [notes, setNotes] = useState(order.receiving_notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [proof, setProof] = useState(null)
  const [invoice, setInvoice] = useState(null)
  function setLine(index, key, value) { setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value } : line)) }
  async function submit(event) {
    event.preventDefault()
    setError('')
    const incomplete = lines.some((line) => line.receivedQuantity === '' || line.acceptedQuantity === '' || line.actualUnitCost === '')
    if (incomplete) { const message = 'Complete Received, Accepted, and Actual cost for every item before saving.'; setError(message); return }
    setSaving(true)
    if (!proof || !invoice) { const message = 'Upload proof of items received and the supplier invoice before submitting.'; setError(message); return }
    try { await onSave(lines, notes, { proof, invoice }) } finally { setSaving(false) }
  }
  return <div className="po-modal-backdrop">
    <section className="po-modal po-receiving-modal po-receiving-guide" role="dialog" aria-modal="true" aria-label="Receive purchase order">
      <header><div><span>{order.po_number}</span><h2>Receive delivery</h2><p className="po-modal-intro">Compare the delivery with the order, then record what can go into stock.</p></div><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
      <form onSubmit={submit}>
        <div className="po-receiving-steps">
          <div className="po-receiving-step is-active"><b>1</b><span><strong>Check quantities</strong><small>What arrived and what is usable</small></span></div>
          <div className="po-receiving-step"><b>2</b><span><strong>Record exceptions</strong><small>Damaged or missing items</small></span></div>
          <div className="po-receiving-step"><b>3</b><span><strong>Submit inspection</strong><small>Admin reviews before payment</small></span></div>
        </div>
        {lines.map((line, index) => <section className="po-receive-card" key={line.id}>
          <div className="po-receive-card-head"><div><h3>{line.item_name}</h3><p>Ordered <strong>{qty(line.quantityOrdered)} {line.unit}</strong> <span>· inventory unit</span></p></div><span className="po-receive-status">Line {index + 1}</span></div>
          <div className="po-receive-instruction">Enter quantities in <strong>{line.unit}</strong>. Accepted quantity enters inventory only after admin verifies payment.</div>
          <div className="po-receive-groups">
            <fieldset className="po-receive-group po-receive-group-primary"><legend>What arrived</legend><label>Received <input type="number" min="0" step="0.01" value={line.receivedQuantity} onChange={(event) => setLine(index, 'receivedQuantity', event.target.value)} required /></label><label>Accepted quantity <input type="number" min="0" step="0.01" value={line.acceptedQuantity} onChange={(event) => setLine(index, 'acceptedQuantity', event.target.value)} required /></label><small>Accepted cannot be greater than received.</small></fieldset>
            <fieldset className="po-receive-group po-receive-group-exceptions"><legend>Exceptions</legend><label>Damaged <input type="number" min="0" step="0.01" value={line.damagedQuantity} onChange={(event) => setLine(index, 'damagedQuantity', event.target.value)} /></label><label>Missing <input type="number" min="0" step="0.01" value={line.missingQuantity} onChange={(event) => setLine(index, 'missingQuantity', event.target.value)} /></label></fieldset>
            <fieldset className="po-receive-group po-receive-group-trace"><legend>Traceability</legend><label>Actual cost / {line.unit}<input type="number" min="0" step="0.01" value={line.actualUnitCost} onChange={(event) => setLine(index, 'actualUnitCost', event.target.value)} required /></label><label>Batch / lot<input value={line.batchNumber} onChange={(event) => setLine(index, 'batchNumber', event.target.value)} /></label><label>Expiry date<input type="date" value={line.expirationDate} onChange={(event) => setLine(index, 'expirationDate', event.target.value)} /></label></fieldset>
          </div>
        </section>)}
        <div className="po-receiving-documents"><DocumentUpload label="Proof of items received" hint="Photo or PDF of the delivered goods" files={proof ? [proof] : []} onChange={(files) => setProof(files[0] || null)} required /><DocumentUpload label="Supplier invoice" hint="Clear photo or PDF of the invoice" files={invoice ? [invoice] : []} onChange={(files) => setInvoice(files[0] || null)} required /></div>
        <Field label="Receiving notes"><textarea rows="2" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} placeholder="Optional: note shortages, damage, or supplier issues" /></Field>
        {error ? <p className="po-inline-error" role="alert">{error}</p> : null}
        <footer><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button><button type="button" className="ops-destructive-action" onClick={onReport}>Report to Admin</button><button type="submit" className="ops-main-action" disabled={saving}>{saving ? 'Submitting…' : 'Submit receiving'}</button></footer>
      </form>
    </section>
  </div>
}

function IssueReportModal({ order, onClose, onSave }) {
  const [reason, setReason] = useState('Damaged items')
  const [resolution, setResolution] = useState('Return affected items')
  const [note, setNote] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [replacementDate, setReplacementDate] = useState('')
  const [affected, setAffected] = useState({})
  const [evidenceFiles, setEvidenceFiles] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const itemSpecific = reason !== 'All items damaged'
  const selectedItems = order.items.filter((item) => affected[item.id]?.selected)
  const updateAffected = (id, key, value) => setAffected((current) => ({ ...current, [id]: { ...current[id], [key]: value } }))
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (reason === 'Other' && !otherReason.trim()) { setError('Enter the issue.'); return }
    if (itemSpecific && !selectedItems.length) { setError('Select at least one affected item.'); return }
    const invalidQuantity = selectedItems.some((item) => {
      const value = Number(affected[item.id]?.quantity)
      return !value || value < 0 || value > item.quantityOrdered
    })
    if (invalidQuantity) { setError('Enter a valid affected quantity.'); return }
    if (reason === 'Wrong items' && selectedItems.some((item) => !affected[item.id]?.detail?.trim())) { setError('Enter the wrong item received.'); return }
    if (resolution === 'Accept partial delivery' && selectedItems.some((item) => affected[item.id]?.accepted === '' || Number(affected[item.id]?.accepted) < 0 || Number(affected[item.id]?.accepted) > item.quantityOrdered)) { setError('Enter a valid accepted quantity.'); return }
    if (resolution === 'Request replacement' && !replacementDate) { setError('Select the replacement date.'); return }

    const details = []
    if (otherReason.trim()) details.push(`Issue: ${otherReason.trim()}`)
    if (reason === 'All items damaged') details.push(`Affected: all order lines`)
    else details.push(`Affected: ${selectedItems.map((item) => {
      const entry = affected[item.id]
      const parts = [`${item.item_name}: ${qty(entry.quantity)} ${item.unit}`]
      if (reason === 'Wrong items') parts.push(`received ${entry.detail.trim()}`)
      if (resolution === 'Accept partial delivery') parts.push(`accept ${qty(entry.accepted)} ${item.unit}`)
      return parts.join(', ')
    }).join('; ')}`)
    if (replacementDate) details.push(`Replacement date: ${replacementDate}`)
    if (note.trim()) details.push(`Note: ${note.trim()}`)
    setSaving(true)
    try { await onSave({ reason, resolution, note: details.join(' | '), evidenceFiles }) } finally { setSaving(false) }
  }
  return <div className="po-modal-backdrop"><section className="po-modal po-action-modal po-issue-modal" role="dialog" aria-modal="true" aria-label="Report receiving issue"><header><div><span>{order.po_number} · Receiving issue</span><h2>Report to Admin</h2><p className="po-modal-intro">Tell the admin what happened and what response you need. Inventory will not change from this report.</p></div><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header><form onSubmit={submit}>
    <div className="po-issue-step"><b>1</b><span><strong>Describe the issue</strong><small>Choose what happened and the action you are requesting.</small></span></div>
    <div className="po-issue-selects"><Field label="Reason" required><select value={reason} onChange={(event) => { setReason(event.target.value); setError('') }}><option>All items damaged</option><option>Damaged items</option><option>Missing items</option><option>Wrong items</option><option>Quantity mismatch</option><option>Quality issue</option><option>Expired items</option><option>Other</option></select></Field><Field label="Request approval to" required><select value={resolution} onChange={(event) => { setResolution(event.target.value); setError('') }}><option>Return all items</option><option>Return affected items</option><option>Request replacement</option><option>Accept partial delivery</option><option>Hold delivery</option></select></Field></div>
    {reason === 'Other' ? <Field label="Issue" required><input value={otherReason} onChange={(event) => setOtherReason(event.target.value)} required /></Field> : null}
    <div className="po-issue-step"><b>2</b><span><strong>{itemSpecific ? 'Select affected products' : 'Review affected products'}</strong><small>{itemSpecific ? 'Choose each product and enter how many units are affected.' : 'This report applies to every product in the order.'}</small></span></div>
    {itemSpecific ? <fieldset className="po-issue-items"><legend>Products in this delivery</legend>{order.items.map((item) => {
      const entry = affected[item.id] || {}
      return <div className={`po-issue-line ${entry.selected ? 'is-selected' : ''}`} key={item.id}>
        <label className="po-issue-check"><input type="checkbox" checked={Boolean(entry.selected)} onChange={(event) => updateAffected(item.id, 'selected', event.target.checked)} /><span><b>{item.item_name}</b><small>Expected: {qty(item.quantityOrdered)} {item.unit}</small></span><em>{entry.selected ? 'Selected' : 'Select product'}</em></label>
        {entry.selected ? <div className="po-issue-fields"><label>Affected quantity<input type="number" min="0.01" max={item.quantityOrdered} step="0.01" value={entry.quantity || ''} onChange={(event) => updateAffected(item.id, 'quantity', event.target.value)} required /></label>{reason === 'Wrong items' ? <label>Item received<input value={entry.detail || ''} onChange={(event) => updateAffected(item.id, 'detail', event.target.value)} required /></label> : null}{resolution === 'Accept partial delivery' ? <label>Accepted quantity<input type="number" min="0" max={item.quantityOrdered} step="0.01" value={entry.accepted ?? ''} onChange={(event) => updateAffected(item.id, 'accepted', event.target.value)} required /></label> : null}</div> : null}
      </div>
    })}</fieldset> : <div className="po-issue-all"><b>All order lines</b><span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span></div>}
    {resolution === 'Request replacement' ? <div className="po-issue-followup"><strong>Replacement details</strong><Field label="Replacement needed by" required><input type="date" value={replacementDate} onChange={(event) => setReplacementDate(event.target.value)} required /></Field></div> : null}
    <div className="po-issue-step"><b>3</b><span><strong>Add evidence and notes</strong><small>Photos help the admin verify damage, quality, or incorrect items.</small></span></div>
    <DocumentUpload label="Issue photos" hint="Add up to 3 JPG, PNG, or WebP images" files={evidenceFiles} onChange={setEvidenceFiles} accept="image/jpeg,image/png,image/webp" multiple limit={3} />
    <Field label="Additional note"><textarea rows="3" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add supplier comments, packaging condition, or other useful details" /></Field>
    {error ? <p className="po-inline-error" role="alert">{error}</p> : null}
    <footer><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button><button type="submit" className="ops-destructive-action" disabled={saving}>{saving ? 'Sending…' : 'Send report'}</button></footer>
  </form></section></div>
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
    {files.length < limit ? <label className="po-upload-drop" htmlFor={inputId}><ImagePlus size={24} aria-hidden="true" /><span><b>{files.length ? 'Add another image' : 'Choose a file'}</b><small>{hint}</small></span><input id={inputId} className="po-upload-input" type="file" accept={accept} multiple={multiple} onChange={selectFiles} /></label> : null}
  </section>
}

function DocumentLink({ document }) {
  const [url, setUrl] = useState('')
  const isImage = /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(document.file_name || '') || String(document.mime_type || '').startsWith('image/')
  useEffect(() => { let active = true; getPurchaseOrderDocumentUrl(document.storage_path).then((nextUrl) => { if (active) setUrl(nextUrl || '') }).catch(() => {}); return () => { active = false } }, [document.storage_path])
  function open() { if (url) window.open(url, '_blank', 'noopener,noreferrer') }
  return <span className="po-document-entry">{isImage && url ? <button type="button" className="po-document-preview" onClick={open} aria-label={`Preview ${document.file_name}`}><img src={url} alt="" loading="lazy" /></button> : <Upload size={14} />}<button type="button" className="po-document-link" onClick={open} disabled={!url}>{document.file_name}</button></span>
}

function ActionModal({ action, onClose, onChange, onConfirm, onReturn }) {
  const [busy, setBusy] = useState(false)
  async function perform(callback) { if (busy) return; setBusy(true); try { await callback() } finally { setBusy(false) } }

  const needsNote = ['reject', 'send', 'close', 'cancel', 'receiving-review', 'payment-review'].includes(action.type)
  const review = ['receiving-review', 'payment-review'].includes(action.type)
  return <div className="po-modal-backdrop"><section className="po-modal po-action-modal" role="dialog" aria-modal="true" aria-label={action.title}><header><h2>{action.title}</h2><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>{needsNote ? <Field label={action.type === 'send' ? 'Supplier reference' : action.type === 'reject' ? 'Rejection reason' : 'Review note'} required={action.type === 'reject'}><textarea rows="3" value={action.note} onChange={(event) => onChange(event.target.value)} required={action.type === 'reject'} /></Field> : <p className="po-confirm-line">Confirm {action.title.toLowerCase()}.</p>}<footer><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button>{review ? <button type="button" className="ops-destructive-action" disabled={busy || !action.note.trim()} onClick={() => perform(onReturn)}>Return for correction</button> : null}<button type="button" className={action.type === 'reject' || action.type === 'cancel' ? 'ops-destructive-action' : 'ops-main-action'} disabled={busy || (action.type === 'reject' && !action.note.trim())} onClick={() => perform(onConfirm)}>{busy ? 'Saving…' : action.label}</button></footer></section></div>
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
        <footer><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button><button type="submit" className="ops-secondary-action" disabled={submitting}>Save Draft</button><button type="button" className="ops-main-action" disabled={submitting} onClick={(event) => submit(event, true)}>Submit for Approval</button></footer>
      </form>
    </section>
  </div>
}

function PaymentModal({ order, onClose, onSave }) {
  const approvedTotal = order.items.reduce((sum, item) => sum + Number(item.acceptedQuantity || 0) * Number(item.actualUnitCost === '' ? item.estimatedUnitCost : item.actualUnitCost), 0)
  const [amount, setAmount] = useState(String(approvedTotal))
  const [method, setMethod] = useState('Cash')
  const [reference, setReference] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [saving, setSaving] = useState(false)
  async function submit(event) { event.preventDefault(); if (!receipt) return; setSaving(true); try { await onSave({ amount, method, reference, receipt }) } finally { setSaving(false) } }
  return <div className="po-modal-backdrop"><section className="po-modal po-action-modal" role="dialog" aria-modal="true" aria-label="Submit supplier payment"><header><div><span>{order.po_number}</span><h2>Record supplier payment</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header><form onSubmit={submit}><div className="po-payment-summary"><span>Approved amount</span><strong>{money(approvedTotal)}</strong></div><p className="po-payment-help">Record the receipt, then verify payment to add accepted items to inventory.</p><Field label="Amount paid" required><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></Field><Field label="Payment method" required><select value={method} onChange={(event) => setMethod(event.target.value)}><option>Cash</option><option>Bank transfer</option><option>Gcash</option><option>Card</option></select></Field><Field label="Payment reference"><input value={reference} onChange={(event) => setReference(event.target.value)} /></Field><Field label="Supplier receipt" required><input type="file" accept="image/*,application/pdf" onChange={(event) => setReceipt(event.target.files?.[0] || null)} required /></Field><footer><button type="button" className="ops-secondary-action" onClick={onClose}>Cancel</button><button type="submit" className="ops-main-action" disabled={saving}>{saving ? 'Submitting…' : 'Submit for verification'}</button></footer></form></section></div>
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
