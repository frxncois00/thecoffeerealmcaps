import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, Minus, Paperclip, Plus, X } from 'lucide-react'
import { money } from '../utils/money'
import { changeReceived, ISSUE_LABELS, isQuantityIssue, RECEIVING_CHECKS, receivingBreakdown, returnAllReceived, validateReceivingReport } from '../utils/purchaseReceiving'
import './purchase-receiving-report.css'

function useReceivingDialog(ref, onClose, busy = false) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return undefined
    const previous = document.activeElement
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter((element) => element.getClientRects().length)
    focusable()[0]?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function keydown(event) {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); event.stopPropagation(); closeRef.current(); return }
      if (event.key !== 'Tab') return
      const elements = focusable(), first = elements[0], last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    dialog.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = previousOverflow; dialog.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus() }
  }, [ref, busy])
}

export function ReceivingValues({ values, replacement = false }) {
  const entries = [[replacement ? 'Delivery total' : 'Order total', values.orderTotal], ['Accepted value', values.acceptedValue], ['Return value', values.returnValue]]
  if (values.missingValue > 0) entries.push(['Missing value', values.missingValue])
  if (values.notReceivedValue > 0) entries.push(['Not received', values.notReceivedValue])
  return <dl className="po-report-values" aria-label="Receiving financial breakdown">{entries.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{money(value)}</dd></div>)}</dl>
}

export default function PurchaseReceivingReport({ order, lines, onChange, answers, notes, onNotes, photos, onPhotos, onBack, onSubmit, onReturnAll, saving, error }) {
  const [errors, setErrors] = useState({})
  const [returnedAll, setReturnedAll] = useState(false)
  const [confirmReturn, setConfirmReturn] = useState(false)
  const dialog = useRef(null)
  const photoInput = useRef(null)
  const headingId = useId()
  useReceivingDialog(dialog, onBack, saving)
  const allowed = RECEIVING_CHECKS.flatMap((check, index) => answers[index] === 'no' ? check.types : [])
  const returnTypes = allowed.filter((type) => !isQuantityIssue(type))
  const values = receivingBreakdown(lines)
  const selectedCount = lines.filter((line) => line.selected).length
  function update(id, callback) {
    onChange(lines.map((line) => line.id === id ? callback(line) : line))
    setErrors((current) => ({ ...current, [id]: '', form: '' }))
    setReturnedAll(false)
  }
  function addIssue(line) {
    const type = returnTypes.find((entry) => !line.issues.some((issue) => issue.type === entry)) || ''
    return { ...line, selected: true, issues: [...line.issues, { type, quantity: '' }] }
  }
  function setIssue(line, index, key, value) {
    const issues = line.issues.map((issue, i) => i === index ? { ...issue, [key]: value } : issue)
    return { ...line, issues }
  }
  async function submit(event) {
    event.preventDefault()
    const next = validateReceivingReport(lines, answers)
    setErrors(next)
    if (Object.keys(next).length) {
      requestAnimationFrame(() => dialog.current?.querySelector('[aria-invalid="true"], [role="alert"]')?.focus())
      return
    }
    await onSubmit()
  }
  return <div className="po-report-overlay"><section ref={dialog} className="po-modal po-receiving-report" role="dialog" aria-modal="true" aria-labelledby={headingId}>
    <header><div><h2 id={headingId}>Report receiving issue</h2><p>{order.po_number} <span aria-hidden="true">·</span> {order.supplierName}</p></div><button type="button" onClick={onBack} disabled={saving} aria-label="Close receiving issue report"><X size={22} /></button></header>
    <form onSubmit={submit} noValidate>
      <div className="po-report-content">
        <p className="po-report-hint">Select affected items and enter what arrived. Missing quantities calculate automatically.</p>
        <div className="po-report-table-wrap"><table className="po-report-table"><thead><tr><th scope="col">Select</th><th scope="col">Item</th><th scope="col">Ordered / received</th><th scope="col">Unit price</th><th scope="col">Issue qty</th><th scope="col">Issue</th></tr></thead><tbody>
          {lines.map((line) => {
            const rowError = errors[line.id]
            const issueRows = line.issues.length ? line.issues : [{ type: '', quantity: '' }]
            const quantityType = Number(line.receivedQuantity) === 0 ? 'not_received' : 'missing_quantity'
            return <tr key={line.id} className={`${line.selected ? 'is-selected' : ''} ${line.issues.some((issue) => issue.type === 'not_received') ? 'is-undelivered' : ''}`}>
              <td data-label="Select"><label className="po-report-checkbox"><input type="checkbox" checked={line.selected} disabled={saving} aria-label={`Select ${line.item_name}`} onChange={(event) => update(line.id, (current) => event.target.checked ? (current.issues.length ? { ...current, selected: true } : addIssue(current)) : { ...current, selected: false, issues: [] })} /></label></td>
              <th scope="row"><span>{line.item_name}</span>{rowError ? <small className="po-report-row-error" id={`issue-error-${line.id}`} role="alert">{rowError}</small> : null}</th>
              <td data-label="Ordered / received"><div className="po-report-received"><span>{line.quantityOrdered} /</span><input type="number" min="0" max={line.quantityOrdered} step="any" inputMode="decimal" value={line.receivedQuantity} disabled={saving} aria-label={`Received quantity for ${line.item_name}`} aria-invalid={Boolean(rowError)} aria-describedby={rowError ? `issue-error-${line.id}` : undefined} onChange={(event) => update(line.id, (current) => changeReceived(current, event.target.value))} /><span>{line.unit}</span></div></td>
              <td data-label="Unit price" className="po-report-price">{money(line.estimatedUnitCost)}</td>
              <td data-label="Issue qty"><div className="po-report-issue-stack">{issueRows.map((issue, index) => <div className={`po-report-stepper ${isQuantityIssue(issue.type) ? 'is-calculated' : ''}`} key={index}>
                {!isQuantityIssue(issue.type) && issue.type !== 'return_all' ? <button type="button" aria-label={`Decrease ${ISSUE_LABELS[issue.type] || 'issue'} quantity for ${line.item_name}`} disabled={!line.selected || saving || !(Number(issue.quantity) > 0)} onClick={() => update(line.id, (current) => setIssue(current, index, 'quantity', Math.max(0, Number(issue.quantity) - 1)))}><Minus size={15} /></button> : null}
                <input type="number" min="0" max={isQuantityIssue(issue.type) ? line.quantityOrdered : line.receivedQuantity} step="any" inputMode="decimal" value={issue.quantity} readOnly={isQuantityIssue(issue.type) || issue.type === 'return_all'} disabled={!line.selected || saving} aria-label={`${ISSUE_LABELS[issue.type] || 'Issue'} quantity for ${line.item_name}`} aria-invalid={Boolean(rowError)} onChange={(event) => update(line.id, (current) => setIssue(current, index, 'quantity', event.target.value))} />
                {!isQuantityIssue(issue.type) && issue.type !== 'return_all' ? <button type="button" aria-label={`Increase ${ISSUE_LABELS[issue.type] || 'issue'} quantity for ${line.item_name}`} disabled={!line.selected || saving || Number(issue.quantity) >= Number(line.receivedQuantity)} onClick={() => update(line.id, (current) => setIssue(current, index, 'quantity', Math.min(Number(line.receivedQuantity), Number(issue.quantity || 0) + 1)))}><Plus size={15} /></button> : null}
              </div>)}</div></td>
              <td data-label="Issue"><div className="po-report-issue-stack">{issueRows.map((issue, index) => <div className="po-report-issue-choice" key={index}><select value={issue.type} disabled={!line.selected || saving || isQuantityIssue(issue.type)} aria-label={`Issue ${index + 1} for ${line.item_name}`} aria-invalid={Boolean(rowError)} onChange={(event) => update(line.id, (current) => {
                if (event.target.value === 'not_received') return changeReceived({ ...current, issues: current.issues.filter((_, i) => i !== index) }, 0)
                if (event.target.value === 'missing_quantity') return { ...setIssue(current, index, 'type', 'missing_quantity'), receivedQuantity: '', issues: current.issues.map((entry, i) => i === index ? { type: 'missing_quantity', quantity: 0 } : entry) }
                return setIssue(current, index, 'type', event.target.value)
              })}><option value="">Select issue</option>{[...new Set([...allowed, ...(issue.type ? [issue.type] : [])])].map((type) => <option key={type} value={type} disabled={isQuantityIssue(type) && type !== quantityType && Number(line.receivedQuantity) < line.quantityOrdered}>{ISSUE_LABELS[type]}</option>)}</select>{line.issues.length > 1 && !isQuantityIssue(issue.type) && issue.type !== 'return_all' ? <button type="button" className="po-report-remove" aria-label={`Remove ${ISSUE_LABELS[issue.type] || 'issue'} for ${line.item_name}`} disabled={saving} onClick={() => update(line.id, (current) => ({ ...current, issues: current.issues.filter((_, i) => i !== index) }))}><X size={14} /></button> : null}</div>)}</div>
                {line.selected && Number(line.receivedQuantity) > 0 && returnTypes.some((type) => !line.issues.some((issue) => issue.type === type)) ? <button type="button" className="po-report-add" disabled={saving} onClick={() => update(line.id, addIssue)}>+ Add another issue</button> : null}
              </td>
            </tr>
          })}
        </tbody></table></div>
        <div className="po-report-notes"><label><span>Note <small>(optional)</small></span><textarea rows="2" maxLength={3000} value={notes} onChange={(event) => onNotes(event.target.value)} disabled={saving} placeholder="Describe the issues for the admin…" /></label><button type="button" className="ops-secondary-action" onClick={() => photoInput.current?.click()} disabled={saving || photos.length >= 5}><Paperclip size={19} /> Add photos</button><input ref={photoInput} type="file" accept=".jpg,.jpeg,.png,.webp" multiple hidden onChange={(event) => { onPhotos([...photos, ...Array.from(event.target.files || [])].slice(0, 5)); event.target.value = '' }} /></div>
        {photos.length ? <ul className="po-report-photos">{photos.map((file, index) => <li key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" disabled={saving} onClick={() => onPhotos(photos.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`}><X size={14} /></button></li>)}</ul> : null}
        <ReceivingValues values={values} replacement={order.items.some((item) => item.acceptedQuantity > 0)} />
        <p className="po-report-approval-note"><AlertTriangle size={18} /><span>{returnedAll ? 'Confirm the physical return to close this order without changing inventory.' : 'Admin approval is required before inventory and payment are updated.'}</span></p>
        {errors.form || error ? <p className="po-inline-error" role="alert" tabIndex={-1}>{errors.form || error}</p> : null}
      </div>
      <footer><button type="button" className="ops-secondary-action" onClick={onBack} disabled={saving}>Back</button><button type="button" className="ops-secondary-action po-return-all" disabled={saving || order.items.some((item) => Number(item.acceptedQuantity) > 0) || !lines.some((line) => Number(line.receivedQuantity) > 0)} onClick={() => { onChange(returnAllReceived(lines)); setErrors({}); setReturnedAll(true); setConfirmReturn(true) }}>Return all received</button><button type="submit" className="ops-main-action" disabled={saving || !selectedCount}>{saving ? 'Submitting…' : `Submit selected issues (${selectedCount})`}</button></footer>
    </form>
    {confirmReturn ? <div className="po-report-confirm-backdrop"><section className="po-modal po-report-confirm" role="alertdialog" aria-modal="true" aria-label="Confirm return of all received items"><header><h2>Return all received items?</h2></header><div className="po-report-confirm-body"><p>Confirm the received items have been physically returned. This will mark the purchase order Returned and will not add anything to inventory. Supplier refunds are handled outside the system.</p>{error ? <p className="po-inline-error" role="alert">{error}</p> : null}</div><footer><button type="button" className="ops-secondary-action" onClick={() => setConfirmReturn(false)} disabled={saving}>Keep editing</button><button type="button" className="ops-destructive-action" onClick={onReturnAll} disabled={saving}>{saving ? 'Returning…' : 'Confirm return'}</button></footer></section></div> : null}
  </section></div>
}
