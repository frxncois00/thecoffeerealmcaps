import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PageFlip } from 'page-flip'
import { useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Gift, UserRound, X } from 'lucide-react'
import PageIndicator from './PageIndicator'
import './page-turn.css'

// The engine owns its DOM shells; React owns only the portal contents.
// Cleanup can safely destroy the engine without removing React-owned nodes.
function OpenBook({ pages, renderPage, onClose, initialPage = 0, navigationStart }) {
  const host = useRef(null)
  const engine = useRef(null)
  const gesture = useRef(null)
  const currentPage = useRef(initialPage)
  const [shells, setShells] = useState([])
  const [page, setPage] = useState(initialPage)
  const [portrait, setPortrait] = useState(false)
  const [busy, setBusy] = useState(false)
  const reduced = useReducedMotion()
  const pageCount = pages.length
  useEffect(() => {
    let disposed = false
    const book = document.createElement('div')
    book.className = 'rp-flip-book'
    host.current.append(book)
    const nodes = Array.from({ length: pageCount }, (_, index) => {
      const node = document.createElement('div')
      node.className = `rp-engine-page ${index % 2 ? 'rp-right' : 'rp-left'}`
      node.dataset.density = 'soft'
      book.append(node)
      return node
    })
    const flip = new PageFlip(book, { width: 390, height: 452, size: 'stretch', minWidth: 260, maxWidth: 390, minHeight: 301, maxHeight: 452, showCover: false, usePortrait: true, flippingTime: 950, drawShadow: true, maxShadowOpacity: .4, mobileScrollSupport: true, swipeDistance: 30, clickEventForward: true, disableFlipByClick: true, useMouseEvents: !reduced })
    engine.current = flip
    flip.on('flip', event => { if (!disposed) { currentPage.current = event.data; setPage(event.data) } })
    flip.on('changeState', event => { if (!disposed) setBusy(event.data === 'flipping' || event.data === 'user_fold') })
    const sync = () => { if (disposed) return; const single = flip.getOrientation() === 'portrait'; setPortrait(single); book.classList.toggle('is-portrait', single) }
    flip.on('changeOrientation', sync)
    flip.on('init', sync)
    const resumePage = Math.min(currentPage.current, pageCount - 1)
    flip.loadFromHTML(nodes)
    flip.turnToPage(resumePage)
    // An odd final spread is made hard by the library; every interior sheet
    // must retain the same soft curl, including the last reward.
    nodes.forEach((_, index) => flip.getPage(index).setDensity('soft'))
    sync()
    setShells(nodes)
    // The engine rewrites each shell's inline styles every frame. Keep scaling
    // on the React content so a turn cannot erase it on a narrow screen.
    const scaleContents = () => {
      const { pageWidth, height } = flip.getBoundsRect()
      const scale = Math.min((pageWidth - 4) / 386, (height - 4) / 448)
      // Inherited from the host so newly mounted portals and engine clones
      // receive the same scale, even before their first ResizeObserver event.
      book.style.setProperty('--rp-scale', String(Math.max(0, scale)))
    }
    const fit = new ResizeObserver(scaleContents)
    fit.observe(book)
    scaleContents()
    // Portrait curls clone the visible page. Copies are purely visual and
    // must never duplicate focus targets or screen-reader content.
    const copies = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && node.matches('.rp-engine-page') && !nodes.includes(node)) {
          node.inert = true
          node.setAttribute('aria-hidden', 'true')
        }
      }
    })
    copies.observe(book, { childList: true, subtree: true })
    const settle = () => {
      flip.userStop({ x: 0, y: 0 }, true)
      flip.getRender().finishAnimation()
      flip.getFlipController().stopMove()
      flip.getRender().finishAnimation()
      gesture.current = null
      setBusy(false)
    }
    const visibilityChanged = () => { if (document.hidden) settle() }
    window.addEventListener('blur', settle)
    window.addEventListener('resize', settle)
    book.addEventListener('touchcancel', settle)
    book.addEventListener('pointercancel', settle)
    document.addEventListener('visibilitychange', visibilityChanged)
    host.current.focus({ preventScroll: true })
    return () => {
      disposed = true
      window.removeEventListener('blur', settle)
      window.removeEventListener('resize', settle)
      book.removeEventListener('touchcancel', settle)
      book.removeEventListener('pointercancel', settle)
      document.removeEventListener('visibilitychange', visibilityChanged)
      fit.disconnect()
      copies.disconnect()
      engine.current = null
      flip.destroy()
    }
  }, [pageCount, reduced])
  function go(direction) {
    const flip = engine.current
    if (!flip || !['read', 'fold_corner'].includes(flip.getState())) return
    host.current.focus({ preventScroll: true })
    if (reduced) {
      const next = page + direction * (portrait ? 1 : 2)
      if (next < 0 || next >= pages.length) return
      flip.turnToPage(next)
      host.current.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 160 })
    } else if (direction > 0) flip.flipNext('bottom')
    else flip.flipPrev('bottom')
  }
  function goTo(target) {
    const flip = engine.current
    if (!flip || busy || !['read', 'fold_corner'].includes(flip.getState())) return
    const next = Math.max(0, Math.min(target, pages.length - 1))
    host.current.focus({ preventScroll: true })
    flip.turnToPage(next)
    host.current.animate([{ opacity: .35 }, { opacity: 1 }], { duration: reduced ? 160 : 220 })
  }
  function startGesture(event) {
    gesture.current = null
    if (event.target.closest('button, a, [data-no-page-drag]')) return
    gesture.current = { x: event.clientX, y: event.clientY }
  }
  function endGesture(event) {
    const start = gesture.current
    gesture.current = null
    if (!reduced || !start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      const rect = host.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      if ((y < 70 || y > rect.height - 70) && (x < 70 || x > rect.width - 70)) go(x < rect.width / 2 ? -1 : 1)
    }
  }
  const onProfile = page === 0
  const onSummary = page >= pages.length - (portrait ? 1 : 2)
  const onRewards = !onProfile && !onSummary
  return <div className="rp-reader" onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); go(event.key === 'ArrowRight' ? 1 : -1) } }}>
    <nav className="rp-section-navigation" aria-label="Passport sections">
      {navigationStart}
      <button type="button" onClick={() => goTo(0)} aria-current={onProfile ? 'page' : undefined} disabled={busy}><UserRound size={16} aria-hidden="true" />Profile</button>
      <button type="button" onClick={() => goTo(1)} aria-current={onRewards ? 'page' : undefined} disabled={busy}><Gift size={16} aria-hidden="true" />Rewards</button>
      <button type="button" onClick={() => goTo(pages.length - 1)} aria-current={onSummary ? 'page' : undefined} disabled={busy}><BookOpen size={16} aria-hidden="true" />Summary</button>
      <button type="button" onClick={onClose} disabled={busy}><X size={16} aria-hidden="true" />Close</button>
    </nav>
    <div ref={host} className="rp-flip-host" tabIndex={0} role="group" aria-label="Realm Passport. Use arrow keys or drag a page corner to turn."
      onPointerDown={startGesture} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null }}
      onMouseDownCapture={event => { if (event.target.closest('button, a, [data-no-page-drag]')) event.stopPropagation() }}
      onTouchStartCapture={event => { if (event.target.closest('button, a, [data-no-page-drag]')) event.stopPropagation() }} />
    {shells.map((node, index) => {
      const visible = index >= page && index < page + (portrait ? 1 : 2)
      return createPortal(<div className="rp-page-content" inert={!visible} aria-hidden={!visible}>{renderPage(index, { active: !busy && visible })}</div>, node, index)
    })}
    <nav className="rp-navigation" aria-label="Passport page navigation">
      <button type="button" onClick={() => go(-1)} disabled={busy || page === 0} aria-label="Previous page"><ArrowLeft size={20}/></button>
      <button type="button" onClick={() => go(1)} disabled={busy || page + (portrait ? 1 : 2) >= pages.length} aria-label="Next page"><ArrowRight size={20}/></button>
    </nav>
    <div className="rp-sr-only"><PageIndicator pages={pages} page={page} spread={!portrait}/></div>
  </div>
}

function ClosedBook({ pages, renderCover, loading, onOpen, navigationStart }) {
  return <div className="rp-reader is-closed">
    <nav className="rp-section-navigation" aria-label="Passport sections">
      {navigationStart}
      <button type="button" onClick={() => onOpen(0)} disabled={loading}><UserRound size={16} aria-hidden="true" />Profile</button>
      <button type="button" onClick={() => onOpen(1)} disabled={loading}><Gift size={16} aria-hidden="true" />Rewards</button>
      <button type="button" onClick={() => onOpen(pages.length - 1)} disabled={loading}><BookOpen size={16} aria-hidden="true" />Summary</button>
      <button type="button" onClick={() => onOpen(0)} disabled={loading}><BookOpen size={16} aria-hidden="true" />Open</button>
    </nav>
    <div className="rp-closed-book">
      {renderCover({ interactive: !loading, onOpen: () => onOpen(0) })}
    </div>
    <nav className="rp-navigation" aria-label="Passport page navigation">
      <button type="button" disabled aria-label="Previous page"><ArrowLeft size={20}/></button>
      <button type="button" onClick={() => onOpen(0)} disabled={loading} aria-label="Next page"><ArrowRight size={20}/></button>
    </nav>
    <div className="rp-sr-only"><PageIndicator pages={pages} page={null} spread={false}/></div>
  </div>
}

export default function PageTurnBook({ pages, renderPage, renderCover, loading, navigationStart }) {
  const [open, setOpen] = useState(false)
  const [targetPage, setTargetPage] = useState(0)

  const handleOpen = (target = 0) => {
    setTargetPage(target)
    setOpen(true)
  }

  return open && !loading
    ? <OpenBook pages={pages} renderPage={renderPage} initialPage={targetPage} onClose={() => setOpen(false)} navigationStart={navigationStart}/>
    : <ClosedBook pages={pages} renderCover={renderCover} loading={loading} onOpen={handleOpen} navigationStart={navigationStart}/>
}
