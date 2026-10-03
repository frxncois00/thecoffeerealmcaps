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
