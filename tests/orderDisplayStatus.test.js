import test from 'node:test'
import assert from 'node:assert/strict'
import { customerOrderDisplayStatus, isDeliveryReady, orderDisplayStatus, orderTrackingSteps } from '../src/utils/orderDisplayStatus.js'

test('delivery readiness remains an internal step for customers', () => {
  const order = { order_type: 'delivery', status: 'Ready for Pickup' }
  const steps = orderTrackingSteps(order, 'Awaiting Payment Verification')
  assert.equal(orderDisplayStatus(order), 'Ready for Delivery')
  assert.equal(isDeliveryReady(order), true)
  assert.equal(customerOrderDisplayStatus(order), 'Preparing')
  assert.equal(steps.indexOf(customerOrderDisplayStatus(order)), 2)
  assert.equal(steps[3], 'Out for Delivery')
  assert.equal(steps.includes('Ready for Delivery'), false)
})

test('pickup orders use the claim step', () => {
  const order = { order_type: 'pickup', status: 'Ready for Pickup' }
  const status = orderDisplayStatus(order)
  assert.equal(status, 'Ready to Claim')
  assert.equal(customerOrderDisplayStatus(order), 'Ready to Claim')
  assert.equal(orderTrackingSteps(order, 'Order Received').indexOf(status), 3)
})

test('other stored statuses keep their original meaning', () => {
  assert.equal(orderDisplayStatus({ order_type: 'delivery', status: 'Out for Delivery' }), 'Out for Delivery')
  assert.equal(orderDisplayStatus({ order_type: 'delivery', status: 'Preparing' }), 'Preparing')
})
