# Raimu Companion - complete source

Complete file contents, already applied in this checkout. See [integration, settings and assumptions](raimu-companion.md). No dependencies were added.

Each heading is the path to paste the complete following code block into. Existing dashboard files include their unchanged content so each block is a complete file.

## src/components/raimu/RaimuMascot.jsx

```jsx
import { useId } from 'react'

// Redrawn from public/assets/raimu/raimu.png. Named, nested SVG groups keep
// breathing, expression, gaze, blinking and gestures on independent transforms.
export default function RaimuMascot({ state = 'idle', blink = false, earTwitch = false, className = '' }) {
  const id = useId().replaceAll(':', '')
  return <svg className={`rc-cat ${className}`} viewBox="0 0 180 190" aria-hidden="true" focusable="false" data-pose={state} data-blink={blink} data-ear-twitch={earTwitch}>
    <defs>
      <linearGradient id={`${id}-fur`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="var(--rc-fur-light)" /><stop offset="1" stopColor="var(--rc-fur)" /></linearGradient>
      <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--rc-cap-light)" /><stop offset="1" stopColor="var(--rc-cap)" /></linearGradient>
      <linearGradient id={`${id}-eye`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#394533" /><stop offset="1" stopColor="#a3ad64" /></linearGradient>
    </defs>
    <ellipse className="rc-cat-shadow" cx="91" cy="178" rx="51" ry="6" fill="var(--rc-ground)" />
    <g className="rc-cat-pose">
      <g className="rc-cat-breathe">
        <g className="rc-cat-tail" fill="none" strokeLinecap="round">
          <path d="M119 163C156 171 166 147 151 132C145 126 149 116 156 117" stroke="var(--rc-outline)" strokeWidth="17" />
          <path d="M119 163C156 171 166 147 151 132C145 126 149 116 156 117" stroke="var(--rc-fur)" strokeWidth="13" />
          <path d="m148 151 10 3m-11-24 9-7" stroke="var(--rc-stripe)" strokeWidth="6" />
        </g>
        <path d="M64 119C51 135 49 158 59 171C72 180 112 180 123 170C130 157 127 134 115 120Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2" />
        <path d="M75 125C65 138 66 159 73 170H109C117 154 113 136 104 125Z" fill="var(--rc-cream)" />
        <path d="m58 145 10 4m-11 7 9 3m52-14-8 4m12 7-10 3" fill="none" stroke="var(--rc-stripe)" strokeWidth="4" strokeLinecap="round" />
        <g className="rc-cat-head">
          <g className="rc-cat-ear rc-cat-ear-left">
            <path d="M40 78C26 63 23 31 32 18C42 15 65 41 69 54Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M39 65C32 47 32 31 35 28C44 31 54 44 58 54Z" fill="var(--rc-pink)" />
            <path d="m36 51 9 2-5-8 12 8-3 9-8-3Z" fill="var(--rc-cream)" />
          </g>
          <g className="rc-cat-ear rc-cat-ear-right">
            <path d="M115 56C125 38 148 25 154 29C161 43 153 76 140 85Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M126 57C136 43 146 38 149 39C151 49 147 64 140 70Z" fill="var(--rc-pink)" />
            <path d="m143 58-10 3 6-9-13 7 3 11 10-4Z" fill="var(--rc-cream)" />
          </g>
          <path d="M45 58C65 42 109 43 131 62C143 72 144 84 151 92L145 94L154 104L146 105L153 114L142 115C137 140 53 146 36 121L26 120L33 112L25 108L33 100L28 95C38 84 32 70 45 58Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M88 84C82 99 79 103 68 105C50 101 39 111 45 122C57 140 126 143 137 122C141 109 125 106 112 108C97 105 95 96 88 84Z" fill="var(--rc-cream)" />
          <g fill="var(--rc-stripe)">
            <path d="M76 57L83 82L87 60ZM92 58L95 86L103 61ZM110 64L109 83L120 67Z" />
            <path d="m36 88 17 8-19-2Zm-3 12 18 5-17 2Zm112-8-16 8 17-2Zm3 13-19 4 16 3Z" />
          </g>
          <g className="rc-cat-brows" fill="var(--rc-stripe)"><path d="M48 84Q55 76 63 83Q54 80 48 84Z" /><path d="M112 84Q122 78 129 87Q119 83 112 84Z" /></g>
          <g className="rc-cat-eyes">
            <g className="rc-cat-eye rc-cat-eye-left">
              <ellipse cx="61" cy="98" rx="15" ry="17" fill="var(--rc-cream)" stroke="var(--rc-outline)" strokeWidth="2" />
              <g className="rc-cat-gaze"><ellipse cx="63" cy="99" rx="11" ry="14" fill={`url(#${id}-eye)`} /><ellipse cx="64" cy="97" rx="6" ry="10" fill="#24291f" /><circle cx="68" cy="91" r="4" fill="#fffdf7" /><circle cx="58" cy="105" r="1.6" fill="#fffdf7" /></g>
            </g>
            <g className="rc-cat-eye rc-cat-eye-right">
              <ellipse cx="119" cy="100" rx="15" ry="17" fill="var(--rc-cream)" stroke="var(--rc-outline)" strokeWidth="2" />
              <g className="rc-cat-gaze"><ellipse cx="117" cy="101" rx="11" ry="14" fill={`url(#${id}-eye)`} /><ellipse cx="117" cy="99" rx="6" ry="10" fill="#24291f" /><circle cx="122" cy="94" r="4" fill="#fffdf7" /><circle cx="111" cy="107" r="1.6" fill="#fffdf7" /></g>
            </g>
          </g>
          <g fill="var(--rc-pink)" opacity=".45"><ellipse cx="48" cy="115" rx="9" ry="4" /><ellipse cx="132" cy="117" rx="9" ry="4" /></g>
          <path d="M83 111Q90 107 97 112Q95 117 90 118Q85 116 83 111Z" fill="var(--rc-nose)" stroke="var(--rc-stripe)" strokeWidth="1.2" />
          <g className="rc-cat-mouth">
            <path className="rc-cat-mouth-open" d="M83 122Q91 127 99 122Q98 133 91 133Q85 133 83 122Z" fill="var(--rc-outline)" />
            <path className="rc-cat-mouth-open" d="M87 129Q92 125 96 130Q91 136 87 129Z" fill="var(--rc-pink)" />
            <path d="M90 118V121Q84 129 78 120M90 121Q98 129 103 121" fill="none" stroke="var(--rc-outline)" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <g fill="none" stroke="var(--rc-cream)" strokeWidth="1.1" strokeLinecap="round" opacity=".95"><path d="M49 116 21 110M49 121 18 120M51 125 24 131M128 119l28-6m-28 11 31 0m-33 5 27 7" /></g>
          <g className="rc-cat-cap">
            <path d="M91 37Q91 30 99 32Q106 33 103 39" fill="var(--rc-cap-light)" stroke="var(--rc-outline)" strokeWidth="2" />
            <path d="M43 62C54 39 76 33 99 36C127 38 140 55 140 76C118 78 83 54 43 66Z" fill={`url(#${id}-cap)`} stroke="var(--rc-outline)" strokeWidth="2" />
            <path d="M75 40Q58 48 57 61M119 43Q132 56 133 72" fill="none" stroke="#b4be90" opacity=".5" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M42 61C66 49 91 54 112 65L133 77C118 83 98 64 78 64C59 62 45 75 36 74C29 75 31 68 42 61Z" fill={`url(#${id}-cap)`} stroke="var(--rc-outline)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M39 67C64 53 87 60 109 70" fill="none" stroke="#b4be90" opacity=".4" strokeWidth="1" />
            <g transform="rotate(27 103 50)"><ellipse cx="103" cy="50" rx="8" ry="11" fill="var(--rc-cream)" /><path d="M106 40C96 47 109 50 100 60" fill="none" stroke="var(--rc-cap)" strokeWidth="2.4" strokeLinecap="round" /></g>
          </g>
        </g>
        <g className="rc-cat-paw rc-cat-paw-left"><path d="M65 141C52 140 50 154 55 169C58 176 73 175 75 170L72 150Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2" /><path d="M59 166v5m6-5v6" stroke="var(--rc-stripe)" strokeWidth="1.5" strokeLinecap="round" /></g>
        <g className="rc-cat-paw rc-cat-paw-right"><path d="M108 141C121 138 128 155 122 169C119 176 104 175 102 170L103 152Z" fill={`url(#${id}-fur)`} stroke="var(--rc-outline)" strokeWidth="2" /><path d="M111 167v5m6-6v6" stroke="var(--rc-stripe)" strokeWidth="1.5" strokeLinecap="round" /></g>
      </g>
    </g>
    <g className="rc-cat-sparkles" fill="var(--rc-sparkle)"><path d="m25 65 2-7 2 7 7 2-7 2-2 7-2-7-7-2Z" /><path d="m153 84 2-6 2 6 6 2-6 2-2 6-2-6-6-2Z" /><path d="m137 20 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" /></g>
    <g className="rc-cat-sleep" fill="var(--rc-primary)" fontFamily="inherit" fontWeight="600"><text x="143" y="69" fontSize="12">z</text><text x="155" y="51" fontSize="15">z</text><text x="161" y="30" fontSize="18">z</text></g>
  </svg>
}
```

## src/components/raimu/raimuMachine.js

```js
export const RAIMU_TIMINGS = Object.freeze({
  idleDelay: 60_000,
  blinkMin: 3_000,
  blinkMax: 6_000,
  blinkDuration: 150,
  earMin: 6_000,
  earMax: 10_000,
  earDuration: 420,
  bubble: 4_500,
  greeting: 2_400,
  attention: 600,
  listening: 1_800,
  talking: 1_800,
  success: 1_400,
  error: 2_600,
  empty: 2_600,
})

export const RAIMU_STATES = Object.freeze([
  'idle', 'attention', 'greeting', 'listening', 'thinking', 'talking',
  'success', 'error', 'empty', 'sleepy',
])
export const RAIMU_ANIMATION_KEY = 'raimu-animated'
const BUSY = new Set(['listening', 'thinking', 'talking'])

// The clock is injectable so lifecycle, queueing and interruption can be tested
// without a browser. Every timer retains its remaining time while suspended.
export function createRaimuMachine({
  now = () => Date.now(),
  schedule = (fn, delay) => setTimeout(fn, delay),
  cancel = (id) => clearTimeout(id),
  random = Math.random,
  timings = RAIMU_TIMINGS,
} = {}) {
  let snapshot = Object.freeze({ state: 'idle', bubble: null, animated: true, reducedMotion: false, visible: true, active: false, blink: false, earTwitch: false, pulse: 0, revision: 0 })
  let session = null
  let sequence = 0
  let queuedReaction = null
  let context = { storeOpen: undefined, goalDay: null }
  const listeners = new Set()
  const timers = new Map()
  const bubbles = []
  const publish = (patch) => {
    snapshot = Object.freeze({ ...snapshot, ...patch })
    listeners.forEach((listener) => listener())
  }
  const running = () => snapshot.active && snapshot.visible
  const moving = () => running() && snapshot.animated && !snapshot.reducedMotion
  const clear = (key) => {
    const timer = timers.get(key)
    if (timer) cancel(timer.id)
    timers.delete(key)
  }
  const arm = (key, timer) => {
    timer.started = now()
    timer.id = schedule(() => {
      timers.delete(key)
      timer.callback()
    }, timer.remaining)
  }
  const after = (key, delay, callback) => {
    clear(key)
    const timer = { callback, remaining: Math.max(0, delay), started: 0, id: null }
    timers.set(key, timer)
    if (running()) arm(key, timer)
  }
  const pauseTimers = () => timers.forEach((timer) => {
    if (timer.id !== null) {
      cancel(timer.id)
      timer.remaining = Math.max(0, timer.remaining - (now() - timer.started))
      timer.id = null
    }
  })
  const resumeTimers = () => timers.forEach((timer, key) => {
    if (timer.id === null) arm(key, timer)
  })
  const randomDelay = (min, max) => min + random() * (max - min)
  const ambient = () => {
    if (!moving()) return
    if (!timers.has('blink')) after('blink', randomDelay(timings.blinkMin, timings.blinkMax), () => {
      if (snapshot.state !== 'sleepy') publish({ blink: true })
      after('blink-end', timings.blinkDuration, () => publish({ blink: false }))
      ambient()
    })
    if (!timers.has('ear')) after('ear', randomDelay(timings.earMin, timings.earMax), () => {
      if (['idle', 'attention'].includes(snapshot.state)) publish({ earTwitch: true })
      after('ear-end', timings.earDuration, () => publish({ earTwitch: false }))
      ambient()
    })
  }
  const idleTimer = () => after('idle', timings.idleDelay, () => {
    if (!BUSY.has(snapshot.state)) setState('sleepy')
  })
  const nextBubble = () => {
    const bubble = bubbles.shift() || null
    publish({ bubble })
    if (bubble) after('bubble', bubble.duration, nextBubble)
    else clear('bubble')
  }
  const say = (message, { duration = timings.bubble, id } = {}) => {
    const text = String(message || '').trim().slice(0, 240)
    if (!text || (id && (snapshot.bubble?.key === id || bubbles.some((item) => item.key === id)))) return
    const bubble = { id: ++sequence, key: id, text, duration: Math.max(1_000, Number(duration) || timings.bubble) }
    if (bubbles.length >= 4) bubbles.shift()
    bubbles.push(bubble)
    if (!snapshot.bubble) nextBubble()
  }
  const clearBubbles = () => {
    bubbles.length = 0
    clear('bubble')
    publish({ bubble: null })
  }
  function settle() {
    if (queuedReaction) {
      const reaction = queuedReaction
      queuedReaction = null
      setState('idle')
      reactTo(reaction)
    } else setState('idle')
  }
  function setState(state, { duration = timings[state] || 0, onComplete } = {}) {
    if (!RAIMU_STATES.includes(state)) return false
    // Ambient attention never interrupts a request, reply, or error explanation.
    if (state === 'attention' && !['idle', 'sleepy', 'attention'].includes(snapshot.state)) return false
    clear('state')
    clear('idle')
    publish({ state, blink: false, earTwitch: false, revision: snapshot.revision + 1 })
    if (state === 'error' || state === 'empty') {
      say(state === 'error' ? 'Hmm… let’s try that again.' : 'Hmm… no results just yet.', { id: 'hmm' })
    }
    if (state === 'idle') {
      if (queuedReaction) settle()
      else idleTimer()
    } else if (duration > 0) {
      after('state', duration, () => {
        if (onComplete) onComplete()
        else settle()
      })
    }
    return true
  }
  function reactTo(event) {
    if (!snapshot.active) return false
    if (event === 'notification') {
      publish({ pulse: snapshot.pulse + 1 })
      return true
    }
    if (!['store-open', 'sales-goal', 'success'].includes(event)) return false
    if (BUSY.has(snapshot.state) || snapshot.state === 'greeting') {
      queuedReaction = event
      return true
    }
    setState('success')
    if (event !== 'success') say(event === 'store-open' ? 'Doors open. Let’s make it a good day!' : 'Today’s sales goal, reached. Nicely done!', { id: event })
    return true
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener) },
    setState, say, reactTo, clearBubbles,
    updateContext({ storeOpen, sales, goal, day } = {}) {
      if (typeof storeOpen === 'boolean') {
        const justOpened = context.storeOpen === false && storeOpen
        context.storeOpen = storeOpen
        if (justOpened) reactTo('store-open')
      }
      // The host supplies its business-day key and configured target. There is
      // no invented sales target, and a reached goal celebrates once per day.
      if (day && Number.isFinite(sales) && Number.isFinite(goal) && goal > 0 && sales >= goal && context.goalDay !== day) {
        context.goalDay = day
        reactTo('sales-goal')
      }
    },
    dismissBubble: nextBubble,
    wake() {
      if (!running()) return
      if (snapshot.state === 'sleepy') setState('idle')
      if (snapshot.state === 'idle' || snapshot.state === 'attention') idleTimer()
    },
    setPreferences({ animated = snapshot.animated, reducedMotion = snapshot.reducedMotion } = {}) {
      publish({ animated, reducedMotion })
      if (!moving()) {
        ;['blink', 'blink-end', 'ear', 'ear-end'].forEach(clear)
        publish({ blink: false, earTwitch: false })
      } else ambient()
    },
    setVisible(visible) {
      if (snapshot.visible === visible) return
      if (!visible) pauseTimers()
      publish({ visible })
      if (running()) { resumeTimers(); ambient() }
    },
    start({ sessionKey = 'default', greet = true } = {}) {
      const newSession = session !== sessionKey
      if (newSession) {
        Array.from(timers.keys()).forEach(clear)
        bubbles.length = 0
        queuedReaction = null
        context = { storeOpen: undefined, goalDay: null }
        session = sessionKey
        publish({ state: 'idle', bubble: null, blink: false, earTwitch: false })
      }
      publish({ active: true })
      if (running()) resumeTimers()
      ambient()
      if (newSession && greet) {
        setState('greeting')
        say('Hi! Need a hand with sales or orders?', { id: 'greeting', duration: 5_500 })
      } else if (snapshot.state === 'idle') idleTimer()
    },
    stop() {
      pauseTimers()
      publish({ active: false })
    },
    destroy() {
      Array.from(timers.keys()).forEach(clear)
      listeners.clear()
    },
  }
}

// Existing chat and dashboard code can import this without a React provider.
export const raimu = createRaimuMachine()
```

## src/components/raimu/useRaimu.js

```js
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
```

## src/components/raimu/useRaimuPosition.js

```js
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
```

## src/components/raimu/raimu-companion.css

```css
/* Workspace colors are inherited from management-theme.css, including dark mode.
   Only the character's fur/cap colors belong to this illustration. */
.raimu-companion {
  --rc-primary: var(--mgmt-primary);
  --rc-strong: var(--mgmt-primary-strong);
  --rc-surface: var(--mgmt-surface);
  --rc-text: var(--mgmt-text);
  --rc-muted: var(--mgmt-muted);
  --rc-mint: var(--mgmt-success-soft);
  --rc-border: var(--mgmt-border);
  --rc-fur: #d99051;
  --rc-fur-light: #f2bd82;
  --rc-stripe: #97603b;
  --rc-outline: #583c2b;
  --rc-cream: #fff1d9;
  --rc-pink: #efa28b;
  --rc-nose: #d98069;
  --rc-cap: #283e2d;
  --rc-cap-light: #60754b;
  --rc-sparkle: var(--gold, #c8a86b);
  --rc-ground: color-mix(in srgb, var(--rc-primary) 17%, transparent);
  --rc-sine: cubic-bezier(.37, 0, .63, 1);
  --rc-spring: cubic-bezier(.2, .85, .3, 1.16);
  --rc-breathe: 4.8s;
  --rc-tail: 5.4s;
  --rc-reaction: 420ms;
  position: fixed;
  inset: 0;
  z-index: 1200;
  pointer-events: none;
  font-family: inherit;
  font-size: 14px;
}
.raimu-companion.raimu-companion { background: transparent; }
.raimu-companion *, .raimu-companion *::before, .raimu-companion *::after { box-sizing: border-box; }
.raimu-companion button, .raimu-companion a, .raimu-companion input { -webkit-tap-highlight-color: transparent; transition: transform 200ms ease, opacity 200ms ease; }
.raimu-companion button { font: inherit; cursor: pointer; }
.raimu-companion button:disabled { cursor: not-allowed; opacity: .45; }
.raimu-companion :is(button, a, input, [tabindex]):focus-visible { outline: 3px solid var(--rc-primary); outline-offset: 4px; }
.rc-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }

.rc-dock { position: fixed; right: max(24px, env(safe-area-inset-right)); bottom: max(20px, env(safe-area-inset-bottom)); width: 132px; height: 148px; pointer-events: none; }
.rc-launcher { position: absolute; inset: 0; display: block; width: 100%; height: 100%; padding: 0; border: 0; border-radius: 42%; background: transparent; pointer-events: auto; touch-action: none; cursor: grab !important; }
.rc-launcher:active { cursor: grabbing !important; }
.rc-launcher:focus-visible { outline-offset: 0 !important; }
.rc-cat { position: relative; display: block; width: 100%; height: 100%; overflow: visible; }
.rc-aura, .rc-notification-pulse { position: absolute; inset: 29% 5% 1%; border: 1px solid var(--rc-primary); border-radius: 50%; pointer-events: none; }
.rc-aura { background: radial-gradient(ellipse, color-mix(in srgb, var(--rc-primary) 12%, transparent), transparent 70%); box-shadow: 0 0 22px color-mix(in srgb, var(--rc-primary) 15%, transparent); opacity: .32; transition: opacity 300ms ease; }
.rc-notification-pulse { opacity: 0; }
.rc-notification-pulse[data-active="true"] { animation: rc-notification 600ms ease-out both; }
[data-state="attention"] .rc-aura, [data-state="listening"] .rc-aura { opacity: .65; }
[data-state="thinking"] .rc-aura { animation: rc-glow 3s var(--rc-sine) infinite; }
.rc-presence { position: absolute; right: 16%; bottom: 8%; width: 9px; height: 9px; border: 2px solid var(--rc-surface); border-radius: 50%; background: var(--mgmt-success); }
[data-state="sleepy"] .rc-presence { opacity: .4; }
.rc-hide { position: absolute; z-index: 2; top: -8px; right: -9px; width: 44px; height: 44px; display: grid; place-items: center; padding: 0; background: transparent; border: 0; color: var(--rc-muted); border-radius: 50%; pointer-events: auto; opacity: .7; }
.rc-hide::before { content: ''; position: absolute; width: 25px; height: 25px; z-index: -1; background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 50%; }
.rc-hide:hover, .rc-hide:focus-visible { opacity: 1; }

/* Independent nesting prevents the head pose, blink and pupil transforms from
   fighting each other. All keyframes in this file use transform/opacity only. */
.rc-cat-pose, .rc-cat-breathe { transform-origin: 50% 91%; transition: transform var(--rc-reaction) var(--rc-spring); }
.rc-cat-breathe { animation: rc-breathe var(--rc-breathe) var(--rc-sine) infinite; }
.rc-cat-tail { transform-origin: 120px 161px; animation: rc-tail var(--rc-tail) var(--rc-sine) infinite; }
.rc-cat-head { transform-origin: 90px 125px; transition: transform var(--rc-reaction) var(--rc-spring); }
.rc-cat-ear-left { transform-origin: 54px 65px; }
.rc-cat-ear-right { transform-origin: 128px 65px; }
.rc-cat-ear { transition: transform 350ms var(--rc-spring); }
.rc-cat[data-ear-twitch="true"] .rc-cat-ear-left { animation: rc-ear 420ms ease-in-out; }
.rc-cat-eye { transform-box: fill-box; transform-origin: center; transition: transform 130ms ease-out; }
.rc-cat-gaze { transform: translate(var(--rc-look-x, 0px), var(--rc-look-y, 0px)); transition: transform 130ms ease-out; }
.rc-cat[data-blink="true"] .rc-cat-eye { transform: scaleY(.07); }
.rc-cat-mouth { transform-origin: 91px 121px; }
.rc-cat-mouth-open { transform-origin: 91px 122px; opacity: 0; transform: scaleY(.25); }
.rc-cat-paw-left { transform-origin: 67px 145px; }
.rc-cat-paw-right { transform-origin: 111px 145px; }
.rc-cat-paw { transition: transform 300ms var(--rc-spring); }
.rc-cat-sparkles, .rc-cat-sleep { opacity: 0; pointer-events: none; }
.rc-cat-sparkles { transform-origin: 90px 93px; }
.rc-cat[data-pose="attention"] .rc-cat-head { transform: rotate(-4deg); }
.rc-cat[data-pose="attention"] .rc-cat-pose { animation: rc-bounce 480ms var(--rc-spring); }
.rc-cat[data-pose="greeting"] .rc-cat-paw-right { animation: rc-wave 600ms ease-in-out 3; }
.rc-cat[data-pose="greeting"] .rc-cat-head { animation: rc-nod 600ms ease-in-out 2; }
.rc-cat[data-pose="listening"] .rc-cat-ear-left { transform: rotate(-8deg); }
.rc-cat[data-pose="listening"] .rc-cat-ear-right { transform: rotate(8deg); }
.rc-cat[data-pose="listening"] .rc-cat-eye { transform: scale(1.045); }
.rc-cat[data-pose="listening"][data-blink="true"] .rc-cat-eye { transform: scaleY(.07); }
.rc-cat[data-pose="thinking"] .rc-cat-head { transform: rotate(7deg); }
.rc-cat[data-pose="thinking"] .rc-cat-paw-right { animation: rc-tap 2.4s var(--rc-sine) infinite; }
.rc-cat[data-pose="talking"] .rc-cat-mouth { animation: rc-talk 400ms var(--rc-sine) infinite; }
.rc-cat[data-pose="talking"] .rc-cat-mouth-open, .rc-cat[data-pose="success"] .rc-cat-mouth-open, .rc-cat[data-pose="greeting"] .rc-cat-mouth-open { opacity: 1; transform: scaleY(1); }
.rc-cat[data-pose="success"] .rc-cat-pose { animation: rc-bounce 500ms var(--rc-spring); }
.rc-cat[data-pose="success"] .rc-cat-tail { animation: rc-flick 500ms ease-in-out 2; }
.rc-cat[data-pose="success"] .rc-cat-sparkles { animation: rc-sparkle 600ms ease-out 2; }
.rc-cat:is([data-pose="error"], [data-pose="empty"]) .rc-cat-head { transform: rotate(-10deg); }
.rc-cat:is([data-pose="error"], [data-pose="empty"]) .rc-cat-ear-right { transform: rotate(13deg); }
.rc-cat[data-pose="sleepy"] .rc-cat-pose { transform: translateY(15px) scaleY(.85); }
.rc-cat[data-pose="sleepy"] .rc-cat-head { transform: translateY(5px) rotate(-9deg); }
.rc-cat[data-pose="sleepy"] .rc-cat-eye { transform: scaleY(.36); }
.rc-cat[data-pose="sleepy"] .rc-cat-tail { transform: rotate(19deg); animation: none; }
.rc-cat[data-pose="sleepy"] .rc-cat-sleep { opacity: .7; }
.rc-cat-sleep text { animation: rc-sleep 4s var(--rc-sine) infinite; }
.rc-cat-sleep text:nth-child(2) { animation-delay: .7s; }
.rc-cat-sleep text:nth-child(3) { animation-delay: 1.4s; }

.rc-speech { position: absolute; display: flex; align-items: center; min-height: 60px; padding: 13px 8px 13px 17px; gap: 4px; color: var(--rc-text); border: 1px solid var(--rc-border); border-radius: 17px 17px 5px 17px; background: var(--rc-surface); box-shadow: var(--mgmt-shadow); pointer-events: auto; font-size: 13px; line-height: 1.5; animation: rc-bubble-in 320ms var(--rc-spring) both; }
.rc-speech > span { flex: 1; }
.rc-speech button { flex: 0 0 44px; width: 44px; height: 44px; padding: 0; display: grid; place-items: center; border: 0; border-radius: 50%; color: var(--rc-muted); background: transparent; }
.rc-speech button:hover { background: var(--mgmt-hover); }

.rc-panel { position: fixed; display: flex; flex-direction: column; max-height: calc(100dvh - 24px); border: 1px solid color-mix(in srgb, var(--rc-border) 85%, transparent); border-radius: 22px; overflow: hidden; background: color-mix(in srgb, var(--rc-surface) 94%, transparent); box-shadow: var(--mgmt-shadow-high), 0 0 0 1px color-mix(in srgb, var(--rc-primary) 5%, transparent); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); color: var(--rc-text); pointer-events: auto; touch-action: auto; }
.rc-panel.is-open { animation: rc-panel-in 360ms var(--rc-spring) both; }
.rc-panel.is-closing { animation: rc-panel-out 200ms ease-in both; pointer-events: none; }
.rc-header { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding: 17px 12px 17px 18px; background: linear-gradient(130deg, var(--rc-strong), var(--rc-primary)); color: var(--mgmt-on-primary); }
.rc-header-mark { width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid currentColor; border-radius: 13px; opacity: .85; }
.rc-heading { min-width: 0; flex: 1; }
.rc-heading h2 { margin: 0; color: inherit; font-size: 16px; font-weight: 700; letter-spacing: -.025em; }
.rc-heading p { margin: 4px 0 0; font-size: 11px; opacity: .9; }
.rc-controls { display: flex; gap: 2px; }
.rc-controls button { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; color: inherit; background: transparent; border: 0; border-radius: 12px; }
.rc-controls button:hover { background: color-mix(in srgb, var(--mgmt-on-primary) 12%, transparent); }
.rc-header button:focus-visible { outline-color: var(--mgmt-on-primary); outline-offset: -3px; }
.rc-status { display: flex; align-items: center; gap: 7px; padding: 11px 19px; font-size: 11px; color: var(--rc-muted); border-bottom: 1px solid var(--rc-border); flex-shrink: 0; }
.rc-status > span { width: 5px; height: 5px; border-radius: 50%; background: var(--rc-primary); }
.rc-log { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 20px 18px; scrollbar-width: thin; scrollbar-color: var(--mgmt-border-strong) transparent; scroll-behavior: auto; }
.rc-log:focus-visible { outline-offset: -4px !important; }
.rc-empty { min-height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; }
.rc-empty-icon { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid var(--rc-border); background: var(--rc-mint); border-radius: 14px; color: var(--rc-primary); margin-bottom: 12px; flex-shrink: 0; }
.rc-empty h3 { margin: 0; font-size: 17px; line-height: 1.25; font-weight: 650; letter-spacing: -.025em; color: var(--mgmt-heading); }
.rc-empty p { margin: 8px 0 18px; font-size: 12px; line-height: 1.6; color: var(--rc-muted); }
.rc-prompts { display: grid; width: 100%; gap: 8px; }
.rc-prompts button { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 11px 13px; min-height: 44px; background: var(--rc-surface); color: var(--rc-text); border: 1px solid var(--rc-border); border-radius: 11px; font-size: 12px; text-align: left; }
.rc-prompts button:hover { background: var(--rc-mint); transform: translateY(-1px); }
.rc-prompts svg { color: var(--rc-primary); flex-shrink: 0; }
.rc-message { max-width: 92%; width: fit-content; margin: 0 0 18px; animation: rc-message-in 280ms ease-out both; animation-delay: var(--rc-message-delay, 0ms); }
.rc-message.is-user { margin-left: auto; }
.rc-message-author { display: block; margin-bottom: 5px; color: var(--rc-muted); font-size: 10px; font-weight: 600; }
.rc-message.is-user .rc-message-author { text-align: right; }
.rc-message p { margin: 0; padding: 12px 14px; border-radius: 4px 15px 15px; background: var(--rc-mint); color: var(--rc-text); font-size: 13px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
.rc-message.is-user p { background: var(--rc-strong); color: var(--mgmt-on-primary); border-radius: 15px 4px 15px 15px; }
.rc-message p a { display: inline-flex; align-items: center; min-height: 44px; color: var(--rc-primary); text-decoration: underline; text-underline-offset: 3px; font-weight: 600; }
.rc-report-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.rc-report-actions button { display: flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 12px; border: 1px solid var(--rc-border); border-radius: 9px; background: var(--rc-surface); color: var(--rc-primary); font-size: 12px; }
.rc-report-actions button:hover { background: var(--rc-mint); }
.rc-typing { display: flex; align-items: center; gap: 9px; width: fit-content; padding: 9px 12px; border-radius: 4px 13px 13px; background: var(--rc-mint); color: var(--rc-muted); font-size: 11px; }
.rc-dots { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 22px; color: var(--rc-primary); }
.rc-dots i { display: block; width: 5px; height: 5px; background: currentColor; border-radius: 50%; animation: rc-dot 1.5s var(--rc-sine) infinite; }
.rc-dots i:nth-child(2) { animation-delay: 160ms; }
.rc-dots i:nth-child(3) { animation-delay: 320ms; }
.rc-latest { align-self: center; display: flex; align-items: center; gap: 5px; min-height: 44px; border: 1px solid var(--rc-border); border-radius: 12px; padding: 0 14px; background: var(--rc-mint); color: var(--rc-primary); font-size: 12px !important; }
.rc-inline-bubble { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 16px 8px; padding-left: 12px; border: 1px solid var(--rc-border); border-radius: 12px; background: var(--rc-mint); color: var(--rc-text); font-size: 12px; }
.rc-inline-bubble button { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; border: 0; border-radius: 10px; background: transparent; color: var(--rc-muted); }
.rc-composer { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin: 0 16px 0; padding: 6px; background: var(--mgmt-input); border: 1px solid var(--rc-border); border-radius: 16px; }
.rc-composer:focus-within { border-color: var(--rc-primary); }
.rc-composer input { flex: 1; min-width: 0; height: 44px; border: 0; padding: 0 8px; background: transparent; color: var(--rc-text); font: inherit; font-size: 16px; }
.rc-composer input::placeholder { color: var(--rc-muted); font-size: 13px; }
.rc-composer input:focus-visible { outline-offset: -2px !important; border-radius: 9px; }
.rc-send { display: grid; place-items: center; width: 44px; height: 44px; border: 0; border-radius: 12px; color: var(--mgmt-on-primary); background: linear-gradient(145deg, var(--rc-primary), var(--rc-strong)); flex-shrink: 0; }
.rc-send:hover:not(:disabled) { transform: translateY(-1px); }
.rc-settings { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; flex-shrink: 0; gap: 0 8px; padding: 4px 16px 7px; color: var(--rc-muted); }
.rc-animation-setting { display: flex; position: relative; align-items: center; gap: 8px; min-height: 44px; cursor: pointer; font-size: 11px; }
.rc-animation-setting input { position: absolute; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
.rc-switch { width: 28px; height: 16px; padding: 2px; border-radius: 10px; background: var(--mgmt-border-strong); }
.rc-switch i { display: grid; place-items: center; width: 12px; height: 12px; border-radius: 50%; background: var(--rc-surface); color: var(--rc-primary); transition: transform 200ms ease; }
.rc-animation-setting input:checked + .rc-switch { background: var(--rc-primary); }
.rc-animation-setting input:checked + .rc-switch i { transform: translateX(12px); }
.rc-animation-setting input:focus-visible + .rc-switch { outline: 3px solid var(--rc-primary); outline-offset: 4px; }
.rc-settings > button { display: grid; place-items: center; width: 44px; height: 44px; border: 0; border-radius: 12px; padding: 0; color: var(--rc-muted); background: transparent; }
.rc-settings > button:hover { background: var(--mgmt-hover); }
.rc-settings small { width: 100%; margin: -2px 0 7px; font-size: 11px; }

@keyframes rc-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
@keyframes rc-tail { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(7deg); } }
@keyframes rc-ear { 0%, 100% { transform: rotate(0); } 40% { transform: rotate(-9deg); } 70% { transform: rotate(3deg); } }
@keyframes rc-bounce { 0%, 100% { transform: translateY(0); } 45% { transform: translateY(-4px); } }
@keyframes rc-wave { 0%, 100% { transform: rotate(0); } 30% { transform: translate(4px, -11px) rotate(-24deg); } 65% { transform: translate(4px, -11px) rotate(-10deg); } }
@keyframes rc-nod { 0%, 100% { transform: rotate(0); } 50% { transform: translateY(2px) rotate(-4deg); } }
@keyframes rc-tap { 0%, 25%, 45%, 100% { transform: translateY(0); } 15%, 35% { transform: translateY(-3px); } }
@keyframes rc-talk { 0%, 100% { transform: scaleY(.88); } 50% { transform: scaleY(1.06); } }
@keyframes rc-flick { 0%, 100% { transform: rotate(0); } 35% { transform: rotate(-15deg); } 70% { transform: rotate(11deg); } }
@keyframes rc-sparkle { 0% { opacity: 0; transform: scale(.8); } 40% { opacity: .85; } 100% { opacity: 0; transform: scale(1.1) translateY(-4px); } }
@keyframes rc-sleep { 0% { opacity: 0; transform: translateY(6px); } 35%, 65% { opacity: .65; } 100% { opacity: 0; transform: translateY(-10px); } }
@keyframes rc-glow { 0%, 100% { opacity: .4; transform: scale(.98); } 50% { opacity: .85; transform: scale(1.025); } }
@keyframes rc-notification { 0% { opacity: .7; transform: scale(.97); } 100% { opacity: 0; transform: scale(1.16); } }
@keyframes rc-bubble-in { from { opacity: 0; transform: translateY(5px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes rc-panel-in { from { opacity: 0; transform: translateY(12px) scale(.94); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes rc-panel-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: translateY(6px) scale(.96); } }
@keyframes rc-message-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rc-dot { 0%, 70%, 100% { opacity: .25; } 35% { opacity: .9; } }
@keyframes rc-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes rc-fade-out { from { opacity: 1; } to { opacity: 0; } }

@media (max-width: 560px) {
  .rc-dock { right: max(14px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom)); width: 100px; height: 112px; }
  .rc-header { gap: 8px; padding: 12px 8px 12px 14px; }
  .rc-header-mark { display: none; }
  .rc-heading h2 { font-size: 15px; }
  .rc-heading p { font-size: 10px; }
  .rc-log { padding: 17px 14px; }
  .rc-message p { font-size: 14px; }
}
@media (max-height: 500px) {
  .rc-header { padding-top: 6px; padding-bottom: 6px; }
  .rc-status { display: none; }
  .rc-empty { padding: 0; }
  .rc-empty-icon { display: none; }
  .rc-empty p { margin: 5px 0 8px; }
}

/* Minimal mode retains state-specific static poses and short opacity fades. */
.raimu-companion[data-motion="minimal"] *, .raimu-companion[data-motion="minimal"] *::before { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
.raimu-companion[data-motion="minimal"] .rc-cat-gaze { transform: none; }
.raimu-companion[data-motion="minimal"] .rc-cat[data-pose="thinking"] .rc-cat-paw-right { transform: translateY(-2px); }
.raimu-companion[data-motion="minimal"] .rc-cat[data-pose="greeting"] .rc-cat-paw-right { transform: rotate(-15deg); }
.raimu-companion[data-motion="minimal"] .rc-panel.is-open, .raimu-companion[data-motion="minimal"] .rc-speech { animation: rc-fade-in 120ms ease-out both !important; }
.raimu-companion[data-motion="minimal"] .rc-panel.is-closing { animation: rc-fade-out 100ms ease-in both !important; }
@media (prefers-reduced-motion: reduce) {
  .raimu-companion *, .raimu-companion *::before { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  .raimu-companion .rc-panel.is-open, .raimu-companion .rc-speech { animation: rc-fade-in 120ms ease-out both !important; }
  .raimu-companion .rc-panel.is-closing { animation: rc-fade-out 100ms ease-in both !important; }
}
.raimu-companion[data-paused="true"] *, .raimu-companion[data-paused="true"] *::before, .raimu-companion[data-paused="true"] *::after { animation-play-state: paused !important; transition: none !important; }
```

## src/components/RaimuWidget.jsx

```jsx
import { ArrowDown, ArrowUp, Check, Coffee, Minus, RotateCcw, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { normalizeRole } from '../lib/auth'
import { supabase } from '../lib/supabase'
import RaimuMascot from './raimu/RaimuMascot'
import { raimu } from './raimu/raimuMachine'
import { readRaimuPreference, saveRaimuPreference, setRaimuAnimated, useRaimu } from './raimu/useRaimu'
import { useRaimuPosition } from './raimu/useRaimuPosition'
import './raimu/raimu-companion.css'

function renderMessageText(text) {
  const parts = String(text || '').split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, index) => /^https?:\/\//i.test(part)
    ? <a href={part} target="_blank" rel="noreferrer" key={`link-${index}`}>Download report</a>
    : <span key={`text-${index}`}>{part}</span>)
}

function saveReportBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

async function downloadReport(url, format) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('The report could not be downloaded. Please try again.')
  const csv = await response.text()
  const rows = csv.trim().split(/\r?\n/).map((line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((cell) => cell.replace(/^"|"$/g, '').replaceAll('""', '"')))
  const filename = `the-coffee-realm-report-${new Date().toISOString().slice(0, 10)}`
  if (format === 'csv') { saveReportBlob(new Blob([csv], { type: 'text/csv' }), `${filename}.csv`); return }
  if (format === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Report', { views: [{ showGridLines: false }] })
    sheet.addRows(rows); sheet.mergeCells(1, 1, 1, rows[0].length); sheet.getCell(1, 1).value = 'THE COFFEE REALM REPORT'; sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FFFFFF' } }; sheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0C4B32' } }
    sheet.getRow(2).eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '176A48' } } }); sheet.columns = rows[0].map(() => ({ width: 22 }))
    const buffer = await workbook.xlsx.writeBuffer(); saveReportBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${filename}.xlsx`); return
  }
  const { jsPDF } = await import('jspdf'); const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' }); pdf.setFillColor(12, 75, 50); pdf.rect(0, 0, 842, 48, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFontSize(16); pdf.text('THE COFFEE REALM REPORT', 32, 30); pdf.setTextColor(35, 65, 50); pdf.setFontSize(8); let y = 78; rows.forEach((row, index) => { if (y > 560) { pdf.addPage(); y = 50 } if (index === 0) pdf.setFont('helvetica', 'bold'); else pdf.setFont('helvetica', 'normal'); pdf.text(row.map((cell) => String(cell).slice(0, 28)).join('   |   '), 32, y); y += 18 }); pdf.save(`${filename}.pdf`)
}

export default function RaimuWidget() {
  const { user, profile, loading } = useAuth()
  const role = normalizeRole(profile?.role)
  const [closed, setClosed] = useState(() => readRaimuPreference('raimu-visible', 'true') === 'false')
  const allowed = Boolean(user) && ['admin', 'staff', 'cashier'].includes(role)

  useEffect(() => {
    const syncVisibility = (event) => setClosed(event.detail?.visible === false)
    window.addEventListener('raimu-visibility-change', syncVisibility)
    return () => window.removeEventListener('raimu-visibility-change', syncVisibility)
  }, [])

  const hideRaimu = () => {
    saveRaimuPreference('raimu-visible', false)
    setClosed(true)
    window.dispatchEvent(new CustomEvent('raimu-visibility-change', { detail: { visible: false } }))
    document.querySelector('.raimu-toggle')?.focus()
  }
  if (loading || !allowed) return null
  const sessionKey = `${user.id}:${user.last_sign_in_at || 'session'}`
  return <RaimuConversation key={sessionKey} role={role} sessionKey={sessionKey} enabled={!closed} onHide={hideRaimu} />
}

async function requestSupportReply(text, role) {
  return supabase.functions.invoke('support-chat', { body: { message: text, role } })
}

const stateLabels = {
  idle: 'Here when you need me', attention: 'You have my attention', greeting: 'A little help, on hand',
  listening: 'All ears', thinking: 'Thinking it through', talking: 'Here’s what I found',
  success: 'All taken care of', error: 'Let’s try that again', empty: 'No results just yet', sleepy: 'Resting, but still here',
}

// The injected request function is also used by the isolated local preview.
// Production always mounts this through the role-gated RaimuWidget above.
export function RaimuConversation({ role, sessionKey, enabled = true, onHide, requestReply = requestSupportReply }) {
  const { resolvedTheme } = useTheme()
  const companion = useRaimu({ enabled, sessionKey })
  const [open, setOpen] = useState(false)
  const [present, setPresent] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const avatarRef = useRef(null)
  const inputRef = useRef(null)
  const logRef = useRef(null)
  const nearBottom = useRef(true)
  const requestId = useRef(0)
  const inFlight = useRef(false)
  const exportInFlight = useRef(false)
  const gaze = useRef({ rect: null, frame: 0 })
  const { dockRef, panelRef, panelStyle, bubbleStyle, moved, resetPosition, cancelDrag, dragHandlers } = useRaimuPosition({ open, enabled, onDrag: () => setOpen(false) })

  const closePanel = (clear = false) => {
    setOpen(false)
    if (clear) {
      requestId.current += 1 // Ignore a late reply to a conversation the user cleared.
      inFlight.current = false
      setTyping(false)
      setMessages([])
      setDraft('')
      raimu.setState('idle')
      raimu.clearBubbles()
    } else if (companion.state === 'listening') raimu.setState('idle')
    avatarRef.current?.focus({ preventScroll: true })
  }
  const openPanel = () => {
    setPresent(true)
    setOpen(true)
    raimu.clearBubbles()
    raimu.wake()
  }
  const scrollToLatest = (smooth = true) => {
    const log = logRef.current
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: smooth && companion.motion && companion.visible ? 'smooth' : 'instant' })
    nearBottom.current = true
    setUnseen(false)
  }

  useEffect(() => () => { requestId.current += 1 }, [])

  useEffect(() => {
    if (!enabled) { setOpen(false); setPresent(false) }
  }, [enabled])

  useLayoutEffect(() => {
    if (!open) return
    // Opening does not depend on animation timing, including reduced motion.
    inputRef.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open || !companion.visible) return
    if (!messages.length && !typing) {
      logRef.current?.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (nearBottom.current || typing) {
      const log = logRef.current
      log?.scrollTo({ top: log.scrollHeight, behavior: companion.motion ? 'smooth' : 'instant' })
      setUnseen(false)
    } else setUnseen(true)
  }, [messages, typing, open, companion.motion, companion.visible])

  useEffect(() => {
    if (!open) return undefined
    const escape = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const active = document.activeElement
      if (!panelRef.current?.contains(active) && active !== avatarRef.current) return
      event.preventDefault()
      setOpen(false)
      if (raimu.getSnapshot().state === 'listening') raimu.setState('idle')
      avatarRef.current?.focus({ preventScroll: true })
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [open, panelRef])

  useEffect(() => {
    if (!enabled || !companion.motion || !companion.visible || companion.state !== 'attention') return undefined
    const currentGaze = gaze.current
    const avatar = avatarRef.current
    currentGaze.rect = avatar?.getBoundingClientRect()
    const follow = (event) => {
      const rect = currentGaze.rect
      if (!rect) return
      const x = Math.max(-3, Math.min(3, (event.clientX - rect.left - rect.width / 2) / 25))
      const y = Math.max(-2, Math.min(2, (event.clientY - rect.top - rect.height / 2) / 30))
      window.cancelAnimationFrame(currentGaze.frame)
      currentGaze.frame = window.requestAnimationFrame(() => {
        avatar?.style.setProperty('--rc-look-x', `${x}px`)
        avatar?.style.setProperty('--rc-look-y', `${y}px`)
      })
    }
    window.addEventListener('pointermove', follow, { passive: true })
    return () => {
      window.removeEventListener('pointermove', follow)
      window.cancelAnimationFrame(currentGaze.frame)
      avatar?.style.setProperty('--rc-look-x', '0px')
      avatar?.style.setProperty('--rc-look-y', '0px')
    }
  }, [enabled, companion.motion, companion.visible, companion.state])

  const send = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || inFlight.current || exportInFlight.current) return
    inFlight.current = true
    const currentRequest = ++requestId.current
    nearBottom.current = true
    setMessages((current) => [...current, { from: 'user', text }])
    setDraft('')
    setTyping(true)
    inputRef.current?.focus({ preventScroll: true })
    raimu.clearBubbles()
    raimu.setState('thinking')
    try {
      const { data, error } = await requestReply(text, role)
      if (currentRequest !== requestId.current) return
      let reply = data?.text || data?.error
      if (error) {
        reply = error.message || 'I could not reach the Support service.'
        if (error.context) {
          try {
            const details = await error.context.clone().json()
            reply = details?.error || reply
          } catch { /* Keep the SDK message when the response is not JSON. */ }
        }
      }
      if (currentRequest !== requestId.current) return
      setMessages((current) => [...current, { from: 'raimu', text: reply || 'I could not generate a response.', reportUrl: data?.download_url || '' }])
      if (error || data?.error) raimu.setState('error')
      else if (!data?.text) raimu.setState('empty')
      else raimu.setState('talking', { onComplete: () => {
        if (data?.download_url) {
          raimu.setState('success')
          raimu.say('Your report is ready.', { duration: 3_000 })
        } else raimu.setState('idle')
      } })
    } catch (error) {
      if (currentRequest !== requestId.current) return
      setMessages((current) => [...current, { from: 'raimu', text: error?.message || 'I could not reach the Support service.' }])
      raimu.setState('error')
    } finally {
      if (currentRequest === requestId.current) {
        inFlight.current = false
        setTyping(false)
      }
    }
  }

  const exportReport = async (url, format) => {
    if (exportInFlight.current || inFlight.current) return
    exportInFlight.current = true
    const conversationId = requestId.current
    setExporting(true)
    raimu.setState('thinking')
    try {
      await downloadReport(url, format)
      if (conversationId !== requestId.current) return
      raimu.setState('success')
      raimu.say('Your download is ready.', { duration: 3_000 })
    } catch (error) {
      if (conversationId !== requestId.current) return
      setMessages((current) => [...current, { from: 'raimu', text: error.message || 'The report could not be downloaded.' }])
      raimu.setState('error')
    } finally { exportInFlight.current = false; setExporting(false) }
  }

  if (!enabled) return null
  return <div className="raimu-companion" data-theme={resolvedTheme} data-state={companion.state} data-motion={companion.motion ? 'full' : 'minimal'} data-paused={!companion.visible}>
    <div className="rc-dock" ref={dockRef}>
      {!open && (companion.bubble || companion.state === 'thinking') && <div className="rc-speech" key={companion.state === 'thinking' ? 'thinking' : companion.bubble.id} style={bubbleStyle}>
        {companion.state === 'thinking' ? <><span className="rc-sr-only">Raimu is thinking</span><ThinkingDots /></> : <><span>{companion.bubble.text}</span><button type="button" aria-label="Dismiss Raimu’s message" onClick={raimu.dismissBubble}><X size={14} /></button></>}
      </div>}
      <button className="rc-hide" type="button" onClick={onHide} aria-label="Hide Raimu" title="Hide Raimu"><X size={14} /></button>
      <button className="rc-launcher" ref={avatarRef} type="button" aria-label={open ? 'Minimize Raimu conversation' : 'Open Raimu conversation'} aria-expanded={open} aria-controls={present ? 'raimu-conversation' : undefined} aria-describedby="raimu-move-hint" {...dragHandlers}
        onPointerEnter={() => raimu.setState('attention', { duration: 0 })}
        onPointerLeave={() => { if (raimu.getSnapshot().state === 'attention') raimu.setState('idle') }}
        onFocus={() => raimu.setState('attention', { duration: 0 })}
        onBlur={() => { if (raimu.getSnapshot().state === 'attention') raimu.setState('idle') }}
        onClick={(event) => { cancelDrag(); if (event.detail === 0 || !moved.current) { if (open) closePanel(); else openPanel() } }}>
        <span className="rc-aura" aria-hidden="true" />
        <span className="rc-notification-pulse" key={companion.pulse} data-active={companion.pulse > 0} aria-hidden="true" />
        <RaimuMascot state={companion.state} blink={companion.blink} earTwitch={companion.earTwitch} />
        <span className="rc-presence" aria-hidden="true" />
      </button>
      <span id="raimu-move-hint" className="rc-sr-only">Drag to move, or use Alt and arrow keys while focused. Enter opens the conversation.</span>
    </div>

    {present && <section id="raimu-conversation" ref={panelRef} className={`rc-panel ${open ? 'is-open' : 'is-closing'}`} style={panelStyle} role="dialog" aria-modal="false" aria-labelledby="raimu-title" inert={!open} aria-hidden={!open} onAnimationEnd={(event) => { if (!open && event.target === event.currentTarget) setPresent(false) }}>
      <header className="rc-header">
        <div className="rc-header-mark" aria-hidden="true"><Coffee size={20} /></div>
        <div className="rc-heading"><h2 id="raimu-title">Raimu Support</h2><p>Internal workspace assistant</p></div>
        <div className="rc-controls"><button type="button" onClick={() => closePanel()} aria-label="Minimize Raimu conversation" title="Minimize"><Minus size={18} /></button><button type="button" onClick={() => closePanel(true)} aria-label="Close and clear Raimu conversation" title="Close and clear"><X size={18} /></button></div>
      </header>
      <div className="rc-status"><span aria-hidden="true" />{stateLabels[companion.state]}</div>
      <div className="rc-log" ref={logRef} role="log" aria-label="Conversation with Raimu" tabIndex={0} aria-live="polite" aria-relevant="additions text" onScroll={() => {
        const log = logRef.current
        nearBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < 60
        if (nearBottom.current) setUnseen(false)
      }}>
        {messages.length ? messages.map((message, index) => <article className={`rc-message is-${message.from}`} key={`${message.from}-${index}`} style={{ '--rc-message-delay': `${Math.min(index, 3) * 45}ms` }}>
          <span className="rc-message-author">{message.from === 'user' ? 'You' : 'Raimu'}</span>
          <p>{renderMessageText(message.text)}</p>
          {message.reportUrl && <div className="rc-report-actions" aria-label="Download report">{[['csv', 'CSV'], ['xlsx', 'Excel'], ['pdf', 'PDF']].map(([format, label]) => <button key={format} type="button" disabled={exporting || typing} onClick={() => exportReport(message.reportUrl, format)}>{label}<ArrowDown size={12} /></button>)}</div>}
        </article>) : <div className="rc-empty">
          <span className="rc-empty-icon"><Coffee size={24} strokeWidth={1.5} /></span>
          <h3>A little clarity for your day.</h3><p>Sales, orders, inventory, or a fresh report.<br />Let’s work through it together.</p>
          <div className="rc-prompts">{['How are sales today?', 'Which orders need attention?'].map((prompt) => <button type="button" key={prompt} onClick={() => { setDraft(prompt); raimu.setState('listening'); inputRef.current?.focus() }}>{prompt}<ArrowUp size={14} /></button>)}</div>
        </div>}
        {typing && <div className="rc-typing"><ThinkingDots /><span>Raimu is thinking…</span></div>}
      </div>
      {unseen && <button className="rc-latest" type="button" onClick={() => scrollToLatest()}><ArrowDown size={14} />Latest message</button>}
      {companion.bubble && ['success', 'error', 'empty'].includes(companion.state) && <div className="rc-inline-bubble"><span>{companion.bubble.text}</span><button type="button" aria-label="Dismiss Raimu’s message" onClick={raimu.dismissBubble}><X size={13} /></button></div>}
      <form className="rc-composer" onSubmit={send}>
        <label className="rc-sr-only" htmlFor="raimu-widget-input">Message Raimu</label>
        <input id="raimu-widget-input" ref={inputRef} value={draft} onChange={(event) => { setDraft(event.target.value); if (!inFlight.current && !exportInFlight.current) raimu.setState(event.target.value.trim() ? 'listening' : 'idle') }} onFocus={() => { if (draft.trim() && !inFlight.current && !exportInFlight.current) raimu.setState('listening') }} onBlur={() => { if (raimu.getSnapshot().state === 'listening') raimu.setState('idle') }} placeholder="Ask Raimu anything…" maxLength={500} autoComplete="off" />
        <button className="rc-send" type="submit" aria-label="Send message" disabled={!draft.trim() || typing || exporting}><ArrowUp size={19} /></button>
      </form>
      <footer className="rc-settings">
        <label className="rc-animation-setting"><input type="checkbox" role="switch" checked={companion.animated} onChange={(event) => setRaimuAnimated(event.target.checked)} aria-describedby={companion.reducedMotion ? 'raimu-motion-note' : undefined} /><span className="rc-switch" aria-hidden="true"><i>{companion.animated && <Check size={9} />}</i></span><span>Animated Raimu</span></label>
        <button type="button" onClick={resetPosition} aria-label="Reset Raimu’s position" title="Reset position"><RotateCcw size={14} /></button>
        {companion.reducedMotion && <small id="raimu-motion-note">Reduced motion is on.</small>}
      </footer>
    </section>}
    <span className="rc-sr-only" role="status" aria-live="polite" aria-atomic="true">{companion.bubble?.text || ''}</span>
    <span className="rc-sr-only" aria-live="polite" aria-atomic="true">{!open && messages.at(-1)?.from === 'raimu' ? `Raimu: ${messages.at(-1).text}` : ''}</span>
  </div>
}

function ThinkingDots() {
  return <span className="rc-dots" aria-hidden="true"><i /><i /><i /></span>
}
```

## src/components/AppShell.jsx

```jsx
import { BarChart3, Bell, Bot, Boxes, CalendarDays, CheckCheck, ClipboardCheck, ClipboardList, Coffee, FileBarChart, LayoutDashboard, LogOut, MenuSquare, Moon, ReceiptText, RefreshCw, Settings, ShieldCheck, Sun, Trash2, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { signOutPortal } from '../lib/auth'
import LogoutConfirmModal from './auth/LogoutConfirmModal'
import { useLogoutTransition } from '../context/LogoutTransitionContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { fetchOpsOrdersByIds } from '../services/opsOrderService'
import { fetchFinishedProducts, fetchIngredients } from '../services/opsInventoryService'
import { money } from '../utils/money'
import { DEFAULT_STAFF_PREFERENCES, fetchStaffPreferences, getCachedStaffPreferences, rememberStaffFilters, subscribeToStaffPreferences } from '../services/staffSettingsService'
import {
  addStaffNotification, clearStaffNotifications, getStaffNotifications, markAllStaffNotificationsRead,
  markStaffNotificationRead, subscribeToStaffNotifications,
} from '../services/notificationCenterService'
import { clearManagementSessionState, requestManagementDataRefresh, useManagementSessionState, writeManagementSessionState } from '../hooks/useManagementSessionState'
import StaffOrderToastContainer from './notifications/StaffOrderToastContainer'
import { playOrderChime } from '../utils/notificationSound'
import { raimu } from './raimu/raimuMachine'
import { readRaimuPreference, saveRaimuPreference } from './raimu/useRaimu'


const adminGroups = [
  { label: 'Main', links: [['Dashboard','/admin',LayoutDashboard]] },
  { label: 'Operations', links: [['Inventory Monitoring','/admin/inventory',Boxes],['Purchase Orders','/admin/purchase-orders',ClipboardCheck],['Menu Approvals','/admin/menu-approvals',ClipboardCheck],['Benefits Verification','/admin/benefits-verification',ShieldCheck],['Transaction History','/admin/transactions',ReceiptText]] },
  { label: 'Reports', links: [['Sales Reports','/admin/reports',FileBarChart],['Inventory Report','/admin/inventory-report',ClipboardList],['Cancellation & Refunds','/admin/cancellations',ShieldCheck]] },
  { label: '', links: [['Analytics','/admin/analytics',BarChart3]] },
  { label: 'Administration', links: [['Content Management','/admin/content',MenuSquare],['Users & Access','/admin/users-access',Users],['System Settings','/admin/settings',Settings]] },
  { label: '', links: [['Settings','/admin/preferences',Settings]] },
]
const staffGroups = [{ label:'', links:[['Order Preparation','/staff',ClipboardList],['Inventory Management','/staff/inventory',Boxes],['Purchase Orders','/staff/purchase-orders',ClipboardCheck],['Manage Menu','/staff/menu',Coffee],['Transactions','/staff/transactions',ReceiptText],['Settings','/staff/settings',Settings]] }]

function notificationTime(value) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (elapsed < 60000) return 'Just now'
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function submittedTime(value) {
  return value ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'just now'
}

async function submitterName(id) {
  if (!id) return 'a staff member'
  const { data } = await supabase.from('profiles').select('full_name,username').eq('id', id).maybeSingle()
  return data?.full_name || data?.username || 'a staff member'
}

export default function AppShell({ role, title, eyebrow, children, actions, titleActions, onRefresh, onNotifications, notificationCount = 0 }) {
  const groups = role === 'admin' ? adminGroups : staffGroups
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { setTransition: setLogoutTransition } = useLogoutTransition()
  const [logoutError, setLogoutError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [notificationsOpen, setNotificationsOpen] = useManagementSessionState(`${role}:shell:notifications-open`, false)
  const [refreshing, setRefreshing] = useState(false)
  const [raimuVisible, setRaimuVisible] = useState(() => readRaimuPreference('raimu-visible', 'true') !== 'false')
  const [notifications, setNotifications] = useState([])
  const [staffPreferences, setStaffPreferences] = useState(getCachedStaffPreferences)
  const notificationAnchorRef = useRef(null)
  const { preference, resolvedTheme, setPreference } = useTheme()
  const { profile, user } = useAuth()
  const accountRoleLabel = role === 'admin' ? 'Administrator' : 'Operation Staff'
  const accountDisplayName = profile?.full_name || profile?.username || profile?.email || user?.email || accountRoleLabel
  const accountInitials = accountDisplayName
    .replace(/@.*$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ST'
  const visibleNotifications = notifications.filter((item) => role === 'admin' ? item.category !== 'orders' : item.category !== 'approvals')
  const unreadNotificationCount = visibleNotifications.filter((item) => !item.read).length
  const visibleNotificationCount = Math.max(notificationCount, unreadNotificationCount)
  const [orderToasts, setOrderToasts] = useState([])
  const [bellAnimated, setBellAnimated] = useState(false)
  const seenOrderIdsRef = useRef(new Set())
  const prevNotificationCountRef = useRef(visibleNotificationCount)

  const triggerBellRing = () => {
    setBellAnimated(true)
    setTimeout(() => setBellAnimated(false), 800)
  }

  useEffect(() => {
    if (visibleNotificationCount > prevNotificationCountRef.current) {
      triggerBellRing()
      raimu.reactTo('notification')
    }
    prevNotificationCountRef.current = visibleNotificationCount
  }, [visibleNotificationCount])

  useEffect(() => {
    const syncRaimu = (event) => setRaimuVisible(event.detail?.visible !== false)
    window.addEventListener('raimu-visibility-change', syncRaimu)
    return () => window.removeEventListener('raimu-visibility-change', syncRaimu)
  }, [])


  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const scrollKey = `tcr:management-scroll:${pathname}`
    const savedPosition = Number(window.sessionStorage.getItem(scrollKey) || 0)
    const restoreFrame = window.requestAnimationFrame(() => window.scrollTo({ top: savedPosition, behavior: 'auto' }))
    let saveFrame = 0
    const rememberPosition = () => {
      window.cancelAnimationFrame(saveFrame)
      saveFrame = window.requestAnimationFrame(() => window.sessionStorage.setItem(scrollKey, String(window.scrollY)))
    }
    window.addEventListener('scroll', rememberPosition, { passive: true })
    return () => {
      window.cancelAnimationFrame(restoreFrame)
      window.cancelAnimationFrame(saveFrame)
      window.removeEventListener('scroll', rememberPosition)
    }
  }, [pathname])

  useEffect(() => {
    if (!['staff', 'admin'].includes(role) || !user?.id) return undefined
    setNotifications(getStaffNotifications(user.id))
    const unsubscribeNotifications = subscribeToStaffNotifications(user.id, setNotifications)
    const unsubscribePreferences = subscribeToStaffPreferences(setStaffPreferences)
    fetchStaffPreferences(user.id).then(setStaffPreferences).catch(() => setStaffPreferences(DEFAULT_STAFF_PREFERENCES))
    return () => {
      unsubscribeNotifications()
      unsubscribePreferences()
    }
  }, [role, user?.id])

  useEffect(() => {
    if (!['staff', 'admin'].includes(role)) return undefined
    const root = document.documentElement
    root.dataset.staffFontSize = staffPreferences.font_size
    root.dataset.staffMotion = staffPreferences.reduced_motion
    return () => {
      delete root.dataset.staffFontSize
      delete root.dataset.staffMotion
    }
  }, [role, staffPreferences.font_size, staffPreferences.reduced_motion])

  useEffect(() => {
    if (!notificationsOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!notificationAnchorRef.current?.contains(event.target)) setNotificationsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [notificationsOpen, setNotificationsOpen])

  useEffect(() => {
    if (!['staff', 'admin'].includes(role) || !user?.id || !isSupabaseConfigured) return undefined
    const add = (notification) => {
      try { return addStaffNotification(user.id, notification) }
      catch (error) { console.error('[Notification Center] Could not save alert:', error); return null }
    }
    const channel = supabase.channel(`management-notification-center-${user.id}`)
    let active = true
    const stockByKey = new Map()
    let stockReady = false
    const pendingStockEvents = []

    const handleStock = async (payload, itemType) => {
      const stock = payload.new
      if (!stock || payload.eventType === 'DELETE') return
      const itemId = itemType === 'ingredient' ? stock.ingredient_id : stock.id
      if (!itemId) return
      const key = `${itemType}:${itemId}`
      const saved = stockByKey.get(key)
      const old = payload.old?.quantity == null ? saved : {
        ...saved, quantity: Number(payload.old.quantity), minimum: Number(payload.old.min_stock_level ?? saved?.minimum ?? 0),
      }
      const quantity = Number(stock.quantity)
      const minimum = Number(stock.min_stock_level)
      if (!Number.isFinite(quantity) || !Number.isFinite(minimum)) return
      let name = stock.name || saved?.name
      let unit = stock.unit || saved?.unit
      if (!name) {
        const table = itemType === 'ingredient' ? 'ingredients' : 'finished_products'
        const { data } = await supabase.from(table).select('name,unit,is_archived').eq('id', itemId).maybeSingle()
        if (!active || data?.is_archived) return
        name = data?.name || 'Inventory item'
        unit = data?.unit || 'units'
      }
      stockByKey.set(key, { quantity, minimum, name, unit })
      const wasLow = old && old.quantity <= old.minimum
      if (!staffPreferences.notify_low_stock || quantity > minimum || wasLow || (payload.eventType !== 'INSERT' && !old)) return
      add({
        category: 'inventory', title: quantity <= 0 ? 'Out of stock' : 'Low stock',
        message: `${name} running low — ${quantity} ${unit || 'units'} left`,
        target: { kind: 'inventory', itemType, itemId, name },
        eventKey: `stock:${key}:${payload.commit_timestamp || stock.updated_at || Date.now()}`,
        createdAt: payload.commit_timestamp,
      })
    }

    const receiveStock = (payload, itemType) => {
      if (!stockReady) pendingStockEvents.push([payload, itemType])
      else void handleStock(payload, itemType)
    }

    Promise.all([fetchIngredients(), fetchFinishedProducts()]).then(([ingredients, products]) => {
      if (!active) return
      ingredients.forEach((item) => stockByKey.set(`ingredient:${item.id}`, { quantity: item.quantity, minimum: item.minStockLevel, name: item.name, unit: item.unit }))
      products.forEach((item) => stockByKey.set(`finished_product:${item.id}`, { quantity: item.quantity, minimum: item.minStockLevel, name: item.name, unit: item.unit }))
      stockReady = true
      pendingStockEvents.splice(0).forEach(([payload, itemType]) => void handleStock(payload, itemType))
    }).catch((error) => {
      console.error('[Notification Center] Stock baseline failed:', error)
      stockReady = true
      pendingStockEvents.splice(0).forEach(([payload, itemType]) => void handleStock(payload, itemType))
    })

    // A single wildcard binding receives the same postgres_changes stream as
    // Order Preparation. Multiple table/event bindings on one channel were
    // reporting SUBSCRIBED but did not deliver any events in the live project.
    channel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (!active) return
      const { table, eventType, new: row, old, commit_timestamp: createdAt } = payload
      if (table === 'orders') {
        if (eventType === 'INSERT' && role === 'staff') {
          const orderId = row?.id
          if (orderId && !seenOrderIdsRef.current.has(orderId)) {
            seenOrderIdsRef.current.add(orderId)
            playOrderChime()
            triggerBellRing()
            const initialToast = {
              id: orderId,
              order: {
                id: orderId,
                order_number: row.order_number,
                customer_name: row.customer_name,
                order_type: row.order_type,
                total_items: row.total_items,
                final_total: row.final_total,
                created_at: row.created_at || createdAt,
              },
              createdAt: Date.now(),
            }
            setOrderToasts((current) => [initialToast, ...current.filter((t) => t.id !== orderId)].slice(0, 3))

            fetchOpsOrdersByIds([orderId]).then(([fullOrder]) => {
              if (fullOrder && active) {
                setOrderToasts((current) => current.map((t) => t.id === orderId ? { ...t, order: fullOrder } : t))
              }
            }).catch(() => {})
          }

          if (staffPreferences.notify_new_orders) {
            add({
              category: 'orders', title: 'New order',
              message: `New order ${row.order_number || ''} from ${row.customer_name || 'Customer'} · ${money(Number(row.final_total || 0))}`,
              target: { kind: 'order', id: row.id }, eventKey: `order:${row.id}`, createdAt,
            })
          }
        }
        if (eventType === 'UPDATE' && staffPreferences.notify_payment_proofs && row?.payment_proof_path && row.payment_proof_path !== old?.payment_proof_path) {
          add({ category: 'payments', title: 'Payment proof received', message: row.order_number ? `${row.order_number} needs payment verification.` : 'A payment proof needs verification.' })
        }
        if (eventType === 'UPDATE' && staffPreferences.notify_customer_cancellations) {
          const reviewRequested = row?.cancellation_status === 'requested' && old?.cancellation_status !== 'requested' && row.cancellation_requested_by_role === 'Customer'
          const cancelled = row?.status === 'Cancelled' && old?.status !== 'Cancelled' && row.cancelled_by_role === 'Customer'
          if (reviewRequested || cancelled) {
            const label = row.order_number || 'An order'
            const reason = row.cancellation_reason ? ` Reason: ${row.cancellation_reason}.` : ''
            add({ category: 'cancellations', title: reviewRequested ? 'Cancellation review requested' : 'Customer cancellation',
              message: reviewRequested ? `${label} is on hold while payment and refund requirements are reviewed.${reason}` : `${label} was cancelled by the customer. No verified payment was recorded.${reason}` })
          }
        }
      } else if (staffPreferences.notify_low_stock && table === 'inventory_stock') receiveStock(payload, 'ingredient')
      else if (staffPreferences.notify_low_stock && table === 'finished_products') receiveStock(payload, 'finished_product')
      else if (role === 'admin' && table === 'purchase_orders' && eventType !== 'DELETE' && row) {
        const status = row.status
        if (!['pending_approval', 'pending_receiving_review', 'payment_review'].includes(status)) return
        const when = status === 'pending_approval' ? row.submitted_at : status === 'pending_receiving_review' ? row.receiving_submitted_at : row.payment_submitted_at
        if (!when) return
        void submitterName(status === 'pending_approval' ? row.submitted_by : status === 'pending_receiving_review' ? row.receiving_submitted_by : row.payment_submitted_by).then((submitter) => {
          if (!active) return
          const label = status === 'pending_approval' ? 'Purchase Order' : status === 'pending_receiving_review' ? 'Inventory receiving' : 'Purchase Order payment'
          add({ category: 'approvals', title: `${label} approval needed`,
            message: `${label} ${row.po_number || ''} submitted by ${submitter} on ${submittedTime(when)}, needs approval`,
            target: { kind: 'purchase-order', id: row.id }, eventKey: `approval:po:${row.id}:${status}:${when}`, createdAt: createdAt || when })
        })
      } else if (role === 'admin' && table === 'menu_change_approvals' && eventType === 'INSERT' && row?.state === 'pending' && !['set_availability', 'bulk_availability'].includes(row.operation)) {
        void submitterName(row.submitted_by).then((submitter) => {
          if (!active) return
          add({ category: 'approvals', title: 'Menu approval needed',
            message: `${row.item_name || 'Menu edit'} (${row.action || 'change'}) submitted by ${submitter} on ${submittedTime(row.created_at)}, needs approval`,
            target: { kind: 'menu-approval', id: row.id }, eventKey: `approval:menu:${row.id}`, createdAt: createdAt || row.created_at })
        })
      } else if (table === 'menu_items' && staffPreferences.notify_menu_changes) {
        const name = row?.name || old?.name || 'A menu item'
        const action = eventType === 'INSERT' ? 'was added' : eventType === 'DELETE' ? 'was removed' : 'was updated'
        add({ category: 'menu', title: 'Menu changed', message: `${name} ${action}.` })
      }
    })

    channel.subscribe((status) => {
      if (!active) return
      if (status === 'SUBSCRIBED') console.info('[Notification Center] Realtime channel:', status)
      else console.warn('[Notification Center] Realtime channel:', status)
    })
    return () => { active = false; supabase.removeChannel(channel) }
  }, [role, staffPreferences.notify_customer_cancellations, staffPreferences.notify_low_stock, staffPreferences.notify_menu_changes, staffPreferences.notify_new_orders, staffPreferences.notify_payment_proofs, user?.id])

  useEffect(() => {
    const themeColor = document.querySelector('meta[name="theme-color"]')
    if (!themeColor) return undefined
    const previous = themeColor.getAttribute('content')
    themeColor.setAttribute('content', resolvedTheme === 'dark' ? '#080E0E' : '#ffffff')
    return () => themeColor.setAttribute('content', previous || '#1b2f22')
  }, [resolvedTheme])

  const refreshPage = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      if (onRefresh) await onRefresh()
      else requestManagementDataRefresh(pathname)
    } finally {
      window.setTimeout(() => setRefreshing(false), 350)
    }
  }

  const openNotifications = () => {
    if (onNotifications) onNotifications()
    else if (role === 'staff' || role === 'admin') setNotificationsOpen((current) => !current)
  }

  const readNotification = (notificationId) => markStaffNotificationRead(user?.id, notificationId)
  const openNotification = async (notification) => {
    readNotification(notification.id)
    const target = notification.target
    if (!target) return
    setNotificationsOpen(false)
    writeManagementSessionState(`${role}:shell:notifications-open`, false)
    if (target.kind === 'order' && role === 'staff') {
      try {
        const [order] = await fetchOpsOrdersByIds([target.id])
        if (order) writeManagementSessionState('staff:orders:drawer', order)
      } catch (error) { console.error('[Notification Center] Could not open order:', error) }
      navigate('/staff')
    } else if (target.kind === 'inventory') {
      if (role === 'admin') {
        writeManagementSessionState('admin:inventory:entity', target.itemType)
        writeManagementSessionState('admin:inventory:search', target.name)
        writeManagementSessionState('admin:inventory:category', 'all')
        writeManagementSessionState('admin:inventory:status', 'all')
        writeManagementSessionState('admin:inventory:type', 'all')
        writeManagementSessionState('admin:inventory:page', 1)
        navigate('/admin/inventory')
      } else {
        rememberStaffFilters('inventory', { activeEntity: target.itemType, search: target.name, categoryFilter: 'all', statusFilter: 'all', typeFilter: 'all', sortBy: 'name' })
        if (pathname === '/staff/inventory') window.location.reload()
        else navigate('/staff/inventory')
      }
    } else if (role === 'admin' && target.kind === 'purchase-order') navigate('/admin/purchase-orders')
    else if (role === 'admin' && target.kind === 'menu-approval') navigate('/admin/menu-approvals')
  }
  const readAllNotifications = () => markAllStaffNotificationsRead(user?.id)
  const clearNotifications = () => clearStaffNotifications(user?.id)
  const toggleRaimu = () => {
    const visible = !raimuVisible
    setRaimuVisible(visible)
    saveRaimuPreference('raimu-visible', visible)
    window.dispatchEvent(new CustomEvent('raimu-visibility-change', { detail: { visible } }))
  }

  async function confirmLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutOpen(false)
    setLogoutError('')

    const fullName = (profile?.full_name || user?.user_metadata?.full_name || '').trim()
    const firstName = fullName && fullName !== 'Coffee Realm Customer'
      ? fullName.split(/\s+/)[0]
      : (profile?.username || user?.email?.split('@')[0] || '')

    setLogoutTransition({
      active: true,
      statusText: 'Signing you out…',
      isExiting: false,
      isComplete: false,
    })

    const startTime = Date.now()
    try {
      await signOutPortal()
      clearManagementSessionState()
    } catch (error) {
      console.error('Portal logout failed:', error)
      setLogoutTransition(null)
      setLoggingOut(false)
      setLogoutError(error?.message || 'Unable to log out right now. Please try again.')
      return
    }

    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, 1500 - elapsed)
    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime))
    }

    setLogoutTransition((prev) => (prev ? {
      ...prev,
      statusText: firstName ? `See you next time, ${firstName}` : 'See you next time',
      isComplete: true,
    } : null))
    await new Promise((resolve) => setTimeout(resolve, 650))

    // Navigate to /portal while root overlay is 100% opaque!
    navigate('/portal', { replace: true })

    // Give React Router 60ms to mount PortalPage under the overlay
    await new Promise((resolve) => setTimeout(resolve, 60))

    setLogoutTransition((prev) => (prev ? { ...prev, isExiting: true } : null))
    await new Promise((resolve) => setTimeout(resolve, 320))

    setLogoutTransition(null)
    setLoggingOut(false)
  }

  const handleDismissOrderToast = (id) => {
    setOrderToasts((current) => current.filter((t) => t.id !== id))
  }

  const handleViewOrderToast = async (order) => {
    if (!order) return
    try {
      const fullOrder = order.order_items ? order : (await fetchOpsOrdersByIds([order.id]))[0] || order
      writeManagementSessionState('staff:orders:drawer', fullOrder)
    } catch {
      writeManagementSessionState('staff:orders:drawer', order)
    }
    if (pathname !== '/staff') {
      navigate('/staff')
    }
  }

  const themeOptions = [
    ['light', 'Light theme', Sun],
    ['dark', 'Dark theme', Moon],
  ]

  return <div className={`app-layout legacy-${role}`} data-theme={resolvedTheme} data-staff-density={staffPreferences.table_density} data-staff-contrast={String(staffPreferences.high_contrast)} data-staff-overdue={role === 'staff' ? String(staffPreferences.overdue_highlighting) : undefined}>
    <aside className="sidebar internal-sidebar">
      <div className="internal-brand"><img src="/images/coffeerealmlogo.png" alt="The Coffee Realm logo"/><div><h2>The Coffee Realm</h2>{role === 'admin' && <p>Admin Portal</p>}</div></div>
      <nav aria-label={`${role} navigation`}>{groups.map(group => <div className="internal-nav-group" key={group.label || group.links[0][1]}>{group.label && <span className="internal-group-label">{group.label}</span>}{group.links.map(([label,to,Icon]) => <NavLink key={to} to={to} end={to === `/${role}`} title={label}><Icon size={20}/><span>{label}</span></NavLink>)}</div>)}</nav>
      <div className="sidebar-footer-stack">
        <div className="sidebar-theme-switcher" role="group" aria-label="Theme options">
          {themeOptions.map(([value, label, Icon]) => <button key={value} type="button" className={resolvedTheme === value ? 'active' : ''} aria-label={label} aria-pressed={resolvedTheme === value} title={`${label}${preference ? '' : ' (system preference)'}`} onClick={() => setPreference(value)}><Icon size={18} aria-hidden="true"/></button>)}
        </div>
        <button type="button" className="sidebar-staff-profile" onClick={() => navigate(role === 'admin' ? '/admin/preferences' : '/staff/settings')} title={`Open profile for ${accountDisplayName}`} aria-label={`Open profile for ${accountDisplayName}, ${accountRoleLabel}`}>
          <span className="sidebar-staff-avatar" aria-hidden="true">{accountInitials}</span>
          <span className="sidebar-staff-profile-copy"><strong>{accountDisplayName}</strong><small>{accountRoleLabel}</small></span>
        </button>
        <button className="sidebar-exit" type="button" onClick={() => setLogoutOpen(true)}><LogOut size={19}/><span>Logout</span></button>
      </div>
    </aside>
    <main className="app-main internal-main"><header className={`page-header internal-page-header${eyebrow ? '' : ' is-compact'}${role === 'admin' ? ' is-admin-surface-header' : ''}`}><div><div className={`internal-title-row${titleActions ? ' has-title-actions' : ''}`}><h1>{title}</h1>{titleActions}</div>{eyebrow && <span>{eyebrow}</span>}</div><div className="header-actions"><div className="internal-utility-bar" aria-label="Workspace utilities"><div className="internal-live-datetime">{role === 'admin' && title === 'Dashboard' && <CalendarDays size={16} aria-hidden="true" />}<div className="internal-live-datetime-copy"><span>{new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(now)}</span><b>{new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(now)} PHT</b></div></div><button type="button" className={`internal-utility-button raimu-toggle${raimuVisible ? ' is-active' : ''}`} aria-label={raimuVisible ? 'Close Raimu support assistant' : 'Open Raimu support assistant'} aria-pressed={raimuVisible} title={raimuVisible ? 'Close Raimu support assistant' : 'Open Raimu support assistant'} onClick={toggleRaimu}><Bot size={18} aria-hidden="true" /></button><div className={`internal-notification-anchor ${bellAnimated ? 'is-ringing' : ''}`} ref={notificationAnchorRef}><button type="button" className="internal-utility-button" aria-label={`Open notifications${visibleNotificationCount ? `, ${visibleNotificationCount} unread` : ''}`} aria-expanded={['staff', 'admin'].includes(role) ? notificationsOpen : undefined} aria-controls={role === 'staff' ? 'staff-notification-center' : undefined} title="Notifications" onClick={openNotifications}><Bell size={18} />{visibleNotificationCount > 0 && <span className={`internal-utility-badge ${bellAnimated ? 'is-popping' : ''}`}>{visibleNotificationCount > 99 ? '99+' : visibleNotificationCount}</span>}</button>{['staff', 'admin'].includes(role) && notificationsOpen && <aside className="staff-notification-center" id="staff-notification-center" role="dialog" aria-modal="false" aria-labelledby="staff-notification-title"><header><div><span>Notification center</span><h2 id="staff-notification-title">Recent activity</h2></div><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={18} /></button></header><div className="staff-notification-actions"><button type="button" onClick={readAllNotifications} disabled={!unreadNotificationCount}><CheckCheck size={16} />Read all</button><button type="button" className="is-destructive" onClick={clearNotifications} disabled={!visibleNotifications.length}><Trash2 size={16} />Clear</button></div><div className="staff-notification-list">{visibleNotifications.length ? visibleNotifications.map((notification) => <button type="button" className={notification.read ? 'is-read' : 'is-unread'} data-category={notification.category} key={notification.id} onClick={() => void openNotification(notification)}><i aria-hidden="true" /><span><b>{notification.title}</b><small>{notification.message}</small><time dateTime={notification.createdAt}>{notificationTime(notification.createdAt)}</time></span></button>) : <div className="staff-notification-empty"><Bell size={22} /><b>{role === 'admin' && notificationCount > 0 ? `${notificationCount} items need attention` : 'You’re all caught up'}</b><span>{role === 'admin' && notificationCount > 0 ? 'Review the dashboard attention cards for details.' : 'Operational alerts will stack here as they arrive.'}</span></div>}</div><footer><button type="button" onClick={() => { setNotificationsOpen(false); navigate(role === 'admin' ? '/admin/preferences' : '/staff/settings') }}>Notification settings</button></footer></aside>}</div><button type="button" className="internal-utility-button" aria-label={refreshing ? 'Refreshing current page data' : 'Refresh current page data'} aria-busy={refreshing} title={refreshing ? 'Refreshing data…' : 'Refresh data'} onClick={refreshPage} disabled={refreshing}><RefreshCw size={18} className={refreshing ? 'spin' : ''} /></button></div>{actions}</div></header>{children}</main>
    {role === 'staff' && (
      <StaffOrderToastContainer
        toasts={orderToasts}
        onDismiss={handleDismissOrderToast}
        onViewOrder={handleViewOrderToast}
      />
    )}
    <LogoutConfirmModal open={logoutOpen} busy={loggingOut} onCancel={() => setLogoutOpen(false)} onConfirm={confirmLogout} />
    {logoutError && (
      <div className="customer-logout-error-banner" role="alert">
        <span>{logoutError}</span>
        <button type="button" onClick={() => setLogoutError('')} aria-label="Dismiss error">
          <X size={16} />
        </button>
      </div>
    )}

  </div>
}
```

## src/pages/AdminDashboard.jsx

```jsx
import {
  Activity, AlertTriangle, ArrowRight, Boxes, CheckCircle2, CircleDollarSign, Clock3,
  Coffee, PackageX, ReceiptText, RefreshCw,
  ShoppingBag, Store, TrendingDown, TrendingUp, Users, WalletCards,
} from 'lucide-react'
import { animate, motion, MotionConfig, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import AppShell from '../components/AppShell'
import ContentManagementPage from './ContentManagementPage'
import SystemSettingsPage from './SystemSettingsPage'
import UsersAccessPage from './UsersAccessPage'
import AdminInventoryPage from './AdminInventoryPage'
import InventoryReportPage from './InventoryReportPage'
import TransactionsPage from './TransactionsPage'
import SalesReportPage from './SalesReportPage'
import CancellationReportPage from './CancellationReportPage'
import PurchaseOrdersPage from './PurchaseOrdersPage'
import MenuApprovalsPage from './MenuApprovalsPage'
import BenefitsVerificationPage from './BenefitsVerificationPage'
import StaffSettingsPage from './StaffSettingsPage'
import { computeDashboardMetrics, fetchDashboardData } from '../services/adminDashboardService'
import { describeError } from '../utils/describeError'
import { money } from '../utils/money'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { raimu } from '../components/raimu/raimuMachine'

const adminPageTitles = {
  '/admin': 'Dashboard',
  '/admin/inventory': 'Inventory Monitoring',
  '/admin/purchase-orders': 'Purchase Orders',
  '/admin/menu-approvals': 'Menu Approvals',
  '/admin/benefits-verification': 'Benefits Verification',
  '/admin/transactions': 'Transaction History',
  '/admin/reports': 'Sales',
  '/admin/analytics': 'Analytics',
  '/admin/inventory-report': 'Inventory Report',
  '/admin/cancellations': 'Cancellation & Refunds',
  '/admin/products': 'Product Performance',
  '/admin/trends': 'Sales Trends',
  '/admin/content': 'Content Management',
  '/admin/users-access/users': 'Users & Access',
  '/admin/users-access/activity': 'Users & Access',
  '/admin/settings': 'System Settings',
  '/admin/preferences': 'Settings',
}

const paymentLabels = { gcash: 'GCash', bank_transfer: 'Bank transfer', cod: 'Cash / COD', cash: 'Cash', other: 'Other' }
const fulfillmentLabels = { delivery: 'Delivery', pickup: 'Pickup', 'walk-in': 'Walk-in' }
const defaultSalesRangeDays = 14
const cardPopDuration = 0.45
const numberCountDuration = 3
const kpiGraphDuration = 4
const salesGraphDuration = kpiGraphDuration
const statusChartDuration = 1.15
const fulfillmentMeta = [
  { key: 'delivery', label: 'Delivery' },
  { key: 'pickup', label: 'Pick Up' },
  { key: 'walk-in', label: 'Walk-In' },
]
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0,
      staggerChildren: 0.04,
    },
  },
}
const itemVariants = {
  hidden: { opacity: 1, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}
const cardItemVariants = {
  hidden: { opacity: 1, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: cardPopDuration, ease: [0.16, 1, 0.3, 1] },
  },
}
const statusCardVariants = {
  hidden: { opacity: 1, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: cardPopDuration, ease: [0.16, 1, 0.3, 1] },
  },
}
const microContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.045,
    },
  },
}
const microItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}
const simpleDashboardPanelVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      delayChildren: 0.1,
      staggerChildren: 0.055,
    },
  },
}
const transactionRowsVariants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.12, staggerChildren: 0.055 } },
}
const transactionRowVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28, ease: 'easeOut' } },
}
const sparkAreaVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: kpiGraphDuration * 0.8, delay: 0.15 } },
}
const sparkLineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: kpiGraphDuration, ease: [0.16, 1, 0.3, 1] } },
}
const sparkDotVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, delay: kpiGraphDuration - 0.35 } },
}
const statusSegmentVariants = {
  hidden: ({ offset, circumference }) => ({
    opacity: 0,
    strokeDasharray: `0 ${circumference}`,
    strokeDashoffset: -offset,
  }),
  visible: ({ offset, dash, circumference, index }) => ({
    opacity: 1,
    strokeDasharray: `${dash} ${Math.max(0, circumference - dash)}`,
    strokeDashoffset: -offset,
    transition: {
      opacity: { duration: 0.2, delay: index * 0.08 },
      strokeDasharray: { duration: statusChartDuration, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] },
    },
  }),
}
const MotionLink = motion(Link)

function formatCount(value) {
  return Math.round(value).toLocaleString('en-PH')
}

function formatPercentValue(value) {
  return `${Math.round(value)}%`
}
function percentage(value) {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.abs(value).toFixed(1)}%`
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(value))
}

function timeAgo(value) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (elapsed < 60000) return 'Just now'
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`
  return formatShortDate(value)
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function chartAxisCurrency(value) {
  if (value >= 1000) return `₱${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k`
  return `₱${Math.round(value).toLocaleString('en-PH')}`
}

function chartAxisStep(value) {
  if (value <= 4) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value / 4))
  const normalized = (value / 4) / magnitude
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return factor * magnitude
}

function chartEaseTimelinePosition(progress) {
  const easedProgress = Math.min(1, Math.max(0, progress))
  const parameter = 1 - Math.cbrt(1 - easedProgress)
  const inverse = 1 - parameter
  return 3 * inverse ** 2 * parameter * 0.16 + 3 * inverse * parameter ** 2 * 0.3 + parameter ** 3
}

function smoothSparklineGeometry(points, x, y) {
  if (points.length < 2) return { path: `M ${x(0)} ${y(points[0])}`, pointProgress: [0] }
  let path = `M ${x(0)} ${y(points[0])}`
  const cumulativeLengths = [0]
  let totalLength = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = Math.max(0, index - 1)
    const next = Math.min(points.length - 1, index + 2)
    const currentX = x(index)
    const nextX = x(index + 1)
    const controlOneX = currentX + (nextX - x(previous)) / 6
    const segmentTop = Math.min(y(points[index]), y(points[index + 1]))
    const segmentBottom = Math.max(y(points[index]), y(points[index + 1]))
    const rawControlOneY = y(points[index]) + (y(points[index + 1]) - y(points[previous])) / 6
    const controlOneY = Math.min(segmentBottom, Math.max(segmentTop, rawControlOneY))
    const controlTwoX = nextX - (x(next) - currentX) / 6
    const rawControlTwoY = y(points[index + 1]) - (y(points[next]) - y(points[index])) / 6
    const controlTwoY = Math.min(segmentBottom, Math.max(segmentTop, rawControlTwoY))
    path += ` C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${nextX} ${y(points[index + 1])}`
    let previousX = currentX
    let previousY = y(points[index])
    for (let sample = 1; sample <= 16; sample += 1) {
      const time = sample / 16
      const inverse = 1 - time
      const sampleX = inverse ** 3 * currentX + 3 * inverse ** 2 * time * controlOneX + 3 * inverse * time ** 2 * controlTwoX + time ** 3 * nextX
      const sampleY = inverse ** 3 * y(points[index]) + 3 * inverse ** 2 * time * controlOneY + 3 * inverse * time ** 2 * controlTwoY + time ** 3 * y(points[index + 1])
      totalLength += Math.hypot(sampleX - previousX, sampleY - previousY)
      previousX = sampleX
      previousY = sampleY
    }
    cumulativeLengths.push(totalLength)
  }
  return {
    path,
    pointProgress: cumulativeLengths.map((length) => totalLength ? length / totalLength : 0),
  }
}

function smoothSparklinePath(points, x, y) {
  return smoothSparklineGeometry(points, x, y).path
}

export default function AdminDashboard() {
  const { pathname } = useLocation()
  if (pathname === '/admin/team') return <Navigate to="/admin/users-access/users" replace />
  if (pathname === '/admin/logs') return <Navigate to="/admin/users-access/activity" replace />
  if (pathname === '/admin/users-access') return <Navigate to="/admin/users-access/users" replace />
  if (pathname === '/admin/users-access/approvals') return <Navigate to="/admin/users-access/users" replace />
  if (pathname === '/admin/users-access/benefits') return <Navigate to="/admin/benefits-verification" replace />
  if (pathname.startsWith('/admin/users-access/')) return <UsersAccessPage />
  if (pathname === '/admin/content') return <ContentManagementPage />
  if (pathname === '/admin/menu-approvals') return <MenuApprovalsPage />
  if (pathname === '/admin/benefits-verification') return <BenefitsVerificationPage />
  if (pathname === '/admin/settings') return <SystemSettingsPage />
  if (pathname === '/admin/preferences') return <StaffSettingsPage role="admin" />
  if (pathname === '/admin/inventory') return <AdminInventoryPage />
  if (pathname === '/admin/purchase-orders') return <PurchaseOrdersPage role="admin" />
  if (pathname === '/admin/inventory-report') return <InventoryReportPage />
  if (pathname === '/admin/transactions') return <TransactionsPage />
  if (pathname === '/admin/reports' || pathname === '/admin/analytics' || pathname === '/admin/products' || pathname === '/admin/trends') return <SalesReportPage />
  if (pathname === '/admin/cancellations') return <CancellationReportPage />
  if (pathname !== '/admin') return <AppShell role="admin" title={adminPageTitles[pathname] || 'Dashboard'} />
  return <AdminDashboardHome />
}

function AdminDashboardHome() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const raw = await fetchDashboardData()
      setMetrics(computeDashboardMetrics(raw))
      setLastUpdated(new Date())
      setError('')
    } catch (cause) {
      setError(describeError(cause, 'The dashboard could not be loaded.'))
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (metrics) raimu.updateContext({ storeOpen: metrics.storeStatus === 'open' })
  }, [metrics])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    const refresh = () => load({ quiet: true })
    const channel = supabase.channel('admin-dashboard-live')
    ;['orders', 'payments', 'refunds', 'inventory_stock', 'menu_items', 'portal_configuration'].forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, refresh)
    })
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  const attentionCount = metrics ? metrics.attentionOrders.length + metrics.pendingRefunds.length + metrics.outOfStockItems.length + metrics.criticalAuditEvents.length : 0

  return <AppShell
    role="admin"
    title="Dashboard"
    eyebrow="Real-time overview of your store performance and operations."
    onRefresh={load}
    notificationCount={attentionCount}
    titleActions={<div className="ad-live-state"><i />Live monitoring{lastUpdated && <span>Updated {timeAgo(lastUpdated)}</span>}</div>}
  >
    {error && <div className="ad-error" role="alert"><AlertTriangle size={19} /><div><b>Dashboard unavailable</b><span>{error}</span></div><button type="button" onClick={() => load()}><RefreshCw size={15} />Try again</button></div>}
    {loading ? <DashboardSkeleton /> : metrics && <DashboardContent metrics={metrics} />}
  </AppShell>
}

function DashboardContent({ metrics }) {
  const customersToday = metrics.newCustomers + metrics.returningCustomers
  const actionCards = [
    { label: 'Low Stock Items', value: metrics.lowStockItems.length, detail: `${metrics.lowStockItems.length} items running low`, icon: PackageX, tone: 'rose', to: '/admin/inventory' },
    { label: 'Pending Issues', value: metrics.attentionOrders.length + metrics.pendingRefunds.length, detail: `${metrics.attentionOrders.length + metrics.pendingRefunds.length} items need review`, icon: Clock3, tone: 'amber', to: '/admin/cancellations' },
  ]

  return <MotionConfig reducedMotion="user">
  <motion.div className="ad-dashboard ad-dashboard-v2 dash-fade-in" variants={containerVariants} initial="hidden" animate="visible">
    <motion.section className="ad-welcome-section" aria-labelledby="welcome-heading" variants={itemVariants}>
      <div className="ad-welcome-card">
        <span className="ad-welcome-icon" aria-hidden="true"><Store size={28} /></span>
        <div className="ad-welcome-copy">
          <span className="ad-welcome-kicker">Store operations</span>
          <h2 id="welcome-heading">Welcome back, Admin!</h2>
        </div>
        <div className="ad-welcome-summary" aria-label="Today's store snapshot">
          <span className={`ad-welcome-summary-item is-store-${metrics.storeStatus}`}><i aria-hidden="true" /><span>Store</span><b>{metrics.storeStatus === 'closed' ? 'Paused' : 'Open'}</b></span>
          <span className="ad-welcome-summary-item"><CheckCircle2 size={15} aria-hidden="true" /><span>Completion</span><b>{formatPercentValue(metrics.completionRate)}</b></span>
          <span className="ad-welcome-summary-item"><Users size={15} aria-hidden="true" /><span>Customers today</span><b>{formatCount(customersToday)}</b></span>
        </div>
      </div>
    </motion.section>

    <motion.section className="ad-kpi-section" aria-labelledby="today-heading" variants={itemVariants}>
      <h2 className="sr-only" id="today-heading">Today's overview</h2>
      <motion.div className="ad-kpi-grid ad-reference-kpis" variants={microContainerVariants}>
        <KpiCard icon={CircleDollarSign} label="Net sales" value={metrics.totalSales} valueFormat={money} comparison={metrics.salesChangePct} detail="vs yesterday" tone="green" trend={metrics.salesTrend} trendLabel="Net sales trend for the last 14 days" />
        <KpiCard icon={ShoppingBag} label="Orders" value={metrics.totalOrders} valueFormat={formatCount} detail={`${metrics.completedOrders} completed`} tone="cream" trend={metrics.ordersTrend} trendLabel="Orders trend for the last 14 days" />
        <KpiCard icon={WalletCards} label="Average order" value={metrics.avgOrderValue} valueFormat={money} detail="Paid completed orders" tone="blue" trend={metrics.averageOrderTrend} trendLabel="Average order trend for the last 14 days" />
        <KpiCard icon={Boxes} label="Items sold" value={metrics.itemsSold} valueFormat={formatCount} detail="Completed paid orders" tone="blue" trend={metrics.itemsTrend} trendLabel="Items sold trend for the last 14 days" />
      </motion.div>
    </motion.section>

    <motion.section className="ad-dashboard-analytics-row" aria-label="Sales and fulfillment overview" variants={itemVariants}>
      <Panel title="Sales overview" detail="Net sales over the selected period" action={<Link to="/admin/analytics">Explore analytics <ArrowRight size={15} /></Link>} className="ad-v2-sales-panel">
        <SalesLineChart points={metrics.salesTrend} comparison={metrics.salesChangePct} />
      </Panel>
      <Panel title="Fulfillment orders" detail="How customers receive their orders" action={<Link to="/admin/transactions">View all orders <ArrowRight size={15} /></Link>} className="ad-status-panel ad-fulfillment-panel" motionVariants={statusCardVariants}>
        <FulfillmentOrdersChart counts={metrics.fulfillmentCounts} />
      </Panel>
    </motion.section>

    <motion.section className="ad-dashboard-operations-row" aria-label="Items needing attention" variants={itemVariants}>
      <OperationalQueue items={actionCards} />
    </motion.section>

    <RecentTransactions orders={metrics.recentOrders} />

    <motion.section className={`ad-dashboard-secondary-grid${metrics.lowStockItems.length ? '' : ' is-no-stock'}`} aria-label="Additional dashboard summaries" variants={itemVariants}>
      {metrics.lowStockItems.length > 0 && <LowStockAlerts items={metrics.lowStockItems} />}
      <Panel title="Top selling items" detail="Last 14 days" action={<Link to="/admin/analytics">View all <ArrowRight size={14} /></Link>} className="ad-rail-panel ad-rail-sellers">
        <RankedProducts products={metrics.bestSellers} />
      </Panel>
      <RecentActivity events={metrics.auditEvents} />
    </motion.section>
  </motion.div>
  </MotionConfig>
}

function OperationalQueue({ items }) {
  return <Panel title="Needs attention" detail="Priority operational queue" action={<Link to="/admin/transactions">View all <ArrowRight size={14} /></Link>} className="ad-rail-panel ad-queue-panel" motionVariants={simpleDashboardPanelVariants}>
    <motion.div className="ad-queue-list" variants={microContainerVariants}>{items.map(({ icon: Icon, ...item }) => <MotionLink className={`is-${item.tone}`} to={item.to} key={item.label} variants={microItemVariants}>
      <span><Icon size={16} /></span><div><b>{item.label}</b><small>{item.detail}</small></div><strong>{item.value}</strong>
    </MotionLink>)}</motion.div>
  </Panel>
}

function LowStockAlerts({ items }) {
  return <Panel title="Low-stock alerts" detail="Inventory below its alert level" action={<Link to="/admin/inventory">View all <ArrowRight size={14} /></Link>} className="ad-rail-panel ad-low-stock-panel">
    <motion.div className="ad-low-stock-list" variants={microContainerVariants}>{items.slice(0, 4).map((item) => {
      const out = item.quantity <= 0
      return <MotionLink to="/admin/inventory" key={item.id} variants={microItemVariants}><span className={out ? 'is-out' : ''}><PackageX size={16} /></span><div><b>{item.name}</b><small>{item.quantity} {item.unit} left</small></div><em className={out ? 'is-out' : ''}>{out ? 'Out' : 'Low'}</em></MotionLink>
    })}</motion.div>
  </Panel>
}

function dashboardActivity(events) {
  const seen = new Set()
  return events.filter((event) => {
    const routineSelfEdit = event.action === 'profiles.updated'
      && event.actor_id && event.actor_id === event.entity_id
      && event.severity !== 'critical' && event.result !== 'failed'
    if (routineSelfEdit) return false
    const key = [event.module, event.action, event.entity_id || event.summary, event.severity, event.result].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 4)
}

function RecentActivity({ events }) {
  const recentEvents = dashboardActivity(events)
  return <Panel title="Recent activity" detail="Latest administrative changes" action={<Link to="/admin/users-access/activity">View all <ArrowRight size={14} /></Link>} className="ad-rail-panel ad-activity-panel">
    <motion.div className="ad-activity-list" variants={microContainerVariants}>{recentEvents.map((event) => <motion.div key={event.id} variants={microItemVariants}><i className={`is-${event.severity || event.result}`} /><span><b>{event.summary || 'System activity recorded'}</b><small>{event.actor_name_snapshot || 'System'} - {timeAgo(event.occurred_at)}</small></span><em>{(event.module || 'System').replaceAll('_', ' ')}</em></motion.div>)}{!recentEvents.length && <EmptyState icon={Activity} text="No notable changes recently." />}</motion.div>
  </Panel>
}

function RecentTransactions({ orders }) {
  return <Panel title="Recent Transactions" detail="Latest orders across supported sales channels" action={<Link to="/admin/transactions">View all transactions <ArrowRight size={15} /></Link>} className="ad-transactions-panel" motionVariants={simpleDashboardPanelVariants}>
    <div className="ad-transactions-scroll">
      <table className="ad-transactions-table">
        <thead><tr><th>Transaction</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th>Time</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <motion.tbody variants={transactionRowsVariants}>{orders.map((order) => {
          const items = order.order_items || []
          const itemLabel = items.length ? items.slice(0, 2).map((item) => item.display_name || item.item_name).join(', ') : 'No item details'
          const statusSlug = order.is_voided ? 'voided' : order.status.toLowerCase().replaceAll(' ', '-')
          return <motion.tr key={order.id} variants={transactionRowVariants}>
            <td><b>{order.order_number}</b><small>{fulfillmentLabels[order.order_type] || order.order_type}</small></td>
            <td>{order.customer_name || 'Walk-in customer'}</td>
            <td><span title={items.map((item) => item.display_name || item.item_name).join(', ')}>{itemLabel}{items.length > 2 ? ` +${items.length - 2}` : ''}</span></td>
            <td>{paymentLabels[order.payments?.[0]?.method] || 'Not recorded'}</td>
            <td><b>{money(order.final_total)}</b></td>
            <td><span className={`ad-order-status is-${statusSlug}`}>{order.is_voided ? 'Voided' : order.status}</span></td>
            <td><time dateTime={order.created_at}>{formatTime(order.created_at)}</time></td>
            <td><Link to="/admin/transactions" aria-label={`View transaction ${order.order_number}`}>View <ArrowRight size={14} /></Link></td>
          </motion.tr>
        })}</motion.tbody>
      </table>
      {!orders.length && <EmptyState icon={ReceiptText} text="No recent transactions are available." />}
    </div>
  </Panel>
}

function Panel({ title, detail, action, className = '', motionVariants = cardItemVariants, children }) {
  const PanelElement = motionVariants ? motion.article : 'article'
  const motionProps = motionVariants ? { variants: motionVariants } : {}
  return <PanelElement className={`ad-panel ${className}`} {...motionProps}><header><div><h2>{title}</h2><p>{detail}</p></div>{action}</header><div className="ad-panel-body">{children}</div></PanelElement>
}

function KpiCard({ icon: Icon, label, value, valueFormat = formatCount, comparison, detail, tone, trend, trendLabel }) {
  const up = comparison >= 0
  return <motion.article className={`ad-kpi-card is-${tone}`} variants={cardItemVariants}><div className="ad-kpi-top"><span><Icon size={19} /></span><small>{label}</small></div><strong><AnimatedMetric value={value} format={valueFormat} duration={numberCountDuration} /></strong><footer>{comparison !== undefined && <span className={up ? 'is-up' : 'is-down'}>{up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{percentage(comparison)}</span>}<small>{detail}</small></footer>{trend?.length > 1 && <MiniTrend values={trend.map((point) => point.total)} tone={tone} label={trendLabel || `${label} trend`} />}</motion.article>
}

function AnimatedMetric({ value, format = formatCount, duration = 0.7 }) {
  const target = Number.isFinite(Number(value)) ? Number(value) : 0
  const reducedMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const displayValue = useTransform(motionValue, (latest) => format(latest))

  useEffect(() => {
    const controls = animate(motionValue, target, {
      duration: reducedMotion ? 0 : duration,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => controls.stop()
  }, [duration, motionValue, reducedMotion, target])

  return <motion.span>{displayValue}</motion.span>
}

function MiniTrend({ values = [], tone, label }) {
  const safeValues = values.filter((value) => Number.isFinite(value))
  const points = safeValues.length > 1 ? safeValues : [0, 0]
  const width = 180, height = 64, inset = { left: 3, right: 3, top: 8, bottom: 8 }
  const min = Math.min(...points)
  const max = Math.max(...points)
  const spread = max - min || Math.max(Math.abs(max) * .2, 1)
  const floor = min - (spread - (max - min)) / 2
  const x = (index) => inset.left + (index / Math.max(1, points.length - 1)) * (width - inset.left - inset.right)
  const y = (value) => inset.top + (1 - (value - floor) / spread) * (height - inset.top - inset.bottom)
  const line = smoothSparklinePath(points, x, y)
  const area = `${line} L ${x(points.length - 1)} ${height - inset.bottom} L ${x(0)} ${height - inset.bottom} Z`
  const gradientId = `ad-spark-${tone}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return <svg className={`ad-kpi-sparkline is-${tone}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".25" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
    <motion.path className="ad-kpi-spark-area" d={area} fill={`url(#${gradientId})`} variants={sparkAreaVariants} />
    <motion.path className="ad-kpi-spark-line" d={line} vectorEffect="non-scaling-stroke" variants={sparkLineVariants} />
    <motion.circle className="ad-kpi-spark-dot" cx={x(points.length - 1)} cy={y(points[points.length - 1])} r="3.5" variants={sparkDotVariants} />
  </svg>
}

function FulfillmentOrdersChart({ counts }) {
  const entries = fulfillmentMeta.map((item) => ({ ...item, value: counts[item.key] || 0 }))
  const [activeKey, setActiveKey] = useState(null)
  const activeEntry = entries.find((item) => item.key === activeKey)
  const total = entries.reduce((sum, item) => sum + item.value, 0)
  const circumference = 2 * Math.PI * 54
  let offset = 0
  return <motion.div className="ad-status-chart" variants={microContainerVariants}>
    <div className="ad-status-visual">
      <svg viewBox="0 0 140 140" role="img" aria-labelledby="ad-fulfillment-title">
        <title id="ad-fulfillment-title">{`${total} orders today by fulfillment method`}</title>
        <circle className="ad-status-track" cx="70" cy="70" r="54" fill="none" strokeWidth="18" />
        <g transform="rotate(-90 70 70)">{entries.map((item, index) => {
          const dash = total ? (item.value / total) * circumference : 0
          const segmentOffset = offset
          const segment = <motion.circle className={`ad-status-segment is-${item.key}${activeKey === item.key ? ' is-active' : ''}${activeKey && activeKey !== item.key ? ' is-muted' : ''}`} key={item.key} cx="70" cy="70" r="54" fill="none" strokeWidth="18" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-segmentOffset} variants={statusSegmentVariants} custom={{ offset: segmentOffset, dash, circumference, index }} tabIndex={item.value ? 0 : -1} aria-label={`${item.label}: ${item.value} order${item.value === 1 ? '' : 's'}`} onMouseEnter={() => setActiveKey(item.key)} onMouseLeave={() => setActiveKey(null)} onFocus={() => setActiveKey(item.key)} onBlur={() => setActiveKey(null)}><title>{`${item.label}: ${item.value}`}</title></motion.circle>
          offset += dash
          return segment
        })}</g>
      </svg>
      <span><b>{activeEntry ? formatCount(activeEntry.value) : <AnimatedMetric value={total} />}</b><small>{activeEntry?.label || 'Total orders'}</small></span>
    </div>
    <motion.div className="ad-status-legend" variants={microContainerVariants}>{entries.map((item) => { const share = total ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'; return <motion.div className={activeKey === item.key ? 'is-active' : ''} key={item.key} variants={microItemVariants} onMouseEnter={() => setActiveKey(item.key)} onMouseLeave={() => setActiveKey(null)}><i className={`is-${item.key}`} /><span><b>{item.label}</b></span><em>{share}</em><strong>{formatCount(item.value)}</strong></motion.div> })}</motion.div>
    <motion.div className="ad-status-summary" variants={microContainerVariants}>{entries.map((item) => <motion.span key={item.key} variants={microItemVariants}><b>{formatCount(item.value)}</b><small>{item.label}</small></motion.span>)}</motion.div>
  </motion.div>
}

function SalesLineChart({ points, comparison }) {
  const reducedMotion = useReducedMotion()
  const [range, setRange] = useState(defaultSalesRangeDays)
  const visiblePoints = points.slice(-range)
  const [activeIndex, setActiveIndex] = useState(null)
  useEffect(() => setActiveIndex(null), [range, visiblePoints.length])
  const width = 760, height = 176, inset = { left: 46, right: 30, top: 38, bottom: 22 }
  const max = Math.max(1, ...visiblePoints.map((point) => point.total))
  const axisMax = chartAxisStep(max) * 4
  const plotHeight = height - inset.top - inset.bottom
  const x = (index) => inset.left + (index / Math.max(1, visiblePoints.length - 1)) * (width - inset.left - inset.right)
  const y = (value) => inset.top + (1 - value / axisMax) * plotHeight
  const lineGeometry = smoothSparklineGeometry(visiblePoints.map((point) => point.total), x, y)
  const line = lineGeometry.path
  const area = `${line} L ${x(visiblePoints.length - 1)} ${height - inset.bottom} L ${x(0)} ${height - inset.bottom} Z`
  const active = visiblePoints[activeIndex ?? visiblePoints.length - 1]
  const total = visiblePoints.reduce((sum, point) => sum + point.total, 0)
  return <motion.div className="ad-sales-chart" variants={microContainerVariants}>
    <div className="ad-chart-summary"><span><b><AnimatedMetric value={total} format={money} duration={numberCountDuration} /></b><small>{range}-day net sales <em className={comparison >= 0 ? 'is-up' : 'is-down'}>{comparison >= 0 ? '+' : '-'}{percentage(comparison)} today</em></small></span>{active && <span><motion.b key={active.day} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>{money(active.total)}</motion.b><small>{formatShortDate(active.day)}</small></span>}<label><span>Period</span><select value={range} onChange={(event) => setRange(Number(event.target.value))}><option value="7">Last 7 days</option><option value="14">Last 14 days</option></select></label></div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${range}-day net sales line chart`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="adSalesArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--mgmt-primary)" stopOpacity=".28" /><stop offset="1" stopColor="var(--mgmt-primary)" stopOpacity="0" /></linearGradient>
        <clipPath id="adSalesRevealClip"><rect key={`clip-${range}-${visiblePoints.map((point) => point.total).join('-')}`} className="ad-sales-line-clip" x={inset.left - 6} y="0" width={width - inset.left - inset.right + 12} height={height} style={{ animationDuration: `${salesGraphDuration}s` }} /></clipPath>
      </defs>
      {[0, .25, .5, .75, 1].map((step) => <g key={step}><line x1={inset.left} x2={width - inset.right} y1={inset.top + step * plotHeight} y2={inset.top + step * plotHeight} className="ad-chart-gridline" /><text x="0" y={inset.top + step * plotHeight + 3} className="ad-chart-y-label">{chartAxisCurrency(axisMax * (1 - step))}</text></g>)}
      <path d={area} fill="url(#adSalesArea)" clipPath="url(#adSalesRevealClip)" />
      <path d={line} className="ad-sales-line" clipPath="url(#adSalesRevealClip)" vectorEffect="non-scaling-stroke" />
      {visiblePoints.map((point, index) => {
        const pointX = x(index)
        const pointY = y(point.total)
        const tooltipWidth = 104
        const tooltipHeight = 32
        const tooltipX = Math.min(width - inset.right - tooltipWidth, Math.max(inset.left, pointX - tooltipWidth / 2))
        const tooltipY = pointY - tooltipHeight - 10 >= 2 ? pointY - tooltipHeight - 10 : pointY + 10
        const isActive = activeIndex === index
        return <g key={`${range}-${point.day}-${point.total}`} className={isActive ? 'is-active' : ''} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onBlur={() => setActiveIndex(null)} tabIndex="0" aria-label={`${formatShortDate(point.day)}, ${money(point.total)}`}>
          <rect className="ad-chart-point-hit-area" x={Math.max(0, pointX - 24)} y="0" width="48" height={height} fill="transparent" />
          <circle className="ad-sales-point" cx={pointX} cy={pointY} r={isActive ? 6 : 3.5} style={{ animationDelay: `${chartEaseTimelinePosition(index / Math.max(1, visiblePoints.length - 1)) * salesGraphDuration}s` }} />
          {isActive && <motion.g className="ad-chart-point-tooltip" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }} aria-hidden="true">
            <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="7" />
            <text x={tooltipX + tooltipWidth / 2} y={tooltipY + 13} className="ad-chart-tooltip-value">{money(point.total)}</text>
            <text x={tooltipX + tooltipWidth / 2} y={tooltipY + 25} className="ad-chart-tooltip-date">{formatShortDate(point.day)}</text>
          </motion.g>}
        </g>
      })}
    </svg>
    <div className="ad-chart-axis" aria-label={`${range}-day date axis`}>{visiblePoints.map((point) => <span key={point.day}>{formatShortDate(point.day)}</span>)}</div>
  </motion.div>
}

function RankedProducts({ products }) {
  const max = Math.max(1, ...products.map((item) => item.qty))
  return <motion.div className="ad-ranked-list" variants={microContainerVariants}>{products.length ? products.map((item, index) => <motion.div key={item.name} variants={microItemVariants}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{item.name}</b><small>{item.qty} sold - {money(item.revenue)}</small><i><em style={{ width: `${(item.qty / max) * 100}%` }} /></i></div></motion.div>) : <EmptyState icon={Coffee} text="No completed product sales yet." />}</motion.div>
}

function EmptyState({ icon: Icon, text }) {
  return <div className="ad-empty"><Icon size={20} /><span>{text}</span></div>
}

function DashboardSkeleton() {
  return <div className="ad-skeleton" aria-label="Loading dashboard"><i className="wide" /><div>{Array.from({ length: 4 }).map((_, index) => <i key={index} />)}</div><div>{Array.from({ length: 3 }).map((_, index) => <i key={index} />)}</div><i className="tall" /><i className="tall" /></div>
}
```

## src/pages/SystemSettingsPage.jsx

```jsx
import { AlertTriangle, Check, Clock3, CreditCard, Database, Image, Info, MapPin, Percent, RotateCcw, Save, ShieldCheck, ShoppingBag, Store, Upload } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { raimu } from '../components/raimu/raimuMachine'
import { describeError } from '../utils/describeError'
import { EMAIL_MAX_LENGTH, isValidEmail, isValidPhone, sanitizeCatalogText, sanitizeDigits, sanitizePersonName, sanitizePhone } from '../utils/inputValidation'
import { IMAGE_UPLOAD_ACCEPT, validateImageFile } from '../utils/imageUpload'
import {
  SYSTEM_DEFAULTS, fetchDeliveryZoneSettings, fetchPortalConfiguration,
  saveDeliveryZoneSettings, savePaymentConfiguration, savePortalConfiguration,
} from '../services/adminPortalConfigurationService'

const SECTIONS = [
  ['store', 'Store profile', Store, 'Public contact details'],
  ['ordering', 'Hours & ordering', Clock3, 'Availability and fulfillment'],
  ['delivery', 'Delivery zones', MapPin, 'Fees and estimates'],
  ['payments', 'Payments', CreditCard, 'Methods and instructions'],
  ['pricing', 'Pricing & VAT', Percent, 'Global price treatment'],
  ['security', 'Platform security', ShieldCheck, 'Access and safeguards'],
]

function Field({ label, hint, wide = false, children }) { return <label className={`ac-field${wide ? ' ac-field--wide' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label> }
function Toggle({ checked, onChange, label, hint }) { return <label className="ac-setting-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><span aria-hidden="true"><i/></span><span><b>{label}</b>{hint && <small>{hint}</small>}</span></label> }

export default function SystemSettingsPage() {
  const [section, setSection] = useState('store')
  const [settings, setSettings] = useState(SYSTEM_DEFAULTS)
  const [zones, setZones] = useState([])
  const [updatedAt, setUpdatedAt] = useState(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [qrFiles, setQrFiles] = useState({ gcash: null, bank_transfer: null })
  const [refreshSignal, setRefreshSignal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [configuration, deliveryZones] = await Promise.all([fetchPortalConfiguration('system'), fetchDeliveryZoneSettings()])
      raimu.updateContext({ storeOpen: configuration.values.ordering?.storeStatus === 'open' })
       setSettings((current) => ({ ...current, ...configuration.values, store: { ...current.store, ...configuration.values.store, phone: sanitizePhone(configuration.values.store?.phone || '') } })); setZones(deliveryZones); setUpdatedAt(configuration.updatedAt); setSetupRequired(configuration.setupRequired); setError('')
    } catch (cause) { setError(describeError(cause, 'System settings could not be loaded.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load, refreshSignal])
  useEffect(() => { if (!notice) return undefined; const timer = window.setTimeout(() => setNotice(''), 3500); return () => window.clearTimeout(timer) }, [notice])

  const update = (key, values) => setSettings((current) => ({ ...current, [key]: { ...current[key], ...values } }))
  const save = async (key) => {
    if (key === 'store' && settings.store.email && !isValidEmail(settings.store.email)) { setError('Enter a valid business email address.'); return }
    if (key === 'store' && settings.store.phone && !isValidPhone(settings.store.phone)) { setError('Contact number must contain 11 digits and start with 09.'); return }
    if (key === 'ordering' && !settings.ordering.deliveryEnabled && !settings.ordering.pickupEnabled) { setError('Keep at least one fulfillment method enabled.'); return }
    if (key === 'payments' && !(settings.payments.enabledMethods || []).length) { setError('Keep at least one payment method enabled.'); return }
    setSaving(true); setError('')
    try {
      if (key === 'delivery') await saveDeliveryZoneSettings(zones)
      else if (key === 'payments') {
        const result = await savePaymentConfiguration(settings.payments, qrFiles)
        setSettings((current) => ({ ...current, payments: result.settings })); setQrFiles({ gcash: null, bank_transfer: null }); setUpdatedAt(result.row.updated_at); setSetupRequired(false)
      } else { const row = await savePortalConfiguration('system', key, settings[key], key !== 'security'); setUpdatedAt(row.updated_at); setSetupRequired(false) }
      if (key === 'ordering') raimu.updateContext({ storeOpen: settings.ordering.storeStatus === 'open' })
      setNotice(`${SECTIONS.find(([id]) => id === key)?.[1] || 'Settings'} saved.`)
    } catch (cause) { setError(describeError(cause, 'These settings could not be saved.')) }
    finally { setSaving(false) }
  }
  const updateZone = (index, values) => setZones((current) => current.map((zone, zoneIndex) => zoneIndex === index ? { ...zone, ...values } : zone))
  const toggleMethod = (method) => {
    const methods = settings.payments.enabledMethods || []
    update('payments', { enabledMethods: methods.includes(method) ? methods.filter((value) => value !== method) : [...methods, method] })
  }

  const lastSaved = updatedAt ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(updatedAt)) : 'Defaults in use'
  return <AppShell role="admin" title="System Settings" onRefresh={() => setRefreshSignal((value) => value + 1)}>
    <section className="ac-workspace">
      <header className="ac-overview">
        <div><span className="ac-overview-icon"><Database size={21}/></span><div><h2>Operational configuration</h2><p>Settings are grouped by where they affect the customer and staff experience.</p></div></div>
        <div className="ac-overview-actions"><span><i className="ac-status-dot"/>Last saved: {lastSaved}</span></div>
      </header>
      {setupRequired && <div className="ac-alert" role="status"><Info size={18}/><div><b>Database setup is still required</b><span>The editor is showing safe defaults. Apply the portal configuration migration before saving settings.</span></div></div>}
      {error && <div className="ac-alert ac-alert--error" role="alert"><AlertTriangle size={18}/><div><b>Something needs attention</b><span>{error}</span></div></div>}
      <div className="ac-layout">
        <nav className="ac-section-nav" aria-label="System setting areas">{SECTIONS.map(([id, label, Icon, description]) => <button type="button" key={id} className={section === id ? 'is-active' : ''} onClick={() => setSection(id)} aria-current={section === id ? 'page' : undefined}><Icon size={18}/><span><b>{label}</b><small>{description}</small></span></button>)}</nav>
        <main className="ac-panel">
          {loading ? <div className="ac-skeleton"><i/><i/><i/><i/></div> : <>
            {section === 'store' && <SettingsSection title="Store profile" description="These details appear on customer-facing contact and footer surfaces." onSave={() => save('store')} saving={saving}>
              <div className="ac-form-grid">
                <Field label="Store name"><input value={settings.store.name} maxLength={80} onChange={(event) => update('store', { name: sanitizeCatalogText(event.target.value, 80) })}/></Field>
                <Field label="Business email"><input type="email" maxLength={EMAIL_MAX_LENGTH} value={settings.store.email} onChange={(event) => update('store', { email: event.target.value.slice(0, EMAIL_MAX_LENGTH) })}/></Field>
                <Field label="Contact number"><input type="tel" inputMode="numeric" autoComplete="tel" maxLength={11} pattern="09[0-9]{9}" title="Enter 11 digits starting with 09." placeholder="09XXXXXXXXX" value={settings.store.phone} onChange={(event) => update('store', { phone: sanitizePhone(event.target.value) })}/></Field>
                <Field label="Timezone" hint="Schedules and timestamps use this timezone."><select value={settings.store.timezone} onChange={(event) => update('store', { timezone: event.target.value })}><option value="Asia/Manila">Asia/Manila (PHT)</option></select></Field>
                <Field label="Store address" wide><textarea rows="3" maxLength={200} value={settings.store.address} onChange={(event) => update('store', { address: event.target.value })}/></Field>
              </div>
            </SettingsSection>}

            {section === 'ordering' && <SettingsSection title="Hours & ordering" description="Control when customers can place orders and which fulfillment methods appear." onSave={() => save('ordering')} saving={saving}>
              <div className={`ac-store-state ${settings.ordering.storeStatus === 'open' ? 'is-open' : 'is-closed'}`}><span><i/><b>{settings.ordering.storeStatus === 'open' ? 'Accepting online orders' : 'Online ordering paused'}</b></span><select value={settings.ordering.storeStatus} onChange={(event) => update('ordering', { storeStatus: event.target.value })}><option value="open">Open</option><option value="closed">Closed</option></select></div>
              <div className="ac-form-grid">
                <Field label="Opening time"><input type="time" value={settings.ordering.openTime} onChange={(event) => update('ordering', { openTime: event.target.value })}/></Field>
                <Field label="Last order time"><input type="time" value={settings.ordering.closeTime} onChange={(event) => update('ordering', { closeTime: event.target.value })}/></Field>
                <Field label="Minimum order (PHP)" hint="Set to 0 for no minimum."><input type="number" min="0" step="1" value={settings.ordering.minimumOrder} onChange={(event) => update('ordering', { minimumOrder: Number(event.target.value) })}/></Field>
                <Field label="Closed-store message" wide><textarea rows="3" maxLength={240} value={settings.ordering.closureMessage} onChange={(event) => update('ordering', { closureMessage: event.target.value })}/></Field>
              </div>
              <div className="ac-toggle-stack"><Toggle checked={settings.ordering.deliveryEnabled} onChange={(value) => update('ordering', { deliveryEnabled: value })} label="Delivery" hint="Show delivery as a checkout option."/><Toggle checked={settings.ordering.pickupEnabled} onChange={(value) => update('ordering', { pickupEnabled: value })} label="Store pickup" hint="Show pickup as a checkout option."/></div>
            </SettingsSection>}

            {section === 'delivery' && <SettingsSection title="Delivery zones" description="A zone update applies to every Barangay assigned to it." onSave={() => save('delivery')} saving={saving}>
              <div className="ac-zone-list">{zones.map((zone, index) => <article key={zone.zone}>
                <header><div><MapPin size={17}/><span><b>{zone.zone}</b><small>{zone.barangays.length} Barangay{zone.barangays.length === 1 ? '' : 's'}</small></span></div><Toggle checked={zone.active} onChange={(value) => updateZone(index, { active: value })} label={zone.active ? 'Active' : 'Inactive'}/></header>
                 <div className="ac-form-grid"><Field label="Delivery fee (PHP)"><input type="number" min="0" step="1" value={zone.fee} onChange={(event) => updateZone(index, { fee: Number(event.target.value) })}/></Field><Field label="Estimated time"><input maxLength={40} value={zone.estimatedTime} onChange={(event) => updateZone(index, { estimatedTime: event.target.value.slice(0, 40) })} placeholder="e.g. 20–35 minutes"/></Field></div>
                <details><summary>View included Barangays</summary><p>{zone.barangays.join(', ')}</p></details>
              </article>)}</div>
            </SettingsSection>}

            {section === 'payments' && <SettingsSection title="Payments" description="Choose the methods customers can use and keep instructions accurate." onSave={() => save('payments')} saving={saving}>
              <div className="ac-payment-methods">
                {[['cod','Cash on delivery','Delivery orders only'],['gcash','GCash','Requires proof of payment'],['bank_transfer','Bank transfer','Requires proof of payment']].map(([id,label,hint]) => <Toggle key={id} checked={(settings.payments.enabledMethods || []).includes(id)} onChange={() => toggleMethod(id)} label={label} hint={hint}/>) }
              </div>
              <div className="ac-subsection"><h3>Cash on delivery</h3><div className="ac-form-grid"><Field label="Maximum order total (PHP)" hint="Orders above this amount must use a digital method."><input type="number" min="0" step="1" value={settings.payments.codMaximum} onChange={(event) => update('payments', { codMaximum: Number(event.target.value) })}/></Field></div></div>
               <div className="ac-subsection"><h3>GCash</h3><QrAssetEditor label="GCash payment QR" currentUrl={settings.payments.gcashQrUrl} file={qrFiles.gcash} onChange={(file) => setQrFiles((current) => ({ ...current, gcash: file }))} onError={setError}/><div className="ac-form-grid"><Field label="Customer instructions" wide><textarea rows="3" maxLength={500} value={settings.payments.gcashInstructions} onChange={(event) => update('payments', { gcashInstructions: event.target.value })}/></Field></div></div>
               <div className="ac-subsection"><h3>Bank transfer</h3><QrAssetEditor label="Bank transfer QR" currentUrl={settings.payments.bankQrUrl} file={qrFiles.bank_transfer} onChange={(file) => setQrFiles((current) => ({ ...current, bank_transfer: file }))} onError={setError}/><div className="ac-form-grid"><Field label="Bank name"><input maxLength={80} value={settings.payments.bankName} onChange={(event) => update('payments', { bankName: sanitizeCatalogText(event.target.value, 80) })}/></Field><Field label="Account name"><input maxLength={80} value={settings.payments.bankAccountName} onChange={(event) => update('payments', { bankAccountName: sanitizePersonName(event.target.value, 80) })}/></Field><Field label="Account number"><input inputMode="numeric" maxLength={34} value={settings.payments.bankAccountNumber} onChange={(event) => update('payments', { bankAccountNumber: sanitizeDigits(event.target.value, 34) })}/></Field><Field label="Customer instructions" wide><textarea rows="3" maxLength={500} value={settings.payments.bankInstructions} onChange={(event) => update('payments', { bankInstructions: event.target.value })}/></Field></div></div>
            </SettingsSection>}

            {section === 'pricing' && <SettingsSection title="Pricing & VAT" description="One global policy applies to customers, cashiers, staff, reports, receipts, and new orders." onSave={() => save('pricing')} saving={saving}>
              <div className="ac-alert" role="status"><Info size={18}/><div><b>Current catalog prices are already VAT-inclusive</b><span>The system will not multiply or change the amounts already stored for menu items, variants, or add-ons.</span></div></div>
              <div className="ac-form-grid">
                <Field label="VAT rate" hint="The current store-wide rate used for order records."><input readOnly value={`${Math.round(Number(settings.pricing?.vatRate ?? 0.12) * 100)}%`}/></Field>
                <Field label="Price treatment" hint="This policy is shared by every user and channel."><input readOnly value={settings.pricing?.pricesIncludeVat !== false ? 'Prices include VAT' : 'VAT calculated at checkout'}/></Field>
                <Field label="Currency"><input readOnly value={settings.pricing?.currency || 'PHP'}/></Field>
              </div>
              <div className="ac-subsection"><h3>Visible to everyone</h3><p>Customers see the policy during browsing and checkout. Cashiers, staff, and administrators see the same notice in their work areas. New orders store the active VAT-inclusive policy for consistent records and reporting.</p></div>
            </SettingsSection>}

            {section === 'security' && <section className="ac-editor-section"><header><div><h2>Platform security</h2><p>Security controls are shown where they are actually managed.</p></div></header><div className="ac-security-grid">
              <article><span><ShieldCheck size={20}/></span><div><b>Role-based access</b><p>Admin, operations staff, cashier, and customer boundaries are enforced by protected routes and database policies.</p><a href="/admin/users-access/users">Manage users and roles</a></div></article>
              <article><span><Database size={20}/></span><div><b>Authentication policy</b><p>Password rules, OTP, session lifetime, and rate limits belong in Supabase Auth. They are not duplicated here because a local toggle would not enforce them.</p><small>Review these controls in the connected Supabase project.</small></div></article>
              <article><span><ShoppingBag size={20}/></span><div><b>Change history</b><p>Administrative changes remain attributable through the portal activity log.</p><a href="/admin/users-access/activity">Open Activity Logs</a></div></article>
            </div></section>}
          </>}
        </main>
      </div>
    </section>
    {notice && <div className="ac-toast" role="status"><Check size={17}/>{notice}</div>}
  </AppShell>
}

function SettingsSection({ title, description, onSave, saving, children }) {
  return <section className="ac-editor-section"><header><div><h2>{title}</h2><p>{description}</p></div></header><div className="ac-editor-body">{children}</div><footer><span>Review operational impact before saving.</span><button type="button" className="ac-primary-button" onClick={onSave} disabled={saving}><Save size={16}/>{saving ? 'Saving…' : 'Save settings'}</button></footer></section>
}

function QrAssetEditor({ label, currentUrl, file, onChange, onError }) {
  const [previewUrl, setPreviewUrl] = useState(currentUrl)
  useEffect(() => {
    if (!file) { setPreviewUrl(currentUrl); return undefined }
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file, currentUrl])
  const choose = async (event) => {
    const next = event.target.files?.[0] || null
    if (!next) return
    try {
      await validateImageFile(next, { label: 'Payment QR image' })
      onError(''); onChange(next)
    } catch (error) {
      onError(error.message || 'Could not use this image.')
    }
    event.target.value = ''
  }
  return <section className="ac-qr-editor" aria-label={label}>
    <div className="ac-qr-preview">{previewUrl ? <img src={previewUrl} alt={`${label} preview`}/> : <span><Image size={24}/><small>No QR uploaded</small></span>}<i>{file ? 'New preview' : 'Current QR'}</i></div>
    <div className="ac-qr-copy"><b>{label}</b><p>{file ? `${file.name} is ready. Save Payments to publish this replacement.` : 'This is the QR customers currently see during checkout.'}</p><small>JPG, PNG or WEBP · Maximum 5 MB · A square, high-contrast image scans best.</small><div><label className="ac-secondary-button ac-file-button"><Upload size={16}/>{file ? 'Choose another' : 'Change QR'}<input type="file" accept={IMAGE_UPLOAD_ACCEPT} onChange={choose}/></label>{file && <button type="button" className="ac-text-button" onClick={() => onChange(null)}><RotateCcw size={15}/>Discard replacement</button>}</div></div>
  </section>
}
```

## src/management-theme.css

```css
/* CoffeeRealm management workspace — shared light/dark theme */
.app-layout.legacy-staff,.app-layout.legacy-admin,.raimu-companion{
  --mgmt-canvas:#fff;--mgmt-subtle:#f6f7f7;--mgmt-surface:#fff;--mgmt-elevated:#fff;
  --mgmt-hover:#eef2f0;--mgmt-border:#e1e7e4;--mgmt-border-strong:#cad4cf;
  --mgmt-text:#202824;--mgmt-heading:#121916;--mgmt-muted:#68736e;--mgmt-faint:#87918c;
  --mgmt-primary:#147d57;--mgmt-primary-strong:#0e6646;--mgmt-on-primary:#fff;
  --mgmt-danger:#a33d3d;--mgmt-danger-soft:#fff3f3;--mgmt-success:#357a50;--mgmt-warning:#a36f19;
  --mgmt-success-soft:#edf8f1;--mgmt-warning-soft:#fff8ea;
  --mgmt-input:#f8fbf9;--mgmt-shadow:0 16px 36px rgba(31,65,45,.08);
  --mgmt-shadow-high:0 26px 64px rgba(31,65,45,.14);--mgmt-highlight:rgba(255,255,255,.94);
  color-scheme:light;color:var(--mgmt-text);background:var(--mgmt-canvas)
}
.app-layout.legacy-staff[data-theme="dark"],.app-layout.legacy-admin[data-theme="dark"],.raimu-companion[data-theme="dark"]{
  --mgmt-canvas:#080e0e;--mgmt-subtle:#0a1111;--mgmt-surface:#0d1715;--mgmt-elevated:#121d19;
  --mgmt-featured:#17231d;--mgmt-hover:#1e2f25;--mgmt-border:#293730;--mgmt-border-strong:#365f48;
  --mgmt-text:#f1f4f2;--mgmt-heading:#f1f4f2;--mgmt-muted:#a6b0aa;--mgmt-muted-low:#737f79;--mgmt-faint:#75817b;
  --mgmt-primary:#65a875;--mgmt-primary-strong:#82b98b;--mgmt-on-primary:#080e0e;
  --mgmt-danger:#e05d57;--mgmt-danger-soft:#251716;--mgmt-success:#48c78e;--mgmt-success-soft:#10231b;
  --mgmt-warning:#d48725;--mgmt-warning-soft:#261d10;--mgmt-input:#0a1111;
  --mgmt-shadow:0 10px 28px rgba(0,0,0,.22);--mgmt-shadow-high:0 20px 52px rgba(0,0,0,.38);
  --mgmt-highlight:rgba(130,185,139,.055);
  color-scheme:dark
}
.app-layout.legacy-admin[data-theme="dark"]{
  --mgmt-canvas:#080e0e;--mgmt-subtle:#0a1111;--mgmt-surface:#0d1715;--mgmt-elevated:#121d19;
  --mgmt-featured:#17231d;--mgmt-hover:#1e2f25;--mgmt-border:#293730;--mgmt-border-strong:#365f48;
  --mgmt-text:#f1f4f2;--mgmt-heading:#f1f4f2;--mgmt-muted:#a6b0aa;--mgmt-muted-low:#737f79;--mgmt-faint:#75817b;
  --mgmt-primary:#65a875;--mgmt-primary-strong:#82b98b;--mgmt-on-primary:#080e0e;
  --mgmt-danger:#e05d57;--mgmt-danger-soft:#251716;--mgmt-success:#48c78e;--mgmt-success-soft:#10231b;
  --mgmt-warning:#d48725;--mgmt-warning-soft:#261d10;--mgmt-input:#0a1111;
  --mgmt-shadow:0 10px 28px rgba(0,0,0,.22);--mgmt-shadow-high:0 20px 52px rgba(0,0,0,.38);
  --mgmt-highlight:rgba(130,185,139,.055);color-scheme:dark
}
.app-layout.legacy-staff[data-theme="dark"]{--mgmt-muted:#a6b0aa;--mgmt-faint:#75817b}

/* Admin content and system configuration workspaces */
.ac-workspace{padding:24px 28px 44px;max-width:1540px;width:100%;margin:0 auto}
.ac-overview{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:0 0 22px;border-bottom:1px solid var(--mgmt-border)}
.ac-overview>div:first-child{display:flex;align-items:center;gap:13px;min-width:0}.ac-overview h2,.ac-editor-section h2{margin:0;color:var(--mgmt-heading);font-size:1.08rem;letter-spacing:-.015em}.ac-overview p,.ac-editor-section header p{margin:4px 0 0;color:var(--mgmt-muted);font-size:.84rem;line-height:1.5}
.ac-overview-icon{width:42px;height:42px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--mgmt-primary) 25%,var(--mgmt-border));border-radius:12px;color:var(--mgmt-primary);background:color-mix(in srgb,var(--mgmt-primary) 7%,var(--mgmt-surface))}
.ac-overview-actions{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}.ac-overview-actions>span{display:flex;align-items:center;gap:7px;color:var(--mgmt-muted);font-size:.78rem;white-space:nowrap}.ac-status-dot{width:7px;height:7px;border-radius:50%;background:var(--mgmt-success);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-success) 15%,transparent)}
.ac-alert{display:flex;align-items:flex-start;gap:10px;margin-top:18px;padding:13px 15px;border:1px solid color-mix(in srgb,var(--mgmt-warning) 28%,var(--mgmt-border));border-radius:10px;background:color-mix(in srgb,var(--mgmt-warning) 7%,var(--mgmt-surface));color:var(--mgmt-warning)}.ac-alert>div{display:grid;gap:2px}.ac-alert b{font-size:.82rem;color:var(--mgmt-heading)}.ac-alert span{font-size:.78rem;color:var(--mgmt-muted);line-height:1.45}.ac-alert--error{border-color:color-mix(in srgb,var(--mgmt-danger) 32%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}
.ac-layout{display:grid;grid-template-columns:224px minmax(0,1fr);gap:30px;padding-top:24px;align-items:start}
.ac-section-nav{position:sticky;top:92px;display:grid;gap:4px}.ac-section-nav button{width:100%;display:flex;align-items:center;gap:11px;padding:11px 12px;border:1px solid transparent;border-radius:10px;color:var(--mgmt-muted);background:transparent;text-align:left;cursor:pointer;transition:background .16s ease,border-color .16s ease,color .16s ease}.ac-section-nav button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.ac-section-nav button.is-active{background:color-mix(in srgb,var(--mgmt-primary) 9%,var(--mgmt-surface));border-color:color-mix(in srgb,var(--mgmt-primary) 24%,var(--mgmt-border));color:var(--mgmt-primary)}.ac-section-nav button>span{display:grid;gap:2px;min-width:0}.ac-section-nav b{font-size:.82rem;color:inherit}.ac-section-nav small{font-size:.7rem;color:var(--mgmt-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ac-panel{min-width:0}.ac-editor-section{border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface);box-shadow:0 10px 28px rgba(31,65,45,.045);overflow:hidden}.ac-editor-section>header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:21px 22px;border-bottom:1px solid var(--mgmt-border)}.ac-editor-body{padding:22px}.ac-editor-section>footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 22px;border-top:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}.ac-editor-section>footer>span{font-size:.75rem;color:var(--mgmt-muted)}
.ac-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px 18px}.ac-field{display:grid;gap:7px;align-content:start}.ac-field--wide{grid-column:1/-1}.ac-field>span{font-size:.76rem;font-weight:700;color:var(--mgmt-text)}.ac-field>small{font-size:.69rem;line-height:1.4;color:var(--mgmt-muted)}.ac-field input,.ac-field textarea,.ac-field select,.ac-store-state select{width:100%;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.82rem;outline:none;transition:border-color .16s,box-shadow .16s}.ac-field input,.ac-field select,.ac-store-state select{min-height:41px;padding:0 11px}.ac-field textarea{padding:10px 11px;line-height:1.55;resize:vertical}.ac-field input:focus,.ac-field textarea:focus,.ac-field select:focus,.ac-store-state select:focus{border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 13%,transparent)}
.ac-primary-button,.ac-secondary-button{min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;border-radius:9px;font:inherit;font-size:.78rem;font-weight:800;text-decoration:none;cursor:pointer;transition:transform .14s,background .14s,border-color .14s}.ac-primary-button{border:1px solid var(--mgmt-primary);background:var(--mgmt-primary);color:var(--mgmt-on-primary)}.ac-primary-button:hover{background:var(--mgmt-primary-strong)}.ac-secondary-button{border:1px solid var(--mgmt-border-strong);background:var(--mgmt-surface);color:var(--mgmt-text)}.ac-secondary-button:hover{background:var(--mgmt-hover)}.ac-primary-button:active,.ac-secondary-button:active{transform:translateY(1px)}.ac-primary-button:disabled,.ac-secondary-button:disabled{opacity:.55;cursor:not-allowed}
.ac-toggle-row,.ac-setting-toggle{display:flex;align-items:center;gap:10px;cursor:pointer}.ac-toggle-row{grid-column:1/-1;padding:4px 0}.ac-toggle-row input,.ac-setting-toggle input{position:absolute;opacity:0;pointer-events:none}.ac-toggle-row>span,.ac-setting-toggle>span:first-of-type{width:36px;height:20px;padding:2px;border-radius:999px;background:var(--mgmt-border-strong);transition:background .16s;flex:0 0 auto}.ac-toggle-row>span i,.ac-setting-toggle>span:first-of-type i{display:block;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.22);transition:transform .16s}.ac-toggle-row input:checked+span,.ac-setting-toggle input:checked+span{background:var(--mgmt-primary)}.ac-toggle-row input:checked+span i,.ac-setting-toggle input:checked+span i{transform:translateX(16px)}.ac-toggle-row b{font-size:.78rem;color:var(--mgmt-text)}
.ac-choice-heading{display:flex;align-items:center;justify-content:space-between;margin:24px 0 10px;padding-top:19px;border-top:1px solid var(--mgmt-border)}.ac-choice-heading>div{display:flex;justify-content:space-between;align-items:center;width:100%;gap:14px}.ac-choice-heading b{font-size:.8rem;color:var(--mgmt-heading)}.ac-choice-heading span{font-size:.73rem;color:var(--mgmt-muted)}
.ac-menu-picker{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ac-menu-picker button{display:grid;grid-template-columns:43px minmax(0,1fr) 24px;align-items:center;gap:10px;padding:8px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-surface);color:var(--mgmt-text);text-align:left;cursor:pointer}.ac-menu-picker button:hover:not(:disabled){border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}.ac-menu-picker button.is-selected{border-color:color-mix(in srgb,var(--mgmt-primary) 48%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 7%,var(--mgmt-surface))}.ac-menu-picker button:disabled{opacity:.5;cursor:not-allowed}.ac-menu-thumb{width:43px;height:43px;display:grid;place-items:center;border-radius:8px;overflow:hidden;background:var(--mgmt-subtle);color:var(--mgmt-primary)}.ac-menu-thumb img{width:100%;height:100%;object-fit:cover}.ac-menu-picker button>span:nth-child(2){display:grid;gap:3px;min-width:0}.ac-menu-picker b{font-size:.77rem;color:var(--mgmt-heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ac-menu-picker small{font-size:.68rem;color:var(--mgmt-muted)}.ac-menu-picker button>i{width:20px;height:20px;display:grid;place-items:center;border:1px solid var(--mgmt-border-strong);border-radius:6px;color:var(--mgmt-on-primary)}.ac-menu-picker button.is-selected>i{border-color:var(--mgmt-primary);background:var(--mgmt-primary)}
.ac-subsection+.ac-subsection{margin-top:26px;padding-top:23px;border-top:1px solid var(--mgmt-border)}.ac-subsection>h3{margin:0 0 15px;font-size:.79rem;color:var(--mgmt-heading);letter-spacing:.01em}
.ac-review-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:20px}.ac-review-list article{padding:17px;border:1px solid var(--mgmt-border);border-radius:11px;background:var(--mgmt-surface)}.ac-review-rating{color:var(--mgmt-warning);font-size:.75rem;letter-spacing:.08em}.ac-review-list blockquote{min-height:64px;margin:11px 0 16px;color:var(--mgmt-text);font-size:.79rem;line-height:1.55}.ac-review-list article>div:last-child{display:flex;align-items:center;justify-content:space-between;gap:12px}.ac-review-list article>div:last-child>span{display:grid;gap:2px}.ac-review-list article b{font-size:.76rem;color:var(--mgmt-heading)}.ac-review-list article small{font-size:.67rem;color:var(--mgmt-muted)}.ac-review-list article button{min-height:30px;padding:0 8px;border:1px solid var(--mgmt-border);border-radius:7px;background:transparent;color:var(--mgmt-text);font:inherit;font-size:.7rem;cursor:pointer}.ac-review-list article button.is-danger{color:var(--mgmt-danger);margin-left:5px}.ac-review-list article button:disabled{opacity:.35;cursor:not-allowed}
.ac-empty{grid-column:1/-1;min-height:210px;display:grid;place-items:center;align-content:center;gap:7px;color:var(--mgmt-muted);text-align:center}.ac-empty b{color:var(--mgmt-heading);font-size:.85rem}.ac-empty span{font-size:.75rem}.ac-skeleton{padding:22px;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface);display:grid;gap:14px}.ac-skeleton i{height:44px;border-radius:8px;background:linear-gradient(90deg,var(--mgmt-subtle),var(--mgmt-hover),var(--mgmt-subtle));background-size:220% 100%;animation:ac-shimmer 1.4s linear infinite}.ac-skeleton i:nth-child(2){height:88px}.ac-skeleton i:nth-child(3){width:72%}@keyframes ac-shimmer{to{background-position:-220% 0}}
.ac-modal-backdrop{position:fixed;inset:0;z-index:1300;display:grid;place-items:center;padding:20px;background:rgba(4,10,8,.62);backdrop-filter:blur(3px)}.ac-modal{width:min(620px,100%);max-height:min(780px,calc(100dvh - 40px));overflow:auto;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-elevated);box-shadow:var(--mgmt-shadow-high)}.ac-modal>header{padding:21px 22px;border-bottom:1px solid var(--mgmt-border)}.ac-modal h2{margin:0;color:var(--mgmt-heading);font-size:1rem}.ac-modal header p{margin:4px 0 0;color:var(--mgmt-muted);font-size:.76rem}.ac-modal>.ac-form-grid{padding:21px 22px}.ac-modal>footer{display:flex;justify-content:flex-end;gap:9px;padding:15px 22px;border-top:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}
.ac-toast{position:fixed;right:24px;bottom:24px;z-index:1400;display:flex;align-items:center;gap:9px;padding:12px 15px;border:1px solid color-mix(in srgb,var(--mgmt-success) 35%,var(--mgmt-border));border-radius:10px;background:var(--mgmt-elevated);box-shadow:var(--mgmt-shadow-high);color:var(--mgmt-success);font-size:.78rem;font-weight:750}
.ac-store-state{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;padding:13px 14px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-subtle)}.ac-store-state>span{display:flex;align-items:center;gap:9px}.ac-store-state>span i{width:8px;height:8px;border-radius:50%;background:var(--mgmt-danger)}.ac-store-state.is-open>span i{background:var(--mgmt-success)}.ac-store-state b{font-size:.78rem;color:var(--mgmt-heading)}.ac-store-state select{width:130px;background:var(--mgmt-surface)}
.ac-toggle-stack,.ac-payment-methods{display:grid;gap:8px;margin-top:20px}.ac-payment-methods{grid-template-columns:repeat(3,minmax(0,1fr));margin:0 0 25px}.ac-setting-toggle{padding:13px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-surface)}.ac-setting-toggle>span:last-child{display:grid;gap:2px}.ac-setting-toggle b{font-size:.75rem;color:var(--mgmt-heading)}.ac-setting-toggle small{font-size:.66rem;color:var(--mgmt-muted);line-height:1.35}
.ac-setting-toggle:has(input:focus-visible),.ac-toggle-row:has(input:focus-visible){outline:2px solid var(--mgmt-primary);outline-offset:3px}
.ac-qr-editor{display:grid;grid-template-columns:148px minmax(0,1fr);gap:20px;align-items:center;margin:0 0 19px;padding:16px;border:1px solid var(--mgmt-border);border-radius:11px;background:var(--mgmt-subtle)}.ac-qr-preview{position:relative;width:148px;aspect-ratio:1;overflow:hidden;border:1px solid var(--mgmt-border-strong);border-radius:10px;background:#fff}.ac-qr-preview img{display:block;width:100%;height:100%;object-fit:contain;padding:7px}.ac-qr-preview>span{height:100%;display:grid;place-items:center;align-content:center;gap:7px;color:var(--mgmt-faint)}.ac-qr-preview>span small{font-size:.68rem}.ac-qr-preview>i{position:absolute;left:7px;bottom:7px;padding:4px 7px;border-radius:6px;background:rgba(4,12,9,.82);color:#fff;font-size:.61rem;font-style:normal;font-weight:800;letter-spacing:.02em}.ac-qr-copy{display:grid;justify-items:start;gap:6px}.ac-qr-copy>b{color:var(--mgmt-heading);font-size:.8rem}.ac-qr-copy>p{margin:0;max-width:58ch;color:var(--mgmt-text);font-size:.75rem;line-height:1.48}.ac-qr-copy>small{color:var(--mgmt-muted);font-size:.68rem;line-height:1.45}.ac-qr-copy>div{display:flex;align-items:center;gap:10px;margin-top:5px;flex-wrap:wrap}.ac-file-button{position:relative;min-height:42px;overflow:hidden}.ac-file-button input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.ac-file-button:has(input:focus-visible){outline:2px solid var(--mgmt-primary);outline-offset:2px}.ac-text-button{min-height:42px;display:inline-flex;align-items:center;gap:7px;padding:0 8px;border:0;background:transparent;color:var(--mgmt-muted);font:inherit;font-size:.72rem;font-weight:750;cursor:pointer}.ac-text-button:hover{color:var(--mgmt-heading)}
.ac-zone-list{display:grid;gap:12px}.ac-zone-list article{padding:16px;border:1px solid var(--mgmt-border);border-radius:11px}.ac-zone-list article>header{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:15px}.ac-zone-list article>header>div{display:flex;align-items:center;gap:9px;color:var(--mgmt-primary)}.ac-zone-list article>header span{display:grid;gap:2px}.ac-zone-list article b{font-size:.79rem;color:var(--mgmt-heading)}.ac-zone-list article small{font-size:.67rem;color:var(--mgmt-muted)}.ac-zone-list details{margin-top:13px;padding-top:11px;border-top:1px solid var(--mgmt-border);font-size:.7rem;color:var(--mgmt-muted)}.ac-zone-list summary{cursor:pointer;font-weight:700;color:var(--mgmt-text)}.ac-zone-list details p{margin:8px 0 0;line-height:1.5}
.ac-inline-note{display:flex;align-items:flex-start;gap:8px;margin:12px 0 0;padding:10px 12px;border-radius:8px;background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.7rem;line-height:1.45}.ac-inline-note svg{flex:0 0 auto;color:var(--mgmt-primary)}
.ac-security-grid{display:grid;gap:0}.ac-security-grid article{display:grid;grid-template-columns:38px minmax(0,1fr);gap:12px;padding:20px 22px;border-bottom:1px solid var(--mgmt-border)}.ac-security-grid article:last-child{border-bottom:0}.ac-security-grid article>span{width:38px;height:38px;display:grid;place-items:center;border-radius:9px;background:color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-subtle));color:var(--mgmt-primary)}.ac-security-grid article>div{display:grid;justify-items:start;gap:5px}.ac-security-grid b{font-size:.8rem;color:var(--mgmt-heading)}.ac-security-grid p{margin:0;max-width:75ch;color:var(--mgmt-muted);font-size:.74rem;line-height:1.5}.ac-security-grid a{color:var(--mgmt-primary);font-size:.72rem;font-weight:750;text-decoration:none}.ac-security-grid small{color:var(--mgmt-faint);font-size:.68rem}
@media(max-width:1000px){.ac-workspace{padding:22px}.ac-layout{grid-template-columns:1fr;gap:18px}.ac-section-nav{position:static;display:flex;overflow-x:auto;padding-bottom:5px;scrollbar-width:thin;scrollbar-color:var(--mgmt-border-strong) transparent}.ac-section-nav button{min-width:180px}.ac-section-nav small{display:none}}
@media(max-width:720px){.ac-workspace{padding:17px 14px 32px}.ac-overview{align-items:flex-start;flex-direction:column}.ac-overview-actions{justify-content:flex-start}.ac-form-grid,.ac-menu-picker,.ac-review-list,.ac-payment-methods{grid-template-columns:1fr}.ac-editor-section>header,.ac-editor-section>footer{align-items:flex-start;flex-direction:column}.ac-editor-section>footer .ac-primary-button{width:100%}.ac-editor-body{padding:17px}.ac-review-list{padding:15px}.ac-modal>.ac-form-grid{padding:17px}.ac-store-state{align-items:flex-start;flex-direction:column}.ac-store-state select{width:100%}.ac-qr-editor{grid-template-columns:1fr}.ac-qr-preview{width:min(180px,100%)}}
@media(prefers-reduced-motion:reduce){.ac-skeleton i{animation:none}.ac-primary-button,.ac-secondary-button,.ac-section-nav button{transition:none}}

/* Personal staff workspace preferences */
html[data-staff-font-size="large"]{font-size:112.5%}
html[data-staff-font-size="extra_large"]{font-size:125%}
html[data-staff-motion="reduce"] .app-layout:is(.legacy-staff,.legacy-admin) *,html[data-staff-motion="reduce"] .app-layout:is(.legacy-staff,.legacy-admin) *:before,html[data-staff-motion="reduce"] .app-layout:is(.legacy-staff,.legacy-admin) *:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
.app-layout.legacy-staff[data-staff-contrast="true"]{--mgmt-border:#9aada3;--mgmt-border-strong:#657b70;--mgmt-text:#111814;--mgmt-heading:#050806;--mgmt-muted:#435148;--mgmt-faint:#5b6a61;--mgmt-input:#fff}
.app-layout.legacy-staff[data-theme="dark"][data-staff-contrast="true"]{--mgmt-border:#66817d;--mgmt-border-strong:#91aaa6;--mgmt-text:#f0f7f6;--mgmt-heading:#fff;--mgmt-muted:#d0ddda;--mgmt-faint:#adbfbb;--mgmt-input:#020405}
.app-layout.legacy-staff[data-staff-density="compact"] .internal-main{padding:28px 30px 46px}
.app-layout.legacy-staff[data-staff-density="compact"] :is(.ops-summary-card,.inv-summary-card,.menu-item-card,.txn-report-stat,.staff-settings-card>header){padding:13px 15px}
.app-layout.legacy-staff[data-staff-density="compact"] :is(.inv-table,.txn-table,.module-table-card table) :is(th,td){padding-top:8px;padding-bottom:8px}
.app-layout.legacy-staff[data-staff-density="compact"] :is(.ops-card,.inv-card){padding:11px}
.app-layout.legacy-staff[data-staff-density="compact"] .staff-workspace-groups{gap:9px;padding:14px 18px}
.app-layout.legacy-staff[data-staff-density="compact"] .staff-workspace-group{padding:12px}
.app-layout.legacy-admin[data-staff-contrast="true"]{--mgmt-border:#9aada3;--mgmt-border-strong:#657b70;--mgmt-text:#111814;--mgmt-heading:#050806;--mgmt-muted:#435148;--mgmt-faint:#5b6a61;--mgmt-input:#fff}
.app-layout.legacy-admin[data-theme="dark"][data-staff-contrast="true"]{--mgmt-border:#66817d;--mgmt-border-strong:#91aaa6;--mgmt-text:#f0f7f6;--mgmt-heading:#fff;--mgmt-muted:#d0ddda;--mgmt-faint:#adbfbb;--mgmt-input:#020405}
.app-layout.legacy-admin[data-staff-density="compact"] .internal-main{padding:20px}
.app-layout.legacy-admin[data-staff-density="compact"] :is(.staff-settings-card>header,.ad-panel>header,.ad-panel-body){padding:13px 15px}
.app-layout.legacy-admin[data-staff-density="compact"] :is(.staff-workspace-groups,.staff-notification-preference-groups){gap:9px;padding:14px 18px}
.app-layout.legacy-admin[data-staff-density="compact"] .staff-workspace-group{padding:12px}
.app-layout.legacy-staff[data-staff-overdue="false"] .ops-card.is-overdue{border-color:var(--mgmt-border)}
.app-layout.legacy-staff[data-staff-overdue="false"] .ops-overdue-chip{display:none}

/* Admin decision dashboard */
.ad-dashboard{max-width:1540px;margin:0 auto;padding-bottom:44px;color:var(--mgmt-text)}
.ad-dashboard a{text-decoration:none}.ad-dashboard button,.ad-dashboard a{cursor:pointer}
.ad-live-state{min-height:42px;display:flex;align-items:center;gap:8px;padding:0 13px;border:1px solid color-mix(in srgb,var(--mgmt-primary) 22%,#fff);border-radius:12px;background:#fff;color:var(--mgmt-primary-strong);font-size:.76rem;font-weight:800;white-space:nowrap;box-shadow:0 7px 16px rgba(31,65,45,.09)}.ad-live-state>i{width:8px;height:8px;border-radius:50%;background:var(--mgmt-success);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-success) 14%,transparent)}.ad-live-state span{margin-left:3px!important;color:var(--mgmt-muted)!important;font-size:.7rem!important;font-weight:600}
.internal-title-row .ad-live-state{min-height:34px;padding:0 11px;border-radius:10px;font-size:.7rem}
.ad-error{display:flex;align-items:flex-start;gap:11px;margin-bottom:18px;padding:14px 16px;border:1px solid color-mix(in srgb,var(--mgmt-danger) 32%,var(--mgmt-border));border-radius:14px;background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}.ad-error>div{display:grid;gap:2px;flex:1}.ad-error b{color:var(--mgmt-heading);font-size:.82rem}.ad-error span{color:var(--mgmt-muted);font-size:.76rem}.ad-error button{min-height:36px;display:flex;align-items:center;gap:7px;padding:0 12px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-surface);color:var(--mgmt-text);font:inherit;font-size:.74rem;font-weight:750}
.ad-attention-heading-actions{display:flex;align-items:center;justify-content:flex-end;gap:16px}.ad-attention-heading-actions>a,.ad-section-heading>a,.ad-panel>header>a{display:inline-flex;align-items:center;gap:6px;color:var(--mgmt-primary);font-size:.73rem;font-weight:800;white-space:nowrap}.ad-attention-heading-actions>a:hover,.ad-section-heading>a:hover,.ad-panel>header>a:hover{color:var(--mgmt-primary-strong)}
.ad-section{margin-bottom:38px}.ad-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:15px}.ad-section-heading h2,.ad-panel>header h2{margin:0;color:var(--mgmt-heading);font-size:1rem;letter-spacing:-.015em}.ad-section-heading p,.ad-panel>header p{margin:4px 0 0;color:var(--mgmt-muted);font-size:.76rem;line-height:1.45}
.ad-attention-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.ad-attention-card{min-width:0;min-height:104px;display:grid;grid-template-columns:36px minmax(0,1fr) 15px;align-items:center;gap:10px;padding:14px;border:1px solid var(--mgmt-border);border-radius:16px;background:var(--mgmt-surface);color:var(--mgmt-text);box-shadow:0 8px 24px rgba(31,65,45,.045);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}.ad-attention-card:hover{transform:translateY(-2px);border-color:var(--mgmt-border-strong);box-shadow:var(--mgmt-shadow)}.ad-attention-card:focus-visible,.ad-dashboard a:focus-visible,.ad-sales-chart g:focus-visible{outline:3px solid color-mix(in srgb,var(--mgmt-primary) 35%,transparent);outline-offset:3px}.ad-attention-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-subtle));color:var(--mgmt-primary)}.ad-attention-card>span:nth-child(2){min-width:0;display:grid;gap:2px}.ad-attention-card b{color:var(--mgmt-heading);font-size:1.24rem;line-height:1}.ad-attention-card strong{overflow:hidden;color:var(--mgmt-text);font-size:.75rem;text-overflow:ellipsis;white-space:nowrap}.ad-attention-card small{overflow:hidden;color:var(--mgmt-muted);font-size:.65rem;text-overflow:ellipsis;white-space:nowrap}.ad-attention-card>svg{color:var(--mgmt-faint)}.ad-attention-card.is-rose .ad-attention-icon{background:color-mix(in srgb,var(--mgmt-danger) 10%,var(--mgmt-surface));color:var(--mgmt-danger)}.ad-attention-card.is-amber .ad-attention-icon{background:color-mix(in srgb,var(--mgmt-warning) 11%,var(--mgmt-surface));color:var(--mgmt-warning)}.ad-attention-card.is-blue .ad-attention-icon{background:color-mix(in srgb,#5887a0 11%,var(--mgmt-surface));color:#5887a0}
.ad-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.ad-kpi-card{position:relative;overflow:hidden;min-height:156px;display:flex;flex-direction:column;padding:19px;border:1px solid var(--mgmt-border);border-radius:19px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:0 10px 28px rgba(31,65,45,.055);transition:transform .2s ease,box-shadow .2s ease}.ad-kpi-card:before{content:'';position:absolute;inset:0 0 auto;height:3px;background:var(--mgmt-primary)}.ad-kpi-card:hover{transform:translateY(-2px);box-shadow:var(--mgmt-shadow)}.ad-kpi-top{display:flex;align-items:center;gap:10px}.ad-kpi-top>span{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--mgmt-primary) 9%,var(--mgmt-subtle));color:var(--mgmt-primary)}.ad-kpi-top small{color:var(--mgmt-muted);font-size:.7rem;font-weight:800;letter-spacing:.055em;text-transform:uppercase}.ad-kpi-card>strong{margin-top:19px;color:var(--mgmt-heading);font-size:1.65rem;line-height:1;font-variant-numeric:tabular-nums}.ad-kpi-card>footer{display:flex;align-items:center;gap:7px;margin-top:auto;color:var(--mgmt-muted);font-size:.7rem}.ad-kpi-card>footer>span{display:inline-flex;align-items:center;gap:3px;font-weight:800}.ad-kpi-card>footer .is-up{color:var(--mgmt-success)}.ad-kpi-card>footer .is-down{color:var(--mgmt-danger)}.ad-kpi-card.is-cream:before{background:#c39b50}.ad-kpi-card.is-cream .ad-kpi-top>span{background:color-mix(in srgb,#c39b50 11%,var(--mgmt-surface));color:#a57b2f}.ad-kpi-card.is-blue:before{background:#5887a0}.ad-kpi-card.is-blue .ad-kpi-top>span{background:color-mix(in srgb,#5887a0 11%,var(--mgmt-surface));color:#5887a0}.ad-kpi-card.is-rose:before{background:var(--mgmt-danger)}.ad-kpi-card.is-rose .ad-kpi-top>span{background:color-mix(in srgb,var(--mgmt-danger) 10%,var(--mgmt-surface));color:var(--mgmt-danger)}
.ad-grid{display:grid;grid-auto-flow:dense;gap:18px;margin-bottom:18px;align-items:stretch}.ad-grid-8-4{grid-template-columns:minmax(0,2fr) minmax(300px,1fr)}.ad-grid-7-5{grid-template-columns:minmax(0,1.42fr) minmax(340px,1fr)}.ad-grid-6-6{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-panel{min-width:0;border:1px solid var(--mgmt-border);border-radius:20px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:0 12px 30px rgba(31,65,45,.05);overflow:hidden;transition:border-color .2s ease,box-shadow .2s ease}.ad-panel:hover{border-color:var(--mgmt-border-strong);box-shadow:var(--mgmt-shadow)}.ad-panel>header{min-height:72px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 19px;border-bottom:1px solid var(--mgmt-border)}.ad-panel-body{padding:19px}
.ad-flow-track{height:11px;display:flex;overflow:hidden;border-radius:999px;background:var(--mgmt-subtle)}.ad-flow-track span{min-width:2px;transition:width .7s cubic-bezier(.22,1,.36,1)}.ad-flow-legend{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:19px 0}.ad-flow-legend>div{min-width:0;display:grid;grid-template-columns:31px 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center}.ad-flow-legend>div>span{grid-row:1/3;width:31px;height:31px;display:grid;place-items:center;border-radius:10px}.ad-flow-legend b{color:var(--mgmt-heading);font-size:1rem;line-height:1}.ad-flow-legend small{overflow:hidden;color:var(--mgmt-muted);font-size:.63rem;text-overflow:ellipsis;white-space:nowrap}.ad-overdue-note{display:flex;align-items:center;gap:7px;margin:4px 0 16px;padding:9px 11px;border-radius:10px;background:color-mix(in srgb,var(--mgmt-danger) 8%,var(--mgmt-surface));color:var(--mgmt-danger);font-size:.7rem}.ad-overdue-note span{color:var(--mgmt-muted)}
.ad-order-list{border-top:1px solid var(--mgmt-border)}.ad-list-head,.ad-order-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px}.ad-list-head{padding:12px 0 7px;color:var(--mgmt-faint);font-size:.63rem;font-weight:800;letter-spacing:.065em;text-transform:uppercase}.ad-order-row{min-height:54px;border-top:1px solid color-mix(in srgb,var(--mgmt-border) 70%,transparent)}.ad-order-row>span:first-child{min-width:0;display:grid;gap:2px}.ad-order-row b{color:var(--mgmt-heading);font-size:.77rem}.ad-order-row small{overflow:hidden;color:var(--mgmt-muted);font-size:.67rem;text-overflow:ellipsis;white-space:nowrap}.ad-order-status{max-width:150px;overflow:hidden;padding:5px 8px;border-radius:999px;background:var(--mgmt-subtle);color:var(--mgmt-text);font-size:.62rem;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.ad-order-status.is-completed,.ad-order-status.is-ready-for-pickup{background:color-mix(in srgb,var(--mgmt-success) 11%,var(--mgmt-surface));color:var(--mgmt-success)}.ad-order-status.is-preparing,.ad-order-status.is-out-for-delivery{background:color-mix(in srgb,#5887a0 12%,var(--mgmt-surface));color:#5887a0}.ad-order-status:is(.is-order-received,.is-awaiting-payment-verification,.is-pending-confirmation){background:color-mix(in srgb,var(--mgmt-warning) 11%,var(--mgmt-surface));color:var(--mgmt-warning)}
.ad-customer-mix{display:flex;align-items:center;justify-content:center;gap:22px;padding:4px 0 16px}.ad-mix-ring{--mix:0deg;width:122px;height:122px;display:grid;place-items:center;border-radius:50%;background:conic-gradient(var(--mgmt-primary) 0 var(--mix),#d0aa60 var(--mix) 360deg);position:relative;box-shadow:0 8px 18px rgba(31,65,45,.09)}.ad-mix-ring:before{content:'';position:absolute;inset:17px;border-radius:50%;background:var(--mgmt-surface);box-shadow:inset 0 0 0 1px var(--mgmt-border)}.ad-mix-ring>span{position:relative;display:grid;text-align:center}.ad-mix-ring b{color:var(--mgmt-heading);font-size:1.45rem}.ad-mix-ring small{color:var(--mgmt-muted);font-size:.6rem}.ad-customer-mix>div:last-child{display:grid;gap:12px}.ad-customer-mix>div:last-child>span{display:grid;grid-template-columns:9px auto;column-gap:7px}.ad-customer-mix i{grid-row:1/3;width:9px;height:9px;margin-top:3px;border-radius:3px}.ad-customer-mix i.is-returning{background:var(--mgmt-primary)}.ad-customer-mix i.is-new{background:#d0aa60}.ad-customer-mix b{color:var(--mgmt-heading);font-size:.82rem}.ad-customer-mix small{color:var(--mgmt-muted);font-size:.64rem}.ad-mix-breakdown{min-width:0}.ad-mix-breakdown p{display:flex;align-items:center;gap:5px;margin:1px 0 0;color:var(--mgmt-primary);font-size:.61rem;font-weight:800;line-height:1.3}.ad-mix-breakdown p svg{flex:none}.ad-customer-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:14px}.ad-customer-stats>div{display:flex;align-items:center;gap:8px;min-width:0;padding:10px;border-radius:11px;background:var(--mgmt-subtle);color:var(--mgmt-primary)}.ad-customer-stats span{min-width:0;display:grid;gap:2px}.ad-customer-stats b{color:var(--mgmt-heading);font-size:.82rem}.ad-customer-stats small{overflow:hidden;color:var(--mgmt-muted);font-size:.6rem;text-overflow:ellipsis;white-space:nowrap}.ad-message-list{display:grid}.ad-message-list>a{display:grid;grid-template-columns:7px minmax(0,1fr);gap:9px;padding:10px 4px;border-top:1px solid var(--mgmt-border)}.ad-message-list>a>i{width:7px;height:7px;margin-top:5px;border-radius:50%;background:var(--mgmt-warning)}.ad-message-list>a>span{min-width:0;display:grid;gap:2px}.ad-message-list b{overflow:hidden;color:var(--mgmt-heading);font-size:.72rem;text-overflow:ellipsis;white-space:nowrap}.ad-message-list small{overflow:hidden;color:var(--mgmt-muted);font-size:.63rem;text-overflow:ellipsis;white-space:nowrap}
.ad-chart-summary{display:flex;justify-content:space-between;gap:12px;margin-bottom:5px}.ad-chart-summary>span{display:grid}.ad-chart-summary>span:last-child{text-align:right}.ad-chart-summary b{color:var(--mgmt-heading);font-size:.9rem}.ad-chart-summary>span:first-child b{font-size:1.2rem}.ad-chart-summary small{color:var(--mgmt-muted);font-size:.64rem}.ad-sales-chart svg{display:block;width:100%;height:250px;overflow:visible}.ad-chart-gridline{stroke:var(--mgmt-border);stroke-width:1;stroke-dasharray:4 7}.ad-sales-line{fill:none;stroke:var(--mgmt-primary);stroke-width:3}.ad-sales-chart circle{fill:var(--mgmt-surface);stroke:var(--mgmt-primary);stroke-width:3;transition:r .18s ease}.ad-sales-chart g{outline:none}.ad-sales-chart g.is-active circle{fill:var(--mgmt-primary);stroke:color-mix(in srgb,var(--mgmt-primary) 24%,var(--mgmt-surface));stroke-width:7}.ad-chart-axis{display:flex;justify-content:space-between;color:var(--mgmt-faint);font-size:.61rem}
.ad-donut-wrap{display:grid;grid-template-columns:180px minmax(0,1fr);align-items:center;gap:20px;min-height:285px}.ad-donut-feature{display:grid;justify-items:center;gap:8px}.ad-donut-visual{position:relative}.ad-donut-visual svg{display:block;width:180px;height:180px;overflow:visible}.ad-donut-visual circle{transition:stroke-width .2s ease,stroke-opacity .2s ease}.ad-donut-visual circle:focus{outline:none;filter:drop-shadow(0 0 4px color-mix(in srgb,var(--mgmt-primary) 34%,transparent))}.ad-donut-visual>span{position:absolute;inset:0;display:grid;place-content:center;text-align:center;pointer-events:none}.ad-donut-visual b{color:var(--mgmt-heading);font-size:1.35rem;line-height:1}.ad-donut-visual small{max-width:80px;margin-top:5px;overflow:hidden;color:var(--mgmt-muted);font-size:.62rem;font-weight:750;text-overflow:ellipsis;white-space:nowrap}.ad-donut-leading{display:grid;gap:2px;text-align:center}.ad-donut-leading>span{color:var(--mgmt-faint);font-size:.59rem;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.ad-donut-leading>b{color:var(--mgmt-heading);font-size:.78rem}.ad-donut-leading>small{color:var(--mgmt-muted);font-size:.61rem}.ad-donut-legend{display:grid;gap:7px}.ad-donut-total{display:flex;align-items:end;justify-content:space-between;gap:12px;padding:0 3px 9px;border-bottom:1px solid var(--mgmt-border)}.ad-donut-total>span{display:grid;gap:2px}.ad-donut-total b{color:var(--mgmt-heading);font-size:1.05rem}.ad-donut-total small{color:var(--mgmt-muted);font-size:.61rem}.ad-donut-total strong{color:var(--mgmt-heading);font-size:.75rem;font-variant-numeric:tabular-nums}.ad-donut-legend>button{width:100%;display:grid;grid-template-columns:9px minmax(0,1fr) auto;align-items:center;gap:9px;padding:8px;border:1px solid transparent;border-radius:10px;background:transparent;color:inherit;font:inherit;text-align:left;transition:background-color .18s ease,border-color .18s ease}.ad-donut-legend>button:hover,.ad-donut-legend>button.is-active{border-color:var(--mgmt-border);background:var(--mgmt-subtle)}.ad-donut-legend>button:focus-visible{outline:3px solid color-mix(in srgb,var(--mgmt-primary) 30%,transparent);outline-offset:2px}.ad-donut-legend>button>i{width:9px;height:9px;border-radius:3px}.ad-donut-legend button>span{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 8px}.ad-donut-legend button b{overflow:hidden;color:var(--mgmt-heading);font-size:.72rem;text-overflow:ellipsis;white-space:nowrap}.ad-donut-legend button small{color:var(--mgmt-muted);font-size:.61rem;white-space:nowrap}.ad-donut-legend button strong{color:var(--mgmt-text);font-size:.68rem;font-variant-numeric:tabular-nums;white-space:nowrap}.ad-donut-legend button em{grid-column:1/-1;height:4px;overflow:hidden;border-radius:999px;background:var(--mgmt-border)}.ad-donut-legend button em>i{display:block;height:100%;border-radius:inherit;transition:width .55s cubic-bezier(.22,1,.36,1)}
.ad-inventory-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:17px}.ad-inventory-summary>div{display:flex;align-items:center;gap:9px;padding:11px;border-radius:12px;background:var(--mgmt-subtle);color:var(--mgmt-primary)}.ad-inventory-summary span{display:grid}.ad-inventory-summary b{color:var(--mgmt-heading);font-size:.92rem}.ad-inventory-summary small{color:var(--mgmt-muted);font-size:.62rem}.ad-inventory-summary .is-danger{color:var(--mgmt-danger);background:color-mix(in srgb,var(--mgmt-danger) 7%,var(--mgmt-surface))}.ad-inventory-summary .is-warning{color:var(--mgmt-warning);background:color-mix(in srgb,var(--mgmt-warning) 8%,var(--mgmt-surface))}.ad-inventory-summary .is-info{color:#5887a0;background:color-mix(in srgb,#5887a0 8%,var(--mgmt-surface))}.ad-stock-list{display:grid}.ad-stock-row{display:grid;grid-template-columns:minmax(160px,1fr) minmax(120px,1fr) 66px;align-items:center;gap:14px;min-height:57px;border-top:1px solid var(--mgmt-border)}.ad-stock-row>span{min-width:0;display:grid;gap:2px}.ad-stock-row b{overflow:hidden;color:var(--mgmt-heading);font-size:.75rem;text-overflow:ellipsis;white-space:nowrap}.ad-stock-row small{overflow:hidden;color:var(--mgmt-muted);font-size:.63rem;text-overflow:ellipsis;white-space:nowrap}.ad-stock-row>div{height:7px;overflow:hidden;border-radius:999px;background:var(--mgmt-subtle)}.ad-stock-row>div i{display:block;height:100%;border-radius:inherit;background:var(--mgmt-danger)}.ad-stock-row>strong{text-align:right;color:var(--mgmt-warning);font-size:.68rem}
.ad-ranked-list{display:grid}.ad-ranked-list>div{display:grid;grid-template-columns:30px minmax(0,1fr);gap:11px;padding:11px 0;border-bottom:1px solid var(--mgmt-border)}.ad-ranked-list>div:last-child{border-bottom:0}.ad-ranked-list>div>span{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;background:color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-subtle));color:var(--mgmt-primary);font-size:.62rem;font-weight:900}.ad-ranked-list>div>div{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px}.ad-ranked-list b{overflow:hidden;color:var(--mgmt-heading);font-size:.74rem;text-overflow:ellipsis;white-space:nowrap}.ad-ranked-list small{color:var(--mgmt-muted);font-size:.63rem}.ad-ranked-list>div>div>i{grid-column:1/-1;height:5px;overflow:hidden;border-radius:999px;background:var(--mgmt-subtle)}.ad-ranked-list em{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--mgmt-primary),#69a580)}
.ad-horizontal-bars{display:grid;gap:17px;padding:7px 0}.ad-horizontal-bars>div{display:grid;grid-template-columns:115px minmax(100px,1fr) 34px;align-items:center;gap:13px}.ad-horizontal-bars>div>span{display:flex;justify-content:space-between;gap:8px}.ad-horizontal-bars b{color:var(--mgmt-heading);font-size:.74rem}.ad-horizontal-bars small{color:var(--mgmt-muted);font-size:.64rem}.ad-horizontal-bars>div>i{height:11px;overflow:hidden;border-radius:999px;background:var(--mgmt-subtle)}.ad-horizontal-bars em{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--mgmt-primary),#63a07c);transition:width .7s cubic-bezier(.22,1,.36,1)}.ad-horizontal-bars strong{text-align:right;color:var(--mgmt-heading);font-size:.76rem}
.ad-activity-list{display:grid}.ad-activity-list>div:not(.ad-empty){display:grid;grid-template-columns:8px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:48px;border-bottom:1px solid var(--mgmt-border)}.ad-activity-list>div:last-child{border-bottom:0}.ad-activity-list>div>i{width:8px;height:8px;border-radius:50%;background:var(--mgmt-primary)}.ad-activity-list>div>i:is(.is-warning,.is-failed){background:var(--mgmt-warning)}.ad-activity-list>div>i.is-critical{background:var(--mgmt-danger);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-danger) 12%,transparent)}.ad-activity-list span{min-width:0;display:grid;gap:2px}.ad-activity-list b{overflow:hidden;color:var(--mgmt-heading);font-size:.72rem;text-overflow:ellipsis;white-space:nowrap}.ad-activity-list small{color:var(--mgmt-muted);font-size:.62rem}.ad-activity-list em{max-width:110px;overflow:hidden;color:var(--mgmt-faint);font-size:.61rem;font-style:normal;text-overflow:ellipsis;text-transform:capitalize;white-space:nowrap}
.ad-empty{min-height:82px;display:flex!important;align-items:center;justify-content:center;gap:8px;color:var(--mgmt-muted);font-size:.7rem}.ad-empty svg{color:var(--mgmt-primary)}
.ad-skeleton{display:grid;gap:15px}.ad-skeleton>i,.ad-skeleton>div>i{display:block;border-radius:16px;background:linear-gradient(90deg,var(--mgmt-subtle),var(--mgmt-hover),var(--mgmt-subtle));background-size:220% 100%;animation:ac-shimmer 1.35s linear infinite}.ad-skeleton>.wide{height:72px}.ad-skeleton>div{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:11px}.ad-skeleton>div:nth-of-type(2){grid-template-columns:repeat(4,minmax(0,1fr))}.ad-skeleton>div>i{height:110px}.ad-skeleton>.tall{height:340px}
@media(max-width:1180px){.ad-attention-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:1280px){.ad-flow-legend{grid-template-columns:repeat(3,minmax(0,1fr))}.ad-donut-wrap{grid-template-columns:150px minmax(0,1fr)}.ad-donut-visual svg{width:150px;height:150px}}
@media(max-width:1050px){.ad-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-grid-8-4,.ad-grid-7-5,.ad-grid-6-6{grid-template-columns:1fr}.ad-donut-wrap{grid-template-columns:190px minmax(0,1fr)}.ad-donut-visual svg{width:180px;height:180px}.ad-skeleton>div,.ad-skeleton>div:nth-of-type(2){grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.ad-dashboard{padding-bottom:28px}.internal-title-row .ad-live-state{min-height:32px}.ad-section-heading,.ad-panel>header{align-items:flex-start;flex-direction:column}.ad-attention-heading-actions{justify-content:flex-start;flex-wrap:wrap;gap:10px 16px}.ad-section{margin-bottom:30px}.ad-attention-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-attention-card{grid-template-columns:34px minmax(0,1fr);min-height:98px}.ad-attention-card>svg{display:none}.ad-kpi-grid{grid-template-columns:1fr}.ad-kpi-card{min-height:142px}.ad-panel>header{min-height:0}.ad-panel-body{padding:16px}.ad-flow-legend{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-donut-wrap{grid-template-columns:1fr;justify-items:center}.ad-donut-legend{width:100%}.ad-inventory-summary{grid-template-columns:1fr}.ad-stock-row{grid-template-columns:minmax(0,1fr) 55px}.ad-stock-row>div{grid-column:1/-1;grid-row:2}.ad-stock-row>strong{grid-column:2;grid-row:1}.ad-horizontal-bars>div{grid-template-columns:90px minmax(80px,1fr) 28px}.ad-customer-mix{justify-content:flex-start}.ad-sales-chart svg{height:210px}.ad-skeleton>div,.ad-skeleton>div:nth-of-type(2){grid-template-columns:1fr}}
@media(max-width:450px){.ad-attention-grid{grid-template-columns:1fr}.ad-attention-card{min-height:82px}.ad-flow-legend{grid-template-columns:1fr 1fr}.ad-customer-mix{gap:14px}.ad-mix-ring{width:108px;height:108px}.ad-customer-stats{grid-template-columns:1fr}.ad-activity-list em{display:none}}
@media(prefers-reduced-motion:reduce){.ad-attention-card,.ad-kpi-card,.ad-panel,.ad-flow-track span,.ad-horizontal-bars em,.ad-sales-chart circle{transition:none}.ad-skeleton>i,.ad-skeleton>div>i{animation:none}}

/* Dashboard v2: reference-led command center layout. */
.ad-dashboard-v2{--ad-v2-gap:20px;display:grid;gap:var(--ad-v2-gap);padding-bottom:44px}
.ad-quick-nav{display:flex;align-items:center;gap:8px}
.ad-quick-nav a{min-height:44px;display:inline-flex;align-items:center;gap:8px;padding:0 13px;border:1px solid var(--mgmt-border);border-radius:12px;background:color-mix(in srgb,var(--mgmt-surface) 88%,transparent);color:var(--mgmt-text);font-size:.75rem;font-weight:800;white-space:nowrap;transition:background-color .2s ease,border-color .2s ease,color .2s ease,box-shadow .2s ease}
.ad-quick-nav a:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover);color:var(--mgmt-primary);box-shadow:0 7px 18px rgba(31,65,45,.07)}
.ad-quick-nav a:focus-visible,.ad-dashboard-v2 :is(.ad-panel>header a,.ad-settings-link):focus-visible{outline:3px solid color-mix(in srgb,var(--mgmt-primary) 28%,transparent);outline-offset:2px}
.ad-overview-section{margin:5px 0 0}
.ad-dashboard-v2 .ad-section-heading{margin-bottom:14px}
.ad-dashboard-v2 .ad-section-heading h2{font-size:1.04rem}
.ad-dashboard-v2 .ad-section-heading p{font-size:.76rem}
.ad-dashboard-v2 .ad-section-heading>a{min-height:44px;display:inline-flex;align-items:center}
.ad-dashboard-v2 .ad-kpi-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.ad-dashboard-v2 .ad-kpi-card{min-height:132px;padding:17px;border-radius:17px;box-shadow:0 8px 22px rgba(31,65,45,.045)}
.ad-dashboard-v2 .ad-kpi-card:hover{transform:none;border-color:var(--mgmt-border-strong);box-shadow:0 12px 26px rgba(31,65,45,.075)}
.ad-dashboard-v2 .ad-kpi-card>strong{margin-top:16px;font-size:clamp(1.35rem,1.8vw,1.65rem)}
.ad-dashboard-v2 .ad-kpi-card>footer{font-size:.72rem}
.ad-v2-grid{display:grid;gap:var(--ad-v2-gap);align-items:stretch}
.ad-v2-grid-main{grid-template-columns:minmax(0,1.9fr) minmax(320px,.85fr)}
.ad-v2-grid-wide{grid-template-columns:minmax(0,1.55fr) minmax(360px,1fr)}
.ad-v2-grid-even{grid-template-columns:repeat(2,minmax(0,1fr))}
.ad-dashboard-v2 .ad-panel{border-radius:19px;box-shadow:0 10px 26px rgba(31,65,45,.045)}
.ad-dashboard-v2 .ad-panel:hover{box-shadow:0 14px 30px rgba(31,65,45,.07)}
.ad-dashboard-v2 .ad-panel>header{min-height:76px;padding:19px 21px}
.ad-dashboard-v2 .ad-panel>header h2{font-size:.98rem;letter-spacing:-.01em}
.ad-dashboard-v2 .ad-panel>header p{margin-top:5px;font-size:.74rem;line-height:1.45}
.ad-dashboard-v2 .ad-panel>header>a{min-height:44px;display:inline-flex;align-items:center;gap:5px;font-size:.73rem;white-space:nowrap}
.ad-dashboard-v2 .ad-panel-body{padding:21px}
.ad-v2-sales-panel .ad-sales-chart svg{height:285px}
.ad-v2-sales-panel .ad-chart-summary{margin-bottom:10px}
.ad-v2-attention-panel .ad-panel-body{display:flex;flex-direction:column;height:calc(100% - 76px)}
.ad-v2-attention-panel .ad-attention-grid{grid-template-columns:1fr;gap:10px}
.ad-v2-attention-panel .ad-attention-card{min-height:82px;padding:13px 14px;border-radius:14px;box-shadow:none}
.ad-v2-attention-panel .ad-attention-card:hover{transform:none;border-color:var(--mgmt-border-strong);box-shadow:0 8px 18px rgba(31,65,45,.055)}
.ad-v2-attention-panel .ad-attention-card strong{font-size:.76rem}
.ad-v2-attention-panel .ad-attention-card small{font-size:.68rem}
.ad-attention-count{display:inline-flex;align-items:center;min-height:32px;padding:0 10px;border-radius:999px;background:color-mix(in srgb,var(--mgmt-warning) 10%,var(--mgmt-surface));color:var(--mgmt-warning);font-size:.7rem;font-weight:850;white-space:nowrap}
.ad-settings-link{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;padding:12px 3px 0;color:var(--mgmt-primary);font-size:.73rem;font-weight:850}
.ad-dashboard-v2 .ad-list-head{font-size:.68rem}
.ad-dashboard-v2 .ad-order-row{min-height:58px}
.ad-dashboard-v2 .ad-order-row b,.ad-dashboard-v2 .ad-ranked-list b,.ad-dashboard-v2 .ad-stock-row b{font-size:.78rem}
.ad-dashboard-v2 .ad-order-row small,.ad-dashboard-v2 .ad-ranked-list small,.ad-dashboard-v2 .ad-stock-row small{font-size:.68rem}
.ad-dashboard-v2 .ad-order-status{font-size:.66rem}
.ad-dashboard-v2 .ad-donut-wrap{min-height:300px;grid-template-columns:160px minmax(0,1fr);gap:17px}
.ad-dashboard-v2 .ad-donut-visual svg{width:160px;height:160px}
.ad-dashboard-v2 .ad-donut-legend button{min-height:48px}
.ad-dashboard-v2 .ad-customer-stats small,.ad-dashboard-v2 .ad-message-list small,.ad-dashboard-v2 .ad-activity-list small{font-size:.67rem}
.ad-dashboard-v2 .ad-message-list>a{min-height:52px;align-items:center}
.ad-v2-subsection{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px}
.ad-v2-subsection span{color:var(--mgmt-heading);font-size:.76rem;font-weight:850}
.ad-v2-subsection small{color:var(--mgmt-muted);font-size:.67rem}
.ad-v2-subsection-divided{margin-top:23px;padding-top:18px;border-top:1px solid var(--mgmt-border)}

@media(max-width:1320px){.ad-dashboard-v2 .ad-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.ad-v2-grid-main{grid-template-columns:minmax(0,1.55fr) minmax(310px,1fr)}.ad-v2-grid-wide{grid-template-columns:minmax(0,1.35fr) minmax(330px,1fr)}}
@media(max-width:1100px){.ad-v2-grid-main,.ad-v2-grid-wide,.ad-v2-grid-even{grid-template-columns:1fr}.ad-v2-attention-panel .ad-attention-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-settings-link{margin-top:10px}.ad-dashboard-v2 .ad-donut-wrap{grid-template-columns:190px minmax(0,1fr)}.ad-dashboard-v2 .ad-donut-visual svg{width:180px;height:180px}}
@media(max-width:720px){.ad-dashboard-v2{--ad-v2-gap:16px;padding-bottom:28px}.ad-quick-nav{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.ad-quick-nav a{justify-content:center;padding:0 8px}.ad-dashboard-v2 .ad-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-dashboard-v2 .ad-kpi-card{min-height:126px}.ad-v2-attention-panel .ad-attention-grid{grid-template-columns:1fr}.ad-dashboard-v2 .ad-panel>header{padding:17px}.ad-dashboard-v2 .ad-panel-body{padding:17px}.ad-v2-sales-panel .ad-sales-chart svg{height:220px}.ad-dashboard-v2 .ad-donut-wrap{grid-template-columns:1fr}.ad-v2-subsection{align-items:flex-start;flex-direction:column;gap:3px}}
@media(max-width:430px){.ad-quick-nav a{flex-direction:column;gap:3px;min-height:56px;font-size:.66rem}.ad-dashboard-v2 .ad-kpi-grid{grid-template-columns:1fr}.ad-dashboard-v2 .ad-kpi-card{min-height:120px}.ad-dashboard-v2 .ad-section-heading>a{align-self:flex-start}.ad-dashboard-v2 .ad-customer-mix{align-items:flex-start;flex-direction:column}.ad-dashboard-v2 .ad-horizontal-bars>div{grid-template-columns:82px minmax(70px,1fr) 28px}}
@media(prefers-reduced-motion:reduce){.ad-dashboard-v2 *{scroll-behavior:auto}.ad-dashboard-v2 :is(.ad-quick-nav a,.ad-kpi-card,.ad-panel,.ad-attention-card){transition:none}}

.app-layout.legacy-staff .internal-main,.app-layout.legacy-admin .internal-main{background:var(--mgmt-canvas);color:var(--mgmt-text);transition:background-color .2s ease,color .2s ease}
.app-layout.legacy-staff[data-theme="dark"] .internal-main{background:var(--mgmt-canvas)}
.app-layout.legacy-admin[data-theme="dark"] .internal-main{background:radial-gradient(circle at 36% 112%,rgba(43,185,141,.085),transparent 35%),linear-gradient(180deg,#050708 0%,#070a0b 68%,#091210 100%)}
.app-layout.legacy-staff .internal-sidebar,.app-layout.legacy-admin .internal-sidebar{background:radial-gradient(circle at 18% 12%,color-mix(in srgb,var(--mgmt-primary) 14%,transparent),transparent 18%),radial-gradient(circle at 82% 47%,color-mix(in srgb,var(--mgmt-primary) 9%,transparent),transparent 21%),radial-gradient(circle at 24% 79%,color-mix(in srgb,var(--mgmt-primary) 12%,transparent),transparent 20%),linear-gradient(180deg,var(--mgmt-surface),var(--mgmt-subtle));border-color:var(--mgmt-border);box-shadow:12px 0 34px rgba(0,0,0,.08)}
.app-layout.legacy-staff .internal-brand h2,.app-layout.legacy-admin .internal-brand h2{color:var(--mgmt-heading)}
.app-layout.legacy-staff .internal-brand p,.app-layout.legacy-admin .internal-brand p{color:var(--mgmt-muted)}
.app-layout.legacy-staff .internal-group-label,.app-layout.legacy-admin .internal-group-label{color:var(--mgmt-faint)}
.app-layout.legacy-staff .internal-sidebar nav a,.app-layout.legacy-staff .sidebar-exit,.app-layout.legacy-admin .internal-sidebar nav a,.app-layout.legacy-admin .sidebar-exit{color:var(--mgmt-muted);border-radius:14px}
.app-layout.legacy-staff .internal-sidebar nav a:hover,.app-layout.legacy-staff .internal-sidebar nav a.active,.app-layout.legacy-admin .internal-sidebar nav a:hover,.app-layout.legacy-admin .internal-sidebar nav a.active{background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary);box-shadow:0 9px 20px rgba(0,0,0,.18)}
.app-layout.legacy-staff .sidebar-exit:hover,.app-layout.legacy-admin .sidebar-exit:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout.legacy-staff .internal-page-header,.app-layout.legacy-admin .internal-page-header{position:relative;overflow:visible;gap:20px;margin-bottom:30px;padding:22px 24px;border:1px solid var(--mgmt-border);border-radius:24px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .internal-page-header.is-compact,.app-layout.legacy-admin .internal-page-header.is-compact{padding-top:18px;padding-bottom:18px}
.app-layout.legacy-staff .internal-page-header:before,.app-layout.legacy-admin .internal-page-header:before{content:'';position:absolute;z-index:1;inset:0 auto auto 0;width:25%;height:100%;pointer-events:none;background:radial-gradient(ellipse 115% 185% at top left,color-mix(in srgb,var(--mgmt-primary) 42%,transparent) 0%,color-mix(in srgb,var(--mgmt-primary) 18%,transparent) 58%,transparent 92%);opacity:.72}
.app-layout.legacy-staff .internal-page-header:after,.app-layout.legacy-admin .internal-page-header:after{z-index:0;background:linear-gradient(115deg,var(--mgmt-highlight),transparent)}
.app-layout.legacy-staff .internal-page-header:before,.app-layout.legacy-staff .internal-page-header:after,.app-layout.legacy-admin .internal-page-header:before,.app-layout.legacy-admin .internal-page-header:after{border-radius:inherit}
.app-layout.legacy-staff .internal-page-header>*,.app-layout.legacy-admin .internal-page-header>*{position:relative;z-index:2}
.app-layout.legacy-staff .internal-page-header h1,.app-layout.legacy-admin .internal-page-header h1{color:var(--mgmt-heading)}
.app-layout.legacy-staff .internal-page-header span,.app-layout.legacy-admin .internal-page-header span{color:var(--mgmt-muted)}
.app-layout.legacy-staff:not([data-theme="dark"]) .internal-page-header,.app-layout.legacy-admin:not([data-theme="dark"]) .internal-page-header{background:var(--mgmt-surface);box-shadow:0 16px 36px rgba(15,23,42,.08),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff:not([data-theme="dark"]) .internal-page-header:before,.app-layout.legacy-staff:not([data-theme="dark"]) .internal-page-header:after,.app-layout.legacy-admin:not([data-theme="dark"]) .internal-page-header:before,.app-layout.legacy-admin:not([data-theme="dark"]) .internal-page-header:after{display:none}
.app-layout.legacy-staff .internal-live-datetime,.app-layout.legacy-staff .internal-utility-button,.app-layout.legacy-admin .internal-live-datetime,.app-layout.legacy-admin .internal-utility-button{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-primary);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .internal-live-datetime span,.app-layout.legacy-admin .internal-live-datetime span{color:var(--mgmt-muted)}
.app-layout.legacy-staff .internal-live-datetime b,.app-layout.legacy-admin .internal-live-datetime b{color:var(--mgmt-heading)}
.app-layout.legacy-staff .internal-utility-button:hover,.app-layout.legacy-admin .internal-utility-button:hover{background:var(--mgmt-hover)}
.app-layout.legacy-staff .internal-utility-button:focus-visible,.app-layout.legacy-admin .internal-utility-button:focus-visible{outline-color:var(--mgmt-primary)}
.app-layout.legacy-staff .internal-utility-badge,.app-layout.legacy-admin .internal-utility-badge{box-shadow:0 0 0 2px var(--mgmt-surface)}
.app-layout.legacy-admin .internal-notification-anchor>.internal-utility-button{width:42px;height:42px;border-radius:13px;border-color:color-mix(in srgb,var(--mgmt-primary) 24%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 5%,var(--mgmt-input));box-shadow:inset 0 1px 0 var(--mgmt-highlight),0 5px 14px rgba(31,65,45,.08)}.app-layout.legacy-admin .internal-notification-anchor>.internal-utility-button:hover{border-color:color-mix(in srgb,var(--mgmt-primary) 42%,var(--mgmt-border-strong));background:color-mix(in srgb,var(--mgmt-primary) 11%,var(--mgmt-input));color:var(--mgmt-primary-strong);transform:translateY(-1px)}.app-layout.legacy-admin .internal-notification-anchor>.internal-utility-button:active{transform:translateY(0)}.app-layout.legacy-admin .internal-notification-anchor>.internal-utility-button svg{stroke-width:2.2}.app-layout.legacy-admin .internal-notification-anchor>.internal-utility-button+.staff-notification-center{right:0}.app-layout.legacy-admin .internal-utility-badge{top:-4px;right:-4px;min-width:19px;height:19px;border:2px solid var(--mgmt-surface);background:var(--mgmt-danger);color:#fff;font-size:.61rem;line-height:1}
.app-layout.legacy-admin .staff-notification-center{border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-text);box-shadow:var(--mgmt-shadow-high),inset 0 1px 0 var(--mgmt-highlight)}.app-layout.legacy-admin .staff-notification-center>header{border-color:var(--mgmt-border);background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface))}.app-layout.legacy-admin .staff-notification-center>header span,.app-layout.legacy-admin .staff-notification-list small,.app-layout.legacy-admin .staff-notification-list time,.app-layout.legacy-admin .staff-notification-empty{color:var(--mgmt-muted)}.app-layout.legacy-admin .staff-notification-center :is(h2,b){color:var(--mgmt-heading)}.app-layout.legacy-admin .staff-notification-center>header button,.app-layout.legacy-admin .staff-notification-actions button{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-text)}.app-layout.legacy-admin .staff-notification-actions,.app-layout.legacy-admin .staff-notification-center>footer{border-color:var(--mgmt-border)}.app-layout.legacy-admin .staff-notification-list>button{color:var(--mgmt-text)}.app-layout.legacy-admin .staff-notification-list>button:hover{background:var(--mgmt-hover)}.app-layout.legacy-admin .staff-notification-list>button.is-unread{background:color-mix(in srgb,var(--mgmt-primary) 13%,var(--mgmt-surface))}.app-layout.legacy-admin .staff-notification-center>footer{background:var(--mgmt-surface)}.app-layout.legacy-admin .staff-notification-center>footer button{color:var(--mgmt-primary-strong)}
.app-layout.legacy-admin[data-theme="dark"] .staff-notification-center{background:linear-gradient(155deg,var(--mgmt-elevated),var(--mgmt-surface) 44%,var(--mgmt-subtle));box-shadow:0 28px 68px rgba(0,0,0,.7),inset 0 1px 0 var(--mgmt-highlight)}.app-layout.legacy-admin[data-theme="dark"] .staff-notification-center>header{background:radial-gradient(circle at 90% -30%,rgba(43,185,141,.19),transparent 48%),linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface))}.app-layout.legacy-admin[data-theme="dark"] .staff-notification-list{background:var(--mgmt-subtle);scrollbar-color:var(--mgmt-border-strong) var(--mgmt-subtle)}.app-layout.legacy-admin[data-theme="dark"] .staff-notification-list>button.is-unread{border-color:color-mix(in srgb,var(--mgmt-primary) 25%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 11%,var(--mgmt-surface))}.app-layout.legacy-admin[data-theme="dark"] .staff-notification-list>button.is-unread>i{background:var(--mgmt-primary-strong);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-primary) 18%,transparent)}
.app-layout.legacy-staff .staff-notification-center{border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-text);box-shadow:var(--mgmt-shadow-high),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .staff-notification-center>header{border-color:var(--mgmt-border);background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface))}
.app-layout.legacy-staff .staff-notification-center>header span,.app-layout.legacy-staff .staff-notification-list small,.app-layout.legacy-staff .staff-notification-list time,.app-layout.legacy-staff .staff-notification-empty{color:var(--mgmt-muted)}
.app-layout.legacy-staff .staff-notification-center :is(h2,b){color:var(--mgmt-heading)}
.app-layout.legacy-staff .staff-notification-center>header button,.app-layout.legacy-staff .staff-notification-actions button{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-text)}
.app-layout.legacy-staff .staff-notification-actions,.app-layout.legacy-staff .staff-notification-center>footer{border-color:var(--mgmt-border)}
.app-layout.legacy-staff .staff-notification-list>button{color:var(--mgmt-text)}
.app-layout.legacy-staff .staff-notification-list>button:hover{background:var(--mgmt-hover)}
.app-layout.legacy-staff .staff-notification-list>button.is-unread{background:color-mix(in srgb,var(--mgmt-primary) 13%,var(--mgmt-surface))}
.app-layout.legacy-staff .staff-notification-center>footer{background:var(--mgmt-surface)}
.app-layout.legacy-staff .staff-notification-center>footer button{color:var(--mgmt-primary-strong)}
.app-layout.legacy-staff .staff-notification-center>footer button:hover{background:var(--mgmt-hover)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-center{isolation:isolate;border-color:var(--mgmt-border-strong);background:linear-gradient(155deg,var(--mgmt-elevated),var(--mgmt-surface) 44%,var(--mgmt-subtle));box-shadow:0 28px 68px rgba(0,0,0,.7),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-center>header{background:radial-gradient(circle at 90% -30%,rgba(43,185,141,.19),transparent 48%),linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface))}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-center>header>div>span{color:#d5af67}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-center>header button:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-actions{background:var(--mgmt-surface)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-actions button:hover:not(:disabled){border-color:var(--mgmt-border-strong);background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-actions button.is-destructive{border-color:color-mix(in srgb,var(--mgmt-danger) 32%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-danger) 9%,var(--mgmt-input));color:var(--mgmt-danger)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list{background:var(--mgmt-subtle);scrollbar-color:var(--mgmt-border-strong) var(--mgmt-subtle)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list>button{border:1px solid transparent;background:transparent;color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list>button.is-read:hover{border-color:var(--mgmt-border);background:var(--mgmt-surface)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list>button.is-unread{border-color:color-mix(in srgb,var(--mgmt-primary) 25%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 11%,var(--mgmt-surface));box-shadow:inset 0 1px 0 color-mix(in srgb,var(--mgmt-primary) 13%,transparent)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list>button.is-unread:hover{border-color:color-mix(in srgb,var(--mgmt-primary) 42%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 16%,var(--mgmt-surface))}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list b{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list small{color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list time{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list>button>i{background:var(--mgmt-faint)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-list>button.is-unread>i{background:var(--mgmt-primary-strong);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-primary) 18%,transparent)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-empty{background:var(--mgmt-subtle);color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-empty svg{color:var(--mgmt-primary-strong)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-empty b{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-empty span{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-center>footer{background:var(--mgmt-surface)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-center>footer button{color:var(--mgmt-primary-strong)}
.app-layout.legacy-staff[data-theme="dark"] .staff-notification-center button:focus-visible{outline-color:var(--mgmt-primary-strong)}

.app-layout.legacy-staff .sidebar-theme-switcher,.app-layout.legacy-admin .sidebar-theme-switcher{border-color:var(--mgmt-border);border-radius:16px;background:var(--mgmt-subtle)}
.app-layout.legacy-staff .sidebar-theme-switcher button,.app-layout.legacy-admin .sidebar-theme-switcher button{border-radius:11px;color:var(--mgmt-muted)}
.app-layout.legacy-staff .sidebar-theme-switcher button.active,.app-layout.legacy-admin .sidebar-theme-switcher button.active{background:var(--mgmt-elevated);color:var(--mgmt-primary);box-shadow:0 5px 12px rgba(0,0,0,.12),inset 0 1px 0 var(--mgmt-highlight)}
.legacy-staff .internal-sidebar:not(:hover) .sidebar-theme-switcher button{gap:0}
.legacy-staff .internal-sidebar:hover .sidebar-theme-switcher{border-radius:16px}
.app-layout.legacy-staff .sidebar-footer-stack,.app-layout.legacy-admin .sidebar-footer-stack{width:100%;margin-top:auto;display:flex;flex-direction:column;gap:8px;min-width:0}
.legacy-staff .sidebar-footer-stack{align-items:center}
.app-layout.legacy-staff .sidebar-footer-stack .sidebar-theme-switcher,.app-layout.legacy-staff .sidebar-footer-stack .sidebar-exit,.app-layout.legacy-admin .sidebar-footer-stack .sidebar-theme-switcher,.app-layout.legacy-admin .sidebar-footer-stack .sidebar-exit{margin-top:0}
.legacy-staff .internal-sidebar:hover .sidebar-footer-stack{align-items:stretch}
.legacy-staff .sidebar-staff-profile{width:46px;min-height:48px;align-self:center;display:flex;align-items:center;justify-content:center;gap:10px;padding:5px;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-subtle);color:var(--mgmt-text);overflow:hidden;white-space:nowrap;cursor:pointer;box-shadow:inset 0 1px 0 var(--mgmt-highlight);transition:width .2s ease,padding .2s ease,background-color .2s ease,border-color .2s ease,box-shadow .2s ease}
.legacy-staff .sidebar-staff-profile:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover);box-shadow:0 8px 18px rgba(0,0,0,.12),inset 0 1px 0 var(--mgmt-highlight)}
.legacy-staff .sidebar-staff-profile:focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}
.legacy-staff .sidebar-staff-avatar{width:36px;height:36px;flex:0 0 36px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary);font-size:.72rem;font-weight:900;letter-spacing:.04em;box-shadow:0 5px 12px rgba(0,0,0,.16)}
.legacy-staff .sidebar-staff-profile-copy{width:0;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px;overflow:hidden;opacity:0;text-align:left;transition:width .2s ease,opacity .2s ease}
.legacy-staff .sidebar-staff-profile-copy strong{max-width:170px;overflow:hidden;text-overflow:ellipsis;color:var(--mgmt-heading);font-size:.78rem}
.legacy-staff .sidebar-staff-profile-copy small{color:var(--mgmt-muted);font-size:.65rem;font-weight:700}
.legacy-staff .internal-sidebar:hover .sidebar-staff-profile{width:100%;justify-content:flex-start;padding:5px 9px}
.legacy-staff .internal-sidebar:hover .sidebar-staff-profile-copy{width:auto;flex:1;opacity:1}
.legacy-staff .sidebar-staff-profile+.sidebar-exit{margin-top:8px}
.legacy-admin .sidebar-staff-profile{width:100%;min-height:48px;display:flex;align-items:center;justify-content:flex-start;gap:10px;padding:5px 9px;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-subtle);color:var(--mgmt-text);overflow:hidden;white-space:nowrap;cursor:pointer;box-shadow:inset 0 1px 0 var(--mgmt-highlight);transition:background-color .2s ease,border-color .2s ease,box-shadow .2s ease}
.legacy-admin .sidebar-staff-profile:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover);box-shadow:0 8px 18px rgba(0,0,0,.12),inset 0 1px 0 var(--mgmt-highlight)}
.legacy-admin .sidebar-staff-profile:focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}
.legacy-admin .sidebar-staff-avatar{width:36px;height:36px;flex:0 0 36px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary);font-size:.72rem;font-weight:900;letter-spacing:.04em;box-shadow:0 5px 12px rgba(0,0,0,.16)}
.legacy-admin .sidebar-staff-profile-copy{min-width:0;display:flex;flex:1;flex-direction:column;align-items:flex-start;gap:2px;text-align:left}
.legacy-admin .sidebar-staff-profile-copy strong{max-width:170px;overflow:hidden;text-overflow:ellipsis;color:var(--mgmt-heading);font-size:.78rem}
.legacy-admin .sidebar-staff-profile-copy small{color:var(--mgmt-muted);font-size:.65rem;font-weight:700}
.legacy-admin .sidebar-staff-profile+.sidebar-exit{margin-top:14px}

/* Admin shell: persistent navigation with a compact, theme-aware scroll rail. */
.app-layout.legacy-admin .internal-sidebar nav{min-height:0;flex:1;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;padding-right:8px;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--mgmt-primary) 54%,var(--mgmt-border)) transparent}
.app-layout.legacy-admin .internal-sidebar nav::-webkit-scrollbar{width:8px}
.app-layout.legacy-admin .internal-sidebar nav::-webkit-scrollbar-track{background:transparent}
.app-layout.legacy-admin .internal-sidebar nav::-webkit-scrollbar-thumb{border:2px solid transparent;border-radius:999px;background:color-mix(in srgb,var(--mgmt-primary) 54%,var(--mgmt-border));background-clip:padding-box}
.app-layout.legacy-admin .internal-sidebar nav::-webkit-scrollbar-thumb:hover{background:var(--mgmt-primary);background-clip:padding-box}

@media(max-width:1100px) and (min-width:801px){
  .app-layout.legacy-admin .internal-page-header{align-items:flex-start;flex-direction:column}
  .app-layout.legacy-admin .internal-page-header .header-actions{width:100%;justify-content:flex-end}
}

.app-layout.legacy-staff :is(.panel,.metric-card,.legacy-ops-card,.module-table-card,.module-toolbar,.dash-alert-card,.dash-stat-card,.ops-summary-card,.inv-summary-card,.inv-table-card,.menu-item-card,.txn-report-stat,.txn-ledger-shell,.txn-loading-shell,.staff-settings-container,.staff-settings-card),
.app-layout.legacy-admin :is(.panel,.metric-card,.legacy-ops-card,.module-table-card,.module-toolbar,.dash-alert-card,.dash-stat-card,.inv-summary-card,.inv-table-card,.txn-report-stat,.txn-ledger-shell,.txn-loading-shell,.staff-settings-container,.staff-settings-card){background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));border-color:var(--mgmt-border);color:var(--mgmt-text);box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff :is(.panel,.metric-card,.legacy-ops-card,.module-table-card,.dash-alert-card,.dash-stat-card,.ops-summary-card,.inv-summary-card,.menu-item-card,.txn-report-stat) :is(h2,h3,b,strong),
.app-layout.legacy-admin :is(.panel,.metric-card,.legacy-ops-card,.module-table-card,.dash-alert-card,.dash-stat-card,.inv-summary-card,.txn-report-stat) :is(h2,h3,b,strong){color:var(--mgmt-heading)}
.app-layout.legacy-staff :is(.panel,.metric-card,.legacy-ops-card,.module-table-card,.dash-alert-card,.dash-stat-card,.ops-summary-card,.inv-summary-card,.menu-item-card,.txn-report-stat) :is(p,small),
.app-layout.legacy-admin :is(.panel,.metric-card,.legacy-ops-card,.module-table-card,.dash-alert-card,.dash-stat-card,.inv-summary-card,.txn-report-stat) :is(p,small){color:var(--mgmt-muted)}

.app-layout.legacy-staff :is(input,select,textarea),.app-layout.legacy-admin :is(input,select,textarea){border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-text)}
.app-layout.legacy-staff :is(input,textarea)::placeholder,.app-layout.legacy-admin :is(input,textarea)::placeholder{color:var(--mgmt-faint)}
.app-layout.legacy-staff :is(input,select,textarea):focus-visible,.app-layout.legacy-admin :is(input,select,textarea):focus-visible{outline:none;border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 24%,transparent)}
.app-layout.legacy-staff :is(.ops-secondary-action,.legacy-ghost,.secondary-button),.app-layout.legacy-admin :is(.ops-secondary-action,.legacy-ghost,.secondary-button){border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-heading);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff :is(.ops-secondary-action,.legacy-ghost,.secondary-button):hover,.app-layout.legacy-admin :is(.ops-secondary-action,.legacy-ghost,.secondary-button):hover{background:var(--mgmt-hover)}
.app-layout.legacy-staff :is(.ops-main-action,.legacy-primary,.primary-button),.app-layout.legacy-admin :is(.ops-main-action,.legacy-primary,.primary-button){background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary);border-color:transparent}

.app-layout.legacy-staff .ops-order-view-toggle{border-color:var(--mgmt-border);background:var(--mgmt-subtle);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-order-view-toggle button{color:var(--mgmt-muted)}
.app-layout.legacy-staff .ops-order-view-toggle button.active{background:var(--mgmt-elevated);color:var(--mgmt-heading);box-shadow:0 6px 14px rgba(0,0,0,.13),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-toolbar{border-color:var(--mgmt-border);background:var(--mgmt-surface);box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-search,.app-layout.legacy-staff .ops-toolbar select{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-text)}
.app-layout.legacy-staff .ops-toolbar-field{color:var(--mgmt-muted)}
.app-layout.legacy-staff .ops-toolbar select:hover{background:var(--mgmt-hover)}
.app-layout.legacy-staff .ops-column{border-color:var(--mgmt-border);background:linear-gradient(165deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-column h3{color:var(--mgmt-heading)}
.app-layout.legacy-staff .ops-column :is(p,small){color:var(--mgmt-muted)}
.app-layout.legacy-staff .ops-column-count{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-heading);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-card{border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-text);box-shadow:0 9px 20px rgba(0,0,0,.12),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-card:before{background:var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-card :is(h4,b,strong){color:var(--mgmt-heading)}
.app-layout.legacy-staff .ops-card :is(p,small,span){border-color:var(--mgmt-border)}
.app-layout.legacy-staff .ops-empty{color:var(--mgmt-muted)}
.app-layout.legacy-staff .ops-completed-orders{border-color:var(--mgmt-border);background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-completed-heading{border-color:var(--mgmt-border)}
.app-layout.legacy-staff .ops-completed-heading h2{color:var(--mgmt-heading)}
.app-layout.legacy-staff .ops-completed-heading p{color:var(--mgmt-muted)}
.app-layout.legacy-staff .ops-completed-heading>span{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card h3{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-customer{color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card :is(.ops-meta,.ops-time,.ops-card-row>span){color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-card-row{border-color:var(--mgmt-border)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-card-row b{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-type-badge{border:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-type-badge.delivery{border-color:#1f5c50;background:#102b27;color:#80ddc8}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-type-badge.pickup{border-color:#294e6b;background:#101f2b;color:#9bcaf0}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-pay-status.is-pending{color:var(--mgmt-warning)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-destructive-action{border-color:color-mix(in srgb,var(--mgmt-danger) 42%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}
.app-layout.legacy-staff[data-theme="dark"] .ops-card .ops-destructive-action:hover:not(:disabled){background:color-mix(in srgb,var(--mgmt-danger-soft) 72%,var(--mgmt-danger))}

.app-layout.legacy-staff .ops-cancellations{border-color:color-mix(in srgb,var(--mgmt-danger) 25%,var(--mgmt-border));background:linear-gradient(145deg,var(--mgmt-surface),var(--mgmt-danger-soft));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-cancellations:before{background:radial-gradient(circle,color-mix(in srgb,var(--mgmt-danger) 16%,transparent),transparent 68%)}
.app-layout.legacy-staff .ops-cancellations-heading{border-color:color-mix(in srgb,var(--mgmt-danger) 22%,transparent)}
.app-layout.legacy-staff .ops-cancellations-heading h2,.app-layout.legacy-staff .ops-cancel-group header,.app-layout.legacy-staff .ops-cancel-card>div:first-child b{color:var(--mgmt-heading)}
.app-layout.legacy-staff .ops-cancellations-heading p,.app-layout.legacy-staff .ops-cancel-group header small,.app-layout.legacy-staff .ops-cancel-card p{color:var(--mgmt-muted)}
.app-layout.legacy-staff .ops-cancellations-heading>span,.app-layout.legacy-staff .ops-cancel-group header b{border-color:color-mix(in srgb,var(--mgmt-danger) 28%,var(--mgmt-border));background:var(--mgmt-elevated);color:var(--mgmt-danger);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-cancel-group,.app-layout.legacy-staff .ops-cancel-card{border-color:color-mix(in srgb,var(--mgmt-danger) 22%,var(--mgmt-border));background:var(--mgmt-elevated);box-shadow:0 10px 24px rgba(0,0,0,.12),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .ops-cancel-group.is-resolved{border-color:color-mix(in srgb,var(--mgmt-success) 30%,var(--mgmt-border));background:var(--mgmt-surface)}

.app-layout.legacy-staff :is(.menu-manage-search,.menu-manage-toolbar,.menu-manage-chip,.menu-view-toggle,.menu-view-toggle button,.menu-sort-control select,.menu-extra-filters,.menu-bulk-bar),
.app-layout.legacy-admin :is(.menu-manage-search,.menu-manage-toolbar,.menu-manage-chip,.menu-view-toggle,.menu-view-toggle button,.menu-sort-control select,.menu-extra-filters,.menu-bulk-bar){border-color:var(--mgmt-border);background:var(--mgmt-surface);color:var(--mgmt-text)}
.app-layout.legacy-staff .menu-manage-toolbar,.app-layout.legacy-admin .menu-manage-toolbar{box-shadow:var(--mgmt-shadow)}
.app-layout.legacy-staff .menu-manage-chip.active,.app-layout.legacy-staff .menu-view-toggle button.active,.app-layout.legacy-admin .menu-manage-chip.active,.app-layout.legacy-admin .menu-view-toggle button.active{background:var(--mgmt-primary);color:var(--mgmt-on-primary);border-color:var(--mgmt-primary)}
.app-layout.legacy-staff .menu-card-title-row b{color:var(--mgmt-heading)}
.app-layout.legacy-staff .menu-card-desc,.app-layout.legacy-staff .menu-card-meta,.app-layout.legacy-staff .menu-card-eyebrow{color:var(--mgmt-muted)}
.app-layout.legacy-staff .menu-card-price{color:var(--mgmt-primary)}
.app-layout.legacy-staff .menu-card-select{background:color-mix(in srgb,var(--mgmt-elevated) 88%,transparent)}
.app-layout.legacy-staff[data-theme="dark"] :is(.menu-summary-card,.menu-item-card){
  --menu-gold-glint:rgba(213,175,103,.25);
  background:
    radial-gradient(circle at 0 0,var(--menu-gold-glint),transparent 34%),
    linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));
  box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--menu-gold-glint)
}
.app-layout.legacy-staff[data-theme="dark"] .menu-summary-card:after{
  background:radial-gradient(circle,var(--menu-gold-glint),transparent 70%);
  opacity:1
}

/* Dark search and filter surfaces override legacy white module controls. */
.app-layout.legacy-staff[data-theme="dark"] .inv-toolbar{border:1px solid var(--mgmt-border);border-radius:14px;padding:12px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .inv-toolbar :is(.ops-search,select){border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-heading);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .inv-toolbar .ops-search input{background:transparent;color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .inv-toolbar .ops-search svg{color:var(--mgmt-primary)}
.app-layout.legacy-staff[data-theme="dark"] .inv-toolbar select:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}
.app-layout.legacy-staff[data-theme="dark"] .inv-toolbar select option{background:var(--mgmt-elevated);color:var(--mgmt-text)}
.app-layout.legacy-staff .inventory-summary-grid{gap:14px;margin-bottom:20px}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-card{--inv-summary-accent:var(--mgmt-primary);position:relative;isolation:isolate;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:13px;min-height:100px;overflow:hidden;padding:17px 18px;border:1px solid color-mix(in srgb,var(--inv-summary-accent) 25%,var(--mgmt-border));border-radius:18px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-card:before{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:var(--inv-summary-accent)}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-card:after{content:'';position:absolute;z-index:-1;right:-44px;bottom:-58px;width:138px;height:138px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--inv-summary-accent) 18%,transparent),transparent 70%);pointer-events:none}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--inv-summary-accent) 46%,var(--mgmt-border));box-shadow:var(--mgmt-shadow-high),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .inventory-summary-grid .tone-red{--inv-summary-accent:#c95259}
.app-layout.legacy-staff .inventory-summary-grid .tone-amber{--inv-summary-accent:#b9822e}
.app-layout.legacy-staff .inventory-summary-grid .tone-neutral{--inv-summary-accent:#3d8062}
.app-layout.legacy-staff[data-theme="dark"] .inventory-summary-grid .tone-red{--inv-summary-accent:#ff9c9c}
.app-layout.legacy-staff[data-theme="dark"] .inventory-summary-grid .tone-amber{--inv-summary-accent:#e2b66c}
.app-layout.legacy-staff[data-theme="dark"] .inventory-summary-grid .tone-neutral{--inv-summary-accent:#68d9a0}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-icon{width:40px;height:40px;display:grid;place-items:center;flex:none;border:1px solid color-mix(in srgb,var(--inv-summary-accent) 30%,var(--mgmt-border));border-radius:12px;background:color-mix(in srgb,var(--inv-summary-accent) 13%,var(--mgmt-surface));color:var(--inv-summary-accent);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-icon svg{color:currentColor}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-copy{min-width:0;display:flex;flex-direction:column;gap:4px}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-copy>span{color:var(--mgmt-heading);font-size:.82rem;font-weight:850;line-height:1.2}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-copy small{color:var(--mgmt-muted);font-size:.68rem;font-weight:650;line-height:1.25}
.app-layout.legacy-staff .inventory-summary-grid .inv-summary-card>b{color:var(--inv-summary-accent);font-size:clamp(1.65rem,2vw,2rem);font-weight:900;line-height:1;letter-spacing:-.05em;font-variant-numeric:tabular-nums}
.app-layout.legacy-staff[data-theme="dark"] :is(.menu-manage-tools,.menu-manage-toolbar){border-color:var(--mgmt-border);background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .menu-manage-search{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-primary);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .menu-manage-search input{background:transparent;color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .menu-manage-search input::placeholder,.app-layout.legacy-staff[data-theme="dark"] .menu-inline-filter input::placeholder{color:var(--mgmt-faint)}
.app-layout.legacy-staff[data-theme="dark"] .menu-manage-search-clear{background:var(--mgmt-elevated);color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .menu-manage-search-clear:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] :is(.menu-sort-control select,.menu-inline-filter select,.menu-inline-filter input){border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-heading);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] :is(.menu-sort-control select,.menu-inline-filter select,.menu-inline-filter input):hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}
.app-layout.legacy-staff[data-theme="dark"] :is(.menu-sort-control select,.menu-inline-filter select) option{background:var(--mgmt-elevated);color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] :is(.menu-sort-control,.menu-customizable-filter):after{border-color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] :is(.menu-filter-label,.menu-clear-filters){color:var(--mgmt-muted)}

.app-layout.legacy-staff :is(.txn-toolbar-shell,.txn-filter-panel,.txn-detail-grid>div,.txn-proof-card,.txn-filter-chip),.app-layout.legacy-admin :is(.txn-toolbar-shell,.txn-filter-panel,.txn-detail-grid>div,.txn-proof-card,.txn-filter-chip){border-color:var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-text)}
.app-layout.legacy-staff :is(.txn-ledger-heading,.txn-filter-secondary,.txn-pagination,.txn-item-list li,.txn-timeline li>div),.app-layout.legacy-admin :is(.txn-ledger-heading,.txn-filter-secondary,.txn-pagination,.txn-item-list li,.txn-timeline li>div){border-color:var(--mgmt-border)}
.app-layout.legacy-staff :is(.txn-ledger-heading h2,.txn-ledger-count b,.txn-table-summary b,.txn-pagination-summary b,.txn-page-nav span b,.txn-detail-grid b,.txn-timeline b),.app-layout.legacy-admin :is(.txn-ledger-heading h2,.txn-ledger-count b,.txn-table-summary b,.txn-pagination-summary b,.txn-page-nav span b,.txn-detail-grid b,.txn-timeline b){color:var(--mgmt-heading)}
.app-layout.legacy-staff :is(.txn-ledger-heading p,.txn-ledger-count span,.txn-table-summary,.txn-pagination-summary,.txn-page-size,.txn-page-nav span,.txn-detail-grid span,.txn-timeline small,.txn-timeline p),.app-layout.legacy-admin :is(.txn-ledger-heading p,.txn-ledger-count span,.txn-table-summary,.txn-pagination-summary,.txn-page-size,.txn-page-nav span,.txn-detail-grid span,.txn-timeline small,.txn-timeline p){color:var(--mgmt-muted)}
.app-layout.legacy-staff :is(.txn-range-control select,.txn-select-control select,.txn-page-size select,.txn-page-nav button,.txn-tab),.app-layout.legacy-admin :is(.txn-range-control select,.txn-select-control select,.txn-page-size select,.txn-page-nav button,.txn-tab){border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-text)}
.app-layout.legacy-staff .txn-tab.active,.app-layout.legacy-admin .txn-tab.active{background:var(--mgmt-primary);border-color:var(--mgmt-primary);color:var(--mgmt-on-primary)}
.app-layout.legacy-staff .txn-report-stat--text-only,.app-layout.legacy-admin .txn-report-stat--text-only{justify-content:center;padding:24px}
.app-layout.legacy-staff .txn-report-stat--text-only>span,.app-layout.legacy-admin .txn-report-stat--text-only>span{margin-top:0;color:var(--mgmt-text);font-size:.94rem;font-weight:850;line-height:1.25;letter-spacing:-.01em}
.app-layout.legacy-staff .txn-report-stat--text-only>b,.app-layout.legacy-admin .txn-report-stat--text-only>b{margin-top:9px;color:var(--mgmt-heading);font-size:clamp(1.75rem,2.4vw,2.2rem);font-weight:900;line-height:1.05;letter-spacing:-.045em;font-variant-numeric:tabular-nums}
.app-layout.legacy-staff .txn-report-stat--text-only small,.app-layout.legacy-admin .txn-report-stat--text-only small{margin-top:12px;color:var(--mgmt-muted);font-size:.76rem;font-weight:650;line-height:1.35}
.app-layout.legacy-staff .txn-table th,.app-layout.legacy-admin .txn-table th{background:var(--mgmt-subtle);color:var(--mgmt-muted);box-shadow:0 1px 0 var(--mgmt-border)}
.app-layout.legacy-staff .txn-table tbody tr:hover,.app-layout.legacy-admin .txn-table tbody tr:hover{background:var(--mgmt-hover)}
.app-layout.legacy-staff .txn-row-voided,.app-layout.legacy-admin .txn-row-voided{background:var(--mgmt-subtle)}

/* Explicit data-surface treatment prevents legacy light tables in dark mode. */
.app-layout[data-theme="dark"] :is(.inv-table-wrap,.module-table-card,.txn-ledger-shell){border-color:var(--mgmt-border);background:var(--mgmt-surface);color:var(--mgmt-text)}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table){background:var(--mgmt-surface);color:var(--mgmt-text)}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table) thead{background:var(--mgmt-elevated)}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table) th{border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-heading);box-shadow:0 1px 0 var(--mgmt-border)}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table) tbody tr{background:var(--mgmt-surface);color:var(--mgmt-text)}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table) tbody tr:nth-child(even){background:var(--mgmt-subtle)}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table) tbody tr:hover{background:var(--mgmt-hover)}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table) td{border-color:var(--mgmt-border);background:transparent;color:var(--mgmt-text)}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table) td :is(b,strong){color:#fff}
.app-layout[data-theme="dark"] :is(.inv-table,.txn-table,.module-table-card table) td small{color:var(--mgmt-muted)}
.app-layout[data-theme="dark"] :is(.txn-row-menu,.inv-overflow-menu){border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-text);box-shadow:var(--mgmt-shadow-high)}
.app-layout[data-theme="dark"] :is(.txn-row-menu,.inv-overflow-menu) button{background:transparent;color:var(--mgmt-text)}
.app-layout[data-theme="dark"] :is(.txn-row-menu,.inv-overflow-menu) button:hover{background:var(--mgmt-hover)}
.app-layout[data-theme="dark"] :is(.inv-card,.txn-card){border-color:var(--mgmt-border);background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));color:var(--mgmt-text);box-shadow:var(--mgmt-shadow)}
.app-layout[data-theme="dark"] :is(.inv-card,.txn-card) :is(b,strong){color:#fff}
.app-layout[data-theme="dark"] :is(.inv-card-meta,.inv-card small){color:var(--mgmt-muted)}
.app-layout[data-theme="dark"] .txn-filter-actions{background:var(--mgmt-surface)}

.app-layout.legacy-staff :is(.ops-drawer,.payment-modal,.menu-workspace-modal,.category-workspace-modal),.app-layout.legacy-admin :is(.ops-drawer,.payment-modal,.menu-workspace-modal,.category-workspace-modal){border-color:var(--mgmt-border);background:var(--mgmt-surface);color:var(--mgmt-text);box-shadow:var(--mgmt-shadow-high)}
.app-layout.legacy-staff .ops-drawer:not(.txn-drawer){background:radial-gradient(circle at 88% 9%,color-mix(in srgb,var(--mgmt-primary) 16%,transparent),transparent 24%),radial-gradient(circle at 8% 53%,color-mix(in srgb,var(--mgmt-primary) 9%,transparent),transparent 22%),radial-gradient(circle at 76% 88%,color-mix(in srgb,var(--mgmt-primary) 12%,transparent),transparent 24%),linear-gradient(165deg,var(--mgmt-elevated),var(--mgmt-surface) 38%,var(--mgmt-subtle))}
.app-layout.legacy-staff :is(.ops-drawer,.payment-modal,.menu-workspace-modal,.category-workspace-modal) :is(header,footer),.app-layout.legacy-admin :is(.ops-drawer,.payment-modal,.menu-workspace-modal,.category-workspace-modal) :is(header,footer){border-color:var(--mgmt-border)}
.app-layout.legacy-staff :is(.ops-drawer,.payment-modal,.menu-workspace-modal,.category-workspace-modal) :is(h2,h3,b,strong),.app-layout.legacy-admin :is(.ops-drawer,.payment-modal,.menu-workspace-modal,.category-workspace-modal) :is(h2,h3,b,strong){color:var(--mgmt-heading)}
.app-layout.legacy-staff :is(.ops-drawer,.payment-modal,.menu-workspace-modal,.category-workspace-modal) :is(p,small),.app-layout.legacy-admin :is(.ops-drawer,.payment-modal,.menu-workspace-modal,.category-workspace-modal) :is(p,small){color:var(--mgmt-muted)}

/* Transaction detail drawer: a complete dark surface, rather than light report cards inside a dark shell. */
.app-layout[data-theme="dark"] .txn-drawer{background:linear-gradient(155deg,var(--mgmt-elevated),var(--mgmt-surface) 38%,var(--mgmt-subtle))}
.app-layout[data-theme="dark"] .txn-drawer :is(.txn-drawer-header,.txn-drawer-nav,.txn-drawer-footer){border-color:var(--mgmt-border);background:var(--mgmt-surface)}
.app-layout[data-theme="dark"] .txn-drawer-header h2,.app-layout[data-theme="dark"] .txn-header-total b,.app-layout[data-theme="dark"] .txn-section-heading h3,.app-layout[data-theme="dark"] .txn-info-card>b,.app-layout[data-theme="dark"] .txn-payment-method>b,.app-layout[data-theme="dark"] .txn-item-list li>div,.app-layout[data-theme="dark"] .txn-item-list li>div span,.app-layout[data-theme="dark"] .txn-total-list b{color:var(--mgmt-heading)}
.app-layout[data-theme="dark"] .txn-header-total span,.app-layout[data-theme="dark"] .txn-section-heading>div>span,.app-layout[data-theme="dark"] .txn-info-card>span,.app-layout[data-theme="dark"] .txn-payment-method>span,.app-layout[data-theme="dark"] .txn-item-count,.app-layout[data-theme="dark"] .txn-item-list li small,.app-layout[data-theme="dark"] .txn-audit-details summary,.app-layout[data-theme="dark"] .txn-audit-json{color:var(--mgmt-muted)}
.app-layout[data-theme="dark"] .txn-drawer-nav button{color:var(--mgmt-muted)}.app-layout[data-theme="dark"] .txn-drawer-nav button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout[data-theme="dark"] .txn-drawer-header>button,.app-layout[data-theme="dark"] .txn-footer-more summary{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-primary)}.app-layout[data-theme="dark"] .txn-drawer-header>button:hover,.app-layout[data-theme="dark"] .txn-footer-more summary:hover,.app-layout[data-theme="dark"] .txn-footer-more[open] summary{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover);color:var(--mgmt-primary-strong)}
.app-layout[data-theme="dark"] .txn-info-card{border-color:var(--mgmt-border);background:linear-gradient(145deg,color-mix(in srgb,var(--mgmt-primary) 9%,var(--mgmt-elevated)),var(--mgmt-surface))}.app-layout[data-theme="dark"] .txn-info-card p{color:var(--mgmt-text)!important}
.app-layout[data-theme="dark"] .txn-total-list{border-color:var(--mgmt-border);background:var(--mgmt-subtle)}.app-layout[data-theme="dark"] .txn-total-list>div{color:var(--mgmt-muted)}.app-layout[data-theme="dark"] .txn-total-list .total{border-color:var(--mgmt-border-strong);color:var(--mgmt-heading)}
.app-layout[data-theme="dark"] .txn-payment-record{border-color:var(--mgmt-border);background:var(--mgmt-subtle)}.app-layout[data-theme="dark"] .txn-payment-method{border-color:var(--mgmt-border);background:color-mix(in srgb,var(--mgmt-primary) 10%,var(--mgmt-elevated))}
.app-layout[data-theme="dark"] .txn-exception-section{border-color:color-mix(in srgb,var(--mgmt-warning) 46%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-warning) 8%,var(--mgmt-surface))}.app-layout[data-theme="dark"] .txn-refund-row{border-color:color-mix(in srgb,var(--mgmt-warning) 30%,var(--mgmt-border));background:var(--mgmt-elevated)}.app-layout[data-theme="dark"] .txn-refund-row small{color:var(--mgmt-muted)}
.app-layout[data-theme="dark"] .txn-order-alert--review{border-color:color-mix(in srgb,var(--mgmt-warning) 46%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-warning) 9%,var(--mgmt-surface));color:#efd49e}.app-layout[data-theme="dark"] .txn-order-alert--review p{color:var(--mgmt-text)!important}.app-layout[data-theme="dark"] .txn-order-alert--review small{color:#d8bd84}.app-layout[data-theme="dark"] .txn-order-alert--cancelled{border-color:color-mix(in srgb,var(--mgmt-danger) 46%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-danger) 9%,var(--mgmt-surface));color:#f2b2b2}.app-layout[data-theme="dark"] .txn-order-alert--cancelled p{color:var(--mgmt-text)!important}.app-layout[data-theme="dark"] .txn-order-alert--cancelled small{color:#d99b9b}
.app-layout[data-theme="dark"] .txn-proof-card{border-color:var(--mgmt-border);background:var(--mgmt-subtle)}.app-layout[data-theme="dark"] .txn-proof-card img{background:var(--mgmt-input)}
.app-layout[data-theme="dark"] .txn-footer-menu{border-color:var(--mgmt-border);background:var(--mgmt-elevated);box-shadow:var(--mgmt-shadow-high)}.app-layout[data-theme="dark"] .txn-footer-menu button{color:var(--mgmt-text)}.app-layout[data-theme="dark"] .txn-footer-menu button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout.legacy-staff :is(.menu-workspace-header,.menu-editor-nav,.menu-editor-panel,.menu-image-upload-card,.menu-option-card,.menu-schedule-card,.menu-workspace-actions,.category-list-panel,.category-create-panel),.app-layout.legacy-admin :is(.menu-workspace-header,.menu-editor-nav,.menu-editor-panel,.menu-image-upload-card,.menu-option-card,.menu-schedule-card,.menu-workspace-actions,.category-list-panel,.category-create-panel){border-color:var(--mgmt-border);background:var(--mgmt-subtle)}
.app-layout.legacy-staff .menu-editor-nav button.active,.app-layout.legacy-admin .menu-editor-nav button.active{border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-heading)}

/* Dark category workspace: separate navigation, content, and creation layers. */
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal{background:radial-gradient(circle at 88% 8%,rgba(213,175,103,.11),transparent 24%),linear-gradient(155deg,var(--mgmt-elevated),var(--mgmt-surface) 42%,var(--mgmt-subtle));border-color:var(--mgmt-border-strong)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .menu-workspace-header{border-color:var(--mgmt-border);background:linear-gradient(145deg,color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-elevated)),var(--mgmt-surface))}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .payment-modal-kicker{color:#d5af67}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .payment-modal-close{border-color:var(--mgmt-border-strong);background:var(--mgmt-input);color:var(--mgmt-heading);box-shadow:inset 0 1px 0 rgba(213,175,103,.18)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .payment-modal-close:hover{border-color:color-mix(in srgb,#d5af67 45%,var(--mgmt-border));background:var(--mgmt-hover);color:#efd49e}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-tabs{border-color:var(--mgmt-border);background:var(--mgmt-subtle)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-tabs button{border-color:var(--mgmt-border);background:var(--mgmt-surface);color:var(--mgmt-muted);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-tabs button:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-tabs button :is(b){color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-tabs button small{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-tabs button strong{border:1px solid var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-tabs button.active{border-color:color-mix(in srgb,var(--mgmt-primary) 52%,var(--mgmt-border));background:linear-gradient(145deg,color-mix(in srgb,var(--mgmt-primary) 17%,var(--mgmt-elevated)),var(--mgmt-elevated));color:var(--mgmt-primary-strong);box-shadow:0 10px 24px rgba(0,0,0,.2),inset 0 1px 0 color-mix(in srgb,var(--mgmt-primary) 22%,transparent)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-tabs button.active strong{border-color:color-mix(in srgb,var(--mgmt-primary) 54%,var(--mgmt-border));background:var(--mgmt-primary);color:var(--mgmt-on-primary)}
.app-layout.legacy-staff[data-theme="dark"] .category-list-panel{border-color:var(--mgmt-border);background:color-mix(in srgb,var(--mgmt-surface) 88%,var(--mgmt-primary))}
.app-layout.legacy-staff[data-theme="dark"] .category-create-panel{background:linear-gradient(160deg,var(--mgmt-subtle),color-mix(in srgb,#d5af67 5%,var(--mgmt-surface)))}
.app-layout.legacy-staff[data-theme="dark"] :is(.category-list-panel,.category-create-panel) h3{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] :is(.category-list-panel,.category-create-panel) header p{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-list li{border-color:var(--mgmt-border);background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:0 8px 18px rgba(0,0,0,.14),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-list li:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}
.app-layout.legacy-staff[data-theme="dark"] .category-row-icon{border:1px solid color-mix(in srgb,var(--mgmt-primary) 30%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 13%,var(--mgmt-surface));color:var(--mgmt-primary-strong)}
.app-layout.legacy-staff[data-theme="dark"] .category-row-copy b{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .category-row-copy small{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .category-empty-state{border-color:var(--mgmt-border-strong);background:var(--mgmt-surface);color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .category-create-panel>header>span{border:1px solid color-mix(in srgb,#d5af67 30%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 22%,var(--mgmt-elevated));color:#efd49e;box-shadow:inset 0 1px 0 rgba(213,175,103,.2)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .field{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .field>span{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .field :is(input,select){border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-heading);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .field :is(input,select):focus{border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 24%,transparent)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-modal .field select option{background:var(--mgmt-elevated);color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-list .ops-destructive-action{border-color:color-mix(in srgb,var(--mgmt-danger) 46%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-danger) 12%,var(--mgmt-surface));color:#ffaaaa}
.app-layout.legacy-staff[data-theme="dark"] .category-workspace-list .ops-destructive-action:hover{background:color-mix(in srgb,var(--mgmt-danger) 20%,var(--mgmt-surface))}

/* Inventory record dialog: preserve the near-black workspace while lifting form layers. */
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal{border-color:var(--mgmt-border-strong);background:linear-gradient(155deg,var(--mgmt-elevated),var(--mgmt-surface) 38%,var(--mgmt-subtle));box-shadow:0 34px 84px rgba(0,0,0,.72),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-header{border-color:var(--mgmt-border);background:radial-gradient(circle at 86% -28%,rgba(43,185,141,.2),transparent 48%),linear-gradient(145deg,color-mix(in srgb,#d5af67 5%,var(--mgmt-elevated)),var(--mgmt-surface))}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-header>div>span{color:#d5af67}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-header h2{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-header p{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-icon{border:1px solid color-mix(in srgb,var(--mgmt-primary) 46%,var(--mgmt-border));background:linear-gradient(145deg,color-mix(in srgb,var(--mgmt-primary) 30%,var(--mgmt-elevated)),var(--mgmt-input));color:var(--mgmt-primary-strong);box-shadow:0 10px 24px rgba(0,0,0,.3),inset 0 1px 0 color-mix(in srgb,var(--mgmt-primary) 30%,transparent)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal .payment-modal-close{border-color:var(--mgmt-border-strong);background:var(--mgmt-input);color:var(--mgmt-heading);box-shadow:0 8px 18px rgba(0,0,0,.26),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal .payment-modal-close:hover{border-color:color-mix(in srgb,#d5af67 45%,var(--mgmt-border));background:var(--mgmt-hover);color:#efd49e}
.app-layout.legacy-staff[data-theme="dark"] .inv-record-form{background:linear-gradient(180deg,var(--mgmt-surface),var(--mgmt-subtle))}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-section{border-color:var(--mgmt-border)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-section>header h3{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-section>header p{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal .field>span{color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal .field :is(input,select,textarea),
.app-layout.legacy-staff[data-theme="dark"] .inv-sale-mapping :is(input,select){border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-heading);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal :is(input,textarea)::placeholder{color:var(--mgmt-faint)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal :is(select option){background:var(--mgmt-elevated);color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal .field :is(input,select,textarea):focus,
.app-layout.legacy-staff[data-theme="dark"] .inv-sale-mapping :is(input,select):focus{border-color:var(--mgmt-primary);background:color-mix(in srgb,var(--mgmt-primary) 5%,var(--mgmt-input));box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 22%,transparent)}
.app-layout.legacy-staff[data-theme="dark"] .inv-sale-mappings{border-color:var(--mgmt-border-strong);background:linear-gradient(145deg,color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-elevated)),var(--mgmt-subtle));box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .inv-sale-mappings legend{color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .inv-sale-mappings>p{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-modal .form-error{border:1px solid color-mix(in srgb,var(--mgmt-danger) 40%,var(--mgmt-border));border-radius:10px;background:var(--mgmt-danger-soft);color:var(--mgmt-danger);padding:10px 12px}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-actions{border-color:var(--mgmt-border);background:color-mix(in srgb,var(--mgmt-surface) 92%,transparent);box-shadow:0 -14px 30px rgba(0,0,0,.22)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-actions .secondary-button{border-color:var(--mgmt-border-strong);background:var(--mgmt-input);color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .inv-form-actions .secondary-button:hover{border-color:color-mix(in srgb,#d5af67 36%,var(--mgmt-border));background:var(--mgmt-hover);color:#efd49e}

@media(max-width:620px){.app-layout.legacy-staff[data-theme="dark"] .inv-sale-mapping{border-color:var(--mgmt-border);background:var(--mgmt-surface)}}

/* Semantic table actions stay recognizable on dark surfaces. */
.app-layout.legacy-staff[data-theme="dark"] .inv-row-actions .ops-icon-button{border-width:1px;box-shadow:0 5px 12px rgba(0,0,0,.18),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .inv-row-actions .inv-action-add{border-color:#285e4e;background:#102c25;color:#67d8ac}
.app-layout.legacy-staff[data-theme="dark"] .inv-row-actions .inv-action-add:hover{border-color:#3b866f;background:#163b31;color:#91e8c7}
.app-layout.legacy-staff[data-theme="dark"] .inv-row-actions .inv-action-deduct{border-color:#6c5124;background:#332713;color:#e8bd69}
.app-layout.legacy-staff[data-theme="dark"] .inv-row-actions .inv-action-deduct:hover{border-color:#967139;background:#493719;color:#f3d38f}
.app-layout.legacy-staff[data-theme="dark"] :is(.inv-row-actions .inv-action-more,.txn-action-more){border-color:color-mix(in srgb,#d5af67 28%,var(--mgmt-border));background:linear-gradient(145deg,var(--mgmt-input),color-mix(in srgb,#d5af67 7%,var(--mgmt-elevated)));color:#d8c08c;box-shadow:0 5px 12px rgba(0,0,0,.18),inset 0 1px 0 rgba(213,175,103,.18)}
.app-layout.legacy-staff[data-theme="dark"] :is(.inv-row-actions .inv-action-more,.txn-action-more):hover{border-color:color-mix(in srgb,#d5af67 52%,var(--mgmt-border));background:color-mix(in srgb,#d5af67 12%,var(--mgmt-hover));color:#f0d9a5}
.app-layout.legacy-staff[data-theme="dark"] :is(.inv-action-add,.inv-action-deduct,.inv-action-more,.txn-action-more)[aria-expanded="true"]{outline:2px solid color-mix(in srgb,currentColor 58%,transparent);outline-offset:2px}

.app-layout:is(.legacy-staff,.legacy-admin) :is(.staff-settings-tabs,.staff-settings-card footer,.staff-workspace-group,.staff-workspace-fields>.staff-setting-toggle,.staff-session-details,.staff-role-summary){border-color:var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-text)}
.app-layout:is(.legacy-staff,.legacy-admin) :is(.staff-settings-card>header,.staff-setting-toggle){border-color:var(--mgmt-border)}
.app-layout:is(.legacy-staff,.legacy-admin) :is(.staff-settings-card h2,.staff-settings-field,.staff-workspace-group legend,.staff-setting-toggle b,.staff-role-summary b){color:var(--mgmt-heading)}
.app-layout:is(.legacy-staff,.legacy-admin) :is(.staff-settings-card p,.staff-settings-field small,.staff-workspace-group>p,.staff-setting-toggle small,.staff-role-summary){color:var(--mgmt-muted)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-settings-icon{background:var(--mgmt-hover);color:var(--mgmt-primary)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-settings-tabs button{color:var(--mgmt-muted)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-settings-tabs button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-settings-tabs button.active{background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-notification-preference-group{border-color:var(--mgmt-border);background:var(--mgmt-subtle)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-notification-preference-group legend{color:var(--mgmt-heading)}

/* Dark add-on catalog workspace. */
.app-layout.legacy-staff[data-theme="dark"] .addon-workspace-modal,.app-layout.legacy-admin[data-theme="dark"] .addon-workspace-modal{border-color:var(--mgmt-border-strong);background:linear-gradient(155deg,var(--mgmt-elevated),var(--mgmt-surface) 42%,var(--mgmt-subtle));box-shadow:0 34px 84px rgba(0,0,0,.72),inset 0 1px 0 var(--mgmt-highlight)}
.app-layout.legacy-staff[data-theme="dark"] .addon-workspace-modal .menu-workspace-header,.app-layout.legacy-admin[data-theme="dark"] .addon-workspace-modal .menu-workspace-header{border-color:var(--mgmt-border);background:linear-gradient(145deg,color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-elevated)),var(--mgmt-surface))}.app-layout.legacy-staff[data-theme="dark"] .addon-workspace-modal .payment-modal-kicker,.app-layout.legacy-admin[data-theme="dark"] .addon-workspace-modal .payment-modal-kicker{color:#d5af67}.app-layout.legacy-staff[data-theme="dark"] .addon-workspace-modal .payment-modal-close,.app-layout.legacy-admin[data-theme="dark"] .addon-workspace-modal .payment-modal-close{border-color:var(--mgmt-border-strong);background:var(--mgmt-input);color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .addon-summary-strip,.app-layout.legacy-admin[data-theme="dark"] .addon-summary-strip{border-color:var(--mgmt-border);background:var(--mgmt-subtle)}.app-layout.legacy-staff[data-theme="dark"] .addon-summary-strip>div,.app-layout.legacy-admin[data-theme="dark"] .addon-summary-strip>div{border-color:var(--mgmt-border)}.app-layout.legacy-staff[data-theme="dark"] .addon-summary-strip strong,.app-layout.legacy-admin[data-theme="dark"] .addon-summary-strip strong{color:var(--mgmt-heading)}.app-layout.legacy-staff[data-theme="dark"] .addon-summary-strip span,.app-layout.legacy-admin[data-theme="dark"] .addon-summary-strip span{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .addon-list-panel,.app-layout.legacy-admin[data-theme="dark"] .addon-list-panel{border-color:var(--mgmt-border);background:var(--mgmt-surface)}.app-layout.legacy-staff[data-theme="dark"] .addon-edit-panel,.app-layout.legacy-admin[data-theme="dark"] .addon-edit-panel{background:linear-gradient(160deg,var(--mgmt-subtle),var(--mgmt-surface))}.app-layout.legacy-staff[data-theme="dark"] .addon-list-toolbar :is(h3,.addon-row-copy>b),.app-layout.legacy-admin[data-theme="dark"] .addon-list-toolbar :is(h3,.addon-row-copy>b),.app-layout.legacy-staff[data-theme="dark"] .addon-edit-header h3,.app-layout.legacy-admin[data-theme="dark"] .addon-edit-header h3{color:var(--mgmt-heading)}.app-layout.legacy-staff[data-theme="dark"] .addon-list-toolbar p,.app-layout.legacy-admin[data-theme="dark"] .addon-list-toolbar p,.app-layout.legacy-staff[data-theme="dark"] .addon-row-copy>span,.app-layout.legacy-admin[data-theme="dark"] .addon-row-copy>span,.app-layout.legacy-staff[data-theme="dark"] .addon-edit-header p,.app-layout.legacy-admin[data-theme="dark"] .addon-edit-header p{color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .addon-row,.app-layout.legacy-admin[data-theme="dark"] .addon-row,.app-layout.legacy-staff[data-theme="dark"] .addon-category-group,.app-layout.legacy-admin[data-theme="dark"] .addon-category-group{border-color:var(--mgmt-border);background:var(--mgmt-elevated);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}.app-layout.legacy-staff[data-theme="dark"] .addon-row:hover,.app-layout.legacy-staff[data-theme="dark"] .addon-row.active,.app-layout.legacy-admin[data-theme="dark"] .addon-row:hover,.app-layout.legacy-admin[data-theme="dark"] .addon-row.active{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}.app-layout.legacy-staff[data-theme="dark"] .addon-row-icon,.app-layout.legacy-admin[data-theme="dark"] .addon-row-icon{background:color-mix(in srgb,var(--mgmt-primary) 16%,var(--mgmt-surface));color:var(--mgmt-primary-strong)}.app-layout.legacy-staff[data-theme="dark"] .addon-scope-badges em,.app-layout.legacy-admin[data-theme="dark"] .addon-scope-badges em{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-muted)}.app-layout.legacy-staff[data-theme="dark"] .addon-availability.available,.app-layout.legacy-admin[data-theme="dark"] .addon-availability.available{background:color-mix(in srgb,var(--mgmt-primary) 20%,var(--mgmt-surface));color:var(--mgmt-primary-strong)}.app-layout.legacy-staff[data-theme="dark"] .addon-availability.unavailable,.app-layout.legacy-admin[data-theme="dark"] .addon-availability.unavailable{background:var(--mgmt-input);color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] .addon-edit-panel .field :is(input,select),.app-layout.legacy-admin[data-theme="dark"] .addon-edit-panel .field :is(input,select){border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-heading);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}.app-layout.legacy-staff[data-theme="dark"] .addon-edit-panel .field :is(input,select):focus,.app-layout.legacy-admin[data-theme="dark"] .addon-edit-panel .field :is(input,select):focus{border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 24%,transparent)}.app-layout.legacy-staff[data-theme="dark"] .addon-edit-panel .field>span,.app-layout.legacy-admin[data-theme="dark"] .addon-edit-panel .field>span,.app-layout.legacy-staff[data-theme="dark"] .addon-category-picker legend,.app-layout.legacy-admin[data-theme="dark"] .addon-category-picker legend{color:var(--mgmt-text)}.app-layout.legacy-staff[data-theme="dark"] .addon-availability-toggle,.app-layout.legacy-admin[data-theme="dark"] .addon-availability-toggle,.app-layout.legacy-staff[data-theme="dark"] .addon-category-picker,.app-layout.legacy-admin[data-theme="dark"] .addon-category-picker{border-color:var(--mgmt-border);background:color-mix(in srgb,var(--mgmt-surface) 82%,var(--mgmt-primary))}.app-layout.legacy-staff[data-theme="dark"] .addon-availability-toggle b,.app-layout.legacy-admin[data-theme="dark"] .addon-availability-toggle b,.app-layout.legacy-staff[data-theme="dark"] .addon-category-option b,.app-layout.legacy-admin[data-theme="dark"] .addon-category-option b{color:var(--mgmt-heading)}.app-layout.legacy-staff[data-theme="dark"] .addon-availability-toggle small,.app-layout.legacy-admin[data-theme="dark"] .addon-availability-toggle small,.app-layout.legacy-staff[data-theme="dark"] .addon-category-picker>p,.app-layout.legacy-admin[data-theme="dark"] .addon-category-picker>p,.app-layout.legacy-staff[data-theme="dark"] .addon-category-option small,.app-layout.legacy-admin[data-theme="dark"] .addon-category-option small{color:var(--mgmt-muted)}.app-layout.legacy-staff[data-theme="dark"] .addon-category-option,.app-layout.legacy-admin[data-theme="dark"] .addon-category-option{border-color:var(--mgmt-border);background:var(--mgmt-elevated)}.app-layout.legacy-staff[data-theme="dark"] .addon-category-option:hover,.app-layout.legacy-staff[data-theme="dark"] .addon-category-option.active,.app-layout.legacy-admin[data-theme="dark"] .addon-category-option:hover,.app-layout.legacy-admin[data-theme="dark"] .addon-category-option.active{border-color:var(--mgmt-border-strong);background:color-mix(in srgb,var(--mgmt-primary) 16%,var(--mgmt-elevated))}.app-layout.legacy-staff[data-theme="dark"] .addon-form-actions,.app-layout.legacy-admin[data-theme="dark"] .addon-form-actions{border-color:var(--mgmt-border)}.app-layout.legacy-staff[data-theme="dark"] .addon-selection-count,.app-layout.legacy-admin[data-theme="dark"] .addon-selection-count{color:var(--mgmt-primary-strong)}.app-layout.legacy-staff[data-theme="dark"] .addon-empty-state,.app-layout.legacy-admin[data-theme="dark"] .addon-empty-state,.app-layout.legacy-staff[data-theme="dark"] .addon-picker-empty,.app-layout.legacy-admin[data-theme="dark"] .addon-picker-empty{border-color:var(--mgmt-border-strong);background:var(--mgmt-elevated);color:var(--mgmt-muted)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-notification-preference-group legend small{color:var(--mgmt-muted)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-notification-group-icon{border:1px solid color-mix(in srgb,var(--mgmt-primary) 28%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 13%,var(--mgmt-surface));color:var(--mgmt-primary-strong)}

/* Staff-wide card typography: override legacy light-theme slate values. */
.app-layout.legacy-staff[data-theme="dark"] :is(.panel,.metric-card,.legacy-ops-card,.ops-summary-card,.ops-card,.ops-cancel-card,.inv-summary-card,.inv-card,.menu-item-card,.txn-report-stat,.txn-card,.dash-alert-card,.dash-stat-card,.staff-settings-card,.staff-workspace-group,.staff-session-details,.ops-drawer,.menu-option-card,.menu-schedule-card) :is(h1,h2,h3,h4,h5,h6,b,strong){color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] :is(.panel,.metric-card,.legacy-ops-card,.ops-summary-card,.ops-card,.ops-cancel-card,.inv-summary-card,.inv-card,.menu-item-card,.txn-report-stat,.txn-card,.dash-alert-card,.dash-stat-card,.staff-settings-card,.staff-workspace-group,.staff-session-details,.ops-drawer,.menu-option-card,.menu-schedule-card) :is(p,small){color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] :is(.ops-summary-card span,.inv-summary-card span,.inv-card-meta,.inv-card-thresholds,.inv-movement-meta,.menu-summary-copy small,.menu-card-eyebrow,.menu-card-meta,.txn-report-stat>span,.txn-report-stat small,.dash-kpi-top span,.dash-kpi-card small,.dash-panel-tag,.dash-doughnut-legend span,.dash-payment-info span,.dash-alert-card span,.dash-stat-card>span,.dash-stat-card small,.legacy-bar-row span,.legacy-list small,.ops-cancel-card>div:first-child span,.ops-cancel-card-meta,.ops-drawer-item>div span,.ops-item-detail,.ops-proof-pending,.staff-settings-field em,.staff-session-details span,.staff-session-details p,.staff-security-help){color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] :is(.dash-doughnut-legend li,.dash-payment-pct,.ops-drawer-body section p,.ops-timeline li.done){color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] :is(.ops-drawer-body section h3,.ops-timeline li,.dash-empty-mini,.inv-empty){color:var(--mgmt-muted)}
.app-layout.legacy-staff[data-theme="dark"] :is(.dash-doughnut-legend li.is-active,.dash-rank-row:hover,.dash-table-row:hover){border-color:var(--mgmt-border);background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout.legacy-staff[data-theme="dark"] .dash-payment-bar{background:var(--mgmt-input)}
.app-layout.legacy-staff[data-theme="dark"] .dash-payment-total{border-color:var(--mgmt-border);color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .staff-settings-field{color:var(--mgmt-text)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-session-network :is(code,span){color:var(--mgmt-heading)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-session-details>div+div,.app-layout:is(.legacy-staff,.legacy-admin) .staff-session-network .staff-session-place{border-color:var(--mgmt-border)}
.app-layout:is(.legacy-staff,.legacy-admin) .staff-session-device-title:before{background:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 18%,transparent)}

.app-layout.legacy-admin[data-theme="dark"] :is(.staff-settings-card,.staff-settings-container,.staff-settings-security){background:var(--mgmt-surface);border-color:var(--mgmt-border);color:var(--mgmt-text)}
.app-layout.legacy-admin[data-theme="dark"] :is(.staff-settings-card,.staff-workspace-group,.staff-session-details) :is(h2,h3,b,strong){color:var(--mgmt-heading)}
.app-layout.legacy-admin[data-theme="dark"] :is(.staff-settings-card,.staff-workspace-group,.staff-session-details) :is(p,small,span){color:var(--mgmt-muted)}
.app-layout.legacy-admin[data-theme="dark"] .staff-settings-field{color:var(--mgmt-text)}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] .staff-security-layout{background:var(--mgmt-canvas)}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] :is(.staff-security-mfa,.staff-security-sessions,.staff-security-password){border-color:var(--mgmt-border);background:var(--mgmt-surface);box-shadow:none}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] :is(.staff-security-title-row h3,.staff-security-sessions h3,.staff-security-password h3,.staff-security-session-main h4){color:var(--mgmt-heading)}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] :is(.staff-security-section-copy>p,.staff-security-sessions>header p,.staff-security-password>header p,.staff-security-session-main p,.staff-security-session-facts,.staff-security-meta span,.staff-security-empty-session small){color:var(--mgmt-muted)}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] :is(.staff-security-section-icon,.staff-security-device-icon,.staff-session-counts span){background:var(--mgmt-hover);color:var(--mgmt-primary)}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] .staff-session-counts b{color:var(--mgmt-heading)}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] .staff-security-empty-session{border-color:var(--mgmt-border);background:var(--mgmt-subtle)}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] .staff-security-empty-session b{color:var(--mgmt-text)}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] .staff-security-status.is-off{border-color:#6f5b34;background:#342d20;color:#f0cf8c}
.app-layout:is(.legacy-admin,.legacy-staff)[data-theme="dark"] .staff-security-status.is-active{border-color:#315e43;background:#1c3828;color:#a9dfba}

.app-layout.legacy-staff[data-theme="dark"] .ops-cancel-group.tone-gold{border-color:color-mix(in srgb,#d5af67 34%,var(--mgmt-border));background:linear-gradient(145deg,color-mix(in srgb,#d5af67 7%,var(--mgmt-surface)),var(--mgmt-elevated))}
.app-layout.legacy-staff[data-theme="dark"] .ops-cancel-group.tone-gold:before{background:#d5af67}
.app-layout.legacy-staff[data-theme="dark"] .ops-cancel-group.tone-gold :is(header,header small,header b){color:#efd49e}
.app-layout.legacy-staff[data-theme="dark"] :is(.ops-review-summary,.ops-payment-outcome,.ops-drawer-cancellation-review){border-color:color-mix(in srgb,#d5af67 32%,var(--mgmt-border));background:color-mix(in srgb,#d5af67 8%,var(--mgmt-elevated));color:#efd49e}
.app-layout.legacy-staff[data-theme="dark"] .ops-review-summary p,.app-layout.legacy-staff[data-theme="dark"] .ops-payment-outcome label{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-text)}
.app-layout.legacy-staff[data-theme="dark"] .ops-review-summary :is(span,b),.app-layout.legacy-staff[data-theme="dark"] .ops-payment-outcome legend,.app-layout.legacy-staff[data-theme="dark"] .ops-drawer-cancellation-review :is(b,small){color:#efd49e}
.app-layout.legacy-staff[data-theme="dark"] .ops-drawer-cancellation-review p{color:var(--mgmt-text)!important}
.app-layout.legacy-staff[data-theme="dark"] .ops-review-status{border-color:color-mix(in srgb,#d5af67 32%,var(--mgmt-border));background:color-mix(in srgb,#d5af67 9%,var(--mgmt-input));color:#efd49e}
.app-layout.legacy-staff[data-theme="dark"] .danger-button.subtle{border-color:color-mix(in srgb,var(--mgmt-danger) 40%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:#ffb5b5}

.app-layout[data-theme="dark"] :is(.status-chip--attention,.inv-status.tone-amber){background:#3a2d16;border-color:#6f5523;color:#f1c56d}
.app-layout[data-theme="dark"] :is(.status-chip--received,.status-chip--completed,.inv-status.tone-green,.inv-connection.tone-live){background:#173322;border-color:#2e6240;color:#8cdaa4}
.app-layout[data-theme="dark"] :is(.status-chip--confirmed,.inv-status.tone-blue){background:#172b40;border-color:#315679;color:#91bff1}
.app-layout[data-theme="dark"] :is(.status-chip--preparing){background:#36291c;border-color:#684b2d;color:#e1b77c}
.app-layout[data-theme="dark"] :is(.status-chip--delivery){background:#12332e;border-color:#29685d;color:#7fd5c6}
.app-layout[data-theme="dark"] :is(.status-chip--pickup){background:#2a2340;border-color:#51457c;color:#b8a8ee}
.app-layout[data-theme="dark"] :is(.status-chip--cancelled,.inv-status.tone-red,.inv-connection.tone-offline){background:#3a2022;border-color:#704045;color:#ffaaaa}
.app-layout[data-theme="dark"] .inv-status.tone-neutral{background:#27322c;border-color:#46564d;color:#bec9c2}
.app-layout[data-theme="dark"] :is(.status-chip--neutral){background:#202e26;border-color:#3b4e42;color:#b7c6bc}
.app-layout[data-theme="dark"] .inv-connection.tone-reconnecting{background:#3a2d16;color:#f1c56d}
.app-layout .sidebar-theme-switcher button:focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}

/* Users & Access workspace */
.ua-primary-action,.ua-secondary-action,.ua-danger-action,.ua-row-action,.ua-clear{min-height:44px;border-radius:12px;padding:0 15px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-size:.78rem;font-weight:850;cursor:pointer;transition:background-color .18s ease,border-color .18s ease,color .18s ease,box-shadow .18s ease,opacity .18s ease}
.ua-primary-action{border:1px solid transparent;background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary);box-shadow:0 9px 18px color-mix(in srgb,var(--mgmt-primary) 24%,transparent)}
.ua-primary-action:hover:not(:disabled){box-shadow:0 12px 24px color-mix(in srgb,var(--mgmt-primary) 32%,transparent)}
.ua-secondary-action,.ua-row-action,.ua-clear{border:1px solid var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-heading)}
.ua-secondary-action:hover:not(:disabled),.ua-row-action:hover,.ua-clear:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}
.ua-danger-action{border:1px solid color-mix(in srgb,var(--mgmt-danger) 38%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}.ua-danger-action:hover:not(:disabled){border-color:color-mix(in srgb,var(--mgmt-danger) 58%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-danger) 14%,var(--mgmt-surface))}.ua-danger-action--solid{border-color:transparent;background:var(--mgmt-danger);color:var(--mgmt-on-primary);box-shadow:0 9px 18px color-mix(in srgb,var(--mgmt-danger) 22%,transparent)}
.ua-primary-action:focus-visible,.ua-secondary-action:focus-visible,.ua-danger-action:focus-visible,.ua-row-action:focus-visible,.ua-clear:focus-visible,.ua-tabs a:focus-visible,.ua-toolbar :is(input,select):focus-visible,.ua-field :is(input,select):focus-visible,.ua-drawer button:focus-visible,.ua-pagination button:focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}.ua-danger-action:focus-visible{outline-color:var(--mgmt-danger)}
.ua-primary-action:disabled,.ua-secondary-action:disabled,.ua-danger-action:disabled{cursor:not-allowed;opacity:.48;box-shadow:none}

.ua-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 18px;padding:7px;border:1px solid var(--mgmt-border);border-radius:19px;background:var(--mgmt-subtle);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}
.ua-tabs a{min-height:64px;border:1px solid transparent;border-radius:14px;padding:10px 15px;display:flex;align-items:center;gap:11px;color:var(--mgmt-muted);transition:background-color .18s ease,border-color .18s ease,color .18s ease,box-shadow .18s ease}
.ua-tabs a>svg{flex:0 0 auto}.ua-tabs a>span{min-width:0;display:flex;flex-direction:column;gap:2px}.ua-tabs a b{color:inherit;font-size:.8rem}.ua-tabs a small{overflow:hidden;text-overflow:ellipsis;color:var(--mgmt-faint);font-size:.66rem;white-space:nowrap}
.ua-tabs a:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}
.ua-tabs a.active{border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-primary);box-shadow:0 8px 18px rgba(0,0,0,.1),inset 0 1px 0 var(--mgmt-highlight)}

.ua-module{min-width:0;border:1px solid var(--mgmt-border);border-radius:24px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight);overflow:hidden}
.ua-module-intro{min-height:88px;padding:19px 22px;border-bottom:1px solid var(--mgmt-border);display:flex;align-items:center;justify-content:space-between;gap:18px}
.ua-module-intro>div{display:flex;align-items:center;gap:12px;min-width:0}.ua-module-icon,.ua-modal-icon{width:42px;height:42px;flex:0 0 42px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--mgmt-primary) 12%,var(--mgmt-surface));color:var(--mgmt-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mgmt-primary) 18%,var(--mgmt-border))}
.ua-module-intro h2{margin:0;color:var(--mgmt-heading);font-size:1rem;letter-spacing:-.02em}.ua-module-intro p{margin:4px 0 0;color:var(--mgmt-muted);font-size:.73rem;line-height:1.45}.ua-module-intro>span,.ua-module-count{flex:none;color:var(--mgmt-muted);font-size:.72rem;font-weight:800;white-space:nowrap}.ua-module-intro-actions{flex:none;margin-left:auto;gap:14px!important}.ua-module-intro-actions .ua-primary-action{min-width:116px}
.ua-stat-rail{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}
.ua-stat-rail>div{min-height:78px;padding:15px 20px;border-right:1px solid var(--mgmt-border);display:flex;justify-content:center;flex-direction:column;gap:5px}.ua-stat-rail>div:last-child{border-right:0}.ua-stat-rail span{color:var(--mgmt-muted);font-size:.68rem;font-weight:750}.ua-stat-rail b{color:var(--mgmt-heading);font-size:1.35rem;font-variant-numeric:tabular-nums;letter-spacing:-.04em}

.ua-toolbar{padding:14px 18px;border-bottom:1px solid var(--mgmt-border);display:flex;align-items:flex-end;gap:9px;flex-wrap:wrap;background:var(--mgmt-surface)}
.ua-toolbar>label{min-width:132px;display:flex;flex-direction:column;gap:5px;color:var(--mgmt-muted);font-size:.62rem;font-weight:850;letter-spacing:.04em;text-transform:uppercase}.ua-toolbar>label>span{padding-left:2px}
.ua-toolbar :is(input,select){height:44px;min-width:0;border:1px solid var(--mgmt-border);border-radius:11px;background:var(--mgmt-input);color:var(--mgmt-text);padding:0 11px;font:inherit;font-size:.76rem;text-transform:none;letter-spacing:0;outline:0}
.ua-toolbar .ua-search{min-width:260px;flex:1;align-self:flex-end;height:44px;border:1px solid var(--mgmt-border);border-radius:12px;background:var(--mgmt-input);padding:0 12px;display:flex;align-items:center;flex-direction:row;gap:8px;color:var(--mgmt-muted)}
.ua-search input{width:100%;height:40px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.ua-clear{height:44px;min-height:44px}
.ua-toolbar--audit .ua-search{flex-basis:280px}.ua-toolbar--audit>label:not(.ua-search){min-width:118px}.ua-toolbar--audit>label:has(input[type="date"]){min-width:142px}

.ua-table-wrap{width:100%;overflow:auto;overscroll-behavior:contain}.ua-table{width:100%;min-width:860px;border-collapse:separate;border-spacing:0;font-size:.74rem}.ua-audit-table{min-width:1180px}
.ua-table th{position:sticky;z-index:2;top:0;padding:12px 15px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.61rem;font-weight:850;letter-spacing:.06em;text-transform:uppercase;text-align:left;white-space:nowrap}
.ua-table td{padding:13px 15px;border-bottom:1px solid var(--mgmt-border);background:transparent;color:var(--mgmt-text);vertical-align:middle}.ua-table tbody tr:last-child td{border-bottom:0}.ua-table tbody tr{transition:background-color .16s ease}.ua-table tbody tr:hover{background:var(--mgmt-hover)}
.ua-table td>b{display:block;color:var(--mgmt-heading);font-size:.75rem}.ua-table td>small{display:block;margin-top:3px;color:var(--mgmt-muted);font-size:.64rem;line-height:1.35}.ua-table time{font-variant-numeric:tabular-nums;white-space:nowrap}.ua-row-action{min-height:44px;height:44px;padding:0 12px;border-radius:10px;font-size:.7rem}
.ua-user-identity{min-width:190px;display:flex;align-items:center;gap:10px}.ua-user-identity>span,.ua-drawer-avatar{width:38px;height:38px;flex:0 0 38px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary);font-size:.68rem;font-weight:900;letter-spacing:.035em;box-shadow:0 5px 12px color-mix(in srgb,var(--mgmt-primary) 22%,transparent)}.ua-user-identity>div{min-width:0}.ua-user-identity b{display:block;max-width:230px;overflow:hidden;text-overflow:ellipsis;color:var(--mgmt-heading);font-size:.75rem;white-space:nowrap}.ua-user-identity small{display:block;max-width:260px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;color:var(--mgmt-muted);font-size:.64rem;white-space:nowrap}
.ua-result,.ua-surface{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;text-transform:capitalize}.ua-result i{width:6px;height:6px;border-radius:50%;background:currentColor}
.ua-result{font-size:.65rem;font-weight:850}.ua-result--success{color:var(--mgmt-success)}.ua-result--warning{color:var(--mgmt-warning)}.ua-result--failed{color:var(--mgmt-danger)}
.ua-event-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:var(--mgmt-faint)}.ua-event-dot--admin,.ua-event-dot--info{background:var(--mgmt-primary)}.ua-event-dot--staff{background:#4c79b7}.ua-event-dot--cashier{background:#9a6ab4}.ua-event-dot--system{background:var(--mgmt-faint)}.ua-event-dot--warning{background:var(--mgmt-warning)}.ua-event-dot--critical{background:var(--mgmt-danger)}
.ua-mobile-list{display:none}.ua-empty{min-height:240px;padding:40px;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;color:var(--mgmt-muted)}.ua-empty>svg{width:48px;height:48px;margin-bottom:12px;padding:12px;border-radius:15px;background:var(--mgmt-subtle);color:var(--mgmt-primary)}.ua-empty b{color:var(--mgmt-heading);font-size:.84rem}.ua-empty span{max-width:330px;margin-top:5px;font-size:.72rem;line-height:1.5}
.ua-loading{padding:14px;display:flex;flex-direction:column;gap:8px}.ua-loading>div{height:57px;border-radius:12px;background:linear-gradient(90deg,var(--mgmt-subtle) 25%,var(--mgmt-hover) 37%,var(--mgmt-subtle) 63%);background-size:400% 100%;animation:ua-shimmer 1.35s ease infinite}@keyframes ua-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
.ua-state{margin:16px;padding:14px;border:1px solid var(--mgmt-border);border-radius:14px;display:flex;align-items:center;gap:11px}.ua-state>svg{flex:none}.ua-state>div{min-width:0;display:flex;flex:1;flex-direction:column;gap:3px}.ua-state b{color:var(--mgmt-heading);font-size:.76rem}.ua-state span{color:var(--mgmt-muted);font-size:.7rem}.ua-state button{min-height:38px;border:1px solid currentColor;border-radius:10px;background:transparent;color:inherit;padding:0 12px;font:inherit;font-size:.7rem;font-weight:850}.ua-state--error{border-color:color-mix(in srgb,var(--mgmt-danger) 30%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}
.ua-audit-notice{margin:14px 18px 0;padding:12px 14px;border:1px solid color-mix(in srgb,var(--mgmt-primary) 20%,var(--mgmt-border));border-radius:13px;background:color-mix(in srgb,var(--mgmt-primary) 7%,var(--mgmt-surface));display:flex;align-items:center;gap:10px;color:var(--mgmt-primary)}.ua-audit-notice>svg{flex:none}.ua-audit-notice>div{display:flex;flex-direction:column;gap:2px}.ua-audit-notice b{color:var(--mgmt-heading);font-size:.72rem}.ua-audit-notice span{color:var(--mgmt-muted);font-size:.66rem;line-height:1.4}.ua-exporting{padding:10px 18px;border-bottom:1px solid var(--mgmt-border);background:color-mix(in srgb,var(--mgmt-primary) 7%,var(--mgmt-surface));color:var(--mgmt-primary);font-size:.7rem;font-weight:800}
.ua-policy-mode{display:inline-flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--mgmt-success) 24%,var(--mgmt-border));border-radius:999px;background:color-mix(in srgb,var(--mgmt-success) 8%,var(--mgmt-surface));color:var(--mgmt-success);font-size:.65rem;font-weight:850;white-space:nowrap}.ua-policy-mode i{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 14%,transparent)}
.ua-approval-banner{margin-top:0;border-radius:0;border-left:0;border-right:0;border-top:0;padding:14px 22px}.ua-approval-banner span{max-width:760px}
.ua-policy-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:16px 18px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}.ua-policy-summary>div{min-height:58px;padding:11px 13px;border:1px solid var(--mgmt-border);border-radius:13px;background:var(--mgmt-surface);display:flex;align-items:center;gap:10px}.ua-policy-summary>div>svg{flex:none;color:var(--mgmt-primary)}.ua-policy-summary span{display:flex;flex-direction:column;gap:2px}.ua-policy-summary b{color:var(--mgmt-heading);font-size:.78rem}.ua-policy-summary small{color:var(--mgmt-muted);font-size:.63rem}
.ua-policy-groups{padding:16px 18px 18px;display:grid;gap:14px}.ua-policy-group{overflow:hidden;border:1px solid var(--mgmt-border);border-radius:16px;background:var(--mgmt-surface)}.ua-policy-group>header{min-height:58px;padding:12px 15px;border-bottom:1px solid var(--mgmt-border);display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--mgmt-subtle)}.ua-policy-group>header h3{margin:0;color:var(--mgmt-heading);font-size:.78rem}.ua-policy-group>header p{margin:3px 0 0;color:var(--mgmt-muted);font-size:.63rem}.ua-policy-group>header>span{color:var(--mgmt-muted);font-size:.62rem;font-weight:750;white-space:nowrap}.ua-policy-group>header>span b{padding:0 4px;color:var(--mgmt-primary);font-size:.8rem}.ua-policy-table-wrap{overflow:auto}.ua-policy-table{width:100%;min-width:880px;border-collapse:collapse;font-size:.68rem}.ua-policy-table th{padding:10px 13px;border-bottom:1px solid var(--mgmt-border);color:var(--mgmt-muted);font-size:.57rem;font-weight:850;letter-spacing:.055em;text-align:left;text-transform:uppercase;white-space:nowrap}.ua-policy-table td{padding:12px 13px;border-bottom:1px solid var(--mgmt-border);vertical-align:middle;color:var(--mgmt-text)}.ua-policy-table tbody tr:last-child td{border-bottom:0}.ua-policy-table tbody tr:hover{background:var(--mgmt-hover)}.ua-policy-action{display:flex;align-items:flex-start;gap:9px;min-width:270px}.ua-policy-action-icon{width:27px;height:27px;flex:0 0 27px;display:grid;place-items:center;border-radius:8px;background:color-mix(in srgb,var(--mgmt-primary) 11%,var(--mgmt-surface));color:var(--mgmt-primary)}.ua-policy-action>span:last-child{display:flex;flex-direction:column;gap:3px}.ua-policy-action b{color:var(--mgmt-heading);font-size:.69rem}.ua-policy-action small{max-width:320px;color:var(--mgmt-muted);font-size:.61rem;line-height:1.4}.ua-policy-request,.ua-policy-approval{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;font-size:.63rem;font-weight:800}.ua-policy-request{color:var(--mgmt-primary)}.ua-policy-approval{color:var(--mgmt-warning)}.ua-policy-rule{display:inline-flex;padding:5px 8px;border-radius:7px;background:var(--mgmt-input);color:var(--mgmt-heading);font-size:.61rem;font-weight:800;white-space:nowrap}.ua-policy-module{color:var(--mgmt-muted);font-size:.62rem;white-space:nowrap}.ua-policy-footer{padding:13px 18px;border-top:1px solid var(--mgmt-border);display:flex;align-items:flex-start;gap:8px;background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.63rem;line-height:1.5}.ua-policy-footer>svg{flex:none;margin-top:1px;color:var(--mgmt-primary)}
.ua-pagination{min-height:62px;padding:10px 16px;border-top:1px solid var(--mgmt-border);display:flex;align-items:center;justify-content:flex-end;gap:18px;color:var(--mgmt-muted);font-size:.7rem}.ua-pagination>span{margin-right:auto}.ua-pagination label{display:flex;align-items:center;gap:7px}.ua-pagination select{height:44px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-input);color:var(--mgmt-text);padding:0 8px}.ua-pagination>div{display:flex;gap:6px}.ua-pagination button{width:44px;height:44px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-elevated);color:var(--mgmt-heading);display:grid;place-items:center}.ua-pagination button:disabled{cursor:not-allowed;opacity:.38}.ua-pagination svg{width:17px}

.ua-overlay,.ua-drawer-scrim{position:fixed;inset:0;z-index:90;background:rgba(3,9,7,.58);backdrop-filter:blur(4px)}.ua-overlay{padding:20px;display:grid;place-items:center}.ua-modal{width:min(610px,100%);max-height:calc(100dvh - 40px);overflow:auto;border:1px solid var(--mgmt-border);border-radius:24px;background:var(--mgmt-elevated);color:var(--mgmt-text);box-shadow:var(--mgmt-shadow-high),inset 0 1px 0 var(--mgmt-highlight);animation:ua-modal-in .2s ease-out both}.ua-modal>header,.ua-drawer>header{min-height:88px;padding:18px 20px;border-bottom:1px solid var(--mgmt-border);display:flex;align-items:center;justify-content:space-between;gap:14px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface))}.ua-modal>header>div,.ua-drawer>header>div{min-width:0;display:flex;align-items:center;gap:12px}.ua-modal h2,.ua-drawer h2{margin:0;color:var(--mgmt-heading);font-size:1rem}.ua-modal header p,.ua-drawer header p{margin:4px 0 0;color:var(--mgmt-muted);font-size:.68rem}.ua-modal header>button,.ua-drawer header>button{width:44px;height:44px;flex:none;border:1px solid var(--mgmt-border);border-radius:12px;background:var(--mgmt-input);color:var(--mgmt-text);display:grid;place-items:center}.ua-modal header>button:hover,.ua-drawer header>button:hover{background:var(--mgmt-hover)}
.ua-confirm-overlay{z-index:120}.ua-confirm-modal{width:min(500px,100%)}.ua-modal-icon--danger{background:var(--mgmt-danger-soft);color:var(--mgmt-danger);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mgmt-danger) 24%,var(--mgmt-border))}.ua-confirm-copy{padding:20px}.ua-confirm-copy p{margin:0;color:var(--mgmt-text);font-size:.76rem;line-height:1.65}
.ua-form-grid{padding:20px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.ua-field{display:flex;flex-direction:column;gap:6px;color:var(--mgmt-heading);font-size:.7rem;font-weight:800}.ua-field--wide{grid-column:1/-1}.ua-field>span{display:flex;justify-content:space-between;gap:8px}.ua-field>span small,.ua-field>small{color:var(--mgmt-muted);font-size:.63rem;font-weight:650;line-height:1.4}.ua-field :is(input,select){width:100%;height:46px;border:1px solid var(--mgmt-border);border-radius:11px;background:var(--mgmt-input);color:var(--mgmt-text);padding:0 12px;font:inherit;font-size:.76rem;outline:0}.ua-field :is(input,select):disabled{cursor:not-allowed;opacity:.56}.ua-form-error{margin:0 20px 16px;padding:11px 12px;border:1px solid color-mix(in srgb,var(--mgmt-danger) 30%,var(--mgmt-border));border-radius:11px;background:var(--mgmt-danger-soft);color:var(--mgmt-danger);font-size:.7rem;font-weight:750;line-height:1.45}.ua-modal>footer,.ua-drawer>footer{padding:14px 20px;border-top:1px solid var(--mgmt-border);display:flex;align-items:center;justify-content:flex-end;gap:9px;background:var(--mgmt-surface)}
.ua-drawer-scrim{z-index:91;width:100%;border:0}.ua-drawer{position:fixed;z-index:92;top:0;right:0;width:min(520px,100vw);height:100dvh;border-left:1px solid var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-text);display:grid;grid-template-rows:auto minmax(0,1fr) auto;box-shadow:-28px 0 70px rgba(0,0,0,.3);animation:ua-drawer-in .23s ease-out both}.ua-drawer-avatar{width:44px;height:44px;flex-basis:44px;border-radius:14px}.ua-drawer-body{overflow-y:auto;padding:18px;overscroll-behavior:contain}.ua-drawer-body>section,.ua-technical{padding:17px;border:1px solid var(--mgmt-border);border-radius:16px;background:var(--mgmt-surface);box-shadow:inset 0 1px 0 var(--mgmt-highlight)}.ua-drawer-body>section+section,.ua-drawer-body>section+.ua-technical{margin-top:12px}.ua-section-heading{margin-bottom:15px;display:flex;align-items:flex-start;gap:9px}.ua-section-heading>svg{margin-top:1px;flex:none;color:var(--mgmt-primary)}.ua-section-heading h3{margin:0;color:var(--mgmt-heading);font-size:.8rem}.ua-section-heading p{margin:3px 0 0;color:var(--mgmt-muted);font-size:.66rem;line-height:1.4}.ua-drawer-body .ua-field+.ua-field{margin-top:12px}.ua-inline-note{margin:12px 0 0;color:var(--mgmt-muted);font-size:.68rem;line-height:1.5}.ua-details{margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ua-details>div{min-width:0}.ua-details dt{color:var(--mgmt-muted);font-size:.61rem;font-weight:800;text-transform:uppercase;letter-spacing:.055em}.ua-details dd{margin:4px 0 0;overflow-wrap:anywhere;color:var(--mgmt-heading);font-size:.72rem;line-height:1.45;text-transform:capitalize}.ua-details code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:.64rem;text-transform:none}.ua-recent-list{display:flex;flex-direction:column}.ua-recent-list>div{padding:9px 0;border-bottom:1px solid var(--mgmt-border);display:grid;grid-template-columns:8px minmax(0,1fr);align-items:flex-start;gap:9px}.ua-recent-list>div:last-child{border-bottom:0}.ua-recent-list>div>i{margin-top:4px}.ua-recent-list span{display:flex;flex-direction:column;gap:3px}.ua-recent-list b{color:var(--mgmt-heading);font-size:.68rem;line-height:1.4}.ua-recent-list small{color:var(--mgmt-muted);font-size:.61rem}
.ua-event-summary h3{margin:12px 0 5px;color:var(--mgmt-heading);font-size:1rem;line-height:1.4}.ua-event-summary p{margin:0;color:var(--mgmt-muted);font:600 .65rem ui-monospace,SFMono-Regular,Consolas,monospace}.ua-change-list{display:flex;flex-direction:column;gap:9px}.ua-change-list>div{padding:11px;border:1px solid var(--mgmt-border);border-radius:12px;background:var(--mgmt-subtle);display:grid;grid-template-columns:100px minmax(0,1fr) minmax(0,1fr);gap:9px;align-items:start}.ua-change-list>div>b{padding-top:18px;overflow-wrap:anywhere;color:var(--mgmt-heading);font-size:.65rem;text-transform:capitalize}.ua-change-list span{min-width:0;display:flex;flex-direction:column;gap:4px}.ua-change-list small{color:var(--mgmt-muted);font-size:.58rem;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.ua-change-list code{max-height:96px;overflow:auto;padding:8px;border-radius:8px;background:var(--mgmt-input);color:var(--mgmt-text);font:500 .61rem/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}.ua-technical summary{cursor:pointer;color:var(--mgmt-heading);font-size:.72rem;font-weight:850}.ua-technical[open] summary{margin-bottom:14px}
.ua-toast{position:fixed;z-index:110;right:22px;bottom:22px;max-width:min(420px,calc(100vw - 32px));min-height:48px;padding:12px 15px;border:1px solid var(--mgmt-border);border-radius:13px;background:var(--mgmt-elevated);color:var(--mgmt-heading);display:flex;align-items:center;gap:9px;font-size:.73rem;font-weight:800;box-shadow:var(--mgmt-shadow-high);animation:ua-toast-in .2s ease-out both}.ua-toast--success>svg{color:var(--mgmt-success)}
@keyframes ua-modal-in{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}@keyframes ua-drawer-in{from{transform:translateX(24px);opacity:.6}to{transform:none;opacity:1}}@keyframes ua-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

@media(max-width:1180px){.ua-toolbar--audit>label:not(.ua-search){flex:1;min-width:145px}.ua-toolbar--audit .ua-search{flex-basis:100%}}
@media(max-width:900px){.ua-stat-rail{grid-template-columns:repeat(2,minmax(0,1fr))}.ua-stat-rail>div:nth-child(2){border-right:0}.ua-stat-rail>div:nth-child(-n+2){border-bottom:1px solid var(--mgmt-border)}.ua-table-wrap{display:none}.ua-mobile-list{padding:12px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ua-user-card,.ua-event-card{min-width:0;min-height:132px;padding:14px;border:1px solid var(--mgmt-border);border-radius:15px;background:var(--mgmt-surface);color:var(--mgmt-text);display:flex;align-items:flex-start;flex-direction:column;gap:9px;text-align:left}.ua-user-card>.ua-user-identity{width:100%;min-width:0}.ua-user-card>span{color:var(--mgmt-muted);font-size:.68rem}.ua-event-card>span:first-child{width:100%;display:grid;grid-template-columns:8px 1fr auto;align-items:center;gap:7px;color:var(--mgmt-muted);font-size:.62rem}.ua-event-card>strong{color:var(--mgmt-heading);font-size:.73rem;line-height:1.4}.ua-event-card>small{color:var(--mgmt-muted);font-size:.64rem}.ua-event-card>.ua-result{margin-top:auto}.ua-pagination{padding-left:14px;padding-right:14px}}
@media(max-width:700px){.ua-tabs{grid-template-columns:1fr}.ua-tabs a{min-height:58px}.ua-module-intro{align-items:flex-start;flex-direction:column}.ua-module-intro>span{align-self:flex-end}.ua-module-intro-actions{width:100%;justify-content:flex-end;flex-wrap:wrap}.ua-stat-rail>div{padding:13px 15px}.ua-toolbar{align-items:stretch;flex-direction:column}.ua-toolbar>label,.ua-toolbar .ua-search,.ua-toolbar--audit>label:not(.ua-search){width:100%;min-width:0;flex:none}.ua-mobile-list{grid-template-columns:1fr}.ua-form-grid{grid-template-columns:1fr}.ua-field--wide{grid-column:auto}.ua-modal>footer,.ua-drawer>footer{align-items:stretch;flex-direction:column-reverse}.ua-modal>footer button,.ua-drawer>footer button{width:100%}.ua-details{grid-template-columns:1fr}.ua-change-list>div{grid-template-columns:1fr}.ua-change-list>div>b{padding-top:0}.ua-drawer{width:100vw}.ua-pagination{flex-wrap:wrap}.ua-pagination>span{width:100%;margin:0}.ua-pagination label{margin-right:auto}.ua-policy-summary{grid-template-columns:1fr}.ua-policy-group>header{align-items:flex-start;flex-direction:column}.ua-policy-group>header>span{white-space:normal}.ua-approval-banner{padding:14px 18px}}
@media(prefers-reduced-motion:reduce){.ua-loading>div{animation:none}.ua-modal,.ua-drawer,.ua-toast{animation:none}.ua-primary-action,.ua-secondary-action,.ua-danger-action,.ua-row-action,.ua-clear,.ua-tabs a,.ua-table tbody tr{transition:none}}
.ua-account-overlay{z-index:120}

@media(prefers-reduced-motion:reduce){.app-layout.legacy-staff *,.app-layout.legacy-staff *::before,.app-layout.legacy-staff *::after,.app-layout.legacy-admin *,.app-layout.legacy-admin *::before,.app-layout.legacy-admin *::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}

/* Customer messages */
.cm-page{display:grid;gap:20px;padding-bottom:30px}
.cm-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.cm-summary-card{--cm-accent:var(--mgmt-primary);position:relative;isolation:isolate;min-width:0;min-height:104px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:13px;overflow:hidden;padding:18px;border:1px solid color-mix(in srgb,var(--cm-accent) 28%,var(--mgmt-border));border-radius:18px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight);transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}
.cm-summary-card:before{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:var(--cm-accent)}
.cm-summary-card:after{content:'';position:absolute;z-index:-1;right:-48px;bottom:-64px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--cm-accent) 18%,transparent),transparent 70%)}
.cm-summary-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--cm-accent) 50%,var(--mgmt-border));box-shadow:var(--mgmt-shadow-high),inset 0 1px 0 var(--mgmt-highlight)}
.cm-summary-card>span{width:42px;height:42px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--cm-accent) 34%,var(--mgmt-border));border-radius:13px;background:color-mix(in srgb,var(--cm-accent) 13%,var(--mgmt-surface));color:var(--cm-accent)}
.cm-summary-card>div{min-width:0;display:flex;flex-direction:column;gap:4px}.cm-summary-card>div b{color:var(--mgmt-heading);font-size:.82rem}.cm-summary-card>div small{color:var(--mgmt-muted);font-size:.68rem;line-height:1.25}
.cm-summary-card>strong{color:var(--cm-accent);font-size:clamp(1.65rem,2vw,2rem);font-weight:900;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.05em}
.cm-summary-card.tone-amber{--cm-accent:#a8711d}.cm-summary-card.tone-blue{--cm-accent:#3475a8}.cm-summary-card.tone-rose{--cm-accent:#a95068}
.legacy-staff[data-theme="dark"] .cm-summary-card.tone-amber{--cm-accent:#e2b66c}.legacy-staff[data-theme="dark"] .cm-summary-card.tone-blue{--cm-accent:#80bce8}.legacy-staff[data-theme="dark"] .cm-summary-card.tone-rose{--cm-accent:#ec9bb2}
.cm-inbox-card{min-width:0;overflow:hidden;border:1px solid var(--mgmt-border);border-radius:20px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:var(--mgmt-shadow),inset 0 1px 0 var(--mgmt-highlight)}
.cm-inbox-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:20px 22px;border-bottom:1px solid var(--mgmt-border)}
.cm-inbox-heading>div>span{color:var(--mgmt-primary);font-size:.66rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.cm-inbox-heading h2{margin:4px 0 0;color:var(--mgmt-heading);font-size:1.15rem}.cm-inbox-heading>p{margin:0;color:var(--mgmt-muted);font-size:.76rem;font-weight:700}
.cm-toolbar{display:grid;grid-template-columns:minmax(260px,.8fr) minmax(520px,1.2fr);gap:14px;padding:14px 16px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}
.cm-search{min-width:0;min-height:46px;display:flex;align-items:center;gap:9px;padding:0 12px;border:1px solid var(--mgmt-border);border-radius:13px;background:var(--mgmt-input);color:var(--mgmt-muted);transition:border-color .2s ease,box-shadow .2s ease}.cm-search:focus-within{border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 22%,transparent)}
.cm-search input{min-width:0;flex:1;border:0!important;outline:0!important;padding:0!important;background:transparent!important;box-shadow:none!important;color:var(--mgmt-heading);font:inherit;font-size:.78rem}.cm-search button{width:32px;height:32px;display:grid;place-items:center;border:0;border-radius:9px;background:transparent;color:var(--mgmt-muted);cursor:pointer}.cm-search button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}
.cm-filter-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:4px;border:1px solid var(--mgmt-border);border-radius:13px;background:var(--mgmt-input)}
.cm-filter-tabs button{min-width:0;min-height:38px;display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:9px;background:transparent;color:var(--mgmt-muted);font:inherit;font-size:.72rem;font-weight:800;cursor:pointer;transition:background-color .2s ease,color .2s ease,box-shadow .2s ease}.cm-filter-tabs button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.cm-filter-tabs button.active{background:var(--mgmt-primary);color:var(--mgmt-on-primary);box-shadow:0 6px 14px color-mix(in srgb,var(--mgmt-primary) 25%,transparent)}.cm-filter-tabs b{min-width:21px;height:21px;display:grid;place-items:center;padding:0 5px;border-radius:999px;background:color-mix(in srgb,currentColor 12%,transparent);font-size:.62rem;font-variant-numeric:tabular-nums}
.cm-table-wrap{overflow-x:auto}.cm-table{width:100%;border-collapse:collapse;table-layout:fixed}.cm-table th{padding:12px 14px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.64rem;font-weight:850;letter-spacing:.07em;text-align:left;text-transform:uppercase}.cm-table th:nth-child(1){width:19%}.cm-table th:nth-child(2){width:15%}.cm-table th:nth-child(3){width:28%}.cm-table th:nth-child(4){width:14%}.cm-table th:nth-child(5){width:13%}.cm-table th:nth-child(6){width:11%}
.cm-table td{padding:14px;border-bottom:1px solid var(--mgmt-border);color:var(--mgmt-text);font-size:.74rem;vertical-align:middle}.cm-table tbody tr{transition:background-color .2s ease}.cm-table tbody tr:hover{background:var(--mgmt-hover)}.cm-table tbody tr:last-child td{border-bottom:0}
.cm-customer,.cm-message-preview{min-width:0;display:flex;flex-direction:column;gap:4px}.cm-customer b,.cm-message-preview b{overflow:hidden;color:var(--mgmt-heading);font-size:.77rem;text-overflow:ellipsis;white-space:nowrap}.cm-customer a{overflow:hidden;color:var(--mgmt-primary);font-size:.69rem;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.cm-customer a:hover{text-decoration:underline}.cm-customer small,.cm-message-preview small{color:var(--mgmt-muted);font-size:.65rem}.cm-message-preview p{display:-webkit-box;overflow:hidden;margin:0;color:var(--mgmt-muted);font-size:.7rem;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.cm-type-badge,.cm-status-badge{width:max-content;max-width:100%;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--mgmt-border);border-radius:999px;padding:6px 9px;background:var(--mgmt-subtle);color:var(--mgmt-text);font-size:.64rem;font-weight:800;white-space:nowrap}.cm-type-badge.type-pre_order{border-color:color-mix(in srgb,var(--mgmt-primary) 35%,var(--mgmt-border));color:var(--mgmt-primary)}.cm-type-badge.type-help_request{border-color:color-mix(in srgb,#a95068 40%,var(--mgmt-border));color:#a95068}.legacy-staff[data-theme="dark"] .cm-type-badge.type-help_request{color:#ec9bb2}.cm-status-badge.is-new{border-color:color-mix(in srgb,var(--mgmt-warning) 38%,var(--mgmt-border));background:var(--mgmt-warning-soft);color:var(--mgmt-warning)}.cm-status-badge.is-new>span{width:7px;height:7px;border-radius:50%;background:currentColor}.cm-status-badge.is-replied{border-color:color-mix(in srgb,var(--mgmt-success) 38%,var(--mgmt-border));background:var(--mgmt-success-soft);color:var(--mgmt-success)}.cm-table time{color:var(--mgmt-muted);font-size:.67rem;line-height:1.45}
.cm-reply-button{min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 11px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-elevated);color:var(--mgmt-heading);font:inherit;font-size:.68rem;font-weight:850;white-space:nowrap;cursor:pointer;transition:border-color .2s ease,background-color .2s ease,color .2s ease}.cm-reply-button:hover{border-color:var(--mgmt-primary);background:color-mix(in srgb,var(--mgmt-primary) 10%,var(--mgmt-elevated));color:var(--mgmt-primary)}
.cm-state{min-height:260px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;padding:30px;color:var(--mgmt-muted);text-align:center}.cm-state b{color:var(--mgmt-heading)}.cm-state span{font-size:.75rem}.cm-state-error{color:var(--mgmt-danger)}.cm-state button{min-height:40px;padding:0 16px;border:0;border-radius:10px;background:var(--mgmt-primary);color:var(--mgmt-on-primary);font-weight:800;cursor:pointer}.cm-mobile-list{display:none}
.cm-pagination{min-height:62px;display:flex;align-items:center;gap:20px;padding:10px 16px;border-top:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.7rem}.cm-pagination>span{margin-right:auto}.cm-pagination b{color:var(--mgmt-heading);font-variant-numeric:tabular-nums}.cm-pagination label{display:flex;align-items:center;gap:8px;font-weight:750}.cm-pagination select{min-height:38px;padding:0 28px 0 10px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-input);color:var(--mgmt-heading)}.cm-pagination>div{display:flex;align-items:center;gap:10px}.cm-pagination>div>button{width:38px;height:38px;display:grid;place-items:center;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-elevated);color:var(--mgmt-heading);cursor:pointer}.cm-pagination>div>button:hover:not(:disabled){border-color:var(--mgmt-primary);color:var(--mgmt-primary)}.cm-pagination button:disabled{cursor:not-allowed;opacity:.4}
.cm-dialog-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(3,8,5,.68);backdrop-filter:blur(6px)}.cm-dialog{width:min(680px,100%);max-height:calc(100dvh - 40px);overflow:auto;border:1px solid var(--mgmt-border);border-radius:22px;background:var(--mgmt-elevated);color:var(--mgmt-text);box-shadow:0 32px 90px rgba(0,0,0,.38)}.cm-dialog:focus{outline:none}.cm-dialog>header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 24px;border-bottom:1px solid var(--mgmt-border)}.cm-dialog>header span{color:var(--mgmt-primary);font-size:.65rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.cm-dialog>header h2{margin:5px 0 0;color:var(--mgmt-heading);font-size:1.18rem}.cm-dialog>header button{width:42px;height:42px;display:grid;place-items:center;flex:none;border:1px solid var(--mgmt-border);border-radius:12px;background:var(--mgmt-subtle);color:var(--mgmt-heading);cursor:pointer}.cm-dialog>header button:hover{background:var(--mgmt-hover)}
.cm-dialog-recipient{display:flex;align-items:center;gap:10px;margin:18px 24px 0;padding:13px 14px;border:1px solid var(--mgmt-border);border-radius:13px;background:var(--mgmt-subtle);color:var(--mgmt-primary)}.cm-dialog-recipient>span{min-width:0;display:flex;flex:1;flex-direction:column;gap:2px}.cm-dialog-recipient b{color:var(--mgmt-heading);font-size:.76rem}.cm-dialog-recipient small{overflow:hidden;color:var(--mgmt-muted);font-size:.68rem;text-overflow:ellipsis}.cm-dialog blockquote{margin:14px 24px;padding:16px 18px;border-left:3px solid var(--mgmt-primary);border-radius:0 12px 12px 0;background:var(--mgmt-subtle)}.cm-dialog blockquote p{margin:0;color:var(--mgmt-text);font-size:.76rem;line-height:1.65;white-space:pre-wrap}.cm-dialog blockquote footer{margin-top:8px;color:var(--mgmt-muted);font-size:.65rem}.cm-previous-reply{margin:14px 24px;padding:14px;border:1px solid color-mix(in srgb,var(--mgmt-success) 28%,var(--mgmt-border));border-radius:12px;background:var(--mgmt-success-soft)}.cm-previous-reply b{color:var(--mgmt-success);font-size:.69rem}.cm-previous-reply p{margin:7px 0;color:var(--mgmt-text);font-size:.72rem;line-height:1.55;white-space:pre-wrap}.cm-previous-reply small{color:var(--mgmt-muted);font-size:.64rem}
.cm-dialog form{padding:4px 24px 24px}.cm-dialog form label>span{display:block;margin-bottom:8px;color:var(--mgmt-heading);font-size:.74rem;font-weight:850}.cm-dialog textarea{width:100%;min-height:150px;resize:vertical;padding:13px;border:1px solid var(--mgmt-border);border-radius:13px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.78rem;line-height:1.6}.cm-dialog form>small{display:block;margin-top:7px;color:var(--mgmt-muted);font-size:.66rem}.cm-dialog-error{margin:10px 0 0;padding:10px 12px;border-radius:10px;background:var(--mgmt-danger-soft);color:var(--mgmt-danger);font-size:.7rem;font-weight:750}.cm-dialog form>footer{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.cm-secondary-button,.cm-send-button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:0 18px;border-radius:11px;font:inherit;font-size:.73rem;font-weight:850;cursor:pointer}.cm-secondary-button{border:1px solid var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-heading)}.cm-send-button{border:0;background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary)}.cm-dialog button:disabled{cursor:not-allowed;opacity:.5}
.cm-toast{position:fixed;right:24px;bottom:24px;z-index:1100;display:flex;align-items:center;gap:9px;padding:13px 16px;border:1px solid color-mix(in srgb,var(--mgmt-success) 35%,var(--mgmt-border));border-radius:13px;background:var(--mgmt-elevated);color:var(--mgmt-success);font-size:.75rem;font-weight:800;box-shadow:var(--mgmt-shadow-high)}
@media(max-width:1180px){.cm-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-toolbar{grid-template-columns:1fr}.cm-filter-tabs{min-width:0}}
@media(max-width:900px){.cm-table-wrap{display:none}.cm-mobile-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:14px}.cm-message-card{min-width:0;display:flex;align-items:flex-start;flex-direction:column;gap:10px;padding:15px;border:1px solid var(--mgmt-border);border-radius:15px;background:var(--mgmt-surface)}.cm-message-card>header{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px}.cm-message-card h3{margin:0;color:var(--mgmt-heading);font-size:.82rem}.cm-message-card>p{display:-webkit-box;overflow:hidden;margin:0;color:var(--mgmt-muted);font-size:.72rem;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:3}.cm-message-card>div{min-width:0;display:flex;flex-direction:column;gap:3px}.cm-message-card>div b{color:var(--mgmt-heading);font-size:.73rem}.cm-message-card>div small,.cm-message-card time{overflow:hidden;color:var(--mgmt-muted);font-size:.65rem;text-overflow:ellipsis}.cm-message-card>.cm-reply-button{width:100%;margin-top:auto}.cm-pagination{flex-wrap:wrap}.cm-pagination>span{width:100%;margin:0}.cm-pagination label{margin-right:auto}}
@media(max-width:650px){.cm-summary-grid{grid-template-columns:1fr}.cm-summary-card{min-height:92px}.cm-inbox-heading{align-items:flex-start;flex-direction:column}.cm-filter-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.cm-mobile-list{grid-template-columns:1fr}.cm-pagination{align-items:stretch;flex-direction:column}.cm-pagination>div{justify-content:space-between}.cm-pagination label{justify-content:space-between;margin:0}.cm-dialog-backdrop{align-items:end;padding:0}.cm-dialog{width:100%;max-height:92dvh;border-radius:22px 22px 0 0}.cm-dialog>header,.cm-dialog form{padding-left:18px;padding-right:18px}.cm-dialog-recipient,.cm-dialog blockquote,.cm-previous-reply{margin-left:18px;margin-right:18px}.cm-dialog-recipient{align-items:flex-start;flex-wrap:wrap}.cm-dialog-recipient .cm-type-badge{margin-left:28px}.cm-dialog form>footer{align-items:stretch;flex-direction:column-reverse}.cm-toast{right:14px;bottom:14px;left:14px;justify-content:center}}

/* Admin cancellations and refunds */
.cancel-workspace-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:16px;padding:5px;border:1px solid var(--mgmt-border);border-radius:16px;background:var(--mgmt-subtle)}
.cancel-workspace-tabs>button{position:relative;min-width:0;min-height:66px;display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:11px;padding:10px 14px;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--mgmt-muted);font:inherit;text-align:left;cursor:pointer;transition:background-color .18s ease,border-color .18s ease,color .18s ease,box-shadow .18s ease}
.cancel-workspace-tabs>button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.cancel-workspace-tabs>button.active{border-color:color-mix(in srgb,var(--mgmt-primary) 30%,var(--mgmt-border));background:var(--mgmt-elevated);color:var(--mgmt-heading);box-shadow:0 6px 18px rgba(31,65,45,.08),inset 0 -2px 0 var(--mgmt-primary)}
.cancel-tab-icon{width:40px;height:40px;display:grid;place-items:center;border:1px solid var(--mgmt-border);border-radius:11px;background:var(--mgmt-surface);color:var(--mgmt-muted)}.cancel-workspace-tabs>button.active .cancel-tab-icon{border-color:color-mix(in srgb,var(--mgmt-primary) 35%,var(--mgmt-border));background:color-mix(in srgb,var(--mgmt-primary) 10%,var(--mgmt-surface));color:var(--mgmt-primary)}
.cancel-workspace-tabs>button>span:nth-child(2){min-width:0;display:grid;gap:3px}.cancel-workspace-tabs b{color:inherit;font-size:.82rem}.cancel-workspace-tabs small{overflow:hidden;color:var(--mgmt-muted);font-size:.68rem;text-overflow:ellipsis;white-space:nowrap}.cancel-workspace-tabs strong{min-width:30px;height:26px;display:grid;place-items:center;padding:0 7px;border-radius:999px;background:var(--mgmt-hover);color:var(--mgmt-text);font-size:.68rem;font-variant-numeric:tabular-nums}.cancel-workspace-tabs>button.active strong{background:color-mix(in srgb,var(--mgmt-primary) 13%,var(--mgmt-surface));color:var(--mgmt-primary)}
.cancel-range-toolbar{min-height:56px;display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:8px 10px;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface);box-shadow:0 8px 24px rgba(31,65,45,.045)}
.cancel-range-display{min-height:38px;display:flex;align-items:center;gap:8px;padding:0 10px;color:var(--mgmt-text);font-size:.72rem;font-weight:800;white-space:nowrap}.cancel-range-display svg{color:var(--mgmt-primary)}
.cancel-presets,.cancel-segmented{display:flex;align-items:center;gap:4px;padding:3px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-input)}.cancel-presets button,.cancel-segmented button{min-height:32px;padding:0 10px;border:0;border-radius:7px;background:transparent;color:var(--mgmt-muted);font:inherit;font-size:.67rem;font-weight:800;cursor:pointer;transition:background-color .18s ease,color .18s ease}.cancel-presets button:hover,.cancel-segmented button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.cancel-presets button.active,.cancel-segmented button.active{background:var(--mgmt-primary);color:var(--mgmt-on-primary)}
.cancel-custom-range{display:flex;align-items:end;gap:7px}.cancel-custom-range label{display:grid;gap:3px;color:var(--mgmt-muted);font-size:.61rem;font-weight:800;text-transform:uppercase}.cancel-custom-range input{min-height:34px;padding:0 8px;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.68rem}.cancel-custom-range>span{padding-bottom:9px;color:var(--mgmt-muted);font-size:.65rem}.cancel-export-control{margin-left:auto}.cancel-export{min-height:38px!important;margin-left:0;white-space:nowrap}.cancel-export-menu{top:44px;min-width:200px}.cancel-export-error{display:flex;align-items:center;gap:8px;margin:-7px 0 16px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--mgmt-danger) 32%,var(--mgmt-border));border-radius:10px;background:var(--mgmt-danger-soft);color:var(--mgmt-danger);font-size:.67rem;font-weight:750}.cancel-export-error span{flex:1}.cancel-export-error button{width:26px;height:26px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:inherit;cursor:pointer}.cancel-export-error button:hover{background:color-mix(in srgb,var(--mgmt-danger) 12%,transparent)}
.cancel-error,.cancel-limit-note{margin:0 0 16px;border-radius:12px;font-size:.73rem}.cancel-error{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid color-mix(in srgb,var(--mgmt-danger) 35%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}.cancel-error>div{display:grid;gap:2px;flex:1}.cancel-error b{color:var(--mgmt-heading)}.cancel-error span{color:var(--mgmt-text)}.cancel-error button{min-height:34px;display:flex;align-items:center;gap:6px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:.67rem;font-weight:800;cursor:pointer}.cancel-limit-note{padding:9px 12px;border:1px solid color-mix(in srgb,var(--mgmt-warning) 30%,var(--mgmt-border));background:var(--mgmt-warning-soft);color:var(--mgmt-warning)}
.cancel-report-enter{display:grid;gap:16px;animation:cancel-enter .2s ease-out both}@keyframes cancel-enter{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.cancel-metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.cancel-metric{--cancel-accent:var(--mgmt-primary);position:relative;min-width:0;min-height:132px;display:flex;flex-direction:column;overflow:hidden;padding:16px 17px;border:1px solid color-mix(in srgb,var(--cancel-accent) 25%,var(--mgmt-border));border-radius:16px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:0 9px 26px rgba(31,65,45,.055),inset 0 1px 0 var(--mgmt-highlight)}.cancel-metric:before{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:var(--cancel-accent)}.cancel-metric-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.cancel-metric-top>span{overflow:hidden;color:var(--mgmt-muted);font-size:.66rem;font-weight:850;letter-spacing:.055em;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}.cancel-metric-top>i{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:color-mix(in srgb,var(--cancel-accent) 10%,var(--mgmt-subtle));color:var(--cancel-accent);font-style:normal}.cancel-metric>strong{display:block;overflow:hidden;margin-top:10px;color:var(--mgmt-heading);font-size:clamp(1.35rem,2vw,1.75rem);font-weight:900;letter-spacing:-.045em;line-height:1.08;text-overflow:ellipsis;white-space:nowrap}.cancel-metric-detail{overflow:hidden;margin-top:4px;color:var(--mgmt-muted);font-size:.64rem;text-overflow:ellipsis;white-space:nowrap}.cancel-compare{display:flex;align-items:center;gap:4px;margin-top:auto;padding-top:10px;color:var(--mgmt-muted);font-size:.61rem}.cancel-compare b{color:inherit}.cancel-compare.is-up{color:var(--mgmt-danger)}.cancel-compare.is-down{color:var(--mgmt-success)}.cancel-compare.is-flat b{color:var(--mgmt-muted)}.cancel-tone-rose{--cancel-accent:#a95068}.cancel-tone-gold{--cancel-accent:var(--mgmt-warning)}.cancel-tone-sage{--cancel-accent:var(--mgmt-primary)}.cancel-tone-blue{--cancel-accent:#3475a8}.app-layout[data-theme="dark"] .cancel-tone-rose{--cancel-accent:#ec9bb2}.app-layout[data-theme="dark"] .cancel-tone-blue{--cancel-accent:#80bce8}
.cancel-panel,.cancel-records-panel{min-width:0;overflow:hidden;border:1px solid var(--mgmt-border);border-radius:17px;background:var(--mgmt-surface);box-shadow:0 10px 28px rgba(31,65,45,.05)}.panel-head{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 16px;border-bottom:1px solid var(--mgmt-border)}.panel-head>div:first-child{display:grid;gap:3px}.panel-head>div:first-child>span{color:var(--mgmt-heading);font-size:.8rem;font-weight:850}.panel-head small{color:var(--mgmt-muted);font-size:.64rem}.cancel-panel-total{min-width:28px;height:26px;display:grid;place-items:center;border-radius:999px;background:var(--mgmt-subtle);color:var(--mgmt-text);font-size:.66rem}
.cancel-insight-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.75fr);gap:16px}.cancel-insight-stack{min-width:0;display:grid;gap:16px}.cancel-trend-panel{min-height:390px}.cancel-trend-chart{padding:18px}.cancel-trend-chart svg{display:block;width:100%;height:auto;min-height:225px;overflow:visible}.cancel-grid-line{stroke:var(--mgmt-border);stroke-width:1}.cancel-line{fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.cancel-line-cancelled,.cancel-dot-cancelled{stroke:#a95068}.cancel-line-refunded,.cancel-dot-refunded{stroke:var(--mgmt-primary)}.cancel-dot{fill:var(--mgmt-surface);stroke-width:2.5}.cancel-axis-label{fill:var(--mgmt-muted);font-size:10px}.cancel-chart-legend{display:flex;justify-content:flex-end;gap:14px;margin-top:7px;color:var(--mgmt-muted);font-size:.64rem}.cancel-chart-legend span{display:flex;align-items:center;gap:6px}.cancel-chart-legend i{width:8px;height:8px;border-radius:50%}.cancel-chart-legend i.cancelled{background:#a95068}.cancel-chart-legend i.refunded{background:var(--mgmt-primary)}
.cancel-bars{display:grid;gap:11px;margin:0;padding:14px 16px 16px;list-style:none}.cancel-bars li>div{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}.cancel-bars li>div>span{overflow:hidden;color:var(--mgmt-text);font-size:.68rem;text-overflow:ellipsis;white-space:nowrap}.cancel-bars li b{color:var(--mgmt-heading);font-size:.68rem}.cancel-bars li b small{color:var(--mgmt-muted);font-weight:600}.cancel-bars li>i{display:block;height:6px;overflow:hidden;border-radius:999px;background:var(--mgmt-subtle)}.cancel-bars li>i>span{display:block;height:100%;min-width:3px;border-radius:inherit}.cancel-empty-mini{min-height:122px;display:grid;place-items:center;align-content:center;gap:8px;padding:20px;color:var(--mgmt-muted);text-align:center}.cancel-empty-mini>span{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:var(--mgmt-subtle);color:var(--mgmt-primary)}.cancel-empty-mini p{margin:0;font-size:.68rem}
.cancel-records-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 18px;border-bottom:1px solid var(--mgmt-border)}.cancel-records-head>div:first-child{display:grid;gap:3px}.cancel-records-head h2{margin:0;color:var(--mgmt-heading);font-size:1rem}.cancel-records-head>div:first-child>span{color:var(--mgmt-muted);font-size:.66rem}.cancel-record-tools{min-width:0;display:flex;align-items:center;justify-content:flex-end;gap:8px}.cancel-search{min-width:260px;min-height:40px;display:flex!important;align-items:center;gap:8px;padding:0 9px!important;border:1px solid var(--mgmt-border)!important;border-radius:10px!important;background:var(--mgmt-input)!important;color:var(--mgmt-muted)}.cancel-search:focus-within{border-color:var(--mgmt-primary)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 16%,transparent)}.cancel-search input{min-width:0;flex:1;border:0!important;outline:0!important;background:transparent!important;color:var(--mgmt-heading)!important;font:inherit;font-size:.7rem}.cancel-search button{width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:var(--mgmt-muted);cursor:pointer}.cancel-search button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.cancel-record-tools>select{min-height:40px;padding:0 30px 0 10px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.68rem}.cancel-filter-button{min-height:40px!important}.cancel-filter-button b{min-width:20px;height:20px;display:grid;place-items:center;border-radius:999px;background:var(--mgmt-primary);color:var(--mgmt-on-primary);font-size:.61rem}.cancel-filter-button.active{border-color:var(--mgmt-primary)!important;color:var(--mgmt-primary)!important}
.cancel-filter-panel{padding:16px 18px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}.cancel-filter-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.cancel-filter-panel-head .eyebrow{color:var(--mgmt-primary);font-size:.58rem;font-weight:850;letter-spacing:.09em;text-transform:uppercase}.cancel-filter-panel-head h3{margin:3px 0 0;color:var(--mgmt-heading);font-size:.85rem}.cancel-filter-panel-head>button{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-surface);color:var(--mgmt-muted);cursor:pointer}.cancel-filter-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.cancel-filter-grid label{display:grid;gap:6px;color:var(--mgmt-text);font-size:.65rem;font-weight:800}.cancel-filter-grid :is(select,input){width:100%;min-height:40px;padding:0 10px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.68rem;outline:none}.cancel-filter-grid :is(select,input):focus{border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 15%,transparent)}.cancel-filter-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.cancel-filter-actions .button{min-height:38px}.cancel-active-filters{min-height:38px;display:flex;align-items:center;gap:7px;padding:7px 16px;border-bottom:1px solid var(--mgmt-border);background:color-mix(in srgb,var(--mgmt-primary) 6%,var(--mgmt-surface));color:var(--mgmt-primary);font-size:.65rem;font-weight:750}.cancel-active-filters button{margin-left:auto;border:0;background:transparent;color:inherit;font:inherit;font-size:.64rem;font-weight:850;cursor:pointer;text-decoration:underline}
.cancel-table-wrap{overflow-x:auto}.cancel-table{width:100%;min-width:1020px;border-collapse:collapse;table-layout:fixed}.cancel-table.is-refunds{min-width:950px}.cancel-table th{padding:11px 13px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.59rem;font-weight:850;letter-spacing:.065em;text-align:left;text-transform:uppercase}.cancel-table td{padding:13px;border-bottom:1px solid var(--mgmt-border);color:var(--mgmt-text);font-size:.68rem;line-height:1.4;vertical-align:middle}.cancel-table tbody tr{cursor:pointer;transition:background-color .16s ease}.cancel-table tbody tr:hover,.cancel-table tbody tr:focus-visible{background:var(--mgmt-hover);outline:none}.cancel-table tbody tr:focus-visible{box-shadow:inset 3px 0 0 var(--mgmt-primary)}.cancel-table tbody tr:last-child td{border-bottom:0}.cancel-table td>b,.cancel-table td>small{display:block}.cancel-table td>b{overflow:hidden;color:var(--mgmt-heading);font-size:.7rem;text-overflow:ellipsis;white-space:nowrap}.cancel-table td>small{margin-top:3px;color:var(--mgmt-muted);font-size:.61rem;line-height:1.35}.cancel-table.is-cancellations th:nth-child(1){width:11%}.cancel-table.is-cancellations th:nth-child(2){width:15%}.cancel-table.is-cancellations th:nth-child(3){width:10%}.cancel-table.is-cancellations th:nth-child(4){width:11%}.cancel-table.is-cancellations th:nth-child(5){width:20%}.cancel-table.is-cancellations th:nth-child(6){width:12%}.cancel-table.is-cancellations th:nth-child(7){width:15%}.cancel-table.is-cancellations th:nth-child(8){width:6%}.cancel-table.is-refunds th:nth-child(1){width:16%}.cancel-table.is-refunds th:nth-child(2){width:12%}.cancel-table.is-refunds th:nth-child(3){width:15%}.cancel-table.is-refunds th:nth-child(4){width:12%}.cancel-table.is-refunds th:nth-child(5){width:17%}.cancel-table.is-refunds th:nth-child(6){width:22%}.cancel-table.is-refunds th:nth-child(7){width:6%}.cancel-reason-cell>span,.cancel-reason-cell>small{display:-webkit-box!important;overflow:hidden;white-space:normal!important;-webkit-box-orient:vertical;-webkit-line-clamp:2}.cancel-amount b{font-variant-numeric:tabular-nums}.cancel-status-stack{display:flex;align-items:flex-start;flex-direction:column;gap:5px}.cancel-status{width:max-content;max-width:100%;display:inline-flex;align-items:center;padding:5px 8px;border:1px solid var(--mgmt-border);border-radius:999px;background:var(--mgmt-subtle);color:var(--mgmt-text);font-size:.58rem;font-weight:850;white-space:nowrap}.cancel-status-order.is-cancelled,.cancel-status-order.is-voided,.cancel-status-refund.is-failed{border-color:color-mix(in srgb,var(--mgmt-danger) 38%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}.cancel-status-refund.is-completed,.cancel-status-refund.is-processed{border-color:color-mix(in srgb,var(--mgmt-success) 38%,var(--mgmt-border));background:var(--mgmt-success-soft);color:var(--mgmt-success)}.cancel-status-refund.is-pending,.cancel-status-refund.is-payment-review,.cancel-status-refund.is-processing{border-color:color-mix(in srgb,var(--mgmt-warning) 38%,var(--mgmt-border));background:var(--mgmt-warning-soft);color:var(--mgmt-warning)}
.cancel-action-cell{position:relative;text-align:right}.cancel-more{width:34px;height:34px;display:grid;place-items:center;margin-left:auto;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-elevated);color:var(--mgmt-muted);cursor:pointer}.cancel-more:hover,.cancel-more[aria-expanded="true"]{border-color:var(--mgmt-primary);background:color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-elevated));color:var(--mgmt-primary)}.cancel-row-menu{position:absolute;z-index:20;right:12px;top:46px;width:178px;display:grid;padding:5px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-elevated);box-shadow:var(--mgmt-shadow-high)}.cancel-row-menu button{min-height:36px;display:flex;align-items:center;gap:8px;padding:0 9px;border:0;border-radius:7px;background:transparent;color:var(--mgmt-text);font:inherit;font-size:.66rem;text-align:left;cursor:pointer}.cancel-row-menu button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}
.cancel-mobile-records{display:none}.cancel-empty-state{min-height:250px;display:grid;place-items:center;align-content:center;gap:7px;padding:30px;color:var(--mgmt-muted);text-align:center}.cancel-empty-state>span{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:var(--mgmt-subtle);color:var(--mgmt-primary)}.cancel-empty-state h3{margin:3px 0 0;color:var(--mgmt-heading);font-size:.9rem}.cancel-empty-state p{margin:0;font-size:.7rem}.cancel-empty-state .button{margin-top:8px}.cancel-pagination{min-height:58px;display:flex;align-items:center;gap:18px;padding:9px 14px;border-top:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.65rem}.cancel-pagination>div:first-child{display:flex;align-items:center;gap:8px}.cancel-pagination select{min-height:34px;padding:0 26px 0 8px;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-input);color:var(--mgmt-heading)}.cancel-pagination>span{margin-left:auto}.cancel-page-buttons{display:flex;align-items:center;gap:8px}.cancel-page-buttons button{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-elevated);color:var(--mgmt-heading);cursor:pointer}.cancel-page-buttons button:hover:not(:disabled){border-color:var(--mgmt-primary);color:var(--mgmt-primary)}.cancel-page-buttons button:disabled{opacity:.4;cursor:not-allowed}.cancel-page-buttons b{min-width:80px;color:var(--mgmt-heading);font-size:.64rem;text-align:center}
.cancel-skeleton{display:grid;gap:16px}.cancel-skeleton-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.cancel-skeleton i{display:block;border-radius:15px;background:linear-gradient(90deg,var(--mgmt-subtle),var(--mgmt-hover),var(--mgmt-subtle));background-size:220% 100%;animation:cancel-shimmer 1.35s linear infinite}.cancel-skeleton-metrics i{height:132px}.cancel-skeleton-charts{display:grid;grid-template-columns:1.5fr 1fr;gap:16px}.cancel-skeleton-charts i{height:260px}.cancel-skeleton-wide{height:180px}.cancel-skeleton-table{height:330px}@keyframes cancel-shimmer{to{background-position:-220% 0}}
.cancel-drawer-statuses{display:flex;gap:7px;margin-bottom:14px;flex-wrap:wrap}.cancel-amount-list{display:grid;gap:0}.cancel-amount-list p{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0;padding:8px 0;border-bottom:1px solid var(--mgmt-border);color:var(--mgmt-muted);font-size:.7rem}.cancel-amount-list p:last-child{border-bottom:0}.cancel-amount-list b{color:var(--mgmt-heading);font-variant-numeric:tabular-nums}.cancel-amount-list .total{margin-top:4px;color:var(--mgmt-heading);font-weight:850}.cancel-amount-list .refund{color:var(--mgmt-success)}.cancel-amount-list .refund b{color:inherit}
.cancel-workspace-tabs button:focus-visible,.cancel-presets button:focus-visible,.cancel-segmented button:focus-visible,.cancel-record-tools :is(button,select):focus-visible,.cancel-filter-panel button:focus-visible,.cancel-more:focus-visible,.cancel-row-menu button:focus-visible,.cancel-pagination :is(button,select):focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}
@media(max-width:1180px){.cancel-metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cancel-insight-grid{grid-template-columns:1fr}.cancel-insight-stack{grid-template-columns:repeat(2,minmax(0,1fr))}.cancel-records-head{align-items:flex-start;flex-direction:column}.cancel-record-tools{width:100%;justify-content:flex-start}.cancel-search{flex:1}.cancel-filter-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:850px){.cancel-range-toolbar{align-items:stretch;flex-wrap:wrap}.cancel-range-display{flex:1}.cancel-presets{order:3;width:100%;display:grid;grid-template-columns:repeat(4,1fr)}.cancel-custom-range{order:4;width:100%}.cancel-export-control{margin-left:0}.cancel-table-wrap{display:none}.cancel-mobile-records{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px}.cancel-mobile-card{min-width:0;min-height:170px;display:flex;align-items:flex-start;flex-direction:column;gap:8px;padding:14px;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface);color:var(--mgmt-text);font:inherit;text-align:left;cursor:pointer}.cancel-mobile-card:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}.cancel-mobile-card>div:first-child,.cancel-mobile-card>footer{width:100%;display:flex;align-items:center;justify-content:space-between;gap:9px}.cancel-mobile-card>div:first-child span{color:var(--mgmt-primary);font-size:.65rem;font-weight:850}.cancel-mobile-card>div:first-child b{color:var(--mgmt-heading);font-size:.78rem}.cancel-mobile-card>strong{color:var(--mgmt-heading);font-size:.76rem}.cancel-mobile-card>small{display:-webkit-box;overflow:hidden;color:var(--mgmt-muted);font-size:.67rem;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.cancel-mobile-card>footer{margin-top:auto;color:var(--mgmt-muted);font-size:.61rem}.cancel-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cancel-pagination{flex-wrap:wrap}.cancel-pagination>span{width:100%;order:3;margin:0}.cancel-page-buttons{margin-left:auto}}
@media(max-width:620px){.cancel-workspace-tabs{grid-template-columns:1fr}.cancel-workspace-tabs>button{min-height:60px}.cancel-range-toolbar{padding:8px}.cancel-range-display{width:100%}.cancel-export-control{width:100%}.cancel-export{width:100%;justify-content:center}.cancel-export-menu{left:0;right:auto;width:100%}.cancel-custom-range{display:grid;grid-template-columns:1fr auto 1fr;align-items:end}.cancel-custom-range input{width:100%}.cancel-metric-grid,.cancel-insight-grid,.cancel-insight-stack,.cancel-mobile-records,.cancel-filter-grid,.cancel-skeleton-metrics,.cancel-skeleton-charts{grid-template-columns:1fr}.cancel-metric{min-height:118px}.cancel-record-tools{align-items:stretch;flex-direction:column}.cancel-search{width:100%;min-width:0}.cancel-record-tools>select,.cancel-filter-button{width:100%}.cancel-records-head{padding:14px}.cancel-filter-panel{padding:14px}.cancel-filter-actions{align-items:stretch;flex-direction:column-reverse}.cancel-filter-actions .button{width:100%;justify-content:center}.cancel-trend-chart{padding:10px}.cancel-trend-chart svg{min-height:180px}.cancel-pagination{align-items:stretch;flex-direction:column}.cancel-pagination>div:first-child,.cancel-page-buttons{justify-content:space-between;margin:0}.cancel-pagination>span{order:0;text-align:center}.cancel-page-buttons b{flex:1}.cancel-drawer{width:100vw!important}}
@media(prefers-reduced-motion:reduce){.cancel-report-enter,.cancel-skeleton i{animation:none}.cancel-workspace-tabs>button,.cancel-presets button,.cancel-segmented button,.cancel-table tbody tr{transition:none}}

/* Report chart motion: draw trends, then introduce points and breakdowns in sequence. */
@keyframes cancel-line-draw{from{stroke-dashoffset:1;opacity:.35}to{stroke-dashoffset:0;opacity:1}}
@keyframes cancel-area-in{from{opacity:0;transform:scaleY(.7);transform-origin:center bottom}to{opacity:1;transform:scaleY(1);transform-origin:center bottom}}
@keyframes cancel-point-in{0%{opacity:0;transform:scale(.3)}70%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
@keyframes cancel-bar-row-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes cancel-bar-fill{from{width:0}to{width:var(--cancel-bar-width)}}
.app-layout.legacy-admin .cancel-animated-path{stroke-dasharray:1;stroke-dashoffset:1;vector-effect:non-scaling-stroke;animation:cancel-line-draw .78s cubic-bezier(.22,1,.36,1) both}
.app-layout.legacy-admin .cancel-area{opacity:1;transform-box:fill-box;animation:cancel-area-in .7s cubic-bezier(.22,1,.36,1) both}
.app-layout.legacy-admin .cancel-area-stop-cancelled{stop-color:#a95068;stop-opacity:.18}
.app-layout.legacy-admin .cancel-area-stop-refunded{stop-color:var(--mgmt-primary);stop-opacity:.2}
.app-layout.legacy-admin .cancel-area-stop-end{stop-color:var(--mgmt-primary);stop-opacity:0}
.app-layout.legacy-admin .cancel-chart-point{transform-box:fill-box;transform-origin:center;opacity:0;animation:cancel-point-in .36s cubic-bezier(.22,1,.36,1) var(--cancel-point-delay) both}
.app-layout.legacy-admin .cancel-dot{transition:r .18s ease,fill .18s ease,filter .18s ease}
.app-layout.legacy-admin .cancel-dot.is-active{fill:var(--mgmt-surface);filter:drop-shadow(0 0 7px color-mix(in srgb,var(--mgmt-primary) 30%,transparent))}
.app-layout.legacy-admin .cancel-dot-cancelled.is-active{filter:drop-shadow(0 0 7px color-mix(in srgb,#a95068 34%,transparent))}
.app-layout.legacy-admin .cancel-hover-guide{stroke:color-mix(in srgb,var(--mgmt-primary) 34%,var(--mgmt-border));stroke-width:1.5;stroke-dasharray:4 6}
.app-layout.legacy-admin .cancel-chart-tooltip{max-width:min(220px,76vw);white-space:normal}
.app-layout.legacy-admin .cancel-chart-tooltip span{color:var(--mgmt-heading)}
.app-layout.legacy-admin .cancel-bar-row{opacity:0;animation:cancel-bar-row-in .36s cubic-bezier(.22,1,.36,1) var(--cancel-bar-delay) both}
.app-layout.legacy-admin .cancel-bars li>i>span{width:var(--cancel-bar-width);animation:cancel-bar-fill .65s cubic-bezier(.22,1,.36,1) var(--cancel-bar-delay) both}
html[data-staff-motion="reduce"] .app-layout.legacy-admin .cancel-animated-path,html[data-staff-motion="reduce"] .app-layout.legacy-admin .cancel-area,html[data-staff-motion="reduce"] .app-layout.legacy-admin .cancel-chart-point,html[data-staff-motion="reduce"] .app-layout.legacy-admin .cancel-bar-row,html[data-staff-motion="reduce"] .app-layout.legacy-admin .cancel-bars li>i>span{animation:none;opacity:1}
@media(prefers-reduced-motion:reduce){.app-layout.legacy-admin .cancel-animated-path,.app-layout.legacy-admin .cancel-area,.app-layout.legacy-admin .cancel-chart-point,.app-layout.legacy-admin .cancel-bar-row,.app-layout.legacy-admin .cancel-bars li>i>span{animation:none;opacity:1}}

/* Admin inventory movement report */
.ir-range-bar{min-height:58px;display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:8px 10px;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface);box-shadow:0 8px 24px rgba(31,65,45,.045)}
.ir-range-label{min-height:38px;display:flex;align-items:center;gap:8px;padding:0 10px;color:var(--mgmt-text);font-size:.72rem;font-weight:800;white-space:nowrap}.ir-range-label svg{color:var(--mgmt-primary)}
.ir-presets{display:flex;gap:4px;padding:3px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-input)}.ir-presets button{min-height:32px;padding:0 10px;border:0;border-radius:7px;background:transparent;color:var(--mgmt-muted);font:inherit;font-size:.67rem;font-weight:800;cursor:pointer;transition:background-color .18s ease,color .18s ease}.ir-presets button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.ir-presets button.active{background:var(--mgmt-primary);color:var(--mgmt-on-primary)}
.ir-custom-range{display:flex;align-items:end;gap:7px}.ir-custom-range label{display:grid;gap:3px;color:var(--mgmt-muted);font-size:.59rem;font-weight:850;letter-spacing:.04em;text-transform:uppercase}.ir-custom-range input{min-height:34px;padding:0 8px;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.67rem}.ir-custom-range>span{padding-bottom:9px;color:var(--mgmt-muted);font-size:.64rem}.ir-refresh{min-height:36px;display:flex;align-items:center;gap:7px;margin-left:auto;padding:0 11px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-elevated);color:var(--mgmt-text);font:inherit;font-size:.66rem;font-weight:800;cursor:pointer}.ir-refresh:hover:not(:disabled){border-color:var(--mgmt-primary);color:var(--mgmt-primary)}.ir-refresh:disabled{opacity:.5;cursor:not-allowed}
.ir-error{display:flex;align-items:center;gap:10px;margin:0 0 16px;padding:12px 14px;border:1px solid color-mix(in srgb,var(--mgmt-danger) 35%,var(--mgmt-border));border-radius:12px;background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}.ir-error>div{display:grid;gap:2px;flex:1}.ir-error b{color:var(--mgmt-heading);font-size:.76rem}.ir-error span{color:var(--mgmt-text);font-size:.7rem}.ir-error button{min-height:34px;padding:0 10px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:.65rem;font-weight:800;cursor:pointer}.ir-limit-note{margin:0 0 16px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--mgmt-warning) 30%,var(--mgmt-border));border-radius:10px;background:var(--mgmt-warning-soft);color:var(--mgmt-warning);font-size:.68rem}
.ir-page-enter{display:grid;gap:16px;animation:ir-enter .2s ease-out both}@keyframes ir-enter{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.ir-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px}.ir-metric{--ir-accent:var(--mgmt-faint);position:relative;min-width:0;min-height:112px;display:grid;grid-template-columns:38px minmax(0,1fr);align-items:start;gap:11px;overflow:hidden;padding:15px;border:1px solid color-mix(in srgb,var(--ir-accent) 25%,var(--mgmt-border));border-radius:15px;background:linear-gradient(145deg,var(--mgmt-elevated),var(--mgmt-surface));box-shadow:0 9px 24px rgba(31,65,45,.05),inset 0 1px 0 var(--mgmt-highlight)}.ir-metric:before{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:var(--ir-accent)}.ir-metric>span{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--ir-accent) 10%,var(--mgmt-subtle));color:var(--ir-accent)}.ir-metric>div{min-width:0;display:grid;gap:3px}.ir-metric small{overflow:hidden;color:var(--mgmt-muted);font-size:.61rem;font-weight:850;letter-spacing:.055em;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}.ir-metric strong{color:var(--mgmt-heading);font-size:1.7rem;font-weight:900;letter-spacing:-.05em;line-height:1.05;font-variant-numeric:tabular-nums}.ir-metric p{overflow:hidden;margin:2px 0 0;color:var(--mgmt-muted);font-size:.61rem;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}.ir-metric.tone-green{--ir-accent:var(--mgmt-success)}.ir-metric.tone-blue{--ir-accent:#3475a8}.ir-metric.tone-amber{--ir-accent:var(--mgmt-warning)}.ir-metric.tone-red,.ir-metric.tone-rose{--ir-accent:var(--mgmt-danger)}.app-layout[data-theme="dark"] .ir-metric.tone-blue{--ir-accent:#80bce8}
.ir-insight-grid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:14px}.ir-panel,.ir-ledger,.ir-exceptions{min-width:0;overflow:hidden;border:1px solid var(--mgmt-border);border-radius:17px;background:var(--mgmt-surface);box-shadow:0 10px 28px rgba(31,65,45,.05)}.ir-panel>header,.ir-exceptions>header{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border-bottom:1px solid var(--mgmt-border)}.ir-panel>header>div,.ir-exceptions>header>div{display:grid;gap:3px}.ir-panel>header span,.ir-exceptions>header span{color:var(--mgmt-heading);font-size:.79rem;font-weight:850}.ir-panel>header small,.ir-exceptions>header small{color:var(--mgmt-muted);font-size:.62rem}.ir-panel>header>b,.ir-exceptions>header>b{min-width:28px;height:26px;display:grid;place-items:center;border-radius:999px;background:var(--mgmt-subtle);color:var(--mgmt-text);font-size:.65rem}.ir-panel>header button{border:0;background:transparent;color:var(--mgmt-primary);font:inherit;font-size:.62rem;font-weight:850;cursor:pointer}
.ir-breakdown{display:grid;gap:11px;margin:0;padding:14px 16px 16px;list-style:none}.ir-breakdown li{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px 12px}.ir-breakdown li>div{display:flex;align-items:center;gap:7px;color:var(--mgmt-text);font-size:.68rem}.ir-breakdown li>b{color:var(--mgmt-heading);font-size:.69rem}.ir-breakdown li>i{grid-column:1/-1;height:6px;overflow:hidden;border-radius:999px;background:var(--mgmt-subtle)}.ir-breakdown li>i>span{display:block;height:100%;min-width:3px;border-radius:inherit;background:var(--mgmt-faint)}.ir-breakdown li>i>span.tone-green{background:var(--mgmt-success)}.ir-breakdown li>i>span.tone-blue{background:#3475a8}.ir-breakdown li>i>span.tone-amber{background:var(--mgmt-warning)}.ir-breakdown li>i>span.tone-red{background:var(--mgmt-danger)}.ir-dot{width:8px;height:8px;border-radius:50%;background:var(--mgmt-faint)}.ir-dot.tone-green{background:var(--mgmt-success)}.ir-dot.tone-blue{background:#3475a8}.ir-dot.tone-amber{background:var(--mgmt-warning)}.ir-dot.tone-red{background:var(--mgmt-danger)}
.ir-ranking{display:grid;gap:0;margin:0;padding:8px 16px 12px;list-style:none}.ir-ranking li{display:grid;grid-template-columns:26px minmax(0,1fr);align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid var(--mgmt-border)}.ir-ranking li:last-child{border-bottom:0}.ir-ranking li>span{width:24px;height:24px;display:grid;place-items:center;border-radius:7px;background:var(--mgmt-subtle);color:var(--mgmt-primary);font-size:.62rem;font-weight:900}.ir-ranking li>div{min-width:0;display:grid;gap:2px}.ir-ranking b{overflow:hidden;color:var(--mgmt-heading);font-size:.69rem;text-overflow:ellipsis;white-space:nowrap}.ir-ranking small{color:var(--mgmt-muted);font-size:.6rem}
.ir-attention>ul{display:grid;margin:0;padding:8px 16px 12px;list-style:none}.ir-attention>ul li{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid var(--mgmt-border)}.ir-attention>ul li:last-child{border-bottom:0}.ir-attention li>div{min-width:0;display:grid;gap:2px}.ir-attention li b{overflow:hidden;color:var(--mgmt-heading);font-size:.68rem;text-overflow:ellipsis;white-space:nowrap}.ir-attention li small{color:var(--mgmt-muted);font-size:.59rem}.ir-attention li>strong{color:var(--mgmt-heading);font-size:.65rem;font-variant-numeric:tabular-nums;white-space:nowrap}
.ir-compact-empty{min-height:134px;display:grid;place-items:center;align-content:center;gap:8px;padding:20px;color:var(--mgmt-muted);text-align:center}.ir-compact-empty svg{color:var(--mgmt-primary)}.ir-compact-empty p{margin:0;font-size:.66rem}
.ir-ledger-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 18px;border-bottom:1px solid var(--mgmt-border)}.ir-ledger-head>div:first-child{display:grid;gap:2px}.ir-ledger-head .eyebrow{color:var(--mgmt-primary);font-size:.57rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.ir-ledger-head h2{margin:1px 0 0;color:var(--mgmt-heading);font-size:1rem}.ir-ledger-head p{margin:0;color:var(--mgmt-muted);font-size:.64rem}.ir-ledger-actions{min-width:0;display:flex;align-items:center;justify-content:flex-end;gap:8px}.ir-search{min-width:280px;min-height:40px;display:flex;align-items:center;gap:8px;padding:0 9px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-input);color:var(--mgmt-muted)}.ir-search:focus-within{border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 16%,transparent)}.ir-search input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--mgmt-heading);font:inherit;font-size:.68rem}.ir-search button{width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:var(--mgmt-muted);cursor:pointer}.ir-search button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.ir-ledger-actions>select{min-height:40px;padding:0 30px 0 10px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.66rem}.ir-clear{min-height:40px;display:flex;align-items:center;gap:6px;padding:0 10px;border:1px solid color-mix(in srgb,var(--mgmt-danger) 30%,var(--mgmt-border));border-radius:10px;background:var(--mgmt-danger-soft);color:var(--mgmt-danger);font:inherit;font-size:.64rem;font-weight:800;cursor:pointer}
.ir-filter-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 16px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}.ir-filter-row label{display:grid;gap:5px;color:var(--mgmt-muted);font-size:.59rem;font-weight:850;letter-spacing:.04em;text-transform:uppercase}.ir-filter-row select{width:100%;min-height:38px;padding:0 28px 0 9px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.66rem;text-transform:none}
.ir-table-wrap{overflow-x:auto}.ir-table{width:100%;min-width:1120px;border-collapse:collapse;table-layout:fixed}.ir-table th{padding:11px 12px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.57rem;font-weight:850;letter-spacing:.065em;text-align:left;text-transform:uppercase}.ir-table th:nth-child(1){width:13%}.ir-table th:nth-child(2){width:16%}.ir-table th:nth-child(3){width:12%}.ir-table th:nth-child(4){width:9%}.ir-table th:nth-child(5){width:12%}.ir-table th:nth-child(6){width:12%}.ir-table th:nth-child(7){width:21%}.ir-table th:nth-child(8){width:5%}.ir-table td{padding:12px;border-bottom:1px solid var(--mgmt-border);color:var(--mgmt-text);font-size:.66rem;line-height:1.4;vertical-align:middle}.ir-table tbody tr{cursor:pointer;transition:background-color .16s ease}.ir-table tbody tr:hover,.ir-table tbody tr:focus-visible{background:var(--mgmt-hover);outline:none}.ir-table tbody tr:focus-visible{box-shadow:inset 3px 0 0 var(--mgmt-primary)}.ir-table tbody tr:last-child td{border-bottom:0}.ir-table td>b,.ir-table td>small{display:block}.ir-table td>b{overflow:hidden;color:var(--mgmt-heading);font-size:.69rem;text-overflow:ellipsis;white-space:nowrap}.ir-table td>small{margin-top:3px;color:var(--mgmt-muted);font-size:.59rem}.ir-reason{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ir-quantity b{font-variant-numeric:tabular-nums}.ir-quantity.is-in b{color:var(--mgmt-success)}.ir-quantity.is-out b{color:var(--mgmt-danger)}.ir-quantity.is-neutral b{color:var(--mgmt-warning)}
.ir-movement-badge{width:max-content;max-width:100%;display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border:1px solid var(--mgmt-border);border-radius:999px;background:var(--mgmt-subtle);color:var(--mgmt-text);font-size:.57rem;font-weight:850;white-space:nowrap}.ir-movement-badge.tone-green{border-color:color-mix(in srgb,var(--mgmt-success) 38%,var(--mgmt-border));background:var(--mgmt-success-soft);color:var(--mgmt-success)}.ir-movement-badge.tone-blue{border-color:color-mix(in srgb,#3475a8 38%,var(--mgmt-border));background:color-mix(in srgb,#3475a8 8%,var(--mgmt-surface));color:#3475a8}.ir-movement-badge.tone-amber{border-color:color-mix(in srgb,var(--mgmt-warning) 38%,var(--mgmt-border));background:var(--mgmt-warning-soft);color:var(--mgmt-warning)}.ir-movement-badge.tone-red{border-color:color-mix(in srgb,var(--mgmt-danger) 38%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}.app-layout[data-theme="dark"] .ir-movement-badge.tone-blue{color:#80bce8}.ir-movement-badge em{padding-left:5px;border-left:1px solid currentColor;font-size:.52rem;font-style:normal;text-transform:uppercase}.ir-view{width:34px;height:34px;display:grid;place-items:center;margin-left:auto;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-elevated);color:var(--mgmt-muted);cursor:pointer}.ir-view:hover{border-color:var(--mgmt-primary);color:var(--mgmt-primary)}
.ir-mobile-list{display:none}.ir-pagination{min-height:58px;display:flex;align-items:center;gap:18px;padding:9px 14px;border-top:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.63rem}.ir-pagination label{display:flex;align-items:center;gap:8px;font-weight:750}.ir-pagination select{min-height:34px;padding:0 26px 0 8px;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-input);color:var(--mgmt-heading)}.ir-pagination>span{margin-left:auto}.ir-pagination>div{display:flex;align-items:center;gap:8px}.ir-pagination button{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-elevated);color:var(--mgmt-heading);cursor:pointer}.ir-pagination button:hover:not(:disabled){border-color:var(--mgmt-primary);color:var(--mgmt-primary)}.ir-pagination button:disabled{opacity:.4;cursor:not-allowed}.ir-pagination>div b{min-width:80px;color:var(--mgmt-heading);font-size:.62rem;text-align:center}.ir-empty{min-height:260px;display:grid;place-items:center;align-content:center;gap:7px;padding:30px;color:var(--mgmt-muted);text-align:center}.ir-empty>svg{color:var(--mgmt-primary)}.ir-empty h3{margin:2px 0 0;color:var(--mgmt-heading);font-size:.88rem}.ir-empty p{margin:0;font-size:.68rem}.ir-empty button{min-height:36px;margin-top:7px;padding:0 12px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-elevated);color:var(--mgmt-heading);font-weight:800;cursor:pointer}
.ir-exceptions>ul{display:grid;margin:0;padding:6px 16px 12px;list-style:none}.ir-exceptions li{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--mgmt-border)}.ir-exceptions li:last-child{border-bottom:0}.ir-exceptions li>div{min-width:0;display:grid;gap:2px}.ir-exceptions li b{color:var(--mgmt-heading);font-size:.68rem}.ir-exceptions li small{overflow:hidden;color:var(--mgmt-muted);font-size:.6rem;text-overflow:ellipsis;white-space:nowrap}.ir-exceptions time{color:var(--mgmt-muted);font-size:.59rem;white-space:nowrap}.ir-exceptions li>button{min-height:32px;padding:0 9px;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-elevated);color:var(--mgmt-text);font:inherit;font-size:.6rem;font-weight:850;cursor:pointer}.ir-exceptions li>button:hover{border-color:var(--mgmt-primary);color:var(--mgmt-primary)}
.ir-drawer-badges{display:flex;align-items:center;gap:7px;margin-bottom:14px;flex-wrap:wrap}.ir-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:0}.ir-detail-grid>div{display:grid;gap:4px;padding:11px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-subtle)}.ir-detail-grid>div.wide{grid-column:1/-1}.ir-detail-grid dt{color:var(--mgmt-muted);font-size:.57rem;font-weight:850;letter-spacing:.05em;text-transform:uppercase}.ir-detail-grid dd{margin:0;color:var(--mgmt-heading);font-size:.7rem;font-weight:750;line-height:1.45}.ir-stock-snapshot{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.ir-stock-snapshot>div{display:grid;gap:4px;padding:11px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-subtle)}.ir-stock-snapshot span{color:var(--mgmt-muted);font-size:.58rem}.ir-stock-snapshot b{color:var(--mgmt-heading);font-size:.74rem}.ir-drawer-note{margin:9px 0 0!important;color:var(--mgmt-muted)!important;font-size:.62rem!important}
.ir-skeleton{display:grid;gap:16px}.ir-skeleton>div{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px}.ir-skeleton>section{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.ir-skeleton i{display:block;height:112px;border-radius:15px;background:linear-gradient(90deg,var(--mgmt-subtle),var(--mgmt-hover),var(--mgmt-subtle));background-size:220% 100%;animation:ir-shimmer 1.35s linear infinite}.ir-skeleton>section i{height:250px}.ir-skeleton>.wide{height:180px}.ir-skeleton>.table{height:390px}@keyframes ir-shimmer{to{background-position:-220% 0}}
.ir-range-bar :is(button,input):focus-visible,.ir-ledger :is(button,input,select):focus-visible,.ir-panel button:focus-visible,.ir-exceptions button:focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}
@media(max-width:1280px){.ir-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.ir-insight-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ir-attention{grid-column:1/-1}.ir-attention>ul{grid-template-columns:repeat(2,minmax(0,1fr));gap:0 20px}.ir-ledger-head{align-items:flex-start;flex-direction:column}.ir-ledger-actions{width:100%;justify-content:flex-start}.ir-search{flex:1}.ir-skeleton>div{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:900px){.ir-range-bar{align-items:stretch;flex-wrap:wrap}.ir-range-label{flex:1}.ir-presets{order:3;width:100%;display:grid;grid-template-columns:repeat(4,1fr)}.ir-custom-range{order:4;width:100%}.ir-refresh{margin-left:0}.ir-filter-row{grid-template-columns:repeat(2,minmax(0,1fr))}.ir-table-wrap{display:none}.ir-mobile-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px}.ir-mobile-card{min-width:0;min-height:174px;display:flex;align-items:flex-start;flex-direction:column;gap:8px;padding:14px;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface);color:var(--mgmt-text);font:inherit;text-align:left;cursor:pointer}.ir-mobile-card:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}.ir-mobile-card header,.ir-mobile-card footer{width:100%;display:flex;align-items:center;justify-content:space-between;gap:9px}.ir-mobile-card time{color:var(--mgmt-muted);font-size:.57rem}.ir-mobile-card>strong{color:var(--mgmt-heading);font-size:.74rem}.ir-mobile-card>p{display:-webkit-box;overflow:hidden;margin:0;color:var(--mgmt-muted);font-size:.64rem;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.ir-mobile-card footer{margin-top:auto;color:var(--mgmt-muted);font-size:.59rem}.ir-mobile-card footer b{font-size:.68rem}.ir-mobile-card footer b.is-in{color:var(--mgmt-success)}.ir-mobile-card footer b.is-out{color:var(--mgmt-danger)}.ir-mobile-card footer b.is-neutral{color:var(--mgmt-warning)}.ir-pagination{flex-wrap:wrap}.ir-pagination>span{width:100%;order:3;margin:0}.ir-pagination>div{margin-left:auto}.ir-exceptions li{grid-template-columns:auto minmax(0,1fr) auto}.ir-exceptions time{display:none}.ir-skeleton>section{grid-template-columns:1fr}}
@media(max-width:650px){.ir-metrics,.ir-insight-grid,.ir-mobile-list,.ir-skeleton>div{grid-template-columns:1fr}.ir-attention{grid-column:auto}.ir-attention>ul{grid-template-columns:1fr}.ir-metric{min-height:102px}.ir-ledger-actions{align-items:stretch;flex-direction:column}.ir-search{width:100%;min-width:0}.ir-ledger-actions>select,.ir-clear{width:100%}.ir-clear{justify-content:center}.ir-filter-row{grid-template-columns:1fr}.ir-custom-range{display:grid;grid-template-columns:1fr auto 1fr;align-items:end}.ir-custom-range input{width:100%}.ir-refresh{width:100%;justify-content:center}.ir-pagination{align-items:stretch;flex-direction:column}.ir-pagination label,.ir-pagination>div{justify-content:space-between;margin:0}.ir-pagination>span{order:0;text-align:center}.ir-pagination>div b{flex:1}.ir-exceptions li{grid-template-columns:1fr auto;align-items:start}.ir-exceptions li>.ir-movement-badge{grid-column:1/-1}.ir-exceptions li>button{grid-column:2}.ir-detail-grid,.ir-stock-snapshot{grid-template-columns:1fr}.ir-detail-grid>div.wide{grid-column:auto}.ir-drawer{width:100vw!important}}
@media(prefers-reduced-motion:reduce){.ir-page-enter,.ir-skeleton i{animation:none}.ir-presets button,.ir-table tbody tr{transition:none}}

/* Admin theme normalization: all modules inherit the shared semantic palette. */
.app-layout.legacy-admin :where(button,a,input,select,textarea,[tabindex]):focus-visible{
  outline:2px solid var(--mgmt-primary);
  outline-offset:2px;
}
.app-layout.legacy-admin :where(button,input,select,textarea):disabled{color:var(--mgmt-muted-low,var(--mgmt-faint));opacity:.48;cursor:not-allowed}
.app-layout.legacy-admin :where(input,select,textarea){accent-color:var(--mgmt-primary)}

.app-layout.legacy-admin[data-theme="dark"] .internal-main{background:var(--mgmt-canvas)}
.app-layout.legacy-admin[data-theme="dark"] .internal-sidebar{background:var(--mgmt-subtle);border-color:var(--mgmt-border);box-shadow:8px 0 24px rgba(0,0,0,.18)}
.app-layout.legacy-admin[data-theme="dark"] .internal-sidebar nav a:hover{background:var(--mgmt-hover);color:var(--mgmt-primary-strong);box-shadow:none}
.app-layout.legacy-admin[data-theme="dark"] .internal-sidebar nav a.active{background:var(--mgmt-hover);color:var(--mgmt-primary-strong);box-shadow:inset 3px 0 0 var(--mgmt-primary)}
.app-layout.legacy-admin[data-theme="dark"] .internal-page-header{background:var(--mgmt-featured);box-shadow:0 8px 24px rgba(0,0,0,.16)}
.app-layout.legacy-admin[data-theme="dark"] .internal-page-header:before,.app-layout.legacy-admin[data-theme="dark"] .internal-page-header:after{display:none}
.app-layout.legacy-admin[data-theme="dark"] :is(.ad-kpi-card,.ad-panel,.ac-editor-section,.ua-panel,.ua-metric,.cancel-metric,.cancel-panel,.cancel-records,.ir-metric,.ir-panel,.ir-ledger,.ir-exceptions){background:var(--mgmt-surface);border-color:var(--mgmt-border);box-shadow:0 8px 22px rgba(0,0,0,.14)}
.app-layout.legacy-admin[data-theme="dark"] :is(.ad-panel,.ad-kpi-card,.cancel-panel,.ir-panel):hover{border-color:var(--mgmt-border-strong);box-shadow:0 10px 26px rgba(0,0,0,.18)}
.app-layout.legacy-admin[data-theme="dark"] :is(.internal-page-header,.ad-panel,.ad-kpi-card,.ac-editor-section,.ua-panel,.cancel-panel,.ir-panel){background-image:none}

.app-layout.legacy-admin[data-theme="dark"] :where(input,select,textarea){border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-heading);color-scheme:dark}
.app-layout.legacy-admin[data-theme="dark"] :where(input,textarea)::placeholder{color:var(--mgmt-faint);opacity:1}
.app-layout.legacy-admin[data-theme="dark"] :where(input,select,textarea):hover:not(:disabled){border-color:var(--mgmt-border-strong)}
.app-layout.legacy-admin[data-theme="dark"] :where(input,select,textarea):focus{border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 22%,transparent)}
.app-layout.legacy-admin[data-theme="dark"] :where(input,textarea):-webkit-autofill{-webkit-text-fill-color:var(--mgmt-heading);box-shadow:0 0 0 1000px var(--mgmt-input) inset;caret-color:var(--mgmt-heading)}
.app-layout.legacy-admin[data-theme="dark"] option{background:var(--mgmt-elevated);color:var(--mgmt-heading)}

.app-layout.legacy-admin[data-theme="dark"] :is(.payment-modal,.auth-confirm-modal,.ac-modal,.ua-modal,.ua-drawer,.ops-drawer,.cancel-drawer,.ir-drawer,.srp-detail-modal,.txn-filter-panel){border-color:var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-text);box-shadow:var(--mgmt-shadow-high)}
.app-layout.legacy-admin[data-theme="dark"] :is(.payment-modal-backdrop,.auth-confirm-backdrop,.ac-modal-backdrop,.ua-overlay,.ops-drawer-backdrop,.ua-drawer-scrim,.txn-filter-backdrop){background:rgba(2,7,6,.68)}
.app-layout.legacy-admin[data-theme="dark"] .auth-confirm-modal{background:var(--mgmt-elevated)}
.app-layout.legacy-admin[data-theme="dark"] .auth-confirm-modal h2{color:var(--mgmt-heading)}
.app-layout.legacy-admin[data-theme="dark"] .auth-confirm-modal p{color:var(--mgmt-muted)}
.app-layout.legacy-admin[data-theme="dark"] .auth-confirm-close{border-color:var(--mgmt-border);background:var(--mgmt-input);color:var(--mgmt-text)}
.app-layout.legacy-admin[data-theme="dark"] .auth-confirm-actions .secondary-button{border-color:var(--mgmt-border-strong);background:var(--mgmt-surface);color:var(--mgmt-text)}
.app-layout.legacy-admin[data-theme="dark"] .auth-confirm-actions .primary-button{border-color:var(--mgmt-primary);background:var(--mgmt-primary);color:var(--mgmt-on-primary)}

.app-layout.legacy-admin[data-theme="dark"] :is(.staff-notification-center,.staff-notification-center>header){background:var(--mgmt-elevated)}
.app-layout.legacy-admin[data-theme="dark"] .staff-notification-list{background:var(--mgmt-surface)}
.app-layout.legacy-admin[data-theme="dark"] :is(.dash-chart-tooltip,.srp-trend-tooltip){border:1px solid var(--mgmt-border);background:var(--mgmt-elevated);color:var(--mgmt-heading);box-shadow:var(--mgmt-shadow)}
.app-layout.legacy-admin[data-theme="dark"] .srp-tooltip-prev{color:var(--mgmt-muted)}
.app-layout.legacy-admin[data-theme="dark"] :is(.ad-chart-gridline,.srp-chart-gridline){stroke:var(--mgmt-border)}
.app-layout.legacy-admin[data-theme="dark"] :is(.ad-sales-line,.srp-trend-line){stroke:var(--mgmt-primary)}
.app-layout.legacy-admin[data-theme="dark"] :is(.ad-sales-chart .ad-sales-point,.srp-trend-chart .srp-dot:not(.is-active)){fill:var(--mgmt-surface);stroke:var(--mgmt-primary)}
.app-layout.legacy-admin[data-theme="dark"] :is(.ad-sales-chart g.is-active .ad-sales-point,.srp-trend-chart .srp-dot.is-active){fill:var(--mgmt-primary)}

.app-layout.legacy-admin[data-theme="dark"] ::selection{background:color-mix(in srgb,var(--mgmt-primary) 36%,transparent);color:var(--mgmt-heading)}
.app-layout.legacy-admin[data-theme="dark"]{scrollbar-color:var(--mgmt-border-strong) var(--mgmt-canvas)}
.app-layout.legacy-admin[data-theme="dark"] *{scrollbar-color:var(--mgmt-border-strong) transparent}

/* Admin dashboard composition and dense operational surfaces. */
.ad-exception-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:12px;overflow:hidden;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface)}
.ad-exception-strip>div{--exception-color:var(--mgmt-faint);min-width:0;display:grid;grid-template-columns:32px auto minmax(70px,1fr) auto;align-items:center;gap:9px;padding:11px 14px;border-right:1px solid var(--mgmt-border)}.ad-exception-strip>div:last-child{border-right:0}.ad-exception-strip>div.is-danger{--exception-color:var(--mgmt-danger)}.ad-exception-strip>div.is-warning{--exception-color:var(--mgmt-warning)}
.ad-exception-strip span{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:color-mix(in srgb,var(--exception-color) 10%,var(--mgmt-subtle));color:var(--exception-color)}.ad-exception-strip b{color:var(--mgmt-heading);font-size:.9rem;font-variant-numeric:tabular-nums}.ad-exception-strip small{color:var(--mgmt-text);font-size:.7rem;font-weight:800}.ad-exception-strip em{overflow:hidden;color:var(--mgmt-muted);font-size:.63rem;font-style:normal;text-align:right;text-overflow:ellipsis;white-space:nowrap}
.ad-chart-summary>label{display:flex;align-items:center;gap:8px;margin-left:auto}.ad-chart-summary>label>span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.ad-chart-summary select{min-height:38px;padding:0 30px 0 11px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-input);color:var(--mgmt-text);font:inherit;font-size:.68rem;font-weight:750;cursor:pointer}.ad-chart-summary small em{margin-left:7px;font-style:normal;font-weight:850}.ad-chart-summary small em.is-up{color:var(--mgmt-success)}.ad-chart-summary small em.is-down{color:var(--mgmt-danger)}
.ad-transactions-panel .ad-panel-body{padding:0}.ad-transactions-scroll{max-width:100%;overflow-x:auto}.ad-transactions-table{width:100%;min-width:980px;border-collapse:collapse;color:var(--mgmt-text);font-size:.69rem}.ad-transactions-table th{padding:11px 14px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.59rem;font-weight:850;letter-spacing:.055em;text-align:left;text-transform:uppercase;white-space:nowrap}.ad-transactions-table td{max-width:220px;padding:12px 14px;border-bottom:1px solid var(--mgmt-border);vertical-align:middle}.ad-transactions-table tbody tr:last-child td{border-bottom:0}.ad-transactions-table tbody tr{transition:background-color .18s ease}.ad-transactions-table tbody tr:hover{background:var(--mgmt-hover)}.ad-transactions-table td:first-child{display:grid;gap:2px}.ad-transactions-table td b{color:var(--mgmt-heading);font-size:.71rem}.ad-transactions-table td small,.ad-transactions-table time{color:var(--mgmt-muted);font-size:.61rem}.ad-transactions-table td>span:not(.ad-order-status){display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ad-transactions-table td:last-child a{display:inline-flex;align-items:center;gap:4px;min-height:36px;color:var(--mgmt-primary);font-weight:850;white-space:nowrap}.ad-order-status.is-voided{border-color:color-mix(in srgb,var(--mgmt-danger) 30%,var(--mgmt-border));background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}
.app-layout.legacy-admin[data-theme="dark"] .ad-exception-strip{background:var(--mgmt-surface)}.app-layout.legacy-admin[data-theme="dark"] .ad-transactions-table th{background:var(--mgmt-elevated)}
@media(max-width:900px){.ad-exception-strip{grid-template-columns:1fr}.ad-exception-strip>div{border-right:0;border-bottom:1px solid var(--mgmt-border)}.ad-exception-strip>div:last-child{border-bottom:0}.ad-chart-summary{flex-wrap:wrap}.ad-chart-summary>label{margin-left:0}}
@media(max-width:520px){.ad-exception-strip>div{grid-template-columns:32px auto minmax(62px,1fr)}.ad-exception-strip em{grid-column:2/-1;text-align:left}.ad-chart-summary>label{width:100%}.ad-chart-summary select{width:100%}}

/* Admin dashboard reference structure: analytics workspace with an operational rail. */
.ad-dashboard-v2 .ad-kpi-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.ad-dashboard-frame{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(290px,320px);align-items:start;gap:20px}
.ad-dashboard-primary,.ad-dashboard-rail{min-width:0;display:grid;gap:20px}
.ad-dashboard-rail{gap:14px}
.ad-insights-grid{min-width:0;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(260px,.75fr);align-items:stretch;gap:20px}
.ad-insights-grid>.ad-panel{min-width:0;height:100%}
.ad-status-panel .ad-panel-body{display:flex;align-items:stretch;min-height:356px}
.ad-status-chart{width:100%;display:flex;flex-direction:column;gap:13px}
.ad-status-visual{position:relative;min-height:172px;display:grid;place-items:center}
.ad-status-visual svg{width:172px;height:172px;overflow:visible}
.ad-status-track{stroke:var(--mgmt-subtle)}
.ad-status-segment{cursor:pointer;stroke-linecap:butt;transition:stroke-width .24s cubic-bezier(.16,1,.3,1),opacity .2s ease,filter .24s ease}
.ad-status-segment.is-active{stroke-width:23;filter:drop-shadow(0 3px 4px rgba(18,35,25,.22))}
.ad-status-segment.is-muted{stroke-width:16;opacity:.28!important}
.ad-status-segment:focus-visible{outline:none;filter:drop-shadow(0 0 4px var(--mgmt-heading)) drop-shadow(0 3px 4px rgba(18,35,25,.22))}
.ad-status-segment.is-pending,.ad-status-legend i.is-pending{stroke:var(--mgmt-warning);background:var(--mgmt-warning)}
.ad-status-segment.is-preparing,.ad-status-legend i.is-preparing{stroke:color-mix(in srgb,var(--mgmt-warning) 58%,var(--mgmt-primary));background:color-mix(in srgb,var(--mgmt-warning) 58%,var(--mgmt-primary))}
.ad-status-segment.is-ready,.ad-status-legend i.is-ready{stroke:var(--mgmt-primary-strong);background:var(--mgmt-primary-strong)}
.ad-status-segment.is-delivery,.ad-status-legend i.is-delivery{stroke:color-mix(in srgb,var(--mgmt-primary) 55%,#4f7fa0);background:color-mix(in srgb,var(--mgmt-primary) 55%,#4f7fa0)}
.ad-status-segment.is-pickup,.ad-status-legend i.is-pickup{stroke:color-mix(in srgb,var(--mgmt-primary) 62%,var(--mgmt-warning));background:color-mix(in srgb,var(--mgmt-primary) 62%,var(--mgmt-warning))}
.ad-status-segment.is-walk-in,.ad-status-legend i.is-walk-in{stroke:var(--mgmt-warning);background:var(--mgmt-warning)}
.ad-status-segment.is-completed,.ad-status-legend i.is-completed{stroke:var(--mgmt-success);background:var(--mgmt-success)}
.ad-status-visual>span{position:absolute;inset:0;display:grid;place-content:center;gap:4px;text-align:center;pointer-events:none}.ad-status-visual b{color:var(--mgmt-heading);font-size:1.55rem;line-height:1;font-variant-numeric:tabular-nums}.ad-status-visual small{color:var(--mgmt-muted);font-size:.64rem;font-weight:750}
.ad-status-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 12px}.ad-status-legend>div{min-width:0;display:grid;grid-template-columns:8px minmax(0,1fr) auto;align-items:center;gap:8px;padding:4px 6px;border-radius:7px;transition:background-color .2s ease,transform .24s cubic-bezier(.16,1,.3,1)}.ad-status-legend>div.is-active{background:var(--mgmt-hover);transform:translateX(3px)}.ad-status-legend>div>i{width:8px;height:8px;border-radius:3px}.ad-status-legend span{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:6px}.ad-status-legend b{overflow:hidden;color:var(--mgmt-text);font-size:.66rem;text-overflow:ellipsis;white-space:nowrap}.ad-status-legend small{color:var(--mgmt-muted);font-size:.6rem}.ad-status-legend strong{color:var(--mgmt-heading);font-size:.68rem;font-variant-numeric:tabular-nums}
.ad-status-overdue{min-height:38px;display:flex;align-items:center;gap:7px;margin-top:auto;padding:8px 10px;border:1px solid color-mix(in srgb,var(--mgmt-danger) 25%,var(--mgmt-border));border-radius:10px;background:var(--mgmt-danger-soft);color:var(--mgmt-danger);font-size:.64rem}.ad-status-overdue b{white-space:nowrap}.ad-status-overdue span{margin-left:auto;color:var(--mgmt-muted);text-align:right}

.ad-dashboard-rail .ad-panel{border-radius:16px;box-shadow:0 8px 22px rgba(31,65,45,.04)}
.ad-dashboard-rail .ad-panel:hover{box-shadow:0 10px 25px rgba(31,65,45,.06)}
.ad-dashboard-rail .ad-panel>header{min-height:64px;padding:15px 16px}
.ad-dashboard-rail .ad-panel>header h2{font-size:.87rem}
.ad-dashboard-rail .ad-panel>header p{margin-top:3px;font-size:.65rem}
.ad-dashboard-rail .ad-panel>header>a{min-height:36px;font-size:.65rem}
.ad-dashboard-rail .ad-panel-body{padding:15px 16px}
.ad-performance-value{display:grid;gap:4px;padding-bottom:15px;border-bottom:1px solid var(--mgmt-border)}.ad-performance-value>span{color:var(--mgmt-muted);font-size:.62rem;font-weight:850;letter-spacing:.055em;text-transform:uppercase}.ad-performance-value>strong{color:var(--mgmt-heading);font-size:clamp(1.5rem,2vw,1.85rem);letter-spacing:-.035em;font-variant-numeric:tabular-nums}.ad-performance-value>small{display:flex;align-items:center;gap:5px;color:var(--mgmt-muted);font-size:.64rem;font-weight:800}.ad-performance-value>small.is-up{color:var(--mgmt-success)}.ad-performance-value>small.is-down{color:var(--mgmt-danger)}.ad-performance-value em{color:var(--mgmt-muted);font-style:normal;font-weight:650}
.ad-performance-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;margin:3px 0}.ad-performance-grid>span{min-width:0;display:grid;gap:3px;padding:12px 8px 12px 0;border-bottom:1px solid var(--mgmt-border)}.ad-performance-grid>span:nth-child(odd){border-right:1px solid var(--mgmt-border)}.ad-performance-grid>span:nth-child(even){padding-left:12px}.ad-performance-grid>span:nth-last-child(-n+2){border-bottom:0}.ad-performance-grid b{overflow:hidden;color:var(--mgmt-heading);font-size:.9rem;text-overflow:ellipsis;white-space:nowrap}.ad-performance-grid small{color:var(--mgmt-muted);font-size:.61rem;line-height:1.3}
.ad-performance-store{display:grid;grid-template-columns:9px minmax(0,1fr);align-items:center;gap:9px;margin-top:8px;padding:10px 11px;border:1px solid color-mix(in srgb,var(--mgmt-success) 24%,var(--mgmt-border));border-radius:11px;background:color-mix(in srgb,var(--mgmt-success) 7%,var(--mgmt-surface))}.ad-performance-store>i{width:8px;height:8px;border-radius:50%;background:var(--mgmt-success);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-success) 11%,transparent)}.ad-performance-store span{min-width:0;display:grid;gap:2px}.ad-performance-store small{color:var(--mgmt-muted);font-size:.58rem}.ad-performance-store b{overflow:hidden;color:var(--mgmt-heading);font-size:.68rem;text-overflow:ellipsis;white-space:nowrap}.ad-performance-store.is-closed{border-color:color-mix(in srgb,var(--mgmt-danger) 25%,var(--mgmt-border));background:var(--mgmt-danger-soft)}.ad-performance-store.is-closed>i{background:var(--mgmt-danger);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-danger) 11%,transparent)}
.ad-queue-list,.ad-low-stock-list{display:grid}.ad-queue-list>a,.ad-low-stock-list>a{min-width:0;min-height:52px;display:grid;align-items:center;gap:9px;border-bottom:1px solid var(--mgmt-border);color:inherit}.ad-queue-list>a:last-child,.ad-low-stock-list>a:last-child{border-bottom:0}.ad-queue-list>a{grid-template-columns:30px minmax(0,1fr) auto}.ad-queue-list>a>span,.ad-low-stock-list>a>span{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:color-mix(in srgb,var(--mgmt-primary) 9%,var(--mgmt-subtle));color:var(--mgmt-primary)}.ad-queue-list>a.is-rose>span{background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}.ad-queue-list>a.is-amber>span{background:var(--mgmt-warning-soft);color:var(--mgmt-warning)}.ad-queue-list>a.is-blue>span{background:color-mix(in srgb,#5887a0 10%,var(--mgmt-surface));color:#5887a0}.ad-queue-list>a>div,.ad-low-stock-list>a>div{min-width:0;display:grid;gap:2px}.ad-queue-list b,.ad-low-stock-list b{overflow:hidden;color:var(--mgmt-heading);font-size:.68rem;text-overflow:ellipsis;white-space:nowrap}.ad-queue-list small,.ad-low-stock-list small{overflow:hidden;color:var(--mgmt-muted);font-size:.59rem;text-overflow:ellipsis;white-space:nowrap}.ad-queue-list strong{min-width:24px;color:var(--mgmt-heading);font-size:.76rem;text-align:right}.ad-queue-list>a:hover,.ad-low-stock-list>a:hover{background:var(--mgmt-hover)}
.ad-low-stock-list>a{grid-template-columns:30px minmax(0,1fr) auto}.ad-low-stock-list>a>span{background:var(--mgmt-warning-soft);color:var(--mgmt-warning)}.ad-low-stock-list>a>span.is-out{background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}.ad-low-stock-list em{padding:4px 7px;border-radius:999px;background:var(--mgmt-warning-soft);color:var(--mgmt-warning);font-size:.56rem;font-style:normal;font-weight:850}.ad-low-stock-list em.is-out{background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}
.ad-rail-sellers .ad-ranked-list>div{grid-template-columns:25px minmax(0,1fr);gap:8px;padding:9px 0}.ad-rail-sellers .ad-ranked-list>div>span{width:24px;height:24px;border-radius:7px}.ad-rail-sellers .ad-ranked-list>div>div{display:grid;grid-template-columns:minmax(0,1fr)}.ad-rail-sellers .ad-ranked-list>div>div>i{display:none}.ad-rail-sellers .ad-ranked-list b{font-size:.68rem}.ad-rail-sellers .ad-ranked-list small{font-size:.59rem}
.ad-activity-panel .ad-activity-list>div:not(.ad-empty){min-height:52px}.ad-activity-panel .ad-activity-list b{font-size:.67rem}.ad-activity-panel .ad-activity-list small,.ad-activity-panel .ad-activity-list em{font-size:.58rem}.ad-activity-panel .ad-activity-list em{max-width:72px}
.app-layout.legacy-admin[data-theme="dark"] :is(.ad-performance-store,.ad-low-stock-list>a,.ad-queue-list>a){box-shadow:none}

@media(max-width:1280px){.ad-dashboard-frame{grid-template-columns:1fr}.ad-dashboard-rail{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-dashboard-rail>.ad-panel:last-child{grid-column:1/-1}.ad-activity-panel .ad-activity-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:0 18px}}
@media(max-width:900px){.ad-insights-grid{grid-template-columns:1fr}.ad-status-panel .ad-panel-body{min-height:0}.ad-status-chart{display:grid;grid-template-columns:190px minmax(0,1fr);align-items:center}.ad-status-visual{grid-row:1/3}.ad-status-overdue{grid-column:2}.ad-dashboard-rail{grid-template-columns:1fr}.ad-dashboard-rail>.ad-panel:last-child{grid-column:auto}.ad-activity-panel .ad-activity-list{grid-template-columns:1fr}.ad-dashboard-v2 .ad-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.ad-status-chart{display:flex}.ad-status-visual{min-height:158px}.ad-status-visual svg{width:158px;height:158px}.ad-status-overdue{width:100%}.ad-status-legend{grid-template-columns:1fr}.ad-dashboard-rail .ad-panel>header{align-items:flex-start;flex-direction:row}.ad-dashboard-rail .ad-panel>header>a{align-self:center}.ad-transactions-table{min-width:840px}}
@media(max-width:430px){.ad-dashboard-v2 .ad-kpi-grid{grid-template-columns:1fr}.ad-performance-grid{grid-template-columns:1fr}.ad-performance-grid>span,.ad-performance-grid>span:nth-child(odd),.ad-performance-grid>span:nth-child(even),.ad-performance-grid>span:nth-last-child(-n+2){padding:10px 0;border-right:0;border-bottom:1px solid var(--mgmt-border)}.ad-performance-grid>span:last-child{border-bottom:0}.ad-activity-panel .ad-activity-list em{display:none}}
@media(prefers-reduced-motion:reduce){.ad-status-segment,.ad-status-legend>div{transition:none}.ad-status-segment.is-active{stroke-width:20}.ad-status-legend>div.is-active{transform:none}}

/* Restore the previous dashboard command banner. */
.ad-store-state{display:flex;align-items:center;gap:9px;white-space:nowrap}.ad-store-state>i{width:8px;height:8px;border-radius:50%;background:var(--mgmt-success);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-success) 14%,transparent)}.ad-store-state b{color:var(--mgmt-heading);font-size:.75rem}.ad-store-state.is-closed>i{background:var(--mgmt-danger);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-danger) 14%,transparent)}
.ad-command-center{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:32px;padding:25px 28px;border:1px solid color-mix(in srgb,var(--mgmt-primary) 24%,var(--mgmt-border));border-radius:24px;background:radial-gradient(circle at 88% 8%,color-mix(in srgb,var(--mgmt-primary) 16%,transparent),transparent 34%),linear-gradient(135deg,color-mix(in srgb,var(--mgmt-primary) 9%,var(--mgmt-elevated)),var(--mgmt-surface));box-shadow:0 18px 42px rgba(31,65,45,.08)}
.ad-command-center:after{content:'';position:absolute;width:180px;height:180px;right:-95px;bottom:-120px;border:28px solid color-mix(in srgb,var(--mgmt-primary) 8%,transparent);border-radius:50%;pointer-events:none}
.ad-command-copy{position:relative;z-index:1;max-width:680px}.ad-command-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:8px;color:var(--mgmt-primary);font-size:.74rem;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.ad-command-copy h2{margin:0;color:var(--mgmt-heading);font-size:clamp(1.45rem,2.2vw,2rem);line-height:1.12;letter-spacing:-.035em}.ad-command-copy p{max-width:590px;margin:9px 0 0;color:var(--mgmt-muted);font-size:.88rem;line-height:1.55}.ad-command-side{position:relative;z-index:1;display:grid;justify-items:end;gap:12px}.ad-command-side .ad-store-state{min-height:32px;padding:7px 11px;border:1px solid color-mix(in srgb,var(--mgmt-success) 24%,var(--mgmt-border));border-radius:999px;background:color-mix(in srgb,var(--mgmt-success) 8%,var(--mgmt-surface))}.ad-command-meta{display:flex;align-items:center;gap:8px;margin-top:13px;color:var(--mgmt-muted);font-size:.7rem;font-weight:750}.ad-command-meta i{width:4px;height:4px;border-radius:50%;background:var(--mgmt-primary)}
.app-layout.legacy-admin[data-theme="dark"] .ad-command-center{background:var(--mgmt-featured)}.app-layout.legacy-admin[data-theme="dark"] .ad-command-center:after{display:none}
@media(max-width:1100px){.ad-command-center{grid-template-columns:1fr}.ad-command-side{justify-items:start}}
@media(max-width:720px){.ad-command-center{gap:22px;padding:21px;border-radius:19px}.ad-command-side{width:100%}}
@media(max-width:430px){.ad-command-copy p{font-size:.8rem}.ad-command-meta{align-items:flex-start;flex-direction:column}.ad-command-meta i{display:none}}

/* Keep the primary analytics visible in the dashboard's opening viewport. */
.ad-dashboard-v2{--ad-v2-gap:16px}
.ad-dashboard-v2 .ad-command-center{gap:24px;padding:18px 22px}
.ad-dashboard-v2 .ad-command-copy p{max-width:720px;margin-top:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ad-dashboard-v2 .ad-command-meta{margin-top:8px}
.ad-dashboard-v2 .ad-overview-section{margin-top:0}
.ad-dashboard-v2 .ad-overview-section .ad-section-heading{margin-bottom:8px}
.ad-dashboard-v2 .ad-overview-section .ad-section-heading p{display:none}
.ad-dashboard-v2 .ad-overview-section .ad-section-heading>a{min-height:32px}
.ad-dashboard-v2 .ad-kpi-card{min-height:112px;padding:14px 16px}
.ad-dashboard-v2 .ad-kpi-card>strong{margin-top:12px}
.ad-dashboard-v2 .ad-exception-strip{margin-top:9px}
.ad-dashboard-v2 .ad-insights-grid{gap:16px}
.ad-dashboard-v2 .ad-insights-grid>.ad-panel>header{min-height:64px;padding:16px 18px}
.ad-dashboard-v2 .ad-insights-grid>.ad-panel>header>a{min-height:36px}
.ad-dashboard-v2 .ad-insights-grid>.ad-panel>.ad-panel-body{padding:16px 18px}
.ad-dashboard-v2 .ad-v2-sales-panel .ad-sales-chart svg{height:240px}
.ad-dashboard-v2 .ad-status-panel .ad-panel-body{min-height:0}
.ad-dashboard-v2 .ad-status-visual{min-height:154px}
.ad-dashboard-v2 .ad-status-visual svg{width:154px;height:154px}
@media(max-width:720px){.ad-dashboard-v2 .ad-command-center{gap:18px;padding:18px}.ad-dashboard-v2 .ad-command-copy p{white-space:normal}.ad-dashboard-v2 .ad-kpi-card{min-height:118px}.ad-dashboard-v2 .ad-v2-sales-panel .ad-sales-chart svg{height:220px}.ad-dashboard-v2 .ad-status-visual{min-height:150px}.ad-dashboard-v2 .ad-status-visual svg{width:150px;height:150px}}

/* Compact welcome actions replace the removed exception card row. */
.ad-dashboard-v2 .ad-overview-layout{min-width:0;grid-template-columns:repeat(4,minmax(0,1fr));align-items:stretch;gap:12px}
.ad-dashboard-v2 .ad-welcome-card{min-width:0;display:grid;align-content:start;gap:11px;padding:16px 18px;border:1px solid color-mix(in srgb,var(--mgmt-primary) 25%,var(--mgmt-border));border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--mgmt-primary) 9%,var(--mgmt-elevated)),var(--mgmt-surface));box-shadow:0 8px 22px rgba(31,65,45,.045)}
.ad-welcome-copy{min-width:0}.ad-welcome-kicker{display:inline-flex;align-items:center;gap:7px;margin-bottom:5px;color:var(--mgmt-primary);font-size:.66rem;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.ad-welcome-copy h2{margin:0;color:var(--mgmt-heading);font-size:1.15rem;line-height:1.15;letter-spacing:-.025em}.ad-welcome-copy p{margin:6px 0 0;overflow:hidden;color:var(--mgmt-muted);font-size:.69rem;line-height:1.4;text-overflow:ellipsis;white-space:nowrap}.ad-welcome-meta{display:flex;align-items:center;gap:7px;margin-top:7px;color:var(--mgmt-muted);font-size:.61rem;font-weight:750}.ad-welcome-meta i{width:4px;height:4px;border-radius:50%;background:var(--mgmt-primary)}
.ad-welcome-status{display:flex;align-items:center;gap:8px;min-height:28px;padding:6px 9px;border:1px solid color-mix(in srgb,var(--mgmt-success) 23%,var(--mgmt-border));border-radius:9px;background:color-mix(in srgb,var(--mgmt-success) 7%,var(--mgmt-surface));color:var(--mgmt-heading);font-size:.63rem}.ad-welcome-status>i{width:7px;height:7px;flex:none;border-radius:50%;background:var(--mgmt-success);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-success) 11%,transparent)}.ad-welcome-status.is-closed{border-color:color-mix(in srgb,var(--mgmt-danger) 25%,var(--mgmt-border));background:var(--mgmt-danger-soft)}.ad-welcome-status.is-closed>i{background:var(--mgmt-danger);box-shadow:0 0 0 4px color-mix(in srgb,var(--mgmt-danger) 11%,transparent)}
.ad-dashboard-v2 .ad-welcome-card .ad-quick-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ad-dashboard-v2 .ad-welcome-card .ad-quick-nav a{min-width:0;min-height:48px;justify-content:center;gap:4px;padding:6px 7px;border-radius:10px;font-size:.64rem;text-align:center}.ad-dashboard-v2 .ad-welcome-card .ad-quick-nav a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.app-layout.legacy-admin[data-theme="dark"] .ad-welcome-card{background:var(--mgmt-featured);box-shadow:none}
@media(max-width:1100px){.ad-dashboard-v2 .ad-overview-layout{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-dashboard-v2 .ad-welcome-card{grid-column:1/-1;grid-template-columns:minmax(0,1fr) auto;align-items:center}.ad-dashboard-v2 .ad-welcome-card .ad-quick-nav{grid-column:1/-1}}
@media(max-width:720px){.ad-dashboard-v2 .ad-overview-layout{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-dashboard-v2 .ad-welcome-card{grid-column:1/-1;grid-template-columns:1fr}.ad-dashboard-v2 .ad-welcome-card .ad-quick-nav{grid-column:auto}}
@media(max-width:430px){.ad-dashboard-v2 .ad-overview-layout{grid-template-columns:1fr}.ad-dashboard-v2 .ad-welcome-card .ad-quick-nav{grid-template-columns:1fr 1fr}.ad-dashboard-v2 .ad-welcome-card .ad-quick-nav a:last-child{grid-column:1/-1}}

/* Reference-led dashboard composition. */
.ad-dashboard-v2 .ad-welcome-section,.ad-dashboard-v2 .ad-kpi-section{min-width:0;margin:0}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{position:relative;overflow:hidden;grid-template-columns:minmax(0,1fr) minmax(460px,1.1fr);grid-template-rows:auto auto;align-items:center;gap:10px 24px;min-height:112px;padding:17px 20px;border-radius:17px;background:linear-gradient(120deg,color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-elevated)),var(--mgmt-surface));box-shadow:0 8px 22px rgba(31,65,45,.045)}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy{grid-column:1;grid-row:1/3;align-self:center}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-status{grid-column:2;grid-row:1;justify-self:start}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-column:2;grid-row:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a{min-width:0;min-height:50px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:7px;padding:0 12px;border-color:color-mix(in srgb,var(--mgmt-border) 86%,var(--mgmt-primary));background:color-mix(in srgb,var(--mgmt-surface) 88%,transparent);font-size:.66rem}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a svg:last-child{color:var(--mgmt-faint)}
.app-layout.legacy-admin[data-theme="dark"] .ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{background:var(--mgmt-featured);box-shadow:none}
.ad-dashboard-v2 .ad-reference-kpis{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ad-dashboard-v2 .ad-reference-kpis .ad-kpi-card{min-width:0;min-height:112px;display:grid;grid-template-columns:minmax(0,1fr) minmax(105px,42%);grid-template-rows:auto 1fr auto;align-items:center;padding:15px 17px}.ad-dashboard-v2 .ad-reference-kpis .ad-kpi-top{grid-column:1;grid-row:1}.ad-dashboard-v2 .ad-reference-kpis .ad-kpi-card>strong{grid-column:1;grid-row:2;align-self:center;margin-top:0}.ad-dashboard-v2 .ad-reference-kpis .ad-kpi-card>footer{grid-column:1;grid-row:3;margin-top:0}.ad-kpi-sparkline{grid-column:2;grid-row:1/4;align-self:end;width:100%;height:62px;overflow:visible}.ad-kpi-spark-line{fill:none;stroke:var(--mgmt-primary);stroke-width:2.2}.ad-kpi-spark-dot{fill:var(--mgmt-primary);stroke:var(--mgmt-surface);stroke-width:2}.ad-kpi-sparkline.is-cream .ad-kpi-spark-line{stroke:#b58a3e}.ad-kpi-sparkline.is-cream .ad-kpi-spark-dot{fill:#b58a3e}.ad-kpi-sparkline.is-blue .ad-kpi-spark-line{stroke:#5887a0}.ad-kpi-sparkline.is-blue .ad-kpi-spark-dot{fill:#5887a0}.app-layout.legacy-admin[data-theme="dark"] .ad-kpi-spark-dot{stroke:var(--mgmt-surface)}
.ad-dashboard-v2 .ad-dashboard-analytics-row{min-width:0;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(310px,.75fr);align-items:stretch;gap:16px}.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel{min-width:0;height:100%}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:245px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-panel .ad-panel-body{min-height:0}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{min-height:164px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:164px;height:164px}
.ad-dashboard-v2 .ad-dashboard-operations-row{min-width:0;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(360px,.9fr);align-items:stretch;gap:16px}.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel{min-width:0;height:100%}.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header{min-height:62px;padding:15px 17px}.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header h2{font-size:.9rem}.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header p{font-size:.66rem}.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header>a{min-height:36px;font-size:.65rem}.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>.ad-panel-body{padding:15px 17px}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value{padding-bottom:12px}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span{padding-top:10px;padding-bottom:10px}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a{min-height:50px}
.ad-dashboard-v2>.ad-transactions-panel{min-width:0}.ad-dashboard-v2 .ad-dashboard-secondary-grid{min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.ad-dashboard-v2 .ad-dashboard-secondary-grid>.ad-panel{min-width:0}.ad-dashboard-v2 .ad-dashboard-secondary-grid>.ad-panel>header{min-height:62px;padding:15px 17px}.ad-dashboard-v2 .ad-dashboard-secondary-grid>.ad-panel>.ad-panel-body{padding:15px 17px}
@media(max-width:1100px){.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{grid-template-columns:1fr;grid-template-rows:auto;gap:12px}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy,.ad-dashboard-v2 .ad-welcome-section .ad-welcome-status,.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-column:auto;grid-row:auto}.ad-dashboard-v2 .ad-dashboard-analytics-row,.ad-dashboard-v2 .ad-dashboard-operations-row{grid-template-columns:1fr}.ad-dashboard-v2 .ad-dashboard-secondary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.ad-dashboard-v2 .ad-reference-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-template-columns:repeat(3,minmax(0,1fr))}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:220px}.ad-dashboard-v2 .ad-dashboard-secondary-grid{grid-template-columns:1fr}}
@media(max-width:430px){.ad-dashboard-v2 .ad-reference-kpis{grid-template-columns:1fr}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-template-columns:1fr}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a{min-height:44px}}

/* Reference-matched welcome banner. */
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{grid-template-columns:56px minmax(420px,1fr) minmax(440px,1fr);grid-template-rows:1fr;align-items:center;gap:14px 18px;height:96px;min-height:96px;padding:14px 16px}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-icon{width:56px;height:56px;display:grid;place-items:center;grid-column:1;grid-row:1;border-radius:50%;background:color-mix(in srgb,var(--mgmt-primary) 9%,var(--mgmt-surface));color:var(--mgmt-primary)}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy{grid-column:2;grid-row:1;align-self:center;min-width:0}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-kicker{display:block;margin:0 0 4px;font-size:.6rem}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy h2{font-size:1rem;line-height:1.18}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy p{margin-top:5px;font-size:.64rem}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-meta{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-top:7px;font-size:.58rem}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-status{display:inline-flex;align-items:center;gap:6px;min-height:0;padding:0;border:0;background:transparent;font-size:.58rem}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-status>i{width:5px;height:5px;box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-success) 11%,transparent)}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-status.is-closed{border:0;background:transparent}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-status.is-closed>i{box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-danger) 11%,transparent)}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-divider{width:3px;height:3px;margin:0;border-radius:50%;background:var(--mgmt-faint)}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-date{display:inline-flex;align-items:center;gap:5px}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-date svg{color:var(--mgmt-faint)}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-column:3;grid-row:1;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a{min-width:0;min-height:58px;display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;justify-content:initial;gap:8px;padding:0 11px;border-radius:10px;text-align:left}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a:hover{box-shadow:0 7px 18px rgba(31,65,45,.07)}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:color-mix(in srgb,var(--mgmt-primary) 8%,var(--mgmt-surface));color:var(--mgmt-primary)}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-copy{min-width:0;display:grid;gap:3px}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-copy b{overflow:hidden;color:var(--mgmt-heading);font-size:.61rem;font-weight:850;text-overflow:ellipsis;white-space:nowrap}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-copy small{overflow:hidden;color:var(--mgmt-muted);font-size:.53rem;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}
.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a>svg:last-child{color:var(--mgmt-faint)}
@media(max-width:1100px){.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{grid-template-columns:56px minmax(0,1fr);grid-template-rows:auto auto;height:auto;min-height:96px}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-icon{grid-column:1;grid-row:1;align-self:start}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy{grid-column:2;grid-row:1}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-column:1/-1;grid-row:2}}
@media(max-width:720px){.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{grid-template-columns:48px minmax(0,1fr);gap:12px;padding:14px}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-icon{width:48px;height:48px}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-template-columns:repeat(3,minmax(0,1fr))}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a{min-height:54px;padding:0 8px;gap:6px}.ad-dashboard-v2 .ad-welcome-section .ad-quick-icon{width:28px;height:28px}.ad-dashboard-v2 .ad-welcome-section .ad-quick-copy small{display:none}}
@media(max-width:430px){.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{grid-template-columns:1fr;grid-template-rows:auto;gap:11px}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-icon,.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy,.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-column:1;grid-row:auto}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-icon{width:48px;height:48px}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy p{white-space:normal}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav{grid-template-columns:1fr}.ad-dashboard-v2 .ad-welcome-section .ad-quick-nav a{min-height:48px}.ad-dashboard-v2 .ad-welcome-section .ad-quick-copy small{display:block}}

/* Place every admin page header directly on the workspace surface. */
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header{margin-bottom:16px;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header:before,.app-layout.legacy-admin .internal-page-header.is-admin-surface-header:after{display:none}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header h1{margin:0;color:var(--mgmt-heading);font-size:1.75rem;line-height:1;letter-spacing:-.035em}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .internal-title-row{align-items:center;gap:10px}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header>div:first-child>span{display:block;margin-top:8px;color:var(--mgmt-muted);font-size:.66rem;line-height:1.35}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .ad-live-state{min-height:28px;padding:0 10px;border-radius:999px;font-size:.61rem;box-shadow:none}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .ad-live-state span{display:none!important}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .internal-live-datetime{min-width:156px;display:flex;align-items:center;gap:8px;padding:7px 11px;text-align:left}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .internal-live-datetime>svg{flex:none;color:var(--mgmt-muted)}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .internal-live-datetime-copy{min-width:0;display:grid;gap:2px}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .internal-live-datetime-copy span{overflow:hidden;color:var(--mgmt-muted);font-size:.58rem;text-overflow:ellipsis;white-space:nowrap}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .internal-live-datetime-copy b{margin:0;color:var(--mgmt-heading);font-size:.68rem;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap}
.app-layout.legacy-admin .internal-page-header.is-admin-surface-header+.ad-dashboard-v2{margin-top:0}
@media(max-width:720px){.app-layout.legacy-admin .internal-page-header.is-admin-surface-header{margin-bottom:14px}.app-layout.legacy-admin .internal-page-header.is-admin-surface-header h1{font-size:1.5rem}.app-layout.legacy-admin .internal-page-header.is-admin-surface-header .internal-live-datetime{min-width:0}}

/* Match the compact reference composition for the primary analytics row. */
.ad-dashboard-v2 .ad-dashboard-analytics-row{grid-template-columns:minmax(0,1.58fr) minmax(360px,1fr);gap:12px}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>header{min-height:54px;padding:11px 16px}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>header h2{font-size:.84rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>header p{margin-top:3px;font-size:.61rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>header>a{min-height:31px;font-size:.61rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>.ad-panel-body{padding:10px 16px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:145px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-summary{margin-bottom:2px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-summary>span:first-child b{font-size:1rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-summary small{font-size:.57rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-summary select{min-height:31px;font-size:.59rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-panel .ad-panel-body{display:flex;align-items:stretch;min-height:0}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-chart{display:grid;grid-template-columns:138px minmax(0,1fr);grid-template-rows:1fr auto;align-items:center;gap:7px 12px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{grid-column:1;grid-row:1;min-height:118px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:118px;height:118px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual b{font-size:1.25rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual small{font-size:.56rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend{grid-column:2;grid-row:1;grid-template-columns:1fr;gap:5px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend>div{gap:6px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend b{font-size:.59rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend small,.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend strong{font-size:.56rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-summary{grid-column:1/-1;grid-row:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:3px;padding-top:8px;border-top:1px solid var(--mgmt-border)}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-summary>span{display:grid;gap:2px;min-width:0;text-align:center;border-right:1px solid var(--mgmt-border)}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-summary>span:last-child{border-right:0}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-summary b{color:var(--mgmt-heading);font-size:.76rem;font-variant-numeric:tabular-nums}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-summary small{color:var(--mgmt-muted);font-size:.54rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-overdue{grid-column:1/-1;grid-row:3;min-height:30px;margin-top:0;padding:6px 8px;font-size:.57rem}
@media(max-width:1100px){.ad-dashboard-v2 .ad-dashboard-analytics-row{grid-template-columns:1fr}}
@media(max-width:720px){.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:190px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-chart{grid-template-columns:150px minmax(0,1fr)}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{min-height:138px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:138px;height:138px}}
@media(max-width:600px){.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-chart{display:flex}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{min-height:132px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:132px;height:132px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend{width:100%;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 10px}}

/* Final analytics proportions for the reference-sized desktop row. */
.ad-dashboard-v2 .ad-dashboard-analytics-row{grid-template-columns:minmax(0,1.5fr) minmax(420px,1fr)}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel{min-height:270px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:132px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{min-height:138px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:132px;height:132px}
@media(max-width:1100px){.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel{min-height:0}}

/* Match the compact performance and attention row from the reference. */
.ad-dashboard-v2 .ad-dashboard-operations-row{grid-template-columns:minmax(0,1.16fr) minmax(420px,1fr);gap:12px}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header{min-height:48px;padding:10px 14px}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header h2{font-size:.78rem}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header p{margin-top:2px;font-size:.58rem}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header>a{min-height:28px;font-size:.58rem}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>.ad-panel-body{padding:10px 14px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-panel>.ad-panel-body{display:grid;grid-template-columns:minmax(125px,1.25fr) repeat(4,minmax(64px,1fr)) minmax(125px,1.15fr);align-items:stretch}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value{grid-column:1;align-content:center;margin:0;padding:0 12px 0 0;border-right:1px solid var(--mgmt-border);border-bottom:0}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value>span{font-size:.52rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value>strong{font-size:1rem;letter-spacing:-.025em}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value>small{font-size:.55rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid{display:contents}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span{align-content:center;padding:0 10px;border-right:1px solid var(--mgmt-border);border-bottom:0}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span:last-child{border-right:0}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid b{font-size:.76rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid small{font-size:.52rem;white-space:nowrap}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store{grid-column:6;align-content:center;margin:0;padding:0 0 0 12px;border:0;border-left:1px solid var(--mgmt-border);border-radius:0;background:transparent}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store small{font-size:.51rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store b{font-size:.6rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-panel>.ad-panel-body{padding:10px 14px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a{min-height:64px;grid-template-columns:28px minmax(0,1fr) auto;gap:7px;padding:9px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-surface)}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a:last-child{border-bottom:1px solid var(--mgmt-border)}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover)}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a>span{width:28px;height:28px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list b{font-size:.61rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list small{font-size:.52rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list strong{min-width:21px;height:21px;display:grid;place-items:center;border-radius:50%;background:var(--mgmt-subtle);font-size:.59rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a.is-rose strong{background:var(--mgmt-danger-soft);color:var(--mgmt-danger)}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a.is-amber strong{background:var(--mgmt-warning-soft);color:var(--mgmt-warning)}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a.is-blue strong{background:color-mix(in srgb,#5887a0 11%,var(--mgmt-surface));color:#5887a0}
@media(max-width:1100px){.ad-dashboard-v2 .ad-dashboard-operations-row{grid-template-columns:1fr}}
@media(max-width:720px){.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-panel>.ad-panel-body{grid-template-columns:repeat(2,minmax(0,1fr));gap:0}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value{grid-column:1/-1;padding:0 0 10px;border-right:0;border-bottom:1px solid var(--mgmt-border)}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid{display:grid;grid-column:1/-1;grid-template-columns:repeat(2,minmax(0,1fr))}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span{min-height:48px;padding:10px;border-right:1px solid var(--mgmt-border);border-bottom:1px solid var(--mgmt-border)}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span:nth-child(even){padding-left:10px}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store{grid-column:1/-1;padding:10px 0 0;border-top:1px solid var(--mgmt-border);border-left:0}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list{grid-template-columns:1fr}}
@media(max-width:430px){.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-panel>.ad-panel-body{grid-template-columns:1fr}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid{grid-template-columns:1fr}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span{border-right:0}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store{grid-column:1}}

/* Match the reference's icon-led performance metric strip. */
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-label{min-width:0;display:flex;align-items:center;gap:4px;overflow:hidden;color:var(--mgmt-muted);font-size:.48rem;font-weight:850;letter-spacing:.035em;line-height:1.1;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-label svg{width:14px;height:14px;flex:none;padding:2px;border-radius:50%;background:color-mix(in srgb,var(--mgmt-primary) 10%,var(--mgmt-surface));color:var(--mgmt-primary);stroke-width:2.4}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-label.is-amber svg{background:color-mix(in srgb,var(--mgmt-warning) 12%,var(--mgmt-surface));color:var(--mgmt-warning)}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-label.is-blue svg{background:color-mix(in srgb,#5887a0 12%,var(--mgmt-surface));color:#5887a0}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value>strong{margin-top:4px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span{gap:3px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span>small{font-size:.49rem;line-height:1.1;white-space:nowrap}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store{display:grid;grid-template-columns:1fr}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store>span{min-width:0;display:grid;gap:3px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store .ad-performance-label{font-size:.48rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store b{font-size:.62rem;line-height:1}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store small{font-size:.49rem;line-height:1}

/* Improve readability without changing the established dashboard proportions. */
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>header{min-height:58px;padding:12px 18px}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>header h2{font-size:.92rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>header p{font-size:.66rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>header>a{min-height:34px;font-size:.65rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel>.ad-panel-body{padding:12px 18px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-summary>span:first-child b{font-size:1.1rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-summary small{font-size:.64rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-summary select{min-height:34px;font-size:.64rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-axis{font-size:.65rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-chart{grid-template-columns:150px minmax(0,1fr);gap:8px 14px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{min-height:142px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:142px;height:142px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual b{font-size:1.35rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual small{font-size:.62rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend{gap:6px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend b{font-size:.68rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend small,.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-legend strong{font-size:.62rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-summary{padding-top:9px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-summary b{font-size:.88rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-summary small{font-size:.61rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-axis{gap:2px;font-size:.6rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-axis span{min-width:0;flex:1;text-align:center;white-space:nowrap}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-y-label{fill:var(--mgmt-muted);font-size:10px;font-weight:700}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-axis{padding-left:38px;padding-right:8px;box-sizing:border-box}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header{min-height:54px;padding:12px 16px}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header h2{font-size:.86rem}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header p{font-size:.63rem}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>header>a{min-height:32px;font-size:.64rem}
.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel>.ad-panel-body{padding:12px 16px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-label{font-size:.58rem;letter-spacing:.04em}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-label svg{width:16px;height:16px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value>strong{font-size:1.1rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-value>small{font-size:.6rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span{gap:4px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid b{font-size:.86rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-grid>span>small{font-size:.58rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store .ad-performance-label{font-size:.58rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store b{font-size:.68rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-performance-store small{font-size:.58rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-panel>.ad-panel-body{padding:12px 16px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list{gap:10px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a{min-height:72px;gap:8px;padding:11px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a>span{width:32px;height:32px}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list b{font-size:.68rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list small{font-size:.58rem}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list strong{min-width:23px;height:23px;font-size:.62rem}
@media(min-width:721px){.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel{min-height:142px}}
@media(max-width:720px){.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{min-height:138px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:138px;height:138px}.ad-dashboard-v2 .ad-dashboard-operations-row>.ad-panel{min-height:0}.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list>a{min-height:64px}}

/* Keep the default 14-day chart readable while the status card stays aligned. */
.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel{height:100%;min-height:294px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:154px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{min-height:146px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:146px;height:146px}
@media(max-width:1100px){.ad-dashboard-v2 .ad-dashboard-analytics-row>.ad-panel{height:auto;min-height:0}}
@media(max-width:720px){.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:190px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual{min-height:138px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-status-visual svg{width:138px;height:138px}}
@media(max-width:720px){.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-axis span:nth-child(even):not(:last-child){display:none}}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-line{stroke-linecap:round;stroke-linejoin:round}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-line-clip{transform:scaleX(0);transform-box:fill-box;transform-origin:left center;animation:ad-sales-clip-reveal cubic-bezier(.16,1,.3,1) forwards}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-point{opacity:0;animation:ad-sales-point-reveal .16s ease-out forwards}
@keyframes ad-sales-clip-reveal{to{transform:scaleX(1)}}
@keyframes ad-sales-point-reveal{to{opacity:1}}

/* Keep the sales plot and its point labels fully visible inside the panel. */
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:190px;overflow:hidden}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-chart-axis{padding-left:46px;padding-right:30px}
.ad-sales-chart .ad-chart-point-hit-area{pointer-events:all;cursor:crosshair}
.ad-sales-chart .ad-chart-point-tooltip{pointer-events:none}
.ad-sales-chart .ad-chart-point-tooltip rect{fill:var(--mgmt-heading);stroke:color-mix(in srgb,var(--mgmt-surface) 35%,transparent);stroke-width:1;filter:drop-shadow(0 5px 9px rgba(18,35,25,.18))}
.ad-sales-chart .ad-chart-point-tooltip text{fill:var(--mgmt-surface);text-anchor:middle;font-variant-numeric:tabular-nums}
.ad-sales-chart .ad-chart-tooltip-value{font-size:9px;font-weight:850}
.ad-sales-chart .ad-chart-tooltip-date{font-size:7px;font-weight:700;opacity:.78}
@media(max-width:720px){.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-chart svg{height:210px}}
@media(prefers-reduced-motion:reduce){.ad-sales-chart .ad-chart-point-tooltip{transition:none}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-line-clip{transform:scaleX(1);animation:none}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-v2-sales-panel .ad-sales-point{opacity:1;animation:none}}

/* Fulfillment card: spacious reference layout with readable data hierarchy. */
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel>header{min-height:72px;padding:16px 22px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel>header h2{font-size:1.05rem;letter-spacing:-.025em}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel>header p{margin-top:4px;font-size:.7rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel>header>a{min-height:40px;font-size:.68rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel>.ad-panel-body{padding:18px 22px 16px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-chart{display:grid;grid-template-columns:minmax(170px,.85fr) minmax(260px,1.35fr);grid-template-rows:minmax(190px,1fr) auto;align-items:center;gap:14px 24px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-visual{grid-column:1;grid-row:1;min-height:190px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-visual svg{width:190px;height:190px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-visual b{font-size:1.65rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-visual small{font-size:.68rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend{grid-column:2;grid-row:1;display:grid;grid-template-columns:1fr;gap:6px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend>div{min-height:44px;grid-template-columns:12px minmax(0,1fr) auto 28px;gap:10px;padding:6px 8px;border-radius:12px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend>div.is-active{transform:translateX(4px)}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend>div>i{width:12px;height:12px;border-radius:4px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend span{display:flex;justify-content:flex-start;gap:2px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend b{font-size:.8rem;line-height:1.15}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend em{min-width:46px;padding:5px 9px;border-radius:999px;background:color-mix(in srgb,var(--mgmt-success) 14%,var(--mgmt-surface));color:var(--mgmt-heading);font-size:.72rem;font-style:normal;font-weight:850;text-align:center;font-variant-numeric:tabular-nums}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend strong{font-size:1.12rem;text-align:right}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-summary{grid-column:1/-1;grid-row:2;margin-top:0;padding-top:14px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-summary>span{gap:4px;padding:6px}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-summary b{font-size:1.1rem}
.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-summary small{color:var(--mgmt-heading);font-size:.68rem;font-weight:800}
@media(max-width:1250px){.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-chart{grid-template-columns:150px minmax(220px,1fr);gap:12px 16px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-visual{min-height:160px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-visual svg{width:160px;height:160px}}
@media(max-width:600px){.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-chart{display:flex;gap:16px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-visual{min-height:176px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-visual svg{width:176px;height:176px}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-legend{width:100%}.ad-dashboard-v2 .ad-dashboard-analytics-row .ad-fulfillment-panel .ad-status-summary{width:100%}}

/* Use smooth, filled KPI sparklines while keeping each metric's existing accent. */
.ad-dashboard-v2 .ad-kpi-sparkline{color:var(--mgmt-primary)}
.ad-dashboard-v2 .ad-kpi-sparkline.is-cream{color:#b58a3e}
.ad-dashboard-v2 .ad-kpi-sparkline.is-blue{color:#5887a0}
.ad-dashboard-v2 .ad-kpi-spark-line{stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}
.ad-dashboard-v2 .ad-kpi-spark-dot{fill:currentColor}

/* Give the simplified welcome copy enough presence after removing metadata. */
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-kicker{font-size:.64rem;letter-spacing:.065em}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy h2{font-size:1.1rem;line-height:1.16}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy p{font-size:.68rem;line-height:1.45}

/* Compact dashboard welcome and operational summaries. */
.ad-dashboard-v2 .ad-reference-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{grid-template-columns:44px minmax(210px,1fr) auto;grid-template-rows:auto;gap:12px;min-height:76px;height:auto;padding:12px 16px}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-icon{width:44px;height:44px;grid-column:1;grid-row:1}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-icon svg{width:23px;height:23px}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy{grid-column:2;grid-row:1}
.ad-dashboard-v2 .ad-welcome-section .ad-welcome-summary{min-width:0;grid-column:3;grid-row:1;display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px}
.ad-dashboard-v2 .ad-welcome-summary-item{min-height:34px;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-surface);color:var(--mgmt-muted);font-size:.65rem;white-space:nowrap}
.ad-dashboard-v2 .ad-welcome-summary-item>svg{flex:none;color:var(--mgmt-primary)}
.ad-dashboard-v2 .ad-welcome-summary-item>i{width:7px;height:7px;flex:none;border-radius:50%;background:var(--mgmt-success)}
.ad-dashboard-v2 .ad-welcome-summary-item b{color:var(--mgmt-heading);font-size:.7rem;font-weight:850;font-variant-numeric:tabular-nums}
.ad-dashboard-v2 .ad-welcome-summary-item.is-store-closed>i{background:var(--mgmt-danger)}
.ad-dashboard-v2 .ad-welcome-summary-item.is-store-closed b{color:var(--mgmt-danger)}
.ad-dashboard-v2 .ad-dashboard-operations-row{grid-template-columns:minmax(0,1fr)}
.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list{grid-template-columns:repeat(2,minmax(0,1fr))}
.ad-dashboard-v2 .ad-dashboard-secondary-grid.is-no-stock{grid-template-columns:repeat(2,minmax(0,1fr))}
@media(max-width:1280px){.ad-dashboard-v2 .ad-reference-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:1100px){.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{grid-template-columns:44px minmax(0,1fr);grid-template-rows:auto auto}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-summary{grid-column:1/-1;grid-row:2;justify-content:flex-start}}
@media(max-width:720px){.ad-dashboard-v2 .ad-dashboard-operations-row .ad-queue-list,.ad-dashboard-v2 .ad-dashboard-secondary-grid.is-no-stock{grid-template-columns:1fr}}
@media(max-width:430px){.ad-dashboard-v2 .ad-welcome-section .ad-welcome-card{grid-template-columns:40px minmax(0,1fr);gap:10px}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-icon{width:40px;height:40px;grid-column:1;grid-row:1}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-copy{grid-column:2;grid-row:1}.ad-dashboard-v2 .ad-welcome-section .ad-welcome-summary{grid-column:1/-1;grid-row:2}.ad-dashboard-v2 .ad-welcome-summary-item{flex:1;justify-content:center}}
@media(max-width:430px){.ad-dashboard-v2 .ad-reference-kpis{grid-template-columns:1fr}}

/* Shared reporting filter surface: the Sales Reports range bar is the reference layout. */
.app-layout.legacy-admin .report-filter-bar{width:100%;min-height:58px;display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px 10px;border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface);box-shadow:0 8px 24px rgba(31,65,45,.045)}
.app-layout.legacy-admin .report-filter-label{min-width:172px;min-height:38px;display:flex;align-items:center;gap:8px;padding:0 8px;color:var(--mgmt-text);white-space:nowrap}.app-layout.legacy-admin .report-filter-label>svg{flex:none;color:var(--mgmt-primary)}.app-layout.legacy-admin .report-filter-label>span{min-width:0;display:grid;gap:2px}.app-layout.legacy-admin .report-filter-label b{overflow:hidden;color:var(--mgmt-heading);font-size:.71rem;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}.app-layout.legacy-admin .report-filter-label small{overflow:hidden;color:var(--mgmt-muted);font-size:.61rem;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}
.app-layout.legacy-admin .report-filter-presets{flex:1;min-width:280px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:3px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-input)}.app-layout.legacy-admin .report-filter-presets.is-four{grid-template-columns:repeat(4,minmax(0,1fr))}.app-layout.legacy-admin .report-filter-presets button{min-width:0;min-height:32px;padding:0 8px;border:0;border-radius:7px;background:transparent;color:var(--mgmt-muted);font:inherit;font-size:.67rem;font-weight:800;cursor:pointer;transition:background-color .18s ease,color .18s ease}.app-layout.legacy-admin .report-filter-presets button:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.app-layout.legacy-admin .report-filter-presets button.active{background:var(--mgmt-primary);color:var(--mgmt-on-primary)}
.app-layout.legacy-admin .report-filter-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-left:auto;flex:none}.app-layout.legacy-admin .report-filter-actions.is-two{min-width:0}.app-layout.legacy-admin .report-filter-actions :is(.report-filter-refresh,.report-filter-export,.report-filter-toggle){min-height:36px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 10px;border-radius:8px;font:inherit;font-size:.67rem;font-weight:800;white-space:nowrap}.app-layout.legacy-admin .report-filter-refresh{border:1px solid var(--mgmt-border-strong);background:var(--mgmt-surface);color:var(--mgmt-text);cursor:pointer}.app-layout.legacy-admin .report-filter-refresh:hover:not(:disabled){background:var(--mgmt-hover);color:var(--mgmt-heading)}.app-layout.legacy-admin .report-filter-refresh:disabled{opacity:.5;cursor:not-allowed}.app-layout.legacy-admin .report-filter-export{border:1px solid transparent;background:linear-gradient(135deg,var(--mgmt-primary),var(--mgmt-primary-strong));color:var(--mgmt-on-primary);cursor:pointer}.app-layout.legacy-admin .report-filter-export:hover:not(:disabled){background:var(--mgmt-primary-strong)}.app-layout.legacy-admin .report-filter-export:disabled{opacity:.5;cursor:not-allowed}.app-layout.legacy-admin .report-filter-toggle{border:1px solid var(--mgmt-border-strong);background:var(--mgmt-surface);color:var(--mgmt-text);cursor:pointer}.app-layout.legacy-admin .report-filter-toggle:hover{background:var(--mgmt-hover)}.app-layout.legacy-admin .report-filter-toggle>span{min-width:18px;height:18px;display:grid;place-items:center;padding:0 4px;border-radius:999px;background:color-mix(in srgb,var(--mgmt-primary) 12%,var(--mgmt-surface));color:var(--mgmt-primary);font-size:.57rem}
.app-layout.legacy-admin .report-filter-popout{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 8px;padding:8px 12px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-subtle);box-shadow:0 8px 22px rgba(31,65,45,.035)}.app-layout.legacy-admin .report-filter-popout-copy{display:flex;min-width:0;align-items:center;gap:8px;color:var(--mgmt-primary)}.app-layout.legacy-admin .report-filter-popout-copy>span{min-width:0;display:grid;gap:2px}.app-layout.legacy-admin .report-filter-popout-copy b{overflow:hidden;color:var(--mgmt-heading);font-size:.68rem;text-overflow:ellipsis;white-space:nowrap}.app-layout.legacy-admin .report-filter-popout-copy small{overflow:hidden;color:var(--mgmt-muted);font-size:.59rem;text-overflow:ellipsis;white-space:nowrap}
.app-layout.legacy-admin .report-filter-date-range{display:flex;align-items:center;flex:none;gap:6px;padding:3px 6px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-input)}.app-layout.legacy-admin .report-filter-date-range label{display:flex;align-items:center;gap:5px;color:var(--mgmt-muted);font-size:.57rem;font-weight:850;letter-spacing:.045em;text-transform:uppercase;white-space:nowrap}.app-layout.legacy-admin .report-filter-date-range input{width:116px;min-height:32px;padding:0 7px;border:1px solid var(--mgmt-border);border-radius:7px;background:var(--mgmt-surface);color:var(--mgmt-heading);font:inherit;font-size:.65rem;text-transform:none}.app-layout.legacy-admin .report-filter-date-range>span{padding:0;color:var(--mgmt-faint);font-size:.61rem}
.app-layout.legacy-admin .report-filter-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 16px;padding:8px 12px;border:1px solid var(--mgmt-border);border-radius:10px;background:var(--mgmt-subtle);box-shadow:0 8px 22px rgba(31,65,45,.035)}.app-layout.legacy-admin .report-filter-fields label{display:grid;gap:4px;color:var(--mgmt-muted);font-size:.56rem;font-weight:850;letter-spacing:.04em;text-transform:uppercase}.app-layout.legacy-admin .report-filter-fields :is(select,input){width:100%;min-height:34px;padding:0 28px 0 9px;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-input);color:var(--mgmt-heading);font:inherit;font-size:.65rem;text-transform:none;outline:none}.app-layout.legacy-admin .report-filter-fields :is(select,input):focus{border-color:var(--mgmt-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mgmt-primary) 15%,transparent)}
.app-layout.legacy-admin .report-filter-panel{display:block;padding:8px 12px}.app-layout.legacy-admin .report-filter-panel .report-filter-fields{margin:0;padding:0;border:0;background:transparent;box-shadow:none}.app-layout.legacy-admin .report-filter-panel .cancel-filter-actions{margin-top:10px}.app-layout.legacy-admin .report-filter-panel .cancel-filter-actions .button{min-height:36px}
.app-layout.legacy-admin .report-filter-bar :is(button,input):focus-visible,.app-layout.legacy-admin .report-filter-popout :is(button,input):focus-visible,.app-layout.legacy-admin .report-filter-fields :is(select,input):focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}
@media(max-width:1100px){.app-layout.legacy-admin .report-filter-bar{align-items:stretch;flex-wrap:wrap}.app-layout.legacy-admin .report-filter-label{order:1;flex:1}.app-layout.legacy-admin .report-filter-presets{order:3;flex-basis:100%;width:100%;min-width:0}.app-layout.legacy-admin .report-filter-actions{order:2;width:auto;margin-left:0}}
@media(max-width:850px){.app-layout.legacy-admin .report-filter-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.app-layout.legacy-admin .report-filter-actions{order:5;width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-left:0}.app-layout.legacy-admin .report-filter-actions.is-two{grid-template-columns:repeat(2,minmax(0,1fr))}.app-layout.legacy-admin .report-filter-actions :is(.report-filter-refresh,.report-filter-export,.report-filter-toggle){width:100%;min-height:44px}.app-layout.legacy-admin .report-filter-presets button{min-height:44px}.app-layout.legacy-admin .report-filter-popout{align-items:stretch;flex-direction:column;gap:8px;padding:10px 12px}.app-layout.legacy-admin .report-filter-popout-copy{align-items:flex-start}.app-layout.legacy-admin .report-filter-date-range{width:100%;justify-content:flex-start}.app-layout.legacy-admin .report-filter-date-range input{min-height:44px;font-size:16px}.app-layout.legacy-admin .report-filter-fields :is(select,input){min-height:44px;font-size:16px}}
@media(max-width:650px){.app-layout.legacy-admin .report-filter-fields{grid-template-columns:1fr}.app-layout.legacy-admin .report-filter-date-range{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;width:100%}.app-layout.legacy-admin .report-filter-date-range input{width:100%}}
@media(max-width:480px){.app-layout.legacy-admin .report-filter-label{flex-basis:100%}.app-layout.legacy-admin .report-filter-presets{grid-template-columns:repeat(2,minmax(0,1fr))}.app-layout.legacy-admin .report-filter-presets.is-four{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* Keep the cancellation/refund view switch with its page title. */
.app-layout.legacy-admin .cancel-title-tabs{min-width:0;max-width:100%;display:inline-flex;align-items:center;gap:3px;padding:3px;border:1px solid var(--mgmt-border);border-radius:11px;background:var(--mgmt-subtle)}
.app-layout.legacy-admin .cancel-title-tabs>button{min-width:0;min-height:34px;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:0 9px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--mgmt-muted);font:inherit;font-size:.65rem;font-weight:850;white-space:nowrap;cursor:pointer;transition:background-color .18s ease,border-color .18s ease,color .18s ease,box-shadow .18s ease}
.app-layout.legacy-admin .cancel-title-tabs>button:hover{border-color:var(--mgmt-border-strong);background:var(--mgmt-hover);color:var(--mgmt-heading)}
.app-layout.legacy-admin .cancel-title-tabs>button.active{border-color:color-mix(in srgb,var(--mgmt-primary) 28%,var(--mgmt-border));background:var(--mgmt-surface);color:var(--mgmt-primary);box-shadow:0 3px 9px rgba(31,65,45,.08)}
.app-layout.legacy-admin .cancel-title-tabs>button>strong{min-width:18px;height:18px;display:grid;place-items:center;padding:0 4px;border-radius:999px;background:var(--mgmt-hover);color:var(--mgmt-text);font-size:.57rem;font-variant-numeric:tabular-nums}
.app-layout.legacy-admin .cancel-title-tabs>button.active>strong{background:color-mix(in srgb,var(--mgmt-primary) 13%,var(--mgmt-surface));color:var(--mgmt-primary)}
.app-layout.legacy-admin .cancel-title-tabs>button:focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}
@media(max-width:480px){.app-layout.legacy-admin .cancel-title-tabs{width:100%}.app-layout.legacy-admin .cancel-title-tabs>button{flex:1}}
@media(prefers-reduced-motion:reduce){.app-layout.legacy-admin .cancel-title-tabs>button{transition:none}}

/* Content Management — menu approval queue */
.app-layout.legacy-admin .ac-approval-section{border:1px solid var(--mgmt-border);border-radius:14px;background:var(--mgmt-surface);box-shadow:0 10px 28px rgba(31,65,45,.045);overflow:hidden}.app-layout.legacy-admin .ac-approval-header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 22px;border-bottom:1px solid var(--mgmt-border)}.app-layout.legacy-admin .ac-approval-header>div{display:flex;align-items:center;gap:13px;min-width:0}.app-layout.legacy-admin .ac-approval-header h2{margin:0;color:var(--mgmt-heading);font-size:1.08rem;letter-spacing:-.015em}.app-layout.legacy-admin .ac-approval-header p{margin:4px 0 0;color:var(--mgmt-muted);font-size:.75rem;line-height:1.45}.app-layout.legacy-admin .ac-approval-icon{width:42px;height:42px;display:grid;place-items:center;flex:0 0 42px;border:1px solid color-mix(in srgb,var(--mgmt-primary) 25%,var(--mgmt-border));border-radius:12px;color:var(--mgmt-primary);background:color-mix(in srgb,var(--mgmt-primary) 7%,var(--mgmt-surface))}.app-layout.legacy-admin .ac-preview-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 9px;border:1px solid var(--mgmt-border);border-radius:8px;color:var(--mgmt-muted);font-size:.62rem;font-weight:850;white-space:nowrap}.app-layout.legacy-admin .ac-preview-badge i{width:6px;height:6px;border-radius:50%;background:var(--mgmt-warning)}.app-layout.legacy-admin .ac-approval-tabs{display:flex;align-items:center;gap:2px;padding:14px 22px 0;border-bottom:1px solid var(--mgmt-border)}.app-layout.legacy-admin .ac-approval-tabs button{min-height:42px;padding:0 13px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--mgmt-muted);font:inherit;font-size:.69rem;font-weight:800;cursor:pointer;transition:color .16s ease,border-color .16s ease}.app-layout.legacy-admin .ac-approval-tabs button:hover{color:var(--mgmt-heading)}.app-layout.legacy-admin .ac-approval-tabs button.is-active{border-bottom-color:var(--mgmt-primary);color:var(--mgmt-heading)}.app-layout.legacy-admin .ac-approval-tabs b{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:6px;padding:0 5px;border-radius:999px;background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.57rem}.app-layout.legacy-admin .ac-approval-tabs button.is-active b{background:color-mix(in srgb,var(--mgmt-primary) 13%,var(--mgmt-surface));color:var(--mgmt-primary)}.app-layout.legacy-admin .ac-approval-toolbar{display:flex;align-items:flex-end;justify-content:flex-end;gap:9px;padding:14px 22px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}.app-layout.legacy-admin .ac-approval-toolbar label{display:grid;gap:5px;color:var(--mgmt-muted);font-size:.59rem;font-weight:850;letter-spacing:.045em;text-transform:uppercase}.app-layout.legacy-admin .ac-approval-toolbar select{min-width:150px;height:38px;padding:0 9px;border:1px solid var(--mgmt-border);border-radius:8px;background:var(--mgmt-surface);color:var(--mgmt-text);font:inherit;font-size:.68rem;text-transform:none;outline:0}.app-layout.legacy-admin .ac-approval-toolbar select:focus,.app-layout.legacy-admin .ac-approval-tabs button:focus-visible,.app-layout.legacy-admin .ac-approval-actions button:focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}.app-layout.legacy-admin .ac-approval-table-wrap{overflow:auto}.app-layout.legacy-admin .ac-approval-table{width:100%;min-width:980px;border-collapse:collapse;font-size:.67rem}.app-layout.legacy-admin .ac-approval-table th{padding:11px 14px;border-bottom:1px solid var(--mgmt-border);color:var(--mgmt-muted);font-size:.56rem;font-weight:850;letter-spacing:.055em;text-align:left;text-transform:uppercase;white-space:nowrap}.app-layout.legacy-admin .ac-approval-table td{padding:12px 14px;border-bottom:1px solid var(--mgmt-border);vertical-align:middle;color:var(--mgmt-text)}.app-layout.legacy-admin .ac-approval-table tbody tr:last-child td{border-bottom:0}.app-layout.legacy-admin .ac-approval-table tbody tr:hover{background:var(--mgmt-hover)}.app-layout.legacy-admin .ac-approval-item{display:flex;align-items:center;gap:10px;min-width:205px}.app-layout.legacy-admin .ac-approval-item>img{width:70px;height:58px;flex:0 0 70px;object-fit:cover;border-radius:9px;background:var(--mgmt-subtle)}.app-layout.legacy-admin .ac-approval-item>span{display:grid;gap:3px;min-width:0}.app-layout.legacy-admin .ac-approval-item b{color:var(--mgmt-heading);font-size:.7rem;white-space:nowrap}.app-layout.legacy-admin .ac-approval-item small,.app-layout.legacy-admin .ac-approval-item em{color:var(--mgmt-muted);font-size:.6rem;font-style:normal;white-space:nowrap}.app-layout.legacy-admin .ac-approval-item em i{color:var(--mgmt-success);font-style:normal;font-weight:850}.app-layout.legacy-admin .ac-change-badge{display:inline-flex;padding:5px 7px;border-radius:4px;font-size:.56rem;font-weight:850;letter-spacing:.015em;text-transform:uppercase;white-space:nowrap}.app-layout.legacy-admin .ac-change-badge--price{background:#eaf3fb;color:#3d78a4}.app-layout.legacy-admin .ac-change-badge--new{background:#e8f5e9;color:#4c8962}.app-layout.legacy-admin .ac-change-badge--updated{background:#fff2d9;color:#a06f27}.app-layout.legacy-admin .ac-change-badge--status{background:#f2eafa;color:#76539c}.app-layout.legacy-admin .ac-approval-person{display:flex;align-items:center;gap:7px;min-width:125px}.app-layout.legacy-admin .ac-approval-person>i{width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:#f0e9df;color:#765e4a;font-size:.55rem;font-style:normal;font-weight:900}.app-layout.legacy-admin .ac-approval-person>span,.app-layout.legacy-admin .ac-approval-date,.app-layout.legacy-admin .ac-approval-detail{display:grid;gap:3px}.app-layout.legacy-admin .ac-approval-person b,.app-layout.legacy-admin .ac-approval-detail{color:var(--mgmt-heading);font-size:.63rem}.app-layout.legacy-admin .ac-approval-person small,.app-layout.legacy-admin .ac-approval-date small,.app-layout.legacy-admin .ac-approval-detail small{color:var(--mgmt-muted);font-size:.59rem;line-height:1.35}.app-layout.legacy-admin .ac-approval-date{white-space:nowrap}.app-layout.legacy-admin .ac-approval-detail{min-width:115px}.app-layout.legacy-admin .ac-approval-actions{display:flex;align-items:center;gap:5px;white-space:nowrap}.app-layout.legacy-admin .ac-approval-actions button{min-height:34px;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 8px;border-radius:7px;font:inherit;font-size:.59rem;font-weight:850;cursor:pointer;transition:background .16s ease,border-color .16s ease,color .16s ease}.app-layout.legacy-admin .ac-approval-reject{border:1px solid color-mix(in srgb,var(--mgmt-danger) 30%,var(--mgmt-border));background:var(--mgmt-surface);color:var(--mgmt-danger)}.app-layout.legacy-admin .ac-approval-reject:hover{background:var(--mgmt-danger-soft)}.app-layout.legacy-admin .ac-approval-approve{border:1px solid var(--mgmt-primary);background:var(--mgmt-primary);color:var(--mgmt-on-primary)}.app-layout.legacy-admin .ac-approval-approve:hover{background:var(--mgmt-primary-strong)}.app-layout.legacy-admin .ac-approval-more{width:34px;border:1px solid var(--mgmt-border);background:var(--mgmt-surface);color:var(--mgmt-muted);letter-spacing:1px}.app-layout.legacy-admin .ac-approval-more:hover{background:var(--mgmt-hover);color:var(--mgmt-heading)}.app-layout.legacy-admin .ac-approval-cards{display:none}.app-layout.legacy-admin .ac-approval-empty{min-height:220px;display:grid;place-items:center;align-content:center;gap:7px;color:var(--mgmt-muted);text-align:center}.app-layout.legacy-admin .ac-approval-empty svg{color:var(--mgmt-primary)}.app-layout.legacy-admin .ac-approval-empty b{color:var(--mgmt-heading);font-size:.82rem}.app-layout.legacy-admin .ac-approval-empty span{font-size:.68rem}.app-layout.legacy-admin .ac-approval-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 22px;border-top:1px solid var(--mgmt-border);background:var(--mgmt-subtle);color:var(--mgmt-muted);font-size:.62rem}.app-layout.legacy-admin .ac-approval-footer span:last-child{color:var(--mgmt-primary);font-weight:750}
@media(max-width:900px){.app-layout.legacy-admin .ac-approval-table-wrap{display:none}.app-layout.legacy-admin .ac-approval-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:14px}.app-layout.legacy-admin .ac-approval-card{padding:13px;border:1px solid var(--mgmt-border);border-radius:11px;background:var(--mgmt-surface)}.app-layout.legacy-admin .ac-approval-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.app-layout.legacy-admin .ac-approval-card .ac-approval-item{min-width:0;align-items:flex-start}.app-layout.legacy-admin .ac-approval-card .ac-approval-item>img{width:52px;height:45px;flex-basis:52px}.app-layout.legacy-admin .ac-approval-card .ac-approval-item b{white-space:normal;line-height:1.35}.app-layout.legacy-admin .ac-approval-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:13px 0;padding:11px 0;border-top:1px solid var(--mgmt-border);border-bottom:1px solid var(--mgmt-border)}.app-layout.legacy-admin .ac-approval-card-grid span{display:grid;gap:3px}.app-layout.legacy-admin .ac-approval-card-grid span:last-child{grid-column:1/-1}.app-layout.legacy-admin .ac-approval-card-grid small{color:var(--mgmt-muted);font-size:.56rem;font-weight:850;text-transform:uppercase}.app-layout.legacy-admin .ac-approval-card-grid b{color:var(--mgmt-heading);font-size:.63rem}.app-layout.legacy-admin .ac-approval-card .ac-approval-actions button{flex:1;min-height:38px}.app-layout.legacy-admin .ac-approval-card .ac-approval-more{display:none}}
@media(max-width:620px){.app-layout.legacy-admin .ac-approval-header{align-items:flex-start;flex-direction:column;padding:17px}.app-layout.legacy-admin .ac-approval-header p{max-width:48ch}.app-layout.legacy-admin .ac-approval-tabs{overflow:auto;padding-left:14px;padding-right:14px}.app-layout.legacy-admin .ac-approval-tabs button{min-width:max-content;padding:0 10px}.app-layout.legacy-admin .ac-approval-toolbar{align-items:stretch;justify-content:stretch;flex-direction:column;padding:12px 14px}.app-layout.legacy-admin .ac-approval-toolbar label,.app-layout.legacy-admin .ac-approval-toolbar select{width:100%}.app-layout.legacy-admin .ac-approval-cards{grid-template-columns:1fr;padding:12px}.app-layout.legacy-admin .ac-approval-footer{align-items:flex-start;flex-direction:column;padding:12px 14px}}
@media(prefers-reduced-motion:reduce){.app-layout.legacy-admin .ac-approval-tabs button,.app-layout.legacy-admin .ac-approval-actions button{transition:none}}
.app-layout.legacy-admin .ac-approval-controls{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;border-bottom:1px solid var(--mgmt-border);background:var(--mgmt-subtle)}.app-layout.legacy-admin .ac-approval-controls .ac-approval-tabs{flex:1;min-width:0;border-bottom:0}.app-layout.legacy-admin .ac-approval-controls .ac-approval-toolbar{flex:0 0 auto;padding:8px 22px;border-bottom:0;background:transparent}
@media(max-width:620px){.app-layout.legacy-admin .ac-approval-controls{align-items:stretch;flex-direction:column;gap:0}.app-layout.legacy-admin .ac-approval-controls .ac-approval-tabs{flex:none}.app-layout.legacy-admin .ac-approval-controls .ac-approval-toolbar{padding:10px 14px 12px}}
.app-layout.legacy-admin .ac-change-badge--image{background:#f3ecfa;color:#76539c}.app-layout.legacy-admin .ac-approval-image-change{display:flex;align-items:center;gap:5px;margin-top:5px}.app-layout.legacy-admin .ac-approval-image-change img{width:28px;height:25px;object-fit:cover;border:1px solid var(--mgmt-border);border-radius:4px;background:var(--mgmt-subtle)}.app-layout.legacy-admin .ac-approval-image-change i{color:var(--mgmt-primary);font-size:.7rem;font-style:normal;font-weight:900}
.app-layout.legacy-admin .ac-change-badge--choices{background:#e8f1fb;color:#3f6f9c}.app-layout.legacy-admin .ac-change-badge--addons{background:#f8ead8;color:#9a6b35}.app-layout.legacy-admin .ac-change-badge--ready{background:#e7f3ee;color:#3d8065}.app-layout.legacy-admin .ac-change-badge--ingredients{background:#f6e7e3;color:#9c5e51}.app-layout.legacy-admin .ac-change-badge--description{background:#eeeafa;color:#6f5c9a}
.app-layout.legacy-staff .menu-approval-required-modal{max-width:520px}.app-layout.legacy-staff .menu-approval-required-icon{width:42px;height:42px;display:grid;place-items:center;margin:12px 24px 0;border:1px solid color-mix(in srgb,var(--mgmt-primary) 25%,var(--mgmt-border));border-radius:12px;background:color-mix(in srgb,var(--mgmt-primary) 10%,var(--mgmt-surface));color:var(--mgmt-primary)}.app-layout.legacy-staff .menu-approval-required-modal>h2{margin:10px 24px 5px;color:var(--mgmt-heading);font-size:1.02rem}.app-layout.legacy-staff .menu-approval-required-modal>p{margin:0;padding:0 24px 10px;color:var(--mgmt-muted);font-size:.73rem;line-height:1.45}.app-layout.legacy-staff .menu-approval-change-types{margin:0 24px 14px;padding:10px;border:1px solid var(--mgmt-border);border-radius:9px;background:var(--mgmt-subtle)}.app-layout.legacy-staff .menu-approval-change-types>span{display:block;margin-bottom:6px;color:var(--mgmt-muted);font-size:.57rem;font-weight:850;letter-spacing:.05em;text-transform:uppercase}.app-layout.legacy-staff .menu-approval-change-types>div{display:flex;gap:5px;flex-wrap:wrap}.app-layout.legacy-staff .menu-approval-change-types em{padding:4px 6px;border-radius:6px;background:var(--mgmt-surface);color:var(--mgmt-text);font-size:.59rem;font-style:normal;font-weight:750}.app-layout.legacy-staff .menu-approval-required-modal .payment-modal-actions{margin-top:0}
.app-layout.legacy-admin .ac-approval-table-wrap{max-height:560px;overflow:auto}.app-layout.legacy-admin .ac-approval-cards{max-height:560px;overflow-y:auto}.app-layout.legacy-admin .ac-pagination{display:flex;align-items:center;gap:8px;margin-left:auto}.app-layout.legacy-admin .ac-pagination b{min-width:74px;color:var(--mgmt-muted);font-size:.61rem;text-align:center}.app-layout.legacy-admin .ac-pagination button{width:28px;height:28px;border:1px solid var(--mgmt-border);border-radius:7px;background:var(--mgmt-surface);color:var(--mgmt-heading);font:inherit;font-size:1rem;line-height:1;cursor:pointer}.app-layout.legacy-admin .ac-pagination button:hover:not(:disabled){border-color:var(--mgmt-primary);color:var(--mgmt-primary)}.app-layout.legacy-admin .ac-pagination button:disabled{cursor:not-allowed;opacity:.4}.app-layout.legacy-admin .ac-pagination button:focus-visible{outline:2px solid var(--mgmt-primary);outline-offset:2px}
.app-layout.legacy-admin .ac-approval-toolbar{align-items:center;gap:16px;padding:8px 22px}.app-layout.legacy-admin .ac-approval-toolbar label{display:flex;align-items:center;gap:8px;white-space:nowrap}.app-layout.legacy-admin .ac-approval-toolbar label>span{letter-spacing:.035em}.app-layout.legacy-admin .ac-approval-toolbar select{min-width:145px}
@media(max-width:620px){.app-layout.legacy-admin .ac-approval-toolbar{gap:9px}.app-layout.legacy-admin .ac-approval-toolbar label{width:100%;justify-content:space-between}.app-layout.legacy-admin .ac-approval-toolbar select{width:auto;min-width:0;flex:1}}
.app-layout.legacy-admin .ac-approval-section.is-compact .ac-approval-header{padding:16px 20px}.app-layout.legacy-admin .ac-approval-section.is-compact .ac-approval-header p{margin-top:2px}.app-layout.legacy-admin .ac-approval-section.is-compact .ac-approval-table-wrap{max-height:calc(100vh - 360px)}
```

## tests/raimuMachine.test.js

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRaimuMachine, RAIMU_TIMINGS } from '../src/components/raimu/raimuMachine.js'

function fixture() {
  let time = 0
  let sequence = 0
  const timers = new Map()
  const machine = createRaimuMachine({
    now: () => time, random: () => .5,
    schedule: (fn, delay) => { const id = ++sequence; timers.set(id, { fn, at: time + delay }); return id },
    cancel: (id) => timers.delete(id),
  })
  const tick = (duration) => {
    const end = time + duration
    for (;;) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0]
      if (!next || next[1].at > end) break
      time = next[1].at
      timers.delete(next[0])
      next[1].fn()
    }
    time = end
  }
  machine.start({ sessionKey: 'test', greet: false })
  return { machine, tick, timers, state: () => machine.getSnapshot() }
}

test('sleep follows 60 seconds of inactivity; activity wakes and resets the clock', () => {
  const { machine, tick, state } = fixture()
  tick(59_999)
  assert.equal(state().state, 'idle')
  machine.wake()
  tick(59_999)
  assert.equal(state().state, 'idle')
  tick(1)
  assert.equal(state().state, 'sleepy')
  machine.wake()
  assert.equal(state().state, 'idle')
  machine.destroy()
})

test('thinking cannot be interrupted by attention, sleep, or a contextual celebration', () => {
  const { machine, tick, state } = fixture()
  machine.setState('thinking')
  assert.equal(machine.setState('attention'), false)
  machine.reactTo('sales-goal')
  tick(120_000)
  assert.equal(state().state, 'thinking')
  machine.setState('talking')
  tick(RAIMU_TIMINGS.talking)
  assert.equal(state().state, 'success')
  assert.match(state().bubble.text, /sales goal/)
  tick(RAIMU_TIMINGS.success)
  assert.equal(state().state, 'idle')
  machine.destroy()
})

test('hidden tabs pause bubbles and reactions with their remaining durations', () => {
  const { machine, tick, state, timers } = fixture()
  machine.setState('talking', { duration: 2_000 })
  machine.say('First', { duration: 4_000 })
  tick(700)
  machine.setVisible(false)
  assert.equal(timers.size, 0)
  tick(300_000)
  assert.equal(state().state, 'talking')
  assert.equal(state().bubble.text, 'First')
  machine.setVisible(true)
  tick(1_299)
  assert.equal(state().state, 'talking')
  tick(1)
  assert.equal(state().state, 'idle')
  tick(2_000)
  assert.equal(state().bubble, null)
  machine.destroy()
})

test('bubble queue is ordered, dismissible, bounded, and deduplicates event keys', () => {
  const { machine, tick, state } = fixture()
  machine.say('First', { duration: 1_000, id: 'first' })
  machine.say('Duplicate', { id: 'first' })
  machine.say('Second', { duration: 1_000 })
  tick(1_000)
  assert.equal(state().bubble.text, 'Second')
  machine.dismissBubble()
  assert.equal(state().bubble, null)
  machine.say('Current')
  for (let i = 0; i < 20; i += 1) machine.say(`Queued ${i}`)
  machine.dismissBubble()
  assert.equal(state().bubble.text, 'Queued 16')
  machine.clearBubbles()
  assert.equal(state().bubble, null)
  machine.destroy()
})

test('disabled or reduced motion cancels ambient timers but keeps chat states working', () => {
  for (const preferences of [{ animated: false }, { reducedMotion: true }]) {
    const { machine, tick, state, timers } = fixture()
    machine.setPreferences(preferences)
    machine.setState('thinking')
    assert.equal(timers.size, 0)
    tick(20_000)
    assert.equal(state().blink, false)
    assert.equal(state().earTwitch, false)
    machine.setState('error')
    assert.match(state().bubble.text, /Hmm/)
    tick(RAIMU_TIMINGS.error)
    assert.equal(state().state, 'idle')
    machine.destroy()
  }
})

test('stop/start survives StrictMode effect replay and only a new session greets again', () => {
  const { machine, tick, state, timers } = fixture()
  machine.start({ sessionKey: 'new-user' })
  const greeting = state().bubble.id
  machine.stop()
  assert.equal(timers.size, 0)
  tick(10_000)
  machine.start({ sessionKey: 'new-user', greet: false })
  assert.equal(state().bubble.id, greeting)
  tick(RAIMU_TIMINGS.greeting)
  assert.equal(state().state, 'idle')
  machine.start({ sessionKey: 'another-user' })
  assert.equal(state().state, 'greeting')
  assert.notEqual(state().bubble.id, greeting)
  machine.destroy()
  assert.equal(timers.size, 0)
})

test('a new request cancels the previous reply completion callback', () => {
  const { machine, tick, state } = fixture()
  let completed = false
  machine.setState('talking', { onComplete: () => { completed = true; machine.setState('success') } })
  machine.setState('thinking')
  tick(5_000)
  assert.equal(state().state, 'thinking')
  assert.equal(completed, false)
  assert.equal(machine.setState('unknown'), false)
  machine.destroy()
})

test('listening settles when typing stops, so an unfinished draft cannot prevent sleep forever', () => {
  const { machine, tick, state } = fixture()
  machine.setState('listening')
  tick(1_000)
  machine.setState('listening')
  tick(1_799)
  assert.equal(state().state, 'listening')
  tick(1)
  assert.equal(state().state, 'idle')
  tick(RAIMU_TIMINGS.idleDelay)
  assert.equal(state().state, 'sleepy')
  machine.destroy()
})

test('store opening is a transition; sales goals require a real target and deduplicate by day', () => {
  const { machine, tick, state } = fixture()
  machine.updateContext({ storeOpen: true })
  assert.equal(state().state, 'idle')
  machine.updateContext({ storeOpen: false })
  machine.updateContext({ storeOpen: true })
  assert.equal(state().state, 'success')
  tick(RAIMU_TIMINGS.success)
  machine.updateContext({ sales: 100, goal: 0, day: '2026-10-04' })
  assert.equal(state().state, 'idle')
  machine.updateContext({ sales: 100, goal: 100, day: '2026-10-04' })
  assert.equal(state().state, 'success')
  tick(RAIMU_TIMINGS.success)
  machine.updateContext({ sales: 120, goal: 100, day: '2026-10-04' })
  assert.equal(state().state, 'idle')
  machine.updateContext({ sales: 120, goal: 100, day: '2026-10-05' })
  assert.equal(state().state, 'success')
  machine.destroy()
})
```

## preview/raimu/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Raimu Companion · Local preview</title>
    <style>
      body { margin: 0; font-family: 'DM Sans', system-ui, sans-serif; }
      .studio { min-height: 100dvh; padding: clamp(20px, 5vw, 64px); background: var(--mgmt-input); color: var(--mgmt-text); }
      .studio .kicker { font-size: 11px; letter-spacing: .15em; color: var(--mgmt-primary); text-transform: uppercase; font-weight: 700; }
      .studio h1 { font-size: clamp(26px, 4vw, 42px); letter-spacing: -.04em; margin: 10px 0; }
      .studio > p { max-width: 560px; color: var(--mgmt-muted); line-height: 1.6; font-size: 14px; }
      .studio-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; max-width: 840px; margin: 28px 0; }
      .studio-controls button, .studio-controls select { min-height: 44px; padding: 0 12px; background: var(--mgmt-surface); color: var(--mgmt-text); border: 1px solid var(--mgmt-border); border-radius: 10px; font: inherit; font-size: 12px; }
      .studio-controls label { display: flex; align-items: center; gap: 8px; font-size: 12px; }
      .studio button:focus-visible, .studio select:focus-visible { outline: 3px solid var(--mgmt-primary); outline-offset: 3px; }
      .pose-grid.raimu-companion { position: static; inset: auto; z-index: auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 12px; max-width: 920px; pointer-events: auto; }
      .pose-card { border: 1px solid var(--mgmt-border); border-radius: 20px; background: var(--mgmt-surface); padding: 14px; text-align: center; }
      .pose-card .rc-cat { width: 128px; height: 138px; margin: auto; }
      .pose-card button { border: 0; min-height: 44px; background: transparent; color: var(--mgmt-text); text-transform: capitalize; font: inherit; font-size: 12px; }
      .studio-note { margin-top: 26px; padding-bottom: 160px; }
      @media(max-width: 500px) { .pose-grid.raimu-companion { grid-template-columns: repeat(2, minmax(0, 1fr)); } .pose-card { padding: 10px 4px; } }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.jsx"></script>
  </body>
</html>
```

## preview/raimu/main.jsx

```jsx
import { StrictMode, useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { RaimuConversation } from '../../src/components/RaimuWidget'
import RaimuMascot from '../../src/components/raimu/RaimuMascot'
import { raimu, RAIMU_STATES } from '../../src/components/raimu/raimuMachine'
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext'
import '../../src/styles.css'
import '../../src/management-theme.css'

export default function Preview() {
  const { resolvedTheme, setPreference } = useTheme()
  const [enabled, setEnabled] = useState(true)
  const [mode, setMode] = useState('reply')
  const snapshot = useSyncExternalStore(raimu.subscribe, raimu.getSnapshot)
  const requestReply = async (text) => {
    await new Promise((resolve) => window.setTimeout(resolve, 1_600))
    if (mode === 'error') return { error: { message: 'The support service is unavailable. Please try again.' }, data: null }
    if (mode === 'empty') return { data: {} }
    if (mode === 'report') return { data: { text: 'Your sales report is ready. Choose a format below.', download_url: 'data:text/csv;charset=utf-8,Date%2CSales%0A2026-10-04%2C17037.79' } }
    if (mode === 'long') return { data: { text: Array.from({ length: 12 }, (_, index) => `${index + 1}. Review paid orders, then check inventory and pending deliveries. All amounts in this local preview are sample data.`).join('\n\n') } }
    return { data: { text: `I can help with “${text}”. Your store has 12 orders today. Seven are for delivery, one is for pickup, and four are walk-ins.\n\nWould you like a sales report or a closer look at an order?` } }
  }
  return <><main className="studio app-layout legacy-admin" data-theme={resolvedTheme} style={{ display: 'block' }}>
    <span className="kicker">The Coffee Realm / Companion studio</span>
    <h1>A familiar face. A little more alive.</h1>
    <p>Raimu’s motion and conversation preview. Open the cat in the corner to try the actual chat component with local sample replies.</p>
    <div className="studio-controls">
      <button onClick={() => setPreference(resolvedTheme === 'dark' ? 'light' : 'dark')}>Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'}</button>
      <button onClick={() => { setEnabled(true); raimu.setState('greeting'); raimu.say('Hi! Need a hand with sales or orders?') }}>Greet / show Raimu</button>
      <button onClick={() => raimu.reactTo('notification')}>New notification</button>
      <button onClick={() => { raimu.updateContext({ storeOpen: false }); raimu.updateContext({ storeOpen: true }) }}>Store opens</button>
      <button onClick={() => raimu.reactTo('sales-goal')}>Sales goal reached</button>
      <button onClick={() => { raimu.say('First in the queue.', { duration: 2_000 }); raimu.say('And then this one.', { duration: 2_000 }) }}>Queue two bubbles</button>
      <button onClick={() => raimu.setVisible(!snapshot.visible)}>{snapshot.visible ? 'Simulate hidden tab' : 'Resume tab'}</button>
      <label>Reply type<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="reply">Normal reply</option><option value="report">Report</option><option value="long">Long reply</option><option value="error">Service error</option><option value="empty">Empty response</option></select></label>
    </div>
    <div className="pose-grid raimu-companion" data-theme={resolvedTheme} data-motion={snapshot.animated && !snapshot.reducedMotion ? 'full' : 'minimal'} data-paused={!snapshot.visible}>
      {RAIMU_STATES.map((state) => <div className="pose-card" key={state}><RaimuMascot state={state} /><button onClick={() => raimu.setState(state)}>{state}</button></div>)}
    </div>
    <p className="studio-note">Local preview only. No messages are sent to Supabase. Drag the companion to reposition it, or focus it and use Alt + arrow keys. Escape minimizes the chat. Current state: <b>{snapshot.state}</b>.</p>
  </main><RaimuConversation role="admin" sessionKey="local-preview" enabled={enabled} onHide={() => setEnabled(false)} requestReply={requestReply} /></>
}

// Keep the standalone test harness root stable during dependency HMR.
const root = import.meta.hot?.data.root || createRoot(document.getElementById('root'))
if (import.meta.hot) import.meta.hot.data.root = root
root.render(<StrictMode><ThemeProvider><Preview /></ThemeProvider></StrictMode>)
```
