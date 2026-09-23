import { ArrowUp, Bot, Minus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../lib/auth'
import { supabase } from '../lib/supabase'

function renderMessageText(text) {
  const parts = String(text || '').split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, index) => /^https?:\/\//i.test(part)
    ? <a href={part} target="_blank" rel="noreferrer" key={`link-${index}`}>Download report</a>
    : <span key={`text-${index}`}>{part}</span>)
}

async function downloadReport(url, format) {
  const response = await fetch(url)
  const csv = await response.text()
  const rows = csv.trim().split(/\r?\n/).map((line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((cell) => cell.replace(/^"|"$/g, '').replaceAll('""', '"')))
  const filename = `the-coffee-realm-report-${new Date().toISOString().slice(0, 10)}`
  if (format === 'csv') { const blob = new Blob([csv], { type: 'text/csv' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${filename}.csv`; link.click(); return }
  if (format === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Report', { views: [{ showGridLines: false }] })
    sheet.addRows(rows); sheet.mergeCells(1, 1, 1, rows[0].length); sheet.getCell(1, 1).value = 'THE COFFEE REALM REPORT'; sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } }; sheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0C4B32' } }
    sheet.getRow(2).eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '176A48' } } }); sheet.columns = rows[0].map(() => ({ width: 22 }))
    const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${filename}.xlsx`; link.click(); return
  }
  const { jsPDF } = await import('jspdf'); const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' }); pdf.setFillColor(12, 75, 50); pdf.rect(0, 0, 842, 48, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFontSize(16); pdf.text('THE COFFEE REALM REPORT', 32, 30); pdf.setTextColor(35, 65, 50); pdf.setFontSize(8); let y = 78; rows.forEach((row, index) => { if (y > 560) { pdf.addPage(); y = 50 } if (index === 0) pdf.setFont('helvetica', 'bold'); else pdf.setFont('helvetica', 'normal'); pdf.text(row.map((cell) => String(cell).slice(0, 28)).join('   |   '), 32, y); y += 18 }); pdf.save(`${filename}.pdf`)
}

export default function RaimuWidget() {
  const { user, profile, loading } = useAuth()
  const role = normalizeRole(profile?.role)
  const [open, setOpen] = useState(false)
  const [closed, setClosed] = useState(() => window.localStorage.getItem('raimu-visible') !== 'true')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [position, setPosition] = useState({ right: 28, bottom: 28 })
  const dragRef = useRef(null)
  const movedRef = useRef(false)
  const allowed = Boolean(user) && ['admin', 'staff', 'cashier'].includes(role)

  useEffect(() => {
    const syncVisibility = (event) => setClosed(event.detail?.visible === false)
    window.addEventListener('raimu-visibility-change', syncVisibility)
    return () => window.removeEventListener('raimu-visibility-change', syncVisibility)
  }, [])

  if (loading || !allowed || closed) return null

  const startDrag = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top }
    movedRef.current = false
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moveDrag = (event) => {
    if (!dragRef.current) return
    const nextLeft = Math.max(10, Math.min(window.innerWidth - 120, event.clientX - dragRef.current.offsetX))
    const nextTop = Math.max(10, Math.min(window.innerHeight - 120, event.clientY - dragRef.current.offsetY))
    movedRef.current = true
    setPosition({ left: nextLeft, top: nextTop })
  }
  const endDrag = () => { dragRef.current = null }
  const hideRaimu = () => {
    window.localStorage.setItem('raimu-visible', 'false')
    setClosed(true)
    window.dispatchEvent(new CustomEvent('raimu-visibility-change', { detail: { visible: false } }))
  }
  const send = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages((current) => [...current, { from: 'user', text }])
    setDraft('')
    setTyping(true)
    try {
      const { data, error } = await supabase.functions.invoke('support-chat', { body: { message: text, role } })
      let reply = data?.text || data?.error
      if (error) {
        reply = error.message || 'I could not reach the Support service.'
        if (error.context) {
          try {
            const details = await error.context.clone().json()
            reply = details?.error || reply
          } catch { /* Keep the SDK message when the response is not JSON. */ }
        }
      }
      setMessages((current) => [...current, { from: 'raimu', text: reply || 'I could not generate a response.', reportUrl: data?.download_url || '' }])
    } catch (error) {
      setMessages((current) => [...current, { from: 'raimu', text: error?.message || 'I could not reach the Support service.' }])
    } finally {
      setTyping(false)
    }
  }

  return <div className={`raimu-widget${open ? ' is-open' : ''}`} style={position}>
    {open && <section className="raimu-popover" aria-label="Chat with Raimu"><header><div><span>Raimu Support</span><b>Internal workspace assistant</b></div><div className="raimu-popover-controls"><button type="button" onClick={() => setOpen(false)} aria-label="Minimize Raimu conversation" title="Minimize"><Minus size={16} /></button><button type="button" onClick={() => { setOpen(false); setMessages([]) }} aria-label="Close Raimu conversation" title="Close"><X size={16} /></button></div></header><div className="raimu-popover-messages" aria-live="polite">{messages.length ? messages.map((message, index) => <div className={`raimu-message-row ${message.from}`} key={`${message.from}-${index}`}><p>{renderMessageText(message.text)}</p>{message.reportUrl && <div className="raimu-report-actions"><button type="button" onClick={() => downloadReport(message.reportUrl, 'csv')}>CSV</button><button type="button" onClick={() => downloadReport(message.reportUrl, 'xlsx')}>Excel</button><button type="button" onClick={() => downloadReport(message.reportUrl, 'pdf')}>PDF</button></div>}</div>) : <div className="raimu-popover-empty"><Bot size={22} /><span>Ask me about sales, orders, inventory, payments, or reports.</span></div>}{typing && <p className="raimu-typing-dots" aria-label="Raimu is typing"><span>.</span><span>.</span><span>.</span></p>}</div><form onSubmit={send}><label className="sr-only" htmlFor="raimu-widget-input">Message Raimu</label><input id="raimu-widget-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Talk to Raimu…" maxLength={500} /><button type="submit" aria-label="Send message" disabled={!draft.trim() || typing}><ArrowUp size={16} /></button></form></section>}
    <button className="raimu-close-button" type="button" onClick={hideRaimu} aria-label="Close Raimu" title="Close Raimu"><X size={14} /></button>
    <button className="raimu-floating-avatar" type="button" aria-label={open ? 'Raimu conversation open' : 'Open Raimu conversation'} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={() => { if (!movedRef.current) setOpen((value) => !value) }}><img src="/assets/raimu/raimu.png?v=1" alt="" /><span className="raimu-floating-status" /></button>
  </div>
}
