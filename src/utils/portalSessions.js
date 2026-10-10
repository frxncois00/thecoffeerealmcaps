// Only identical authenticated sessions are duplicates. Matching browser/IP
// details alone must never hide a separate login that an admin may need to revoke.
export function uniquePortalSessions(records, currentSessionId) {
  const sessions = new Map()
  for (const record of records) {
    const identity = record.auth_session_id || record.session_key || record.id
    if (!identity) continue
    const key = `${record.user_id || ''}:${identity}`
    const previous = sessions.get(key)
    const ended = (item) => Boolean(item.revoked_at || item.signed_out_at || item.auth_session_exists === false)
    if (!previous || (ended(record) && !ended(previous)) ||
      (ended(record) === ended(previous) && new Date(record.last_seen_at) > new Date(previous.last_seen_at))) {
      sessions.set(key, record)
    }
  }
  return [...sessions.values()].map((record) => ({
    ...record, isCurrent: (record.auth_session_id || record.session_key) === currentSessionId,
  }))
}

export function createSingleFlight() {
  const pending = new Map()
  return (key, operation) => {
    if (pending.has(key)) return pending.get(key)
    const result = Promise.resolve().then(operation).finally(() => pending.delete(key))
    pending.set(key, result)
    return result
  }
}
