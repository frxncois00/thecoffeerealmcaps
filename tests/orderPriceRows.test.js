import test from 'node:test'
import assert from 'node:assert/strict'
import { buildVatExemptOrderBreakdown } from '../src/utils/pricing.js'
import { orderPriceRows } from '../src/utils/orderPriceRows.js'

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
