import test from 'node:test'
import assert from 'node:assert/strict'
import { createLiveStockAvailability } from '../src/services/liveStockAvailability.js'

test('stock counts are cached and simultaneous card and modal requests share one lookup', async () => {
  let calls = 0
  const store = createLiveStockAvailability(null, async () => {
    calls += 1
    return 13
  })
  const args = ['meal:default:cart', [], 'meal', null, 99]
  const [card, modal] = await Promise.all([store.load(...args), store.load(...args)])
  assert.equal(card, 13)
  assert.equal(modal, 13)
  assert.equal(calls, 1)
  assert.equal(store.cached(args[0], 'meal'), 13)
  assert.equal(await store.load(...args), 13)
  assert.equal(calls, 1)
})

test('menu stock events invalidate only the changed product and reconnect requests a sync', async () => {
  let onUpdate
  let onStatus
  let channels = 0
  let removed = 0
  let stock = 13
  const channel = {
    on(_event, _filter, handler) { onUpdate = handler; return this },
    subscribe(handler) { onStatus = handler; return this },
  }
  const client = {
    channel() { channels += 1; return channel },
    removeChannel() { removed += 1 },
  }
  const store = createLiveStockAvailability(client, async () => stock)
  const events = []
  const unsubscribeCard = store.subscribe((id) => events.push(['card', id]))
  const unsubscribeModal = store.subscribe((id) => events.push(['modal', id]))
  assert.equal(channels, 1)
  await store.load('meal', [], 'meal', null, 99)
  await store.load('drink', [], 'drink', null, 99)

  stock = 3
  onUpdate({ new: { id: 'meal' } })
  assert.equal(store.cached('meal', 'meal'), null)
  assert.equal(store.cached('drink', 'drink'), 13)
  assert.deepEqual(events, [['card', 'meal'], ['modal', 'meal']])
  assert.equal(await store.load('meal', [], 'meal', null, 99), 3)

  onStatus('SUBSCRIBED')
  assert.deepEqual(events.slice(-2), [['card', null], ['modal', null]])
  unsubscribeCard()
  unsubscribeModal()
  assert.equal(removed, 1)
  onUpdate({ new: { id: 'drink' } })
  assert.equal(store.cached('drink', 'drink'), 13)
})
