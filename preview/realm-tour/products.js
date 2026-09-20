// EDITORIAL TODO: replace every placeholder before publishing this preview.
// No price, description, or availability here is connected to production data.
export const products = [
  { id: 'biscoff-latte', name: 'Biscoff Latte', category: 'Coffee', badge: 'From the bar', theme: 'caramel', shape: 'drink', word: 'sip', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'matcha-latte', name: 'Matcha Latte', category: 'Matcha', badge: 'A green moment', theme: 'sage', shape: 'drink', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'beef-tapa', name: 'Beef Tapa', category: 'Meals', badge: 'Comfort food', theme: 'clay', shape: 'plate', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'macadamia', name: 'Macadamia', category: 'Cookies', badge: 'Cookie break', theme: 'froth', shape: 'cookie', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'red-velvet-cake', name: 'Red Velvet Cake', category: 'Cakes', badge: 'Cake time', theme: 'wine', shape: 'cake', word: 'velvet', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'nuggets', name: 'Nuggets', category: 'Snacks', badge: 'Something savory', theme: 'olive', shape: 'plate', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'smores', name: 'Smores', category: 'Cookies', badge: 'A sweet pause', theme: 'cocoa', shape: 'cookie', word: 'pause', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'biscoff-burnt-cheesecake', name: 'Biscoff Burnt Cheesecake', category: 'Cakes', badge: 'One last slice', theme: 'oat', shape: 'cake', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
].map(product => ({ ...product, image: `/images/realm-tour/${product.id}.png` }))

export const environment = {
  opening: '/images/realm-tour/storefront-facade.jpg',
  closing: '/images/realm-tour/lounge-interior.jpg',
}
