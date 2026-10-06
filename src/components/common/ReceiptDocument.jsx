import React from 'react'
import { store } from '../../data/mockData'
import { formatVatRate, buildVatExemptOrderBreakdown } from '../../utils/pricing'
import { escapeHtml } from '../../utils/escapeHtml'

const STORE_NAME = 'THE COFFEE REALM'
const STORE_ADDRESS = store.address || 'Lot 1 Block 210 Mark Street corner Dollar Street, Quezon City, Philippines, 1121'
const STORE_PHONE = store.phone || '+63 997 533 7958'
const TIN_ID = ''

function formatMoney(value) {
  return Number(value || 0).toFixed(2)
}

function formatReceiptDateTime(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function resolveItemCustomizations(item, addonNames = {}) {
  const details = []
  const customizations = item.customizations || {}

  if (customizations.variantLabel) details.push(customizations.variantLabel)
  else if (customizations.variantKey) details.push(customizations.variantKey)

  if (customizations.temperature) {
    const temp = String(customizations.temperature).toLowerCase()
    details.push(temp === 'hot' ? 'Hot' : 'Cold')
  }
  if (customizations.sugarLevel) details.push(`Sugar: ${customizations.sugarLevel}`)
  if (customizations.iceLevel) details.push(`Ice: ${customizations.iceLevel}`)

  const addons = item.addons || []
  if (Array.isArray(addons)) {
    addons.forEach((addon) => {
      if (typeof addon === 'string') {
        const resolved = addonNames[addon] || addon
        details.push(`Add-on: ${resolved}`)
      } else if (addon?.name) {
        details.push(`Add-on: ${addon.name}`)
      }
    })
  }

  if (customizations.special_instructions) {
    details.push(`Note: ${customizations.special_instructions}`)
  }

  return details
}

export function normalizeReceiptData(order = {}, defaultVatRate = 0.12, defaultPricesIncludeVat = true) {
  let effectiveDefaultVatRate = defaultVatRate
  let effectiveDefaultPricesIncludeVat = defaultPricesIncludeVat
  if (typeof defaultVatRate === 'object' && defaultVatRate !== null) {
    effectiveDefaultVatRate = defaultVatRate.vatRate ?? 0.12
    effectiveDefaultPricesIncludeVat = defaultVatRate.pricesIncludeVat ?? true
  }
  const orderNumber = order.orderNumber || order.order_number || order.reference_code || `Order #${order.id || '---'}`
  const receiptNumber = order.receiptNumber || order.receipt_number || null
  const counterNumber = order.counterNumber || order.counter_number || ''
  const diningOption = order.diningOption || order.dining_option || 'dine_in'
  const orderTypeRaw = String(order.orderType || order.order_type || order.fulfillment || 'walk-in').toLowerCase()

  const isOnline = orderTypeRaw === 'delivery' || orderTypeRaw === 'pickup' || orderTypeRaw === 'preorder'
  const isDelivery = orderTypeRaw === 'delivery'

  const typeLabel = orderTypeRaw === 'delivery'
    ? 'Delivery'
    : orderTypeRaw === 'pickup'
      ? 'Pickup'
      : orderTypeRaw === 'preorder'
        ? 'Preorder'
        : 'Walk-in'

  const createdAt = order.createdAt || order.created_at || new Date().toISOString()
  const customerName = order.customerName || order.customer_name || ''
  const customerPhone = order.customerPhone || order.customer_phone || order.phone || ''
  const deliveryAddress = order.deliveryAddress || order.delivery_address || order.address || ''
  const deliveryFee = Number(order.deliveryFee ?? order.delivery_fee ?? 0)
  const scheduleDate = order.scheduleDate || order.schedule_date || ''
  const scheduleTime = order.scheduleTime || order.schedule_time || ''
  const cashierName = order.cashierName || order.cashier_name || ''

  const rawPaymentMethod = order.paymentMethod || order.payment_method || (Array.isArray(order.payments) ? order.payments[0]?.method : order.payment?.method) || 'Cash'
  const paymentMethod = String(rawPaymentMethod).toLowerCase() === 'bank_transfer' || String(rawPaymentMethod).toLowerCase() === 'bank'
    ? 'Bank Transfer'
    : String(rawPaymentMethod).toLowerCase() === 'gcash'
      ? 'GCash'
      : 'Cash'

  const paymentReference = order.paymentReference || order.payment_reference || (Array.isArray(order.payments) ? order.payments[0]?.reference_number : null) || ''
  const accountNumber = order.accountNumber || order.account_number || (Array.isArray(order.payments) ? order.payments[0]?.account_number : null) || ''
  const bankName = order.bankName || order.bank_name || (Array.isArray(order.payments) ? order.payments[0]?.bank_name : null) || ''

  const cashReceived = Number(order.cashReceived ?? order.cash_received ?? order.amountReceived ?? order.amount_received ?? (Array.isArray(order.payments) ? order.payments[0]?.amount_received : 0))
  const changeAmount = Number(order.change ?? order.change_amount ?? (Array.isArray(order.payments) ? order.payments[0]?.change_amount : 0))

  const discountType = order.discountType || order.discount_type || ''
  const discountIdNumber = order.discountIdNumber || order.discount_id_number || ''
  const discountCustomerName = order.discountCustomerName || order.discount_customer_name || ''

  const items = order.items || order.order_items || []
  const subtotal = Number(order.subtotal || 0) || items.reduce((sum, item) => sum + Number(item.line_total ?? item.lineTotal ?? (Number(item.unit_price || item.unitPrice || 0) * Number(item.quantity || item.qty || 1))), 0)
  const total = Number(order.total ?? order.final_total ?? order.finalTotal ?? 0) || subtotal

  const vatRate = Number(order.vatRate ?? order.vat_rate ?? effectiveDefaultVatRate)
  const pricesIncludeVat = order.pricesIncludeVat ?? order.prices_include_vat ?? effectiveDefaultPricesIncludeVat

  const discountSubtotal = Number(order.discountSubtotal ?? order.discount_subtotal ?? 0)
  const discountAmount = Number(order.discountAmount ?? order.discount_amount ?? 0)
  const vatExemptAmount = Number(order.vatExemptAmount ?? order.vat_exempt_amount ?? 0)

  const breakdown = buildVatExemptOrderBreakdown({
    subtotal,
    discountSubtotal,
    discountType,
    discountAmount,
    vatExemptAmount,
    vatRate,
    pricesIncludeVat,
  })

  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || item.qty || 1), 0)

  return {
    orderNumber,
    receiptNumber,
    counterNumber,
    diningOption,
    orderTypeRaw,
    typeLabel,
    isOnline,
    isDelivery,
    createdAt,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryFee,
    scheduleDate,
    scheduleTime,
    cashierName,
    paymentMethod,
    paymentReference,
    accountNumber,
    bankName,
    cashReceived,
    changeAmount,
    discountType,
    discountIdNumber,
    discountCustomerName,
    items,
    subtotal,
    total,
    vatRate,
    pricesIncludeVat,
    breakdown,
    itemCount,
  }
}

export function ReceiptPaper({ order, defaultVatRate = 0.12, defaultPricesIncludeVat = true, addonNames = {} }) {
  const data = normalizeReceiptData(order, defaultVatRate, defaultPricesIncludeVat)
  const { breakdown, vatRate } = data

  const scheduleValue = data.scheduleDate
    ? `${data.scheduleDate}${data.scheduleTime ? ` ${data.scheduleTime}` : ''}`
    : ''

  return (
    <div className="receipt-print-area">
      {/* Store Header */}
      <div className="receipt-header">
        <img className="receipt-logo" src="/images/coffeerealmlogo.png" alt="Store logo" />
        <div className="receipt-store-name">{STORE_NAME}</div>
        <div className="receipt-store-info">{STORE_ADDRESS}</div>
        <div className="receipt-store-info">{STORE_PHONE}</div>
        <div className="receipt-store-info">TIN ID: {TIN_ID}</div>
      </div>

      {/* Claim Block: ONLY for in-store / walk-in orders with counter number */}
      {!data.isOnline && data.counterNumber ? (
        <div className="receipt-claim-block">
          <div>CLAIM AT THE COUNTER</div>
          <strong>{data.counterNumber}</strong>
          <div>[ {data.diningOption === 'take_out' ? 'TAKE OUT' : 'DINE IN'} ]</div>
        </div>
      ) : null}

      <div className="receipt-line" />

      {/* Order Info */}
      <div className="receipt-row">
        <span className="receipt-label">Order #:</span>
        <span className="receipt-value">{data.orderNumber}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Reference #:</span>
        <span className="receipt-value">{data.receiptNumber || data.paymentReference || 'N/A'}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Date:</span>
        <span className="receipt-value">{formatReceiptDateTime(data.createdAt)}</span>
      </div>
      <div className="receipt-row">
        <span className="receipt-label">Type:</span>
        <span className="receipt-value">{data.typeLabel}</span>
      </div>

      {data.cashierName && !data.isOnline ? (
        <div className="receipt-row">
          <span className="receipt-label">Cashier:</span>
          <span className="receipt-value">{data.cashierName}</span>
        </div>
      ) : null}

      {data.customerName && data.isOnline ? (
        <div className="receipt-row">
          <span className="receipt-label">Customer:</span>
          <span className="receipt-value">{data.customerName}</span>
        </div>
      ) : null}

      {data.customerPhone && data.isOnline ? (
        <div className="receipt-row">
          <span className="receipt-label">Contact:</span>
          <span className="receipt-value">{data.customerPhone}</span>
        </div>
      ) : null}

      {scheduleValue && data.isOnline ? (
        <div className="receipt-row">
          <span className="receipt-label">Schedule:</span>
          <span className="receipt-value">{scheduleValue}</span>
        </div>
      ) : null}

      {data.isDelivery && data.deliveryAddress ? (
        <div className="receipt-row">
          <span className="receipt-label">Customer Address:</span>
          <span className="receipt-value">{data.deliveryAddress}</span>
        </div>
      ) : null}

      <div className="receipt-line" />

      {/* Items Table */}
      <div className="receipt-table-header">
        <div>QTY</div>
        <div>ITEM</div>
        <div>PRICE</div>
      </div>
      <div className="receipt-line" />

      <div className="receipt-items">
        {data.items.map((item, index) => {
          const qty = Number(item.quantity || item.qty || 1)
          const name = item.display_name || item.name || item.item_name || item.product_name || 'Menu item'
          const lineTotal = Number(item.line_total ?? item.lineTotal ?? (Number(item.unit_price || item.unitPrice || 0) * qty))
          const details = resolveItemCustomizations(item, addonNames)
          const isDiscounted = Boolean(item.is_discounted || item.isDiscounted)

          return (
            <div className="receipt-item" key={item.lineKey || item.id || `${name}-${index}`}>
              <div>{qty}</div>
              <div className="receipt-item-name">
                {name}
                {details.map((detail) => (
                  <div className="receipt-option" key={detail}>+ {detail}</div>
                ))}
                {isDiscounted ? (
                  <div className="receipt-option">+ {data.discountType || 'Discount'} discount applied</div>
                ) : null}
              </div>
              <div className="receipt-item-price">{formatMoney(lineTotal)}</div>
            </div>
          )
        })}
      </div>

      <div className="receipt-line" />

      {/* Tax and Totals Breakdown */}
      {breakdown.isVatExemptDiscount ? (
        <>
          {breakdown.regularBaseAmount > 0 ? (
            <div className="receipt-total-row">
              <span>VATable Sale:</span>
              <span>{formatMoney(breakdown.regularBaseAmount)}</span>
            </div>
          ) : null}
          <div className="receipt-total-row">
            <span>VAT-Exempt Sale:</span>
            <span>{formatMoney(breakdown.vatExemptSale)}</span>
          </div>
          <div className="receipt-total-row">
            <span>{formatVatRate(vatRate)} VAT:</span>
            <span>{formatMoney(breakdown.regularVatAmount)}</span>
          </div>
          <div className="receipt-total-row">
            <span>Less 20% SC/PWD Disc.:</span>
            <span>-{formatMoney(breakdown.discountAmount)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="receipt-total-row">
            <span>VATable Sale:</span>
            <span>{formatMoney(breakdown.baseAmount)}</span>
          </div>
          <div className="receipt-total-row">
            <span>{formatVatRate(vatRate)} VAT:</span>
            <span>{formatMoney(breakdown.vatAmount)}</span>
          </div>
        </>
      )}

      {/* Delivery Fee for online delivery orders */}
      {data.isDelivery && data.deliveryFee > 0 ? (
        <div className="receipt-total-row">
          <span>Delivery Fee:</span>
          <span>{formatMoney(data.deliveryFee)}</span>
        </div>
      ) : null}

      <div className="receipt-total-row">
        <span>TOTAL:</span>
        <span className="receipt-grand-total">{formatMoney(data.total)}</span>
      </div>

      <div className="receipt-line" />

      {/* Payment Details */}
      <div className="receipt-row">
        <span className="receipt-label">Payment Method:</span>
        <span className="receipt-value">{data.paymentMethod}</span>
      </div>

      {breakdown.isVatExemptDiscount && data.discountIdNumber ? (
        <div className="receipt-row">
          <span className="receipt-label">Discount ID:</span>
          <span className="receipt-value">{data.discountIdNumber}</span>
        </div>
      ) : null}

      {data.paymentMethod === 'Cash' && data.cashReceived > 0 ? (
        <>
          <div className="receipt-row">
            <span className="receipt-label">Cash Received:</span>
            <span className="receipt-value">PHP {formatMoney(data.cashReceived)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Change:</span>
            <span className="receipt-value">PHP {formatMoney(data.changeAmount)}</span>
          </div>
        </>
      ) : null}

      {data.paymentMethod === 'GCash' ? (
        <>
          {data.paymentReference ? (
            <div className="receipt-row">
              <span className="receipt-label">Payment Reference Number:</span>
              <span className="receipt-value">{data.paymentReference}</span>
            </div>
          ) : null}
          {data.accountNumber ? (
            <div className="receipt-row">
              <span className="receipt-label">Account Number:</span>
              <span className="receipt-value">{data.accountNumber}</span>
            </div>
          ) : null}
        </>
      ) : null}

      {data.paymentMethod === 'Bank Transfer' ? (
        <>
          {data.bankName ? (
            <div className="receipt-row">
              <span className="receipt-label">Bank Name:</span>
              <span className="receipt-value">{data.bankName}</span>
            </div>
          ) : null}
          {data.paymentReference ? (
            <div className="receipt-row">
              <span className="receipt-label">Payment Reference Number:</span>
              <span className="receipt-value">{data.paymentReference}</span>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="receipt-line" />

      {/* Item Count */}
      <div className="receipt-row">
        <span className="receipt-label">Items:</span>
        <span className="receipt-value">{data.itemCount}</span>
      </div>

      <div className="receipt-line" />

      {/* Footer message */}
      <div className="receipt-footer">
        {data.isDelivery ? (
          <>Please check your items upon delivery.<br />Thank you for choosing The Coffee Realm.</>
        ) : (
          <>Thank you for choosing The Coffee Realm,<br />Enjoy your drink and have a great day!</>
        )}
      </div>

      <div className="receipt-line" />
    </div>
  )
}

export function buildReceiptHtml(order, defaultVatRate = 0.12, defaultPricesIncludeVat = true, addonNames = {}) {
  const data = normalizeReceiptData(order, defaultVatRate, defaultPricesIncludeVat)
  const { breakdown, vatRate } = data

  const scheduleValue = data.scheduleDate
    ? `${data.scheduleDate}${data.scheduleTime ? ` ${data.scheduleTime}` : ''}`
    : ''

  const itemsHtml = data.items.map((item, index) => {
    const qty = Number(item.quantity || item.qty || 1)
    const name = item.display_name || item.name || item.item_name || item.product_name || 'Menu item'
    const lineTotal = Number(item.line_total ?? item.lineTotal ?? (Number(item.unit_price || item.unitPrice || 0) * qty))
    const details = resolveItemCustomizations(item, addonNames)
    const isDiscounted = Boolean(item.is_discounted || item.isDiscounted)

    const detailsHtml = details.map((detail) => `<div class="receipt-option">+ ${escapeHtml(detail)}</div>`).join('')
    const discountHtml = isDiscounted ? `<div class="receipt-option">+ ${escapeHtml(data.discountType || 'Discount')} discount applied</div>` : ''

    return `<div class="receipt-item">
      <div>${qty}</div>
      <div class="receipt-item-name">
        ${escapeHtml(name)}
        ${detailsHtml}
        ${discountHtml}
      </div>
      <div class="receipt-item-price">${formatMoney(lineTotal)}</div>
    </div>`
  }).join('')

  const claimBlockHtml = (!data.isOnline && data.counterNumber) ? `
    <div class="receipt-claim-block">
      <div>CLAIM AT THE COUNTER</div>
      <strong>${escapeHtml(data.counterNumber)}</strong>
      <div>[ ${data.diningOption === 'take_out' ? 'TAKE OUT' : 'DINE IN'} ]</div>
    </div>
  ` : ''

  const cashierRowHtml = (data.cashierName && !data.isOnline)
    ? `<div class="receipt-row"><span class="receipt-label">Cashier:</span><span class="receipt-value">${escapeHtml(data.cashierName)}</span></div>`
    : ''

  const customerRowHtml = (data.customerName && data.isOnline)
    ? `<div class="receipt-row"><span class="receipt-label">Customer:</span><span class="receipt-value">${escapeHtml(data.customerName)}</span></div>`
    : ''

  const contactRowHtml = (data.customerPhone && data.isOnline)
    ? `<div class="receipt-row"><span class="receipt-label">Contact:</span><span class="receipt-value">${escapeHtml(data.customerPhone)}</span></div>`
    : ''

  const scheduleRowHtml = (scheduleValue && data.isOnline)
    ? `<div class="receipt-row"><span class="receipt-label">Schedule:</span><span class="receipt-value">${escapeHtml(scheduleValue)}</span></div>`
    : ''

  const addressRowHtml = (data.isDelivery && data.deliveryAddress)
    ? `<div class="receipt-row"><span class="receipt-label">Customer Address:</span><span class="receipt-value">${escapeHtml(data.deliveryAddress)}</span></div>`
    : ''

  const vatBreakdownHtml = breakdown.isVatExemptDiscount ? `
    ${breakdown.regularBaseAmount > 0 ? `<div class="receipt-total-row"><span>VATable Sale:</span><span>${formatMoney(breakdown.regularBaseAmount)}</span></div>` : ''}
    <div class="receipt-total-row"><span>VAT-Exempt Sale:</span><span>${formatMoney(breakdown.vatExemptSale)}</span></div>
    <div class="receipt-total-row"><span>${formatVatRate(vatRate)} VAT:</span><span>${formatMoney(breakdown.regularVatAmount)}</span></div>
    <div class="receipt-total-row"><span>Less 20% SC/PWD Disc.:</span><span>-${formatMoney(breakdown.discountAmount)}</span></div>
  ` : `
    <div class="receipt-total-row"><span>VATable Sale:</span><span>${formatMoney(breakdown.baseAmount)}</span></div>
    <div class="receipt-total-row"><span>${formatVatRate(vatRate)} VAT:</span><span>${formatMoney(breakdown.vatAmount)}</span></div>
  `

  const deliveryFeeHtml = (data.isDelivery && data.deliveryFee > 0)
    ? `<div class="receipt-total-row"><span>Delivery Fee:</span><span>${formatMoney(data.deliveryFee)}</span></div>`
    : ''

  const discountIdHtml = (breakdown.isVatExemptDiscount && data.discountIdNumber)
    ? `<div class="receipt-row"><span class="receipt-label">Discount ID:</span><span class="receipt-value">${escapeHtml(data.discountIdNumber)}</span></div>`
    : ''

  let paymentDetailsHtml = ''
  if (data.paymentMethod === 'Cash' && data.cashReceived > 0) {
    paymentDetailsHtml = `
      <div class="receipt-row"><span class="receipt-label">Cash Received:</span><span class="receipt-value">PHP ${formatMoney(data.cashReceived)}</span></div>
      <div class="receipt-row"><span class="receipt-label">Change:</span><span class="receipt-value">PHP ${formatMoney(data.changeAmount)}</span></div>
    `
  } else if (data.paymentMethod === 'GCash') {
    paymentDetailsHtml = `
      ${data.paymentReference ? `<div class="receipt-row"><span class="receipt-label">Payment Reference Number:</span><span class="receipt-value">${escapeHtml(data.paymentReference)}</span></div>` : ''}
      ${data.accountNumber ? `<div class="receipt-row"><span class="receipt-label">Account Number:</span><span class="receipt-value">${escapeHtml(data.accountNumber)}</span></div>` : ''}
    `
  } else if (data.paymentMethod === 'Bank Transfer') {
    paymentDetailsHtml = `
      ${data.bankName ? `<div class="receipt-row"><span class="receipt-label">Bank Name:</span><span class="receipt-value">${escapeHtml(data.bankName)}</span></div>` : ''}
      ${data.paymentReference ? `<div class="receipt-row"><span class="receipt-label">Payment Reference Number:</span><span class="receipt-value">${escapeHtml(data.paymentReference)}</span></div>` : ''}
    `
  }

  const footerTextHtml = data.isDelivery
    ? 'Please check your items upon delivery.<br />Thank you for choosing The Coffee Realm.'
    : 'Thank you for choosing The Coffee Realm,<br />Enjoy your drink and have a great day!'

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(data.orderNumber)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; font-family: 'Courier New', Courier, monospace; overflow-wrap: break-word; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; font-size: 11px; line-height: 1.45; }
    .receipt-print-area { width: 300px; max-width: 100%; min-width: 260px; margin: 0 auto; padding: 8px 10px; background: #fff; }
    .receipt-header, .receipt-footer { text-align: center; }
    .receipt-logo { width: 42px; height: 42px; object-fit: contain; display: block; margin: 0 auto 4px; }
    .receipt-store-name { font-size: 15px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
    .receipt-store-info { font-size: 10px; line-height: 1.25; }
    .receipt-claim-block { text-align: center; margin: 14px 0 10px; font-size: 11px; line-height: 2; letter-spacing: .04em; }
    .receipt-claim-block strong { display: block; font-size: 13px; font-weight: 400; }
    .receipt-line { border-top: 1px dashed #000; margin: 6px 0; width: 100%; }
    .receipt-row, .receipt-total-row { display: flex; justify-content: space-between; gap: 8px; width: 100%; align-items: flex-start; }
    .receipt-label { flex: 0 0 112px; min-width: 112px; text-align: left; }
    .receipt-value { flex: 1 1 auto; min-width: 0; text-align: right; }
    .receipt-table-header, .receipt-item { display: grid; grid-template-columns: 24px minmax(0, 1fr) 58px; gap: 4px; width: 100%; }
    .receipt-table-header { font-weight: 800; }
    .receipt-item-name { min-width: 0; }
    .receipt-item-price { text-align: right; white-space: nowrap; }
    .receipt-option { grid-column: 2 / 4; padding-left: 0; font-size: 10px; }
    .receipt-grand-total { font-size: 14px; font-weight: 900; }
    .receipt-footer { margin-top: 8px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="receipt-print-area">
    <div class="receipt-header">
      <img class="receipt-logo" src="/images/coffeerealmlogo.png" alt="Store logo" />
      <div class="receipt-store-name">${STORE_NAME}</div>
      <div class="receipt-store-info">${STORE_ADDRESS}</div>
      <div class="receipt-store-info">${STORE_PHONE}</div>
      <div class="receipt-store-info">TIN ID: ${TIN_ID}</div>
    </div>
    ${claimBlockHtml}
    <div class="receipt-line"></div>
    <div class="receipt-row"><span class="receipt-label">Order #:</span><span class="receipt-value">${escapeHtml(data.orderNumber)}</span></div>
    <div class="receipt-row"><span class="receipt-label">Reference #:</span><span class="receipt-value">${escapeHtml(data.receiptNumber || data.paymentReference || 'N/A')}</span></div>
    <div class="receipt-row"><span class="receipt-label">Date:</span><span class="receipt-value">${escapeHtml(formatReceiptDateTime(data.createdAt))}</span></div>
    <div class="receipt-row"><span class="receipt-label">Type:</span><span class="receipt-value">${data.typeLabel}</span></div>
    ${cashierRowHtml}
    ${customerRowHtml}
    ${contactRowHtml}
    ${scheduleRowHtml}
    ${addressRowHtml}
    <div class="receipt-line"></div>
    <div class="receipt-table-header"><div>QTY</div><div>ITEM</div><div>PRICE</div></div>
    <div class="receipt-line"></div>
    <div class="receipt-items">${itemsHtml}</div>
    <div class="receipt-line"></div>
    ${vatBreakdownHtml}
    ${deliveryFeeHtml}
    <div class="receipt-total-row"><span>TOTAL:</span><span class="receipt-grand-total">${formatMoney(data.total)}</span></div>
    <div class="receipt-line"></div>
    <div class="receipt-row"><span class="receipt-label">Payment Method:</span><span class="receipt-value">${data.paymentMethod}</span></div>
    ${discountIdHtml}
    ${paymentDetailsHtml}
    <div class="receipt-line"></div>
    <div class="receipt-row"><span class="receipt-label">Items:</span><span class="receipt-value">${data.itemCount}</span></div>
    <div class="receipt-line"></div>
    <div class="receipt-footer">${footerTextHtml}</div>
    <div class="receipt-line"></div>
  </div>
</body>
</html>`
}

export function openReceiptWindow(order, shouldPrint = false, defaultVatRate = 0.12, defaultPricesIncludeVat = true, addonNames = {}) {
  const html = buildReceiptHtml(order, defaultVatRate, defaultPricesIncludeVat, addonNames)
  const win = window.open('', '_blank', 'width=460,height=900')
  if (!win) return false
  win.document.open()
  win.document.write(html)
  win.document.close()
  if (shouldPrint) {
    const images = [...win.document.images]
    const ready = images.length
      ? Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }) })))
      : Promise.resolve()
    ready.then(() => window.setTimeout(() => {
      win.focus()
      win.print()
    }, 150))
    win.addEventListener('afterprint', () => win.close(), { once: true })
  }
  return true
}

export function printReceipt(order, defaultVatRate = 0.12, defaultPricesIncludeVat = true, addonNames = {}) {
  return openReceiptWindow(order, true, defaultVatRate, defaultPricesIncludeVat, addonNames)
}
