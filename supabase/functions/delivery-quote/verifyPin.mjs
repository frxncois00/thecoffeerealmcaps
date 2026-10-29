const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(barangay|brgy)\.?\s*/g, '').replace(/[^a-z0-9]/g, '')
const verifiedPins = new Map()

function findBarangay(address, knownBarangays) {
  const keys = ['quarter', 'suburb', 'village', 'neighbourhood', 'neighborhood', 'residential', 'subdivision', 'city_district', 'district', 'locality', 'name']
  const candidates = keys.map(key => address[key]).filter(value => typeof value === 'string')
  for (const candidate of candidates) {
    const exact = knownBarangays.find(name => normalize(name) === normalize(candidate))
    if (exact) return exact
  }
  // Accept common map suffixes and comma-separated address components, never
  // arbitrary substrings: Fairview and North Fairview are separate barangays.
  const labels = [...candidates, address.display_name].filter(value => typeof value === 'string')
  for (const label of labels) {
    for (const part of label.split(',')) {
      const clean = part.trim().replace(/\s+(subdivision|subd\.?|barangay)$/i, '')
      const match = knownBarangays.find(name => normalize(name) === normalize(clean))
      if (match) return match
    }
  }
  return null
}

function matchAddress(address, knownBarangays) {
  const cities = ['city', 'town', 'municipality', 'county'].map(key => normalize(address[key]))
  if (!cities.some(city => ['quezoncity', 'cityofquezoncity'].includes(city))) return { mismatch: 'city' }
  const barangay = findBarangay(address, knownBarangays)
  return barangay ? { barangay } : { mismatch: 'barangay' }
}

// A provider failure never permits checkout: another provider must confirm
// both Quezon City and the selected active barangay for the actual pin.
export async function verifyDeliveryPin(lat, lng, barangay, { fetchImpl = fetch, photonUrl = 'https://photon.komoot.io/reverse', overpassUrl = 'https://overpass-api.de/api/interpreter', knownBarangays = [barangay], useCache = true } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Choose a valid delivery pin.')
  const cacheKey = JSON.stringify([lat, lng, normalize(barangay), knownBarangays])
  const cached = useCache && verifiedPins.get(cacheKey)
  if (cached?.expiresAt > Date.now()) return cached.barangay
  const remember = verifiedBarangay => {
    if (useCache) {
      if (verifiedPins.size >= 500) verifiedPins.delete(verifiedPins.keys().next().value)
      verifiedPins.set(cacheKey, { barangay: verifiedBarangay, expiresAt: Date.now() + 5 * 60 * 1000 })
    }
    return verifiedBarangay
  }
  const headers = { 'User-Agent': 'TheCoffeeRealm/1.0 (+https://thecoffeerealm.store)', 'Accept-Language': 'en', Accept: 'application/json' }
  let mismatch = ''
  const providers = [
    // POIs/business entries often lack the barangay even when their surrounding
    // address is complete. Ask for address features instead, using the same pin.
    { url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&layer=address&zoom=14&lat=${lat}&lon=${lng}`, address: body => body?.address ? { ...body.address, display_name: body.display_name } : null },
    { url: `${photonUrl}?lat=${lat}&lon=${lng}&lang=en&layer=street&layer=locality&layer=district&radius=0.2&limit=1`, address: body => body?.features?.[0]?.properties },
  ]
  for (const provider of providers) {
    let address
    try {
      const response = await fetchImpl(provider.url, { headers, signal: AbortSignal.timeout(7000) })
      if (!response.ok) continue
      address = provider.address(await response.json())
    } catch { continue }
    if (!address || typeof address !== 'object') continue
    const result = matchAddress(address, knownBarangays)
    if (result.barangay) return remember(result.barangay)
    mismatch = result.mismatch
  }
  // Reverse geocoders may return a subdivision or POI instead of the barangay.
  // Query the administrative areas containing the coordinates in that case.
  try {
    const query = `[out:json][timeout:8];is_in(${lat},${lng})->.a;area.a["boundary"="administrative"]["admin_level"~"^(6|10)$"];out tags;`
    const response = await fetchImpl(overpassUrl, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ data: query }).toString(), signal: AbortSignal.timeout(10000) })
    if (response.ok) {
      const data = await response.json()
      const areas = (data.elements || []).map(element => element.tags || {})
      const names = tags => ['name', 'name:en', 'official_name', 'alt_name', 'short_name'].flatMap(key => String(tags[key] || '').split(';')).filter(Boolean)
      const cityConfirmed = areas.some(tags => tags.admin_level === '6' && names(tags).some(name => ['quezoncity', 'cityofquezoncity'].includes(normalize(name))))
      if (cityConfirmed) {
        for (const tags of areas.filter(tags => tags.admin_level === '10')) {
          for (const name of names(tags)) {
            const canonical = knownBarangays.find(known => normalize(known) === normalize(name))
            if (canonical) return remember(canonical)
          }
        }
        mismatch = 'barangay'
      } else if (areas.some(tags => tags.admin_level === '6')) mismatch = 'city'
    }
  } catch { /* Keep verification closed when boundary lookup is unavailable. */ }
  if (mismatch === 'city') throw new Error('Choose a pin within Quezon City.')
  if (mismatch === 'barangay') throw new Error('Cannot confirm the barangay. Move the pin closer to your address.')
  throw new Error('Address check is unavailable. Please retry shortly.')
}
