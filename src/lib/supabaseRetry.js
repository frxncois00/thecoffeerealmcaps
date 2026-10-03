const DEFAULT_DELAYS = [700, 1400, 2600]

export function isJwtIssuedInFutureError(error) {
  if (!error) return false
  const code = String(error.code || error.status || '').toUpperCase()
  const message = String(error.message || error.details || error.error_description || '').toLowerCase()
  return code === 'PGRST303' && message.includes('jwt issued at future')
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export async function retryJwtTimingRequest(request, delays = DEFAULT_DELAYS) {
  let result = await request()

  for (const delay of delays) {
    if (!isJwtIssuedInFutureError(result?.error)) return result
    await wait(delay)
    result = await request()
  }

  return result
}
