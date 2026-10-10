import React from 'react'
import { formatVatRate } from '../../utils/pricing'
import {
  STORE_NAME,
  STORE_ADDRESS,
  STORE_PHONE,
  TIN_ID,
  formatMoney,
  formatReceiptDateTime,
  resolveItemCustomizations,
  normalizeReceiptData,
} from './receiptUtils'

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
