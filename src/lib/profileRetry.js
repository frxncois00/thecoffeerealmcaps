const FUTURE_JWT_RETRY_DELAYS_MS = [300, 700, 1500, 3000, 5000, 5000]

export function isFutureJwtError(error) {
  return error?.code === 'PGRST303' && /jwt issued at future/i.test(error.message || '')
}

export async function readProfileWithRetry(client, userId, columns, delays = FUTURE_JWT_RETRY_DELAYS_MS) {
  for (let attempt = 0; ; attempt += 1) {
    const result = await client.from('profiles').select(columns).eq('id', userId).maybeSingle()
    if (!isFutureJwtError(result.error) || attempt >= delays.length) return result
    await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
  }
}
