// Customer-triggered system work is displayed without attributing it to a
// customer's name. Keep the stored audit record intact for traceability.
export function presentAuditEvent(event) {
  if (String(event.actor_role_snapshot || '').trim().toLowerCase() !== 'customer') return event

  const actor = event.surface === 'system' ? 'System' : 'Customer'
  const name = event.actor_name_snapshot
  const summary = event.summary || ''
  return {
    ...event,
    actor_name_snapshot: actor,
    actor_role_snapshot: event.surface === 'system' ? 'system' : 'customer',
    summary: name && summary.startsWith(`${name} `)
      ? `${actor}${summary.slice(name.length)}`
      : summary,
  }
}
