export async function deliveryQuoteErrorMessage(error) {
  const status = error?.context?.status
  let body
  try { body = await error.context.clone().json() } catch { /* Network failures have no response body. */ }
  if (typeof body?.error === 'string' && body.error.trim()) return body.error
  if (status === 404) return 'Delivery service is not deployed. Contact the store.'
  if (status === 401) return /invalid jwt/i.test(body?.message || '')
    ? 'Delivery service authentication needs updating. Contact the store.'
    : 'Sign in again to calculate delivery.'
  if (status === 503) return 'Delivery service is unavailable. Try again shortly.'
  if (typeof body?.message === 'string' && body.message.trim()) return body.message
  return 'Cannot reach the delivery service. Check your connection and retry.'
}
