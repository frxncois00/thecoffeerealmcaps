export function paidCheckoutPayment(session, expectedSessionId, expectedAmountMinor, expectedLivemode = false) {
  if (!session || session.id !== expectedSessionId || Boolean(session.attributes?.livemode) !== Boolean(expectedLivemode)) return null
  const payments = session.attributes?.payments
  if (!Array.isArray(payments)) return null
  return payments.find((payment) =>
    payment?.attributes?.status === 'paid' &&
    payment?.attributes?.currency === 'PHP' &&
    Number.isSafeInteger(payment?.attributes?.amount) &&
    payment.attributes.amount === expectedAmountMinor
  ) || null
}
