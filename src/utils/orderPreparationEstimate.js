const roundUpToFive = (minutes) => Math.ceil(minutes / 5) * 5

function itemPrepMinutes(item, menuItem) {
  const value = menuItem?.prep_time_minutes ?? item?.prep_time_minutes
  const configured = value === null || value === undefined || value === '' ? NaN : Number(value)
  if (Number.isFinite(configured) && configured >= 0) return configured
  if (menuItem?.inventory_source === 'products') return 5
  if (menuItem?.item_type === 'drink') return 8
  if (menuItem?.item_type === 'food') return 15
  return 10
}

export function orderPreparationRange(order) {
  const items = order?.order_items
  if (!Array.isArray(items) || items.length === 0) return null

  // Conservative sequential estimate until actual batch capacities are configured.
  const minutes=items.reduce((total,item)=>{
    const menuItem=Array.isArray(item?.menu_items)?item.menu_items[0]:item?.menu_items
    return total+itemPrepMinutes(item,menuItem)*Math.max(1,Math.floor(Number(item?.quantity)||1))
  },0)
  const min=Math.max(5,roundUpToFive(minutes))
  return {min,max:min+5}
}
export function cartPreparationRange(items,products){
  return orderPreparationRange({order_items:items.map(item=>({quantity:item.quantity,menu_items:products.find(p=>p.id===item.productId)}))})
}
