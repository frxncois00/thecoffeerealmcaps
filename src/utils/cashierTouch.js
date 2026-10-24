// The cashier is a touch terminal. Restore normal browser behavior on exit.
export function installCashierTouchGuard(doc = document) {
  const scope = '.cashier-refined, .cashier-refined-modal'
  const withinCashier = (event) => Boolean(event.target?.closest?.(scope))
  const preventPinch = (event) => {
    if (withinCashier(event) && (event.touches?.length > 1 || event.type.startsWith('gesture'))) event.preventDefault()
  }
  const preventTrackpadPinch = (event) => {
    if (event.ctrlKey && withinCashier(event)) event.preventDefault()
  }
  const options = { passive: false }
  const events = ['touchstart', 'touchmove', 'gesturestart', 'gesturechange']
  events.forEach((name) => doc.addEventListener(name, preventPinch, options))
  doc.addEventListener('wheel', preventTrackpadPinch, options)
  return () => {
    events.forEach((name) => doc.removeEventListener(name, preventPinch, options))
    doc.removeEventListener('wheel', preventTrackpadPinch, options)
  }
}
