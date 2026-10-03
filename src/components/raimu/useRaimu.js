import { useEffect, useSyncExternalStore } from 'react'
import { raimu, RAIMU_ANIMATION_KEY } from './raimuMachine'

export function readRaimuPreference(key, fallback, storage = 'localStorage') {
  try { return window[storage].getItem(key) ?? fallback } catch { return fallback }
}

export function saveRaimuPreference(key, value, storage = 'localStorage') {
  try { window[storage].setItem(key, String(value)) } catch { /* Session-only preference if storage is unavailable. */ }
}

export function setRaimuAnimated(animated) {
  saveRaimuPreference(RAIMU_ANIMATION_KEY, animated)
  raimu.setPreferences({ animated })
}

export function useRaimu({ enabled, sessionKey }) {
  const snapshot = useSyncExternalStore(raimu.subscribe, raimu.getSnapshot, raimu.getSnapshot)

  useEffect(() => {
    if (!enabled) return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreferences = () => raimu.setPreferences({
      animated: readRaimuPreference(RAIMU_ANIMATION_KEY, 'true') !== 'false',
      reducedMotion: query.matches || document.documentElement.dataset.staffMotion === 'reduce',
    })
    const visibility = () => raimu.setVisible(!document.hidden)
    const storage = (event) => { if (event.key === RAIMU_ANIMATION_KEY || event.key === null) updatePreferences() }
    let lastMove = 0
    const activity = (event) => {
      if (event.type === 'pointermove' && Date.now() - lastMove < 1_000) return
      lastMove = Date.now()
      raimu.wake()
    }
    const observer = new MutationObserver(updatePreferences)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-staff-motion'] })
    updatePreferences()
    visibility()
    const greetingKey = `raimu-greeted:${sessionKey}`
    raimu.start({ sessionKey, greet: readRaimuPreference(greetingKey, 'false', 'sessionStorage') !== 'true' })
    saveRaimuPreference(greetingKey, 'true', 'sessionStorage')
    query.addEventListener('change', updatePreferences)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('storage', storage)
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'focusin']
    activityEvents.forEach((type) => window.addEventListener(type, activity, { passive: true }))
    return () => {
      raimu.stop()
      observer.disconnect()
      query.removeEventListener('change', updatePreferences)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('storage', storage)
      activityEvents.forEach((type) => window.removeEventListener(type, activity))
    }
  }, [enabled, sessionKey])

  return { ...snapshot, motion: snapshot.animated && !snapshot.reducedMotion }
}
