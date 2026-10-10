import test from 'node:test'
import assert from 'node:assert/strict'
import { completedPassportOrders, rewardProgress, PASSPORT_REWARDS } from '../src/utils/realmPassport.js'

test('only completed or received purchases earn a stamp; duplicate and refunded purchases do not', () => {
  const orders = [
    { id: '1', status: 'Completed', created_at: '2026-09-01' },
    { id: '1', status: 'Completed', created_at: '2026-09-01' },
    { id: '2', status: 'received', created_at: '2026-09-02' },
    { id: '3', status: 'Preparing' },
    { id: '4', status: 'Cancelled' },
    { id: '5', status: 'Completed', refund_status: 'refunded' },
  ]
  assert.deepEqual(completedPassportOrders(orders).map(order => order.id), ['1', '2'])
})
test('all ten reward milestones require their own five purchases', () => {
  assert.equal(PASSPORT_REWARDS.length, 10)
  for (let milestone = 1; milestone <= 10; milestone++) {
    assert.equal(rewardProgress((milestone - 1) * 5, milestone), 0)
    assert.equal(rewardProgress(milestone * 5 - 1, milestone), 4)
    assert.equal(rewardProgress(milestone * 5, milestone), 5)
    assert.equal(rewardProgress(100, milestone), 5)
  }
})
