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
