export const INVENTORY_STATUS_META = {
  out: { label: 'Out of Stock', tone: 'red' },
  critical: { label: 'Critical', tone: 'red' },
  low: { label: 'Low Stock', tone: 'amber' },
  stocked: { label: 'Stocked', tone: 'green' },
  archived: { label: 'Archived', tone: 'neutral' },
}

export function inventoryStatus(item) {
  if (item.isArchived) return 'archived'
  const quantity = Number(item.quantity || 0)
  if (quantity <= 0) return 'out'
  if (quantity <= Number(item.criticalStockLevel || 0)) return 'critical'
  if (quantity <= Number(item.minStockLevel || 0)) return 'low'
  return 'stocked'
}
