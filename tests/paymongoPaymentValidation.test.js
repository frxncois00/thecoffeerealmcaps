import test from 'node:test'
import assert from 'node:assert/strict'
import { paidCheckoutPayment } from '../supabase/functions/create-paymongo-checkout/paymentValidation.mjs'

const session = (amount, status = 'paid', currency = 'PHP') => ({
  id: 'cs_test_1',
  attributes: { livemode: false, payments: [{ id: 'pay_1', attributes: { status, amount, currency } }] },
})

test('only a paid payment for the bound session and exact peso amount is accepted', () => {
  assert.equal(paidCheckoutPayment(session(12500), 'cs_test_1', 12500)?.id, 'pay_1')
  assert.equal(paidCheckoutPayment(session(100), 'cs_test_1', 12500), null)
  assert.equal(paidCheckoutPayment(session(12500, 'pending'), 'cs_test_1', 12500), null)
  assert.equal(paidCheckoutPayment(session(12500, 'paid', 'USD'), 'cs_test_1', 12500), null)
  assert.equal(paidCheckoutPayment(session(12500), 'cs_test_2', 12500), null)
  assert.equal(paidCheckoutPayment({ id: 'cs_test_1', attributes: { status: 'paid' } }, 'cs_test_1', 12500), null)
})
