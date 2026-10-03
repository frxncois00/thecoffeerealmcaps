// Web Audio API soft chime for staff order notifications
let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioCtx) {
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

const MUTE_STORAGE_KEY = 'tcr:staff-sound-muted'

export function isSoundMuted() {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setSoundMuted(muted) {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, String(Boolean(muted)))
    window.dispatchEvent(new CustomEvent('tcr:sound-mute-change', { detail: { muted: Boolean(muted) } }))
  } catch {
    // Ignore storage failure
  }
}

export function toggleSoundMuted() {
  const next = !isSoundMuted()
  setSoundMuted(next)
  return next
}

/**
 * Plays a short, soft, melodic two-tone chime (D5 -> A5)
 * Soft sine waves with gentle envelope to sound clean and professional.
 */
export function playOrderChime() {
  if (isSoundMuted()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.18, now)
    masterGain.connect(ctx.destination)

    // Note 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.7, now + 0.03)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.connect(gain1)
    gain1.connect(masterGain)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // Note 2: 880.00 Hz (A5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880.0, now + 0.12)
    gain2.gain.setValueAtTime(0, now + 0.12)
    gain2.gain.linearRampToValueAtTime(0.85, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
    osc2.connect(gain2)
    gain2.connect(masterGain)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.65)
  } catch (error) {
    console.debug('[Audio] Could not play notification chime:', error)
  }
}
