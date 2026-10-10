import { useSyncExternalStore } from 'react'
import { MOTION_ENABLED } from './config'

const getServerSnapshot = () => false

function useMedia(query) {
  return useSyncExternalStore(
    listener => {
      const media = window.matchMedia(query)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    },
    () => window.matchMedia(query).matches,
    getServerSnapshot,
  )
}

export function useRealmMotion() {
  const reduced = useMedia('(prefers-reduced-motion: reduce)')
  const compact = useMedia('(max-width: 760px)')
  const canHover = useMedia('(hover: hover) and (pointer: fine)')
  const enabled = MOTION_ENABLED && !reduced
  return { enabled, reduced, compact, canHover, ambient: enabled && !compact && canHover }
}
