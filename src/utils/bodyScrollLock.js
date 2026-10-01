const activeLocks = new Set()
let previousOverflow = ''

export function lockBodyScroll(token) {
  if (typeof document === 'undefined' || activeLocks.has(token)) return
  if (activeLocks.size === 0) {
    const currentOverflow = document.body.style.overflow
    previousOverflow = currentOverflow === 'hidden' ? '' : currentOverflow
  }
  activeLocks.add(token)
  document.body.style.overflow = 'hidden'
}

export function unlockBodyScroll(token) {
  if (typeof document === 'undefined' || !activeLocks.delete(token)) return
  if (activeLocks.size > 0) return
  document.body.style.overflow = previousOverflow
  previousOverflow = ''
}

export function restoreBodyScrollIfIdle() {
  if (typeof document === 'undefined' || activeLocks.size > 0) return
  document.body.style.removeProperty('overflow')
  previousOverflow = ''
}
