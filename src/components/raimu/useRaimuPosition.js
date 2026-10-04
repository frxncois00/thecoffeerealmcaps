import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.max(min, Math.min(Math.max(min, max), value))

// Reads layout only on open/resize/drag-start. Pointer movement writes a single
// transform per frame; neither gaze nor dragging causes a React render per pixel.
export function useRaimuPosition({ open, enabled, onDrag }) {
  const dockRef = useRef(null)
  const panelRef = useRef(null)
  const offset = useRef({ x: 0, y: 0 })
  const drag = useRef(null)
  const moved = useRef(false)
  const frame = useRef(0)
  const [panelStyle, setPanelStyle] = useState({ visibility: 'hidden' })
  const [bubbleStyle, setBubbleStyle] = useState({})
  const place = useCallback(() => {
    if (!dockRef.current) return
    const viewport = window.visualViewport
    const width = viewport?.width || window.innerWidth
    const height = viewport?.height || window.innerHeight
    const left = viewport?.offsetLeft || 0
    const top = viewport?.offsetTop || 0
    const rect = dockRef.current.getBoundingClientRect()
    // Clamp a previously dragged dock when the viewport shrinks or rotates.
    const dx = clamp(rect.left, left + 12, left + width - rect.width - 12) - rect.left
    const dy = clamp(rect.top, top + 12, top + height - rect.height - 12) - rect.top
    offset.current = { x: offset.current.x + dx, y: offset.current.y + dy }
    dockRef.current.style.transform = `translate3d(${offset.current.x}px, ${offset.current.y}px, 0)`
    const x = rect.left + dx
    const y = rect.top + dy
    const panelWidth = Math.min(392, width - 24)
    const availableHeight = Math.max(120, height - 24)
    const panelHeight = Math.min(524, availableHeight)
    const panelX = clamp(x + rect.width - panelWidth, left + 12, left + width - panelWidth - 12)
    const panelY = clamp(y - panelHeight - 12, top + 12, top + height - panelHeight - 12)
    setPanelStyle({ left: panelX, top: panelY, width: panelWidth, height: panelHeight, transformOrigin: `${clamp(x + rect.width / 2 - panelX, 0, panelWidth)}px ${clamp(y + rect.height / 2 - panelY, 0, panelHeight)}px` })
    const bubbleWidth = Math.min(248, width - 24)
    setBubbleStyle({ width: bubbleWidth, left: clamp(x + rect.width - bubbleWidth, left + 12, left + width - bubbleWidth - 12) - x, ...(y > top + 115 ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 8px)' }) })
  }, [])

  useLayoutEffect(() => {
    place()
    window.addEventListener('resize', place)
    window.visualViewport?.addEventListener('resize', place)
    window.visualViewport?.addEventListener('scroll', place)
    return () => {
      window.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('scroll', place)
      window.cancelAnimationFrame(frame.current)
    }
  }, [open, enabled, place])

  const startDrag = (event) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    const rect = dockRef.current.getBoundingClientRect()
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: { ...offset.current }, rect }
    moved.current = false
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moveDrag = (event) => {
    if (!drag.current || drag.current.id !== event.pointerId) return
    // Recover from a lost pointerup (window switching, native controls, or a
    // cancelled gesture); a later hover must never minimize the conversation.
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      drag.current = null
      return
    }
    const current = drag.current
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (!moved.current && Math.hypot(dx, dy) < 6) return
    if (!moved.current) { moved.current = true; onDrag() }
    offset.current = {
      x: current.start.x + clamp(dx, 12 - current.rect.left, window.innerWidth - current.rect.right - 12),
      y: current.start.y + clamp(dy, 12 - current.rect.top, window.innerHeight - current.rect.bottom - 12),
    }
    window.cancelAnimationFrame(frame.current)
    frame.current = window.requestAnimationFrame(() => {
      if (dockRef.current) dockRef.current.style.transform = `translate3d(${offset.current.x}px, ${offset.current.y}px, 0)`
    })
  }
  const endDrag = (event) => {
    if (!drag.current) return
    window.cancelAnimationFrame(frame.current)
    dockRef.current.style.transform = `translate3d(${offset.current.x}px, ${offset.current.y}px, 0)`
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    place()
  }
  const moveWithKeyboard = (event) => {
    if (!event.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    const distance = event.shiftKey ? 40 : 16
    offset.current.x += event.key === 'ArrowLeft' ? -distance : event.key === 'ArrowRight' ? distance : 0
    offset.current.y += event.key === 'ArrowUp' ? -distance : event.key === 'ArrowDown' ? distance : 0
    dockRef.current.style.transform = `translate3d(${offset.current.x}px, ${offset.current.y}px, 0)`
    place()
  }
  const resetPosition = () => {
    offset.current = { x: 0, y: 0 }
    dockRef.current.style.transform = 'translate3d(0, 0, 0)'
    place()
  }
  const cancelDrag = () => { drag.current = null }
  return { dockRef, panelRef, panelStyle, bubbleStyle, moved, resetPosition, cancelDrag, dragHandlers: { onPointerDown: startDrag, onPointerMove: moveDrag, onPointerUp: endDrag, onPointerCancel: endDrag, onLostPointerCapture: cancelDrag, onKeyDown: moveWithKeyboard } }
}
