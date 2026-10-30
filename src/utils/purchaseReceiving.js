export const RECEIVING_CHECKS = [
  { question: 'Are all items the correct products?', types: ['wrong_item'] },
  { question: 'Are all quantities complete?', types: ['missing_quantity', 'not_received'] },
  { question: 'Are all items free from damage?', types: ['damaged'] },
  { question: 'Are all items within acceptable expiry dates?', types: ['expired'] },
]

export const ISSUE_LABELS = {
  wrong_item: 'Wrong item', missing_quantity: 'Missing quantity', not_received: 'Not received',
  damaged: 'Damaged', expired: 'Expired or unacceptable expiry', return_all: 'Return all received',
}
export const isQuantityIssue = (type) => ['missing_quantity', 'not_received'].includes(type)
const number = (value) => Number(value)
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100
const same = (a, b) => Math.abs(a - b) < 0.000001

export function receivingLines(order) {
  const correction = ['receiving_correction', 'receiving_rejected', 'receiving_information'].includes(order.status)
  if (correction && order.reports?.[0]) return order.reports[0].lines.map((line) => ({ ...line, issues: line.issues.map((issue) => ({ ...issue })) }))
  return order.items.map((item) => ({
    id: item.id, item_name: item.item_name, unit: item.unit,
    quantityOrdered: Math.max(0, item.quantityOrdered - item.acceptedQuantity),
    estimatedUnitCost: item.estimatedUnitCost, receivedQuantity: Math.max(0, item.quantityOrdered - item.acceptedQuantity),
    selected: false, issues: [],
  })).filter((line) => line.quantityOrdered > 0)
}

export function changeReceived(line, value) {
  const received = number(value)
  const issues = line.issues.filter((issue) => !isQuantityIssue(issue.type))
  if (value !== '' && Number.isFinite(received) && received >= 0 && received < line.quantityOrdered) {
    issues.unshift({ type: received === 0 ? 'not_received' : 'missing_quantity', quantity: line.quantityOrdered - received })
  }
  return { ...line, receivedQuantity: value, issues, selected: issues.length > 0 || line.selected }
}

export function returnAllReceived(lines) {
  return lines.map((line) => {
    const next = changeReceived(line, line.receivedQuantity)
    const issues = next.issues.filter((issue) => isQuantityIssue(issue.type))
    if (number(line.receivedQuantity) > 0) issues.push({ type: 'return_all', quantity: number(line.receivedQuantity) })
    return { ...next, selected: issues.length > 0, issues }
  })
}

export function receivingBreakdown(lines) {
  let order = 0, returned = 0, missing = 0, notReceived = 0
  for (const line of lines) {
    const price = number(line.estimatedUnitCost)
    order += line.quantityOrdered * price
    const received = Number.isFinite(number(line.receivedQuantity)) ? number(line.receivedQuantity) : 0
    const shortage = Math.max(0, line.quantityOrdered - received) * price
    if (received === 0) notReceived += shortage
    else missing += shortage
    if (line.selected) returned += line.issues.filter((issue) => !isQuantityIssue(issue.type)).reduce((sum, issue) => sum + (number(issue.quantity) || 0) * price, 0)
  }
  const total = round(order), returnValue = round(returned), missingValue = round(missing), notReceivedValue = round(notReceived)
  return { orderTotal: total, acceptedValue: round(total - returnValue - missingValue - notReceivedValue), returnValue, missingValue, notReceivedValue }
}

export function validateReceivingReport(lines, answers, report = true) {
  const errors = {}
  if (!RECEIVING_CHECKS.every((_, index) => ['yes', 'no'].includes(answers[index]))) errors.form = 'Answer every delivery check with Yes or No.'
  else if (report && !RECEIVING_CHECKS.some((_, index) => answers[index] === 'no')) errors.form = 'A report requires at least one check answered No.'
  else if (!report && RECEIVING_CHECKS.some((_, index) => answers[index] !== 'yes')) errors.form = 'All delivery checks must be Yes to submit as received.'
  if (!lines.length) errors.form = 'There are no outstanding items to receive.'
  if (report && !lines.some((line) => line.selected)) errors.form = 'Select at least one affected item.'
  for (const line of lines) {
    const received = number(line.receivedQuantity), ordered = number(line.quantityOrdered)
    const fail = (message) => { errors[line.id] ||= message }
    if (line.receivedQuantity === '' || !Number.isFinite(received) || received < 0 || received > ordered) fail('Received quantity must be between zero and the ordered quantity.')
    if (!report && (!same(received, ordered) || line.issues.length)) fail('A complete delivery must include every ordered quantity without issues.')
    if (!line.selected && (received < ordered || line.issues.length)) fail('Select this item to include its delivery issues.')
    if (!line.selected) continue
    if (!line.issues.length) fail('Choose an issue type and quantity.')
    const types = new Set()
    let returned = 0
    for (const issue of line.issues) {
      const quantity = number(issue.quantity)
      if (!ISSUE_LABELS[issue.type]) fail('Choose an issue type.')
      if (types.has(issue.type)) fail('Combine quantities for the same issue type.')
      types.add(issue.type)
      if (!Number.isFinite(quantity) || quantity <= 0) fail('Issue quantities must be greater than zero.')
      if (issue.type === 'missing_quantity' && !(received > 0 && received < ordered && same(quantity, ordered - received))) fail('Missing quantity must equal ordered minus received, with a partial delivery.')
      if (issue.type === 'not_received' && !(received === 0 && same(quantity, ordered))) fail('Not received requires zero received quantity and the full ordered quantity.')
      if (issue.type === 'return_all' && !same(quantity, received)) fail('Return all received must include every physically delivered unit.')
      if (!isQuantityIssue(issue.type)) returned += quantity
      const check = RECEIVING_CHECKS.findIndex((entry) => entry.types.includes(issue.type))
      if (check >= 0 && answers[check] !== 'no') fail('This issue must match a delivery check answered No.')
    }
    if (returned > received && !same(returned, received)) fail('Total return quantity cannot exceed the received quantity.')
    if (received < ordered && !types.has(received === 0 ? 'not_received' : 'missing_quantity')) fail('Record the undelivered quantity for this item.')
  }
  if (report) RECEIVING_CHECKS.forEach((check, index) => {
    if (answers[index] === 'no' && !lines.some((line) => line.selected && line.issues.some((issue) => check.types.includes(issue.type) || (index !== 1 && issue.type === 'return_all')))) {
      errors.form ||= `Identify the affected items for: ${check.question}`
    }
  })
  return errors
}
