// Match the database's half-hour grid and strict minimum lead time in Manila.
export function scheduleSlots(date, fulfillment, ordering = {}, prepMinutes = 0, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return []
  const clock = (value, fallback) => /^\d{2}:\d{2}/.test(value || '') ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5)) : fallback
  const open = Math.max(600, clock(ordering.openTime, 600))
  const close = Math.min(1410, clock(ordering.closeTime, 1410))
  const threshold = Number(now) + (Math.max(fulfillment === 'delivery' ? 60 : 30, prepMinutes) + 1) * 60000
  const slots = []
  for (let time = Math.ceil(open / 30) * 30; time <= close; time += 30) {
    const id = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`
    if (Date.parse(`${date}T${id}:00+08:00`) <= threshold) continue
    slots.push({ id, name: `${Math.floor(time / 60) % 12 || 12}:${String(time % 60).padStart(2, '0')} ${time < 720 ? 'AM' : 'PM'}` })
  }
  return slots
}
