// Read every page so lifetime totals are not limited by the API's row cap.
export async function fetchAllCustomerRows(createQuery) {
  const rows = []
  const pageSize = 1000
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await createQuery().order('id').range(start, start + pageSize - 1)
    if (error) return { data: null, error }
    rows.push(...(data || []))
    if (!data || data.length < pageSize) return { data: rows, error: null }
  }
}

export function getCustomerActivityPeriods(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(now)
  const year = Number(parts.find((part) => part.type === 'year').value)
  const month = Number(parts.find((part) => part.type === 'month').value)
  const day = Number(parts.find((part) => part.type === 'day').value)
  const offset = 8 * 60 * 60 * 1000
  return {
    monthStart: Date.UTC(year, month - 1, 1) - offset,
    previousMonthStart: Date.UTC(year, month - 2, 1) - offset,
    todayStart: Date.UTC(year, month - 1, day) - offset,
  }
}

export function computeCustomerSummary(customers, orders, now = new Date()) {
  const { monthStart, previousMonthStart } = getCustomerActivityPeriods(now)
  const customerIds = new Set(customers.map((customer) => customer.id))
  const orderedIds = new Set(orders
    .filter((order) => order.order_source === 'customer_pos' && customerIds.has(order.customer_id))
    .map((order) => order.customer_id))
  let signupsThisMonth = 0
  let signupsLastMonth = 0
  for (const customer of customers) {
    const created = new Date(customer.created_at).getTime()
    if (created >= monthStart && created <= now.getTime()) signupsThisMonth += 1
    else if (created >= previousMonthStart && created < monthStart) signupsLastMonth += 1
  }
  return {
    totalCustomers: customerIds.size,
    customersWhoOrdered: orderedIds.size,
    signupsThisMonth,
    signupsLastMonth,
    signupGrowth: signupsLastMonth > 0
      ? ((signupsThisMonth - signupsLastMonth) / signupsLastMonth) * 100
      : null,
  }
}

// Anonymous counter orders cannot reliably identify unique people, so count orders.
export function computeWalkInSummary(orders, now = new Date()) {
  const { monthStart, previousMonthStart, todayStart } = getCustomerActivityPeriods(now)
  const currentTime = now.getTime()
  const daysElapsedThisMonth = Math.floor((todayStart - monthStart) / 86400000) + 1
  let ordersThisMonth = 0
  let ordersLastMonth = 0
  let ordersToday = 0
  for (const order of orders) {
    if (order.order_source !== 'cashier_pos' || order.order_type !== 'walk-in'
      || order.payment_status !== 'paid' || order.status === 'Cancelled' || order.is_voided) continue
    const created = new Date(order.created_at).getTime()
    if (!Number.isFinite(created) || created > currentTime) continue
    if (created >= monthStart) ordersThisMonth += 1
    else if (created >= previousMonthStart) ordersLastMonth += 1
    if (created >= todayStart) ordersToday += 1
  }
  return {
    ordersThisMonth,
    ordersLastMonth,
    ordersToday,
    dailyAverage: ordersThisMonth / daysElapsedThisMonth,
    orderGrowth: ordersLastMonth > 0
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
      : null,
  }
}
