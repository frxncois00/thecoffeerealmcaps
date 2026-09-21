import { ArrowUp, Bot, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../lib/auth'
import { supabase } from '../lib/supabase'

function RaimuCanvas({ typing = false }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { willReadFrequently: true })
    if (!video || !canvas || !context) return undefined
    let frame = 0
    const keepTwoSecondLoop = () => { if (video.currentTime >= 2) video.currentTime = 0 }
    video.addEventListener('timeupdate', keepTwoSecondLoop)
    const render = () => {
      if (video.readyState >= 2) {
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth || 320
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight || 320
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = image.data
        const width = canvas.width; const height = canvas.height
        const isBackground = (pixel) => Math.min(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]) > 246 && (pixels[pixel] + pixels[pixel + 1] + pixels[pixel + 2]) / 3 > 249
        const visited = new Uint8Array(width * height)
        const queue = []
        const add = (x, y) => { const cell = y * width + x; const pixel = cell * 4; if (!visited[cell] && isBackground(pixel)) { visited[cell] = 1; queue.push(cell) } }
        for (let x = 0; x < width; x += 1) { add(x, 0); add(x, height - 1) }
        for (let y = 1; y < height - 1; y += 1) { add(0, y); add(width - 1, y) }
        for (let cursor = 0; cursor < queue.length; cursor += 1) {
          const cell = queue[cursor]; const x = cell % width; const y = Math.floor(cell / width)
          pixels[cell * 4 + 3] = 0
          if (x > 0) add(x - 1, y); if (x < width - 1) add(x + 1, y); if (y > 0) add(x, y - 1); if (y < height - 1) add(x, y + 1)
        }
        context.putImageData(image, 0, 0)
      }
      frame = requestAnimationFrame(render)
    }
    video.play().catch(() => {})
    frame = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(frame); video.removeEventListener('timeupdate', keepTwoSecondLoop) }
  }, [])
  return <><video ref={videoRef} className="raimu-source-video" src={typing ? '/assets/raimu/typing.mp4?v=1' : '/assets/raimu/idle.mp4?v=2'} autoPlay loop muted playsInline /><canvas ref={canvasRef} className="raimu-transparent-canvas" aria-hidden="true" /></>
}

export default function RaimuWidget() {
  const { user, profile } = useAuth()
  const role = normalizeRole(profile?.role)
  const [open, setOpen] = useState(false)
  const [closed, setClosed] = useState(() => window.localStorage.getItem('raimu-visible') === 'false')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [position, setPosition] = useState({ right: 28, bottom: 28 })
  const dragRef = useRef(null)
  const movedRef = useRef(false)
  const allowed = Boolean(user) && ['admin', 'staff', 'operational_staff', 'cashier'].includes(role)

  useEffect(() => {
    const syncVisibility = (event) => setClosed(event.detail?.visible === false)
    window.addEventListener('raimu-visibility-change', syncVisibility)
    return () => window.removeEventListener('raimu-visibility-change', syncVisibility)
  }, [])

  if (!allowed || closed) return null

  const startDrag = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top }
    movedRef.current = false
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moveDrag = (event) => {
    if (!dragRef.current) return
    const nextLeft = Math.max(10, Math.min(window.innerWidth - 86, event.clientX - dragRef.current.offsetX))
    const nextTop = Math.max(10, Math.min(window.innerHeight - 86, event.clientY - dragRef.current.offsetY))
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
    setTyping(true)
    const { data, error } = await supabase.functions.invoke('support-chat', { body: { message: text, role } })
    setMessages((current) => [...current, { from: 'raimu', text: error ? (error.message || 'I could not reach the Support service.') : (data?.text || data?.error || 'I could not generate a response.') }])
    setTyping(false)
    setDraft('')
  }

  return <div className={`raimu-widget${open ? ' is-open' : ''}`} style={position}>
    {open && <section className="raimu-popover" aria-label="Chat with Raimu"><header><div><span>Raimu Support</span><b>Internal workspace assistant</b></div><button type="button" onClick={() => setOpen(false)} aria-label="Close Raimu conversation"><X size={16} /></button></header><div className="raimu-popover-messages" aria-live="polite">{messages.length ? messages.map((message, index) => <p className={message.from} key={`${message.from}-${index}`}>{message.text}</p>) : <div className="raimu-popover-empty"><Bot size={22} /><span>Ask me about sales, orders, inventory, payments, or reports.</span></div>}{typing && <p className="raimu-typing-dots" aria-label="Raimu is typing"><span>.</span><span>.</span><span>.</span></p>}</div><form onSubmit={send}><label className="sr-only" htmlFor="raimu-widget-input">Message Raimu</label><input id="raimu-widget-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Talk to Raimu…" maxLength={500} /><button type="submit" aria-label="Send message" disabled={!draft.trim()}><ArrowUp size={16} /></button></form></section>}
    <button className="raimu-close-button" type="button" onClick={hideRaimu} aria-label="Close Raimu" title="Close Raimu"><X size={14} /></button>
    <button className="raimu-floating-avatar" type="button" aria-label={open ? 'Raimu conversation open' : 'Open Raimu conversation'} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={() => { if (!movedRef.current) setOpen((value) => !value) }}><RaimuCanvas typing={typing} /><span className="raimu-floating-status" /></button>
  </div>
}
