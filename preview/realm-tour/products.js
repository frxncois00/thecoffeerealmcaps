// EDITORIAL TODO: replace every placeholder before publishing this preview.
// No price, description, or availability here is connected to production data.
export const products = [
  { id: 'beef-tapa', name: 'Beef Tapa', category: 'Meals', badge: 'Comfort food', theme: 'clay', shape: 'plate', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'biscoff-latte', name: 'Biscoff Latte', category: 'Coffee', badge: 'From the bar', theme: 'caramel', shape: 'drink', word: 'sip', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'red-velvet-cake', name: 'Red Velvet Cake', category: 'Cakes', badge: 'Cake time', theme: 'wine', shape: 'cake', word: 'velvet', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'smores', name: 'Smores', category: 'Cookies', badge: 'A sweet pause', theme: 'cocoa', shape: 'cookie', word: 'pause', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
  { id: 'biscoff-burnt-cheesecake', name: 'Biscoff Burnt Cheesecake', category: 'Cakes', badge: 'One last slice', theme: 'oat', shape: 'cake', price: '\u20b1000', description: '[ADD DESCRIPTION]' },
].map(product => ({ ...product, image: `/images/realm-tour/${product.id}.png` }))

// Interactive flavor section only. Keep the transparent artwork as supplied.
export const flavors = [
  { id: 'matcha', name: 'Matcha', word: 'matcha', cup: 'matcha-cup.png', bubble: 'matcha-bubble.png', color: '#adbc98', mist: '#edf1d8', accent: '#3a5a40', width: 1113, height: 1414 },
  { id: 'darkwhite-chocolate', name: 'Dark White Chocolate', word: 'chocolate', cup: 'darkwhite-chocolate-cup.png', bubble: 'darkwhite-chocolate-bubble.png', color: '#c1a087', mist: '#fbebd5', accent: '#69432e', width: 1122, height: 1402 },
  { id: 'strawberry-milk', name: 'Strawberry Milk', word: 'strawberry', cup: 'strawberry-milk-cup.png', bubble: 'strawberry-milk-bubble.png', color: '#d3a3a3', mist: '#f9e1d7', accent: '#8b414b', width: 1023, height: 1538 },
]

export const environment = {
  opening: '/images/realm-tour/storefront-facade.jpg',
  closing: '/images/realm-tour/lounge-interior.jpg',
}

// Realm gallery only: a small walk through the real space, from the bar to the patio.
export const galleryPhotos = [
  { file: 'pc1.jpg', caption: 'It starts at the bar.', alt: 'A barista preparing coffee at the espresso machine' },
  { file: 'pc3.jpg', caption: 'Settle into something soft.', alt: 'A pink lounge sofa beneath an arched lamp and framed photographs' },
  { file: 'pc2.jpg', caption: 'A little pocket of light.', alt: 'A glowing table lamp beneath a framed photograph on a sage wall' },
  { file: 'pc4.jpg', caption: 'Room for your usual company.', alt: 'Cafe tables and chairs beside sage walls with warm vertical lights' },
  { file: 'pc5.jpg', caption: 'Or a moment to yourself.', alt: 'A cozy table near a small lamp and the warmly lit cafe counter' },
  { file: 'pc6.jpg', caption: 'One more round?', alt: 'A foosball table beside the cafe windows at night' },
  { file: 'pc7.jpg', caption: 'There’s more up here.', alt: 'A green sign reading More seats upstairs, same coffee extra cozy vibes' },
  { file: 'pc8.jpg', caption: 'Let the afternoon linger.', alt: 'A pink sofa and coffee table beside a sunlit window and floor lamp' },
  { file: 'pc10.jpg', caption: 'Little things, collected.', alt: 'An arrangement of framed photographs and mirrors on a green wall' },
  { file: 'pc11.jpg', caption: 'Good company leaves a mark.', alt: 'A corner wall covered with framed snapshots of cafe guests' },
  { file: 'pc44.jpg', caption: 'Your window-side pause.', alt: 'A cushioned chair, floor lamp and wooden drawers beside a leafy cafe window' },
  { file: 'pc9.jpg', caption: 'A little fresh air, too.', alt: 'Outdoor patio tables and chairs surrounded by plants outside The Coffee Realm' },
]
