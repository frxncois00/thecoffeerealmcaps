import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import PageIndicator from './PageIndicator'
import './page-turn.css'

const TURN_EASE = [0.22, 0.65, 0.3, 1]
const DESKTOP_QUERY = '(min-width: 900px)'
const clamp = value => Math.max(0, Math.min(1, value))

function Spread({ page, wide, renderPage, active = false, hideLeft = false }) {
  return <div className="rp-resting-spread">
    <div className={`rp-page-slot ${wide ? 'rp-page-left' : ''}`} style={hideLeft ? { visibility: 'hidden' } : undefined}>
      {renderPage(page, { active: active && !hideLeft })}
    </div>
    {wide && <div className="rp-page-slot rp-page-right">{renderPage(page + 1, { active })}</div>}
    {wide && <div className="rp-spine" aria-hidden="true"><i/><i/><i/></div>}
  </div>
}

function BookSnapshot({ page, wide, renderPage, renderCover, active = false, onOpen }) {
  return page === null
    ? <div className="rp-cover-slot">{renderCover({ onOpen, interactive: active })}</div>
    : <Spread page={page} wide={wide} renderPage={renderPage} active={active}/>
}

function BookBinding({ turn, progress }) {
  const opacity = useTransform(progress, [0, 1], turn?.from === null ? [0, 1] : turn?.to === null ? [1, 0] : [1, 1])
  return <motion.div className="rp-binding" style={{ opacity }} aria-hidden="true"/>
}

const SHEET_SEGMENTS = 5

// Five connected strips give the sheet a shallow curve. Each face clips a
// full-size page; only the hinges move, so text and stamp artwork stay intact.
function PaperStrip({ index = 0, progress, forward, front, back }) {
  const rotation = useTransform(progress, value => {
    const phase = forward ? value : 1 - value
    const bend = Math.sin(Math.PI * phase) * 32
    return index === 0 ? -180 * phase - bend / 2 : bend / (SHEET_SEGMENTS - 1)
  })
  const shade = useTransform(progress, value => Math.sin(Math.PI * value) * (0.035 + index * 0.014))
  return <motion.div className={`rp-paper-strip ${index === 0 ? 'rp-paper-strip-root' : ''}`} style={{ rotateY: rotation }}>
    <div className="rp-strip-face rp-strip-front">
      <div className="rp-strip-content" style={{ left: `${-index * 100}%` }}>{front}</div>
      <motion.span className="rp-sheet-shade" style={{ opacity: shade }} />
    </div>
    <div className="rp-strip-face rp-strip-back">
      <div className="rp-strip-content" style={{ left: `${-(SHEET_SEGMENTS - 1 - index) * 100}%` }}>{back}</div>
      <motion.span className="rp-sheet-shade" style={{ opacity: shade }} />
    </div>
    {index + 1 < SHEET_SEGMENTS && <PaperStrip index={index + 1} progress={progress} forward={forward} front={front} back={back} />}
  </motion.div>
}

function TurningPages({ turn, progress, wide, reducedMotion, renderPage, renderCover }) {
  const opening = turn.from === null
  const closing = turn.to === null
  const forward = opening || (!closing && turn.to > turn.from)
  const cover = opening || closing
  const rotation = useTransform(progress, [0, 1], wide
    ? forward ? [0, -180] : [-180, 0]
    : closing ? [-180, 0] : [0, -180])
  const travel = useTransform(progress, [0, 1], wide && cover
    ? opening ? ['-50%', '0%'] : ['0%', '-50%']
    : ['0%', '0%'])
  const sourceOpacity = useTransform(progress, [0, 1], [1, 0])
  const destinationOpacity = useTransform(progress, [0, 1], [0, 1])
  const paperOpacity = useTransform(progress, [0, 1], opening ? [0, 1] : closing ? [1, 0] : [1, 1])
  const shade = useTransform(progress, [0, 0.5, 1], [0, 0.12, 0])

  // Copies are inert and always inactive: a turning leaf never consumes a stamp's entrance.
  if (reducedMotion) return <div className="rp-turn-scene" aria-hidden="true" inert>
    <motion.div className="rp-snapshot" style={{ opacity: sourceOpacity }}>
      <BookSnapshot page={turn.from} wide={wide} renderPage={renderPage} renderCover={renderCover}/>
    </motion.div>
    <motion.div className="rp-snapshot" style={{ opacity: destinationOpacity }}>
      <BookSnapshot page={turn.to} wide={wide} renderPage={renderPage} renderCover={renderCover}/>
    </motion.div>
  </div>

  const restingPage = opening ? 0 : closing ? turn.from : turn.to
  let front
  let back
  let resting
  if (wide) {
    front = cover ? renderCover({ interactive: false }) : renderPage((forward ? turn.from : turn.to) + 1, { active: false })
    back = renderPage(opening ? 0 : closing ? turn.from : forward ? turn.to : turn.from, { active: false })
    resting = cover
      ? <Spread page={restingPage} wide renderPage={renderPage} hideLeft/>
      : <div className="rp-resting-spread">
        <div className="rp-page-slot rp-page-left">{renderPage(forward ? turn.from : turn.to, { active: false })}</div>
        <div className="rp-page-slot rp-page-right">{renderPage((forward ? turn.to : turn.from) + 1, { active: false })}</div>
        <div className="rp-spine" aria-hidden="true"><i/><i/><i/></div>
      </div>
  } else {
    front = cover ? renderCover({ interactive: false }) : renderPage(forward ? turn.from : turn.to, { active: false })
    back = <div className="rp-paper rp-paper-reverse" />
    resting = <Spread page={cover ? restingPage : forward ? turn.to : turn.from} renderPage={renderPage}/>
  }

  return <div className="rp-turn-scene" aria-hidden="true" inert>
    <motion.div className="rp-snapshot" style={{ opacity: paperOpacity }}>{resting}</motion.div>
    {cover ? <motion.div className="rp-leaf rp-cover-leaf" style={{ rotateY: rotation, x: travel }}>
      <div className="rp-leaf-face rp-leaf-front">{front}<motion.span className="rp-leaf-shade" style={{ opacity: shade }}/></div>
      <div className="rp-leaf-face rp-leaf-back">{back}<motion.span className="rp-leaf-shade" style={{ opacity: shade }}/></div>
    </motion.div> : <div className="rp-leaf rp-flexible-sheet" style={{ '--rp-sheet-segments': SHEET_SEGMENTS }}>
      <PaperStrip progress={progress} forward={forward} front={front} back={back} />
    </div>}
  </div>
}

export default function PageTurnBook({ pages, renderPage, renderCover, currentPage = 1, onPageChange }) {
  const [page, setPage] = useState(null)
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches)
  const [turn, setTurn] = useState(null)
  const progress = useMotionValue(0)
  const reducedMotion = useReducedMotion()
  const instructionsId = useId()
  const bookRef = useRef(null)
  const pageRef = useRef(null)
  const turnRef = useRef(null)
  const animationRef = useRef(null)
  const pointerRef = useRef(null)
  const suppressClickUntil = useRef(0)
  const wideRef = useRef(wide)
  const onPageChangeRef = useRef(onPageChange)
  onPageChangeRef.current = onPageChange

  const normalize = useCallback(value => value === null ? null : Math.floor(Math.max(0, Math.min(pages.length - 1, value)) / (wideRef.current ? 2 : 1)) * (wideRef.current ? 2 : 1), [pages.length])

  const finish = useCallback(commit => {
    const pending = turnRef.current
    if (!pending) return
    // Clear the lock before stopping an animation; stale completion callbacks are harmless.
    turnRef.current = null
    animationRef.current?.stop()
    animationRef.current = null
    pointerRef.current = null
    const next = normalize(commit ? pending.to : pending.from)
    pageRef.current = next
    setPage(next)
    setTurn(null)
    onPageChangeRef.current?.(next)
  }, [normalize])

  const settle = useCallback(commit => {
    const pending = turnRef.current
    if (!pending) return
    animationRef.current?.stop()
    const distance = Math.abs((commit ? 1 : 0) - progress.get())
    animationRef.current = animate(progress, commit ? 1 : 0, {
      duration: reducedMotion ? 0.16 : Math.max(0.2, 0.62 * distance),
      ease: TURN_EASE,
      onComplete: () => { if (turnRef.current === pending) finish(commit) },
    })
  }, [finish, progress, reducedMotion])

  const begin = useCallback((destination, dragging = false) => {
    if (turnRef.current) return false
    // Every opening starts with the identity page, including keyboard shortcuts.
    const target = normalize(pageRef.current === null && destination !== null ? 0 : destination)
    if (target === pageRef.current) return false
    const pending = { from: pageRef.current, to: target }
    if (bookRef.current?.contains(document.activeElement)) bookRef.current.focus({ preventScroll: true })
    progress.set(0)
    turnRef.current = pending
    setTurn(pending)
    if (!dragging) settle(true)
    return true
  }, [normalize, progress, settle])

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    const handleResize = () => {
      // A resize cancels an unfinished gesture, so no half-turned sheet survives a layout change.
      finish(false)
      pointerRef.current = null
      wideRef.current = query.matches
      setWide(query.matches)
      const next = normalize(pageRef.current)
      if (next !== pageRef.current) {
        pageRef.current = next
        setPage(next)
        onPageChangeRef.current?.(next)
      }
    }
    const handleBlur = () => { finish(false); pointerRef.current = null }
    window.addEventListener('resize', handleResize)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('blur', handleBlur)
      turnRef.current = null
      animationRef.current?.stop()
    }
  }, [finish, normalize])

  function go(direction) {
    if (pageRef.current === null) { if (direction > 0) begin(0); return }
    const next = pageRef.current + direction * (wideRef.current ? 2 : 1)
    if (next >= 0 && next < pages.length) begin(next)
  }

  function onKeyDown(event) {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return
    if (['ArrowRight', 'ArrowLeft', 'Home', 'End', 'Escape'].includes(event.key)) event.preventDefault()
    if (event.key === 'ArrowRight') go(1)
    if (event.key === 'ArrowLeft') go(-1)
    if (event.key === 'Home') begin(0)
    if (event.key === 'End') begin(pages.length - 1)
    if (event.key === 'Escape') begin(null)
  }

  function onPointerDown(event) {
    if (turnRef.current || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    if (event.target.closest('a, input, textarea, select, [contenteditable="true"], [data-no-page-drag]')) return
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, time: event.timeStamp, velocity: 0, dragging: false, direction: 0 }
  }

  function onPointerMove(event) {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      pointerRef.current = null
      if (pointer.dragging) settle(false)
      return
    }
    const dx = event.clientX - pointer.x
    const dy = event.clientY - pointer.y
    if (!pointer.dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { pointerRef.current = null; return }
      if (Math.abs(dx) < 8) return
      const direction = dx < 0 ? 1 : -1
      const from = pageRef.current
      const destination = from === null ? 0 : from + direction * (wideRef.current ? 2 : 1)
      if ((from === null && direction < 0) || destination < 0 || destination >= pages.length || !begin(destination, true)) { pointerRef.current = null; return }
      pointer.dragging = true
      pointer.direction = direction
      pointer.width = bookRef.current.getBoundingClientRect().width / (wideRef.current ? 2 : 1)
      try { bookRef.current.setPointerCapture(event.pointerId) } catch { /* The pointer may already have been released. */ }
    }
    const elapsed = event.timeStamp - pointer.time
    if (elapsed > 0) pointer.velocity = (event.clientX - pointer.lastX) / elapsed
    pointer.lastX = event.clientX
    pointer.time = event.timeStamp
    progress.set(clamp(-dx * pointer.direction / pointer.width))
    if (event.cancelable) event.preventDefault()
  }

  function releasePointer(event, cancelled = false) {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    pointerRef.current = null
    if (!pointer.dragging) return
    suppressClickUntil.current = performance.now() + 400
    const freshVelocity = event.timeStamp - pointer.time < 100 ? -pointer.velocity * pointer.direction : 0
    const commit = !cancelled && (progress.get() >= 0.32 || (progress.get() > 0.045 && freshVelocity > 0.45))
    settle(commit)
    if (bookRef.current?.hasPointerCapture(event.pointerId)) bookRef.current.releasePointerCapture(event.pointerId)
  }

  const busy = turn !== null
  const open = page !== null
  const atEnd = open && page + (wide ? 2 : 1) >= pages.length

  return <div className="rp-reader" onKeyDown={onKeyDown}>
    <div className="rp-book-space">
      <div ref={bookRef} className={`rp-book ${wide ? 'is-wide' : 'is-single'} ${open ? 'is-open' : 'is-closed'} ${busy ? 'is-turning' : ''}`}
        tabIndex={0} role="group" aria-label="Interactive Realm Passport" aria-describedby={instructionsId} aria-busy={busy}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={event => releasePointer(event)}
        onPointerLeave={() => { if (!pointerRef.current?.dragging) pointerRef.current = null }}
        onPointerCancel={event => releasePointer(event, true)} onLostPointerCapture={event => releasePointer(event, true)}
        onClickCapture={event => { if (performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation() } }}>
        {(open || busy) && <BookBinding turn={turn} progress={progress}/>}
        {turn ? <TurningPages turn={turn} progress={progress} wide={wide} reducedMotion={reducedMotion} renderPage={renderPage} renderCover={renderCover}/>
          : <BookSnapshot page={page} wide={wide} renderPage={renderPage} renderCover={renderCover} active onOpen={() => begin(0)}/>}
        {open && !busy && <>
          <button className="rp-edge rp-edge-previous" onClick={() => go(-1)} disabled={page === 0} aria-label="Turn to previous page" data-no-page-drag><ArrowLeft size={15}/></button>
          <button className="rp-edge rp-edge-next" onClick={() => go(1)} disabled={atEnd} aria-label="Turn to next page" data-no-page-drag><ArrowRight size={15}/></button>
        </>}
      </div>
    </div>
    <nav className="rp-navigation" aria-label="Passport page navigation">
      <button onClick={() => go(-1)} disabled={!open || busy || page === 0} aria-label="Previous page"><ArrowLeft size={18} aria-hidden="true"/><span>Previous</span></button>
      <PageIndicator pages={pages} page={page} spread={wide}/>
      <button className="rp-next-button" onClick={() => go(1)} disabled={busy || atEnd} aria-label={open ? 'Next page' : 'Open passport'}><span>{open ? 'Next' : 'Open'}</span><ArrowRight size={18} aria-hidden="true"/></button>
    </nav>
    {open && <nav className="rp-shortcuts" aria-label="Passport sections">
      <button onClick={() => begin(0)} disabled={busy} aria-current={page === 0 ? 'page' : undefined}>Identity</button>
      <button onClick={() => begin(currentPage)} disabled={busy} aria-current={page !== 0 && page === normalize(currentPage) ? 'page' : undefined}>Stamps</button>
      <button onClick={() => begin(pages.length - 1)} disabled={busy} aria-current={page === normalize(pages.length - 1) ? 'page' : undefined}>Summary</button>
      <button onClick={() => begin(null)} disabled={busy}><X size={14} aria-hidden="true"/>Close</button>
    </nav>}
    <p className="rp-instructions" id={instructionsId}>Swipe or use ← → to turn pages.<span className="rp-sr-only"> Home: identity. End: summary. Escape: close.</span></p>
  </div>
}
