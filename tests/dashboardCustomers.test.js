import test from 'node:test'
import assert from 'node:assert/strict'
import { computeCustomerSummary, computeWalkInSummary, fetchAllCustomerRows, getCustomerActivityPeriods } from '../src/utils/dashboardCustomers.js'
import { slidingPageNumbers } from '../src/utils/pagination.js'

test('counts unique website customers and computes real signup growth', () => {
  const customers = Array.from({ length: 11 }, (_, id) => ({
    id: String(id), created_at: id < 4 ? '2026-09-12T00:00:00Z' : '2026-10-12T00:00:00Z',
  }))
  const orders = [
    { customer_id: '0', order_source: 'customer_pos' },
    { customer_id: '0', order_source: 'customer_pos' },
    { customer_id: '1', order_source: 'customer_pos' },
    { customer_id: '2', order_source: 'cashier_pos' },
    { customer_id: 'employee', order_source: 'customer_pos' },
    { customer_id: null, order_source: 'customer_pos' },
  ]
  assert.deepEqual(computeCustomerSummary(customers, orders, new Date('2026-10-24T00:00:00Z')), {
    totalCustomers: 11, customersWhoOrdered: 2, signupsThisMonth: 7, signupsLastMonth: 4, signupGrowth: 75,
  })
})

test('signup months use Philippine midnight and handle year boundaries', () => {
  const customers = [
    { id: 'old', created_at: '2026-11-30T15:59:59Z' },
    { id: 'last', created_at: '2026-12-31T15:59:59Z' },
    { id: 'this', created_at: '2026-12-31T16:00:00Z' },
    { id: 'future', created_at: '2027-01-02T00:00:00Z' },
  ]
  const result = computeCustomerSummary(customers, [], new Date('2026-12-31T16:30:00Z'))
  assert.equal(result.signupsThisMonth, 1)
  assert.equal(result.signupsLastMonth, 1)
  assert.equal(result.signupGrowth, 0)
})

test('no prior signups has no fabricated percentage; a decline is negative', () => {
  const now = new Date('2026-10-24T00:00:00Z')
  assert.equal(computeCustomerSummary([], [], now).signupGrowth, null)
  assert.equal(computeCustomerSummary([{ id: 'a', created_at: '2026-10-01' }], [], now).signupGrowth, null)
  assert.equal(computeCustomerSummary([{ id: 'a', created_at: '2026-09-01' }], [], now).signupGrowth, -100)
})

const walkInOrder = (created_at, overrides = {}) => ({
  created_at, order_source: 'cashier_pos', order_type: 'walk-in',
  payment_status: 'paid', status: 'Completed', is_voided: false,
  customer_id: null, ...overrides,
})

test('walk-in growth counts anonymous paid counter orders independently of online accounts', () => {
  const orders = [
    walkInOrder('2026-09-03T00:00:00Z'),
    walkInOrder('2026-09-25T00:00:00Z'),
    walkInOrder('2026-10-01T00:00:00Z'),
    walkInOrder('2026-10-10T00:00:00Z'),
    walkInOrder('2026-10-24T00:00:00Z', { status: 'Preparing' }),
    walkInOrder('2026-10-24T00:00:00Z', { order_source: 'customer_pos' }),
    walkInOrder('2026-10-24T00:00:00Z', { order_type: 'pickup' }),
    walkInOrder('2026-10-24T00:00:00Z', { payment_status: 'pending' }),
    walkInOrder('2026-10-24T00:00:00Z', { status: 'Cancelled' }),
    walkInOrder('2026-10-24T00:00:00Z', { is_voided: true }),
  ]
  assert.deepEqual(computeWalkInSummary(orders, new Date('2026-10-24T01:00:00Z')), {
    ordersThisMonth: 3, ordersLastMonth: 2, ordersToday: 1, dailyAverage: 3 / 24, orderGrowth: 50,
  })
})

test('walk-in periods include full months and today at Philippine midnight across a year boundary', () => {
  const now = new Date('2026-12-31T16:30:00Z')
  const periods = getCustomerActivityPeriods(now)
  assert.equal(new Date(periods.previousMonthStart).toISOString(), '2026-11-30T16:00:00.000Z')
  assert.equal(new Date(periods.monthStart).toISOString(), '2026-12-31T16:00:00.000Z')
  const orders = [
    walkInOrder('2026-11-30T15:59:59Z'),
    walkInOrder('2026-11-30T16:00:00Z'),
    walkInOrder('2026-12-31T15:59:59Z'),
    walkInOrder('2026-12-31T16:00:00Z'),
    walkInOrder('2026-12-31T16:30:01Z'),
    walkInOrder('invalid'),
  ]
  assert.deepEqual(computeWalkInSummary(orders, now), {
    ordersThisMonth: 1, ordersLastMonth: 2, ordersToday: 1, dailyAverage: 1, orderGrowth: -50,
  })
})

test('walk-in daily counts respect the Philippine day even when UTC is still the previous day', () => {
  const orders = [walkInOrder('2026-10-23T15:59:59Z'), walkInOrder('2026-10-23T16:00:00Z')]
  const result = computeWalkInSummary(orders, new Date('2026-10-23T17:00:00Z'))
  assert.equal(result.ordersThisMonth, 2)
  assert.equal(result.ordersToday, 1)
  assert.equal(result.dailyAverage, 2 / 24)
})

test('daily walk-in average includes only this month and all elapsed days, including days without orders', () => {
  const orders = [
    ...Array.from({ length: 12 }, () => walkInOrder('2026-10-01T00:00:00Z')),
    walkInOrder('2026-10-04T00:00:00Z'),
    walkInOrder('2026-09-30T15:59:59Z'),
    walkInOrder('2026-10-05T00:00:00Z'),
    walkInOrder('2026-10-04T00:00:00Z', { is_voided: true }),
  ]
  const result = computeWalkInSummary(orders, new Date('2026-10-04T01:00:00Z'))
  assert.equal(result.ordersThisMonth, 13)
  assert.equal(result.dailyAverage, 3.25)
})

test('walk-in growth handles empty history, no previous baseline, no change, and a complete decline', () => {
  const now = new Date('2026-10-24T00:00:00Z')
  const thisMonth = walkInOrder('2026-10-12T00:00:00Z')
  const lastMonth = walkInOrder('2026-09-12T00:00:00Z')
  assert.deepEqual(computeWalkInSummary([], now), { ordersThisMonth: 0, ordersLastMonth: 0, ordersToday: 0, dailyAverage: 0, orderGrowth: null })
  assert.equal(computeWalkInSummary([thisMonth], now).orderGrowth, null)
  assert.equal(computeWalkInSummary([thisMonth, lastMonth], now).orderGrowth, 0)
  assert.equal(computeWalkInSummary([lastMonth], now).orderGrowth, -100)
})

test('lifetime customer reads continue past the API row limit and propagate errors', async () => {
  const rows = Array.from({ length: 1001 }, (_, id) => ({ id }))
  const ranges = []
  const result = await fetchAllCustomerRows(() => ({
    order: () => ({ range: async (start, end) => {
      ranges.push([start, end])
      return { data: rows.slice(start, end + 1), error: null }
    } }),
  }))
  assert.equal(result.data.length, 1001)
  assert.deepEqual(ranges, [[0, 999], [1000, 1999]])
  const error = new Error('Read failed')
  assert.equal((await fetchAllCustomerRows(() => ({ order: () => ({ range: async () => ({ error }) }) }))).error, error)
})

test('pagination slides through three numbers and stops at either boundary', () => {
  assert.deepEqual(slidingPageNumbers(1, 20), [1, 2, 3])
  assert.deepEqual(slidingPageNumbers(3, 20), [2, 3, 4])
  assert.deepEqual(slidingPageNumbers(4, 20), [3, 4, 5])
  assert.deepEqual(slidingPageNumbers(5, 20), [4, 5, 6])
  assert.deepEqual(slidingPageNumbers(20, 20), [18, 19, 20])
  assert.deepEqual(slidingPageNumbers(1, 2), [1, 2])
  assert.deepEqual(slidingPageNumbers(1, 1), [1])
})
