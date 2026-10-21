export const selectBestsellers = products => products
  .filter(product => product.isBestseller)
  .sort((a, b) => (a.bestsellerRank || 99) - (b.bestsellerRank || 99))
  .slice(0, 5)

export const menuStartingPrice = product => product.variations?.length
  ? Math.min(...product.variations.map(option => Number(option.price)))
  : Number(product.basePrice)

export function filterMenu(products, { query = '', category = 'All', min = '', max = '', available = false, sort = 'recommended' } = {}) {
  const search = query.trim().toLowerCase()
  const result = products.filter(product => {
    const price = menuStartingPrice(product)
    return (!available || product.available)
      && (category === 'All' || product.category === category)
      && `${product.name} ${product.description || ''}`.toLowerCase().includes(search)
      && (min === '' || price >= Number(min))
      && (max === '' || price <= Number(max))
  })
  if (sort === 'price-low') result.sort((a, b) => menuStartingPrice(a) - menuStartingPrice(b))
  else if (sort === 'price-high') result.sort((a, b) => menuStartingPrice(b) - menuStartingPrice(a))
  else result.sort((a, b) => Number(Boolean(b.isBestseller || b.isFeatured)) - Number(Boolean(a.isBestseller || a.isFeatured)))
  return result
}
