export const DELIVERY_DEFAULTS = {
  baseFare: 50,
  tiers: [{ upTo: 3, rate: 6.5 }, { upTo: 7, rate: 6.2 }, { upTo: 10, rate: 6 }, { upTo: 15, rate: null }, { upTo: null, rate: 5 }],
  storeLat: 14.7088, storeLng: 121.0605, pickupImageUrl: '',
}

export function validateDeliveryRates(settings) {
  if (typeof settings?.baseFare !== 'number' || !Number.isFinite(settings.baseFare) || settings.baseFare < 0) throw new Error('Enter a valid base fare.')
  if (!Array.isArray(settings.tiers) || !settings.tiers.length || settings.tiers.length > 20) throw new Error('Add distance tiers.')
  let previous = 0
  settings.tiers.forEach((tier, index) => {
    if (tier.upTo === null) {
      if (index !== settings.tiers.length - 1) throw new Error('Only the last tier can be unlimited.')
    } else if (typeof tier.upTo !== 'number' || !Number.isFinite(tier.upTo) || tier.upTo <= previous) throw new Error('Tier limits must increase.')
    if (tier.rate !== null && (typeof tier.rate !== 'number' || !Number.isFinite(tier.rate) || tier.rate < 0)) throw new Error('Enter valid rates.')
    previous = tier.upTo
  })
  if (settings.tiers.at(-1).upTo !== null) throw new Error('The final tier must be unlimited.')
}

// Progressive tiers: each rate applies only to the kilometers within its range.
export function calculateDeliveryFee(distanceKm, settings) {
  validateDeliveryRates(settings)
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 200) throw new Error('Invalid road distance.')
  let fee = settings.baseFare
  let start = 0
  for (const tier of settings.tiers) {
    const end = tier.upTo ?? Infinity
    const length = Math.max(0, Math.min(distanceKm, end) - start)
    if (length > 0 && tier.rate === null) throw new Error('Delivery rate unavailable for this distance. Contact the store.')
    fee += length * (tier.rate ?? 0)
    if (distanceKm <= end) return Math.round((fee + Number.EPSILON) * 100) / 100
    start = end
  }
  throw new Error('Delivery rate unavailable.')
}
