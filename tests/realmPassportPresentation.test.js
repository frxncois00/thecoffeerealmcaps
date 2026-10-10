import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPassportPresentation } from '../src/utils/realmPassportPresentation.js'
import { PASSPORT_ASSETS, PASSPORT_REWARDS } from '../src/utils/realmPassport.js'
import { createSeenStampTracker } from '../src/components/customer/realm-passport/useSeenStamps.js'

const ordersFor = count => Array.from({ length: count }, (_, index) => ({
  id: `order-${index + 1}`,
  order_number: `TCR-${index + 1}`,
  status: index % 2 ? 'Received' : 'Completed',
  created_at: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
}))

test('presentation reuses eligibility, deduplication, and purchase-date ordering', () => {
  const orders = ordersFor(3)
  const model = buildPassportPresentation({ orders: [
    orders[2], orders[0], orders[1], orders[0],
    { ...orders[0], id: 'pending', status: 'Pending' },
    { ...orders[0], id: 'cancelled', status: 'Cancelled' },
    ...['refunded', 'partially_refunded', 'fully_refunded'].map(refund_status => ({ ...orders[0], id: refund_status, refund_status })),
  ] })
  assert.equal(model.summary.totalPurchases, 3)
  assert.deepEqual(model.chapters[0].slots.filter(slot => slot.earned).map(slot => slot.orderId), ['order-1', 'order-2', 'order-3'])
  assert.equal(model.chapters[0].slots[2].key, 'order-3')
  assert.match(model.chapters[0].slots[2].label, /Stamp 3 of 5, earned, order TCR-3, order placed Sep 3, 2026/)
  assert.equal(model.chapters[0].slots[3].label, 'Stamp 4 of 5, empty')
})

test('empty, partial, milestone, and completed books produce matching summaries', () => {
  for (const [count, earned, nextNumber, remaining] of [[0, 0, 1, 5], [3, 0, 1, 2], [5, 1, 2, 5], [12, 2, 3, 3], [49, 9, 10, 1], [50, 10, null, 0], [51, 10, null, 0], [53, 10, null, 0]]) {
    const model = buildPassportPresentation({ orders: ordersFor(count) })
    assert.equal(model.summary.totalPurchases, count)
    assert.equal(model.summary.rewardsEarned, earned)
    assert.equal(model.summary.nextReward?.number ?? null, nextNumber)
    assert.equal(model.summary.remaining, remaining)
    assert.equal(model.summary.complete, count >= 50)
    assert.equal(model.summary.extraPurchases, Math.max(0, count - 50))
    assert.equal(model.chapters.flatMap(chapter => chapter.slots).filter(slot => slot.earned).length, Math.min(count, 50))
    assert.equal(model.pages.length, 12)
    assert.equal(model.pages[0].kind, 'identity')
    assert.equal(model.pages[11].kind, 'summary')
  }
  const model = buildPassportPresentation({ orders: ordersFor(12) })
  assert.deepEqual(model.chapters.slice(0, 4).map(chapter => chapter.status), ['unlocked', 'unlocked', 'in-progress', 'locked'])
  assert.equal(model.chapters[2].progress, 2)
  assert.equal(model.chapters[2].remaining, 3)
  assert.equal(model.summary.nextReward.title, PASSPORT_REWARDS[2][0])
})

test('refetching purchases in a different order preserves stamp keys and slots without mutating input', () => {
  const orders = Object.freeze(ordersFor(12).map(Object.freeze))
  const stampPositions = model => model.chapters.flatMap(chapter => chapter.slots)
    .filter(slot => slot.earned)
    .map(({ key, orderId, purchaseNumber, position }) => ({ key, orderId, purchaseNumber, position }))
  const firstVisit = stampPositions(buildPassportPresentation({ orders }))
  const nextVisit = stampPositions(buildPassportPresentation({ orders: [...orders].reverse() }))
  assert.deepEqual(nextVisit, firstVisit)
  assert.equal(new Set(firstVisit.map(slot => slot.key)).size, 12)
  assert.deepEqual(orders.map(order => order.id), Array.from({ length: 12 }, (_, index) => `order-${index + 1}`))

  const newPurchase = ordersFor(13).at(-1)
  const afterPurchase = stampPositions(buildPassportPresentation({ orders: [newPurchase, ...orders] }))
  assert.deepEqual(afterPurchase.slice(0, 12), firstVisit)
  assert.deepEqual(afterPurchase.at(-1), { key: 'order-13', orderId: 'order-13', purchaseNumber: 13, position: 3 })
})

test('a refunded purchase is removed from its stamp slot and reward totals on the next fetch', () => {
  const orders = ordersFor(10)
  const beforeRefund = buildPassportPresentation({ orders })
  const afterRefund = buildPassportPresentation({ orders: orders.map(order => order.id === 'order-4' ? { ...order, refund_status: 'partially_refunded' } : order) })
  assert.equal(beforeRefund.summary.rewardsEarned, 2)
  assert.equal(afterRefund.summary.totalPurchases, 9)
  assert.equal(afterRefund.summary.rewardsEarned, 1)
  assert.equal(afterRefund.summary.nextReward.number, 2)
  assert.equal(afterRefund.summary.remaining, 1)
  const earned = afterRefund.chapters.flatMap(chapter => chapter.slots).filter(slot => slot.earned)
  assert.deepEqual(earned.map(slot => slot.orderId), ['order-1', 'order-2', 'order-3', 'order-5', 'order-6', 'order-7', 'order-8', 'order-9', 'order-10'])
  assert.equal(earned[3].key, 'order-5')
  assert.equal(earned[3].purchaseNumber, 4)
  assert.equal(afterRefund.chapters[1].slots[4].earned, false)
})

test('milestone slots stay real order slots and each chapter uses its original artwork', () => {
  const model = buildPassportPresentation({ orders: ordersFor(50) })
  for (const [index, chapter] of model.chapters.entries()) {
    assert.equal(chapter.title, PASSPORT_REWARDS[index][0])
    assert.equal(chapter.artwork, PASSPORT_ASSETS + PASSPORT_REWARDS[index][1])
    assert.equal(chapter.slots.length, 5)
    assert.equal(chapter.slots[4].orderId, `order-${(index + 1) * 5}`)
    assert.equal(chapter.slots[4].purchaseNumber, chapter.milestone)
  }
})

test('loading hides earned data until purchases are known', () => {
  const model = buildPassportPresentation({ loading: true, orders: ordersFor(12) })
  assert.equal(model.identity.id, 'Issuing…')
  assert.equal(model.summary.totalPurchases, null)
  assert.equal(model.summary.rewardsEarned, null)
  assert.equal(model.summary.nextReward, null)
  assert.equal(model.summary.remaining, null)
  assert.equal(model.summary.complete, false)
  assert.equal(model.chapters.flatMap(chapter => chapter.slots).some(slot => slot.earned), false)
  assert.equal(model.chapters[0].slots[0].label, 'Stamp 1 of 5, loading')
})

test('identity handles missing fields and shows only approved verification', () => {
  const empty = buildPassportPresentation().identity
  assert.equal(empty.username, 'Member')
  assert.equal(empty.photoUrl, null)
  assert.equal(empty.birthDate, '—')
  assert.equal(empty.favoriteDrink, 'Not set')
  assert.equal(empty.favoriteFood, 'Not set')
  assert.equal(empty.verification, null)
  const username = `@${'long-name-'.repeat(30)}`
  const identity = buildPassportPresentation({ profile: { username, birthdate: '1995-01-02', created_at: '2026-09-01', favorite_food: '  Crookie  ' }, benefit: { status: 'approved', kind: 'senior' } }).identity
  assert.equal(identity.username, username.slice(1))
  assert.equal(identity.birthDate, 'Jan 2, 1995')
  assert.equal(identity.memberSince, 'Sep 2026')
  assert.equal(identity.favoriteFood, 'Crookie')
  assert.deepEqual(identity.verification, { kind: 'senior', label: 'Senior verified' })
  assert.equal(buildPassportPresentation({ benefit: { status: 'pending', kind: 'pwd' } }).identity.verification, null)
})

test('seen stamps persist across trackers and are isolated per member', () => {
  const firstVisit = createSeenStampTracker('test-member-a')
  assert.equal(firstVisit.claimStamp('order-1'), true)
  assert.equal(firstVisit.claimStamp('order-1'), false)
  assert.equal(firstVisit.claimReward(1), true)
  assert.equal(firstVisit.claimReward(1), false)
  const nextVisit = createSeenStampTracker('test-member-a')
  assert.equal(nextVisit.claimStamp('order-1'), false)
  assert.equal(nextVisit.claimStamp('order-2'), true)
  assert.equal(nextVisit.claimReward(1), false)
  assert.equal(createSeenStampTracker('test-member-b').claimStamp('order-1'), true)
  assert.equal(createSeenStampTracker(null).claimStamp('order-1'), false)
})

test('seen stamps read stored visits and tolerate denied or corrupt storage', () => {
  const originalWindow = globalThis.window
  const saved = new Map([['realm-passport:seen:v1:test-storage-member', JSON.stringify({ stamps: ['saved-order'], rewards: ['1'] })]])
  try {
    globalThis.window = { localStorage: { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) } }
    const tracker = createSeenStampTracker('test-storage-member')
    assert.equal(tracker.claimStamp('saved-order'), false)
    assert.equal(tracker.claimReward(1), false)
    assert.equal(tracker.claimStamp('new-order'), true)
    assert.deepEqual(JSON.parse(saved.get('realm-passport:seen:v1:test-storage-member')).stamps, ['saved-order', 'new-order'])
    saved.set('realm-passport:seen:v1:test-corrupt-storage-member', '{invalid json')
    assert.equal(createSeenStampTracker('test-corrupt-storage-member').claimStamp('order-1'), true)
    globalThis.window = { get localStorage() { throw new Error('Storage denied') } }
    assert.equal(createSeenStampTracker('test-denied-storage-member').claimStamp('order-1'), true)
    assert.equal(createSeenStampTracker('test-denied-storage-member').claimStamp('order-1'), false)
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
})
