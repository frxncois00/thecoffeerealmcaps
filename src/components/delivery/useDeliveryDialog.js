import { useEffect, useRef } from 'react'
import { lockBodyScroll, unlockBodyScroll } from '../../utils/bodyScrollLock'

export function useDeliveryDialog(onClose, active = true) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  const scrollToken = useRef(Symbol('delivery-dialog'))
  useEffect(()=>{onCloseRef.current=onClose},[onClose])
  useEffect(()=>{
    if (!active) return undefined
    const previous = document.activeElement
    const token = scrollToken.current
    lockBodyScroll(token)
    ref.current?.focus()
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); return }
      if (event.key !== 'Tab') return
      const focusable = [...(ref.current?.querySelectorAll('button:not(:disabled),a[href],textarea:not(:disabled),input:not(:disabled),[tabindex="0"]') || [])].filter(element=>element.getClientRects().length)
      if (!focusable.length) { event.preventDefault(); ref.current?.focus(); return }
      const first=focusable[0],last=focusable.at(-1)
      if (event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)) { event.preventDefault();last.focus() }
      else if (!event.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)) { event.preventDefault();first.focus() }
    }
    document.addEventListener('keydown',handleKey)
    return()=>{unlockBodyScroll(token);document.removeEventListener('keydown',handleKey);if(previous?.isConnected)previous.focus()}
  },[active])
  return ref
}
