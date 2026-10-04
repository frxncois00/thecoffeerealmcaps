import { ArrowDown, ArrowUp, Check, Coffee, Minus, RotateCcw, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { normalizeRole } from '../lib/auth'
import { supabase } from '../lib/supabase'
import RaimuMascot from './raimu/RaimuMascot'
import { raimu } from './raimu/raimuMachine'
import { readRaimuPreference, saveRaimuPreference, setRaimuAnimated, useRaimu } from './raimu/useRaimu'
import { useRaimuPosition } from './raimu/useRaimuPosition'
import './raimu/raimu-companion.css'

function renderMessageText(text) {
  const parts = String(text || '').split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, index) => /^https?:\/\//i.test(part)
    ? <a href={part} target="_blank" rel="noreferrer" key={`link-${index}`}>Download report</a>
    : <span key={`text-${index}`}>{part}</span>)
}

function saveReportBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

async function downloadReport(url, format) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('The report could not be downloaded. Please try again.')
  const csv = await response.text()
  const rows = csv.trim().split(/\r?\n/).map((line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((cell) => cell.replace(/^"|"$/g, '').replaceAll('""', '"')))
  const filename = `the-coffee-realm-report-${new Date().toISOString().slice(0, 10)}`
  if (format === 'csv') { saveReportBlob(new Blob([csv], { type: 'text/csv' }), `${filename}.csv`); return }
  if (format === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Report', { views: [{ showGridLines: false }] })
    sheet.addRows(rows); sheet.mergeCells(1, 1, 1, rows[0].length); sheet.getCell(1, 1).value = 'THE COFFEE REALM REPORT'; sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } }; sheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0C4B32' } }
    sheet.getRow(2).eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '176A48' } } }); sheet.columns = rows[0].map(() => ({ width: 22 }))
    const buffer = await workbook.xlsx.writeBuffer(); saveReportBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`); return
  }
  const { jsPDF } = await import('jspdf'); const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' }); pdf.setFillColor(12, 75, 50); pdf.rect(0, 0, 842, 48, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFontSize(16); pdf.text('THE COFFEE REALM REPORT', 32, 30); pdf.setTextColor(35, 65, 50); pdf.setFontSize(8); let y = 78; rows.forEach((row, index) => { if (y > 560) { pdf.addPage(); y = 50 } if (index === 0) pdf.setFont('helvetica', 'bold'); else pdf.setFont('helvetica', 'normal'); pdf.text(row.map((cell) => String(cell).slice(0, 28)).join('   |   '), 32, y); y += 18 }); pdf.save(`${filename}.pdf`)
}

export default function RaimuWidget() {
  const { user, profile, loading } = useAuth()
  const role = normalizeRole(profile?.role)
  const [closed, setClosed] = useState(() => readRaimuPreference('raimu-visible', 'true') === 'false')
  const allowed = Boolean(user) && ['admin', 'staff', 'cashier'].includes(role)

  useEffect(() => {
    const syncVisibility = (event) => setClosed(event.detail?.visible === false)
    window.addEventListener('raimu-visibility-change', syncVisibility)
    return () => window.removeEventListener('raimu-visibility-change', syncVisibility)
  }, [])

  const hideRaimu = () => {
    saveRaimuPreference('raimu-visible', false)
    setClosed(true)
    window.dispatchEvent(new CustomEvent('raimu-visibility-change', { detail: { visible: false } }))
    document.querySelector('.raimu-toggle')?.focus()
  }
  if (loading || !allowed) return null
  const sessionKey = `${user.id}:${user.last_sign_in_at || 'session'}`
  return <RaimuConversation key={sessionKey} role={role} sessionKey={sessionKey} enabled={!closed} onHide={hideRaimu} />
}

async function requestSupportReply(text, role) {
  return supabase.functions.invoke('support-chat', { body: { message: text, role } })
}

const stateLabels = {
  idle: 'Here when you need me', attention: 'You have my attention', greeting: 'A little help, on hand',
  listening: 'All ears', thinking: 'Thinking it through', talking: 'Here’s what I found',
  success: 'All taken care of', error: 'Let’s try that again', empty: 'No results just yet', sleepy: 'Resting, but still here',
}

// The injected request function is also used by the isolated local preview.
// Production always mounts this through the role-gated RaimuWidget above.
export function RaimuConversation({ role, sessionKey, enabled = true, onHide, requestReply = requestSupportReply }) {
  const { resolvedTheme } = useTheme()
  const companion = useRaimu({ enabled, sessionKey })
  const [open, setOpen] = useState(false)
  const [present, setPresent] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const avatarRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)
  const nearBottom = useRef(true)
  const requestId = useRef(0)
  const inFlight = useRef(false)
  const exportInFlight = useRef(false)
  const gaze = useRef({ rect: null, frame: 0 })
  const { dockRef, panelRef, panelStyle, bubbleStyle, moved, resetPosition, cancelDrag, dragHandlers } = useRaimuPosition({ open, enabled, onDrag: () => setOpen(false) })

  const closePanel = (clear = false) => {
    setOpen(false)
    if (clear) {
      requestId.current += 1 // Ignore a late reply to a conversation the user cleared.
      inFlight.current = false
      setTyping(false)
      setMessages([])
      setDraft('')
      raimu.setState('idle')
      raimu.clearBubbles()
    } else if (companion.state === 'listening') raimu.setState('idle')
    avatarRef.current?.focus({ preventScroll: true })
  }
  const openPanel = () => {
    setPresent(true)
    setOpen(true)
    raimu.clearBubbles()
    raimu.wake()
  }
  const scrollToLatest = (smooth = true) => {
    const log = logRef.current
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: smooth && companion.motion && companion.visible ? 'smooth' : 'instant' })
    nearBottom.current = true
    setUnseen(false)
  }

  useEffect(() => () => { requestId.current += 1 }, [])

  useEffect(() => {
    if (!enabled) { setOpen(false); setPresent(false) }
  }, [enabled])

  useLayoutEffect(() => {
    if (!open) return
    // Opening does not depend on animation timing, including reduced motion.
    inputRef.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open || !companion.visible) return
    if (!messages.length && !typing) {
      logRef.current?.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (nearBottom.current || typing) {
      const log = logRef.current
      log?.scrollTo({ top: log.scrollHeight, behavior: companion.motion ? 'smooth' : 'instant' })
      setUnseen(false)
    } else setUnseen(true)
  }, [messages, typing, open, companion.motion, companion.visible])

  useEffect(() => {
    if (!open) return undefined
    const escape = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const active = document.activeElement
      if (!panelRef.current?.contains(active) && active !== avatarRef.current) return
      event.preventDefault()
      setOpen(false)
      if (raimu.getSnapshot().state === 'listening') raimu.setState('idle')
      avatarRef.current?.focus({ preventScroll: true })
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [open, panelRef])

  useEffect(() => {
    if (!enabled || !companion.motion || !companion.visible || companion.state !== 'attention') return undefined
    const currentGaze = gaze.current
    const avatar = avatarRef.current
    currentGaze.rect = avatar?.getBoundingClientRect()
    const follow = (event) => {
      const rect = currentGaze.rect
      if (!rect) return
      const x = Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) / 25))
      const y = Math.max(-2, Math.min(2, (event.clientY - rect.top - rect.height / 2) / 30))
      window.cancelAnimationFrame(currentGaze.frame)
      currentGaze.frame = window.requestAnimationFrame(() => {
        avatar?.style.setProperty('--rc-look-x', `${x}px`)
        avatar?.style.setProperty('--rc-look-y', `${y}px`)
      })
    }
    window.addEventListener('pointermove', follow, { passive: true })
    return () => {
      window.removeEventListener('pointermove', follow)
      window.cancelAnimationFrame(currentGaze.frame)
      avatar?.style.setProperty('--rc-look-x', '0px')
      avatar?.style.setProperty('--rc-look-y', '0px')
    }
  }, [enabled, companion.motion, companion.visible, companion.state])

  const send = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || inFlight.current || exportInFlight.current) return
    inFlight.current = true
    const currentRequest = ++requestId.current
    nearBottom.current = true
    setMessages((current) => [...current, { from: 'user', text }])
    setDraft('')
    setTyping(true)
    inputRef.current?.focus({ preventScroll: true })
    raimu.clearBubbles()
    raimu.setState('thinking')
    try {
      const { data, error } = await requestReply(text, role)
      if (currentRequest !== requestId.current) return
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
      if (currentRequest !== requestId.current) return
      setMessages((current) => [...current, { from: 'raimu', text: reply || 'I could not generate a response.', reportUrl: data?.download_url || '' }])
      if (error || data?.error) raimu.setState('error')
      else if (!data?.text) raimu.setState('empty')
      else raimu.setState('talking', { onComplete: () => {
        if (data?.download_url) {
          raimu.setState('success')
          raimu.say('Your report is ready.', { duration: 3_000 })
        } else raimu.setState('idle')
      } })
    } catch (error) {
      if (currentRequest !== requestId.current) return
      setMessages((current) => [...current, { from: 'raimu', text: error?.message || 'I could not reach the Support service.' }])
      raimu.setState('error')
    } finally {
      if (currentRequest === requestId.current) {
        inFlight.current = false
        setTyping(false)
      }
    }
  }

  const exportReport = async (url, format) => {
    if (exportInFlight.current || inFlight.current) return
    exportInFlight.current = true
    const conversationId = requestId.current
    setExporting(true)
    raimu.setState('thinking')
    try {
      await downloadReport(url, format)
      if (conversationId !== requestId.current) return
      raimu.setState('success')
      raimu.say('Your download is ready.', { duration: 3_000 })
    } catch (error) {
      if (conversationId !== requestId.current) return
      setMessages((current) => [...current, { from: 'raimu', text: error.message || 'The report could not be downloaded.' }])
      raimu.setState('error')
    } finally { exportInFlight.current = false; setExporting(false) }
  }

  if (!enabled) return null
  return <div className="raimu-companion" data-theme={resolvedTheme} data-state={companion.state} data-motion={companion.motion ? 'full' : 'minimal'} data-paused={!companion.visible}>
    <div className="rc-dock" ref={dockRef}>
      {!open && (companion.bubble || companion.state === 'thinking') && <div className="rc-speech" key={companion.state === 'thinking' ? 'thinking' : companion.bubble.id} style={bubbleStyle}>
        {companion.state === 'thinking' ? <><span className="rc-sr-only">Raimu is thinking</span><ThinkingDots /></> : <><span>{companion.bubble.text}</span><button type="button" aria-label="Dismiss Raimu’s message" onClick={raimu.dismissBubble}><X size={14} /></button></>}
      </div>}
      <button className="rc-hide" type="button" onClick={onHide} aria-label="Hide Raimu" title="Hide Raimu"><X size={14} /></button>
      <button className="rc-launcher" ref={avatarRef} type="button" aria-label={open ? 'Minimize Raimu conversation' : 'Open Raimu conversation'} aria-expanded={open} aria-controls={present ? 'raimu-conversation' : undefined} aria-describedby="raimu-move-hint" {...dragHandlers}
        onPointerEnter={() => raimu.setState('attention', { duration: 0 })}
        onPointerLeave={() => { if (raimu.getSnapshot().state === 'attention') raimu.setState('idle') }}
        onFocus={() => raimu.setState('attention', { duration: 0 })}
        onBlur={() => { if (raimu.getSnapshot().state === 'attention') raimu.setState('idle') }}
        onClick={(event) => { cancelDrag(); if (event.detail === 0 || !moved.current) { if (open) closePanel(); else openPanel() } }}>
        <span className="rc-aura" aria-hidden="true" />
        <span className="rc-notification-pulse" key={companion.pulse} data-active={companion.pulse > 0} aria-hidden="true" />
        <RaimuMascot state={companion.state} blink={companion.blink} earTwitch={companion.earTwitch} />
        <span className="rc-presence" aria-hidden="true" />
      </button>
      <span id="raimu-move-hint" className="rc-sr-only">Drag to move, or use Alt and arrow keys while focused. Enter opens the conversation.</span>
    </div>

    {present && <section id="raimu-conversation" ref={panelRef} className={`rc-panel ${open ? 'is-open' : 'is-closing'}`} style={panelStyle} role="dialog" aria-modal="false" aria-labelledby="raimu-title" inert={!open} aria-hidden={!open} onAnimationEnd={(event) => { if (!open && event.target === event.currentTarget) setPresent(false) }}>
      <header className="rc-header">
        <div className="rc-header-mark" aria-hidden="true"><Coffee size={20} /></div>
        <div className="rc-heading"><h2 id="raimu-title">Raimu Support</h2><p>Internal workspace assistant</p></div>
        <div className="rc-controls"><button type="button" onClick={() => closePanel()} aria-label="Minimize Raimu conversation" title="Minimize"><Minus size={18} /></button><button type="button" onClick={() => closePanel(true)} aria-label="Close and clear Raimu conversation" title="Close and clear"><X size={18} /></button></div>
      </header>
      <div className="rc-status"><span aria-hidden="true" />{stateLabels[companion.state]}</div>
      <div className="rc-log" ref={logRef} role="log" aria-label="Conversation with Raimu" tabIndex={0} aria-live="polite" aria-relevant="additions text" onScroll={() => {
        const log = logRef.current
        nearBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < 60
        if (nearBottom.current) setUnseen(false)
      }}>
        {messages.length ? messages.map((message, index) => <article className={`rc-message is-${message.from}`} key={`${message.from}-${index}`} style={{ '--rc-message-delay': `${Math.min(index, 3) * 45}ms` }}>
          <span className="rc-message-author">{message.from === 'user' ? 'You' : 'Raimu'}</span>
          <p>{renderMessageText(message.text)}</p>
          {message.reportUrl && <div className="rc-report-actions" aria-label="Download report">{[['csv', 'CSV'], ['xlsx', 'Excel'], ['pdf', 'PDF']].map(([format, label]) => <button key={format} type="button" disabled={exporting || typing} onClick={() => exportReport(message.reportUrl, format)}>{label}<ArrowDown size={12} /></button>)}</div>}
        </article>) : <div className="rc-empty">
          <span className="rc-empty-icon"><Coffee size={24} strokeWidth={1.5} /></span>
          <h3>A little clarity for your day.</h3><p>Sales, orders, inventory, or a fresh report.<br />Let’s work through it together.</p>
          <div className="rc-prompts">{['How are sales today?', 'Which orders need attention?'].map((prompt) => <button type="button" key={prompt} onClick={() => { setDraft(prompt); raimu.setState('listening'); inputRef.current?.focus() }}>{prompt}<ArrowUp size={14} /></button>)}</div>
        </div>}
        {typing && <div className="rc-typing"><ThinkingDots /><span>Raimu is thinking…</span></div>}
      </div>
      {unseen && <button className="rc-latest" type="button" onClick={() => scrollToLatest()}><ArrowDown size={14} />Latest message</button>}
      {companion.bubble && ['success', 'error', 'empty'].includes(companion.state) && <div className="rc-inline-bubble"><span>{companion.bubble.text}</span><button type="button" aria-label="Dismiss Raimu’s message" onClick={raimu.dismissBubble}><X size={13} /></button></div>}
      <form className="rc-composer" onSubmit={send}>
        <label className="rc-sr-only" htmlFor="raimu-widget-input">Message Raimu</label>
        <input id="raimu-widget-input" ref={inputRef} value={draft} onChange={(event) => { setDraft(event.target.value); if (!inFlight.current && !exportInFlight.current) raimu.setState(event.target.value.trim() ? 'listening' : 'idle') }} onFocus={() => { if (draft.trim() && !inFlight.current && !exportInFlight.current) raimu.setState('listening') }} onBlur={() => { if (raimu.getSnapshot().state === 'listening') raimu.setState('idle') }} placeholder="Ask Raimu anything…" maxLength={500} autoComplete="off" />
        <button className="rc-send" type="submit" aria-label="Send message" disabled={!draft.trim() || typing || exporting}><ArrowUp size={19} /></button>
      </form>
      <footer className="rc-settings">
        <label className="rc-animation-setting"><input type="checkbox" role="switch" checked={companion.animated} onChange={(event) => setRaimuAnimated(event.target.checked)} aria-describedby={companion.reducedMotion ? 'raimu-motion-note' : undefined} /><span className="rc-switch" aria-hidden="true"><i>{companion.animated && <Check size={9} />}</i></span><span>Animated Raimu</span></label>
        <button type="button" onClick={resetPosition} aria-label="Reset Raimu’s position" title="Reset position"><RotateCcw size={14} /></button>
        {companion.reducedMotion && <small id="raimu-motion-note">Reduced motion is on.</small>}
      </footer>
    </section>}
    <span className="rc-sr-only" role="status" aria-live="polite" aria-atomic="true">{companion.bubble?.text || ''}</span>
    <span className="rc-sr-only" aria-live="polite" aria-atomic="true">{!open && messages.at(-1)?.from === 'raimu' ? `Raimu: ${messages.at(-1).text}` : ''}</span>
  </div>
}

function ThinkingDots() {
  return <span className="rc-dots" aria-hidden="true"><i /><i /><i /></span>
}
