export function uniqueAddons(addons) {
  const seenIds = new Set()
  const seenNames = new Set()

  return addons.filter((addon) => {
    const id = String(addon.id || '').trim()
    const name = String(addon.name || '').trim().replace(/\s+/g, ' ').toLowerCase()
    if ((id && seenIds.has(id)) || (name && seenNames.has(name))) return false
    if (id) seenIds.add(id)
    if (name) seenNames.add(name)
    return true
  })
}

export function menuItemAddons(addons, item) {
  return uniqueAddons(addons.filter((addon) => {
    if (Array.isArray(addon.subcategoryIds)) return addon.subcategoryIds.includes(item.subcategory_id)
    const appliesTo = addon.appliesTo || 'both'
    return appliesTo === 'both' || appliesTo === item.item_type
  }))
}
