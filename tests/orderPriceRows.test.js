import test from 'node:test'
import assert from 'node:assert/strict'
import { buildVatExemptOrderBreakdown } from '../src/utils/pricing.js'
import { orderPriceRows } from '../src/utils/orderPriceRows.js'

test('Senior Citizen and PWD show the same VAT-exempt breakdown', () => {
  const input = { subtotal: 336, discountSubtotal: 112, vatRate: 0.12 }
  const senior = buildVatExemptOrderBreakdown({ ...input, discountType: 'Senior Citizen' })
  const pwd = buildVatExemptOrderBreakdown({ ...input, discountType: 'PWD' })
  assert.equal(senior.isVatExemptDiscount, true)
  assert.deepEqual(senior, pwd)
  assert.deepEqual(orderPriceRows({ breakdown: senior, fulfillment: 'pickup', total: senior.totalAmount, vatRate: 0.12 }), [
    { label: 'VATable Sale', amount: 200 },
    { label: 'VAT-Exempt Sale', amount: 100 },
    { label: '12% VAT', amount: 24 },
    { label: 'Less 20% SC/PWD Discount', amount: -20, kind: 'discount' },
    { label: 'Total', amount: 304, kind: 'total' },
  ])
})

test('delivery review and placed-order summary both include the delivery fee', () => {
  const breakdown = buildVatExemptOrderBreakdown({ subtotal: 880, vatRate: 0.12 })
  assert.deepEqual(orderPriceRows({ breakdown, fulfillment: 'delivery', deliveryFee: 60, total: 940, vatRate: 0.12 }), [
    { label: 'VATable Sale', amount: 785.71 },
    { label: '12% VAT', amount: 94.29 },
    { label: 'Delivery fee', amount: 60 },
    { label: 'Total', amount: 940, kind: 'total' },
  ])
})

test('pickup omits the delivery fee', () => {
  const breakdown = buildVatExemptOrderBreakdown({ subtotal: 880, vatRate: 0.12 })
  assert.equal(orderPriceRows({ breakdown, fulfillment: 'pickup', total: 880, vatRate: 0.12 }).some((row) => row.label === 'Delivery fee'), false)
})
