import { formatVatRate } from './pricing.js'

export function orderPriceRows({ breakdown, fulfillment, deliveryFee = 0, total, vatRate }) {
  const rows = breakdown.isVatExemptDiscount
    ? [
        ...(breakdown.regularBaseAmount > 0 ? [{ label: 'VATable Sale', amount: breakdown.regularBaseAmount }] : []),
        { label: 'VAT-Exempt Sale', amount: breakdown.vatExemptSale },
        { label: `${formatVatRate(vatRate)} VAT`, amount: breakdown.regularVatAmount },
        { label: 'Less 20% SC/PWD Discount', amount: -breakdown.discountAmount, kind: 'discount' },
      ]
    : [
        { label: 'VATable Sale', amount: breakdown.baseAmount },
        { label: `${formatVatRate(vatRate)} VAT`, amount: breakdown.vatAmount },
      ]

  if (fulfillment === 'delivery') rows.push({ label: 'Delivery fee', amount: deliveryFee })
  rows.push({ label: 'Total', amount: total, kind: 'total' })
  return rows
}
