import { deliveryAreas } from '../data/deliveryAreas.js'

const GEOAPIFY_API_KEY = String(import.meta.env.VITE_GEOAPIFY_API_KEY || '').trim()

export const TCR_STORE_COORDS = {
  lat: 14.7088,
  lng: 121.0605,
  name: 'The Coffee Realm',
  address: 'Lot 1 Block 210 Mark Street corner Dollar Street, North Fairview, Quezon City',
}

// Bounding box for Quezon City with a small margin
const QC_GEO_BOUNDS = {
  minLat: 14.56,
  maxLat: 14.79,
  minLng: 120.96,
  maxLng: 121.16,
}

// Known non-Quezon City municipalities, cities, and provinces in NCR / PH
const NON_QC_LOCALITIES = [
  'manila', 'city of manila',
  'pasig', 'pasig city',
  'makati', 'makati city',
  'taguig', 'taguig city',
  'caloocan', 'caloocan city', 'north caloocan', 'south caloocan',
  'marikina', 'marikina city',
  'valenzuela', 'valenzuela city',
  'mandaluyong', 'mandaluyong city',
  'san juan', 'san juan city',
  'pasay', 'pasay city',
  'parañaque', 'paranaque', 'parañaque city', 'paranaque city',
  'las piñas', 'las pinas', 'las piñas city', 'las pinas city',
  'muntinlupa', 'muntinlupa city',
  'navotas', 'navotas city',
  'malabon', 'malabon city',
  'pateros',
  'san jose del monte', 'sjdm', 'city of san jose del monte',
  'marilao', 'meycauayan', 'meycauayan city', 'bocaue', 'obando', 'bulakan', 'bulacan',
  'santa maria', 'sta. maria', 'norzagaray', 'plaridel', 'malolos', 'baliwag', 'baliuag',
  'guiguinto', 'balagtas', 'pandi', 'san ildefonso', 'san miguel', 'san rafael',
  'rodriguez', 'montalban', 'san mateo', 'antipolo', 'antipolo city', 'cainta', 'taytay',
  'angono', 'binangonan', 'teresa', 'morong', 'baras', 'tanay', 'pililla',
  'cavite', 'bacoor', 'imus', 'dasmariñas', 'dasmarinas', 'general trias', 'tagaytay',
  'laguna', 'san pedro', 'biñan', 'binan', 'santa rosa', 'sta. rosa', 'cabuyao', 'calamba',
  'pampanga', 'batangas', 'cebu', 'davao', 'iloilo', 'baguio', 'benguet'
]

// Clean and normalize strings for fuzzy matching
const normalize = str =>
  String(str || '')
    .toLowerCase()
    .replace(/^brgy\.?\s*/i, '')
    .replace(/^barangay\s*/i, '')
    .replace(/[^a-z0-9]/g, '')

/**
 * Determine if an address or OSM result is genuinely within Quezon City
 */
export function isWithinQuezonCity(addressObj = {}, displayName = '', coords = null) {
  // If coordinates are provided, check geographic bounding box first
  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    if (
      coords.lat < QC_GEO_BOUNDS.minLat ||
      coords.lat > QC_GEO_BOUNDS.maxLat ||
      coords.lng < QC_GEO_BOUNDS.minLng ||
      coords.lng > QC_GEO_BOUNDS.maxLng
    ) {
      return false
    }
  }

  const city = String(addressObj.city || '').toLowerCase().trim()
  const municipality = String(addressObj.municipality || '').toLowerCase().trim()
  const town = String(addressObj.town || '').toLowerCase().trim()
  const county = String(addressObj.county || '').toLowerCase().trim()
  const state = String(addressObj.state || '').toLowerCase().trim()
  const province = String(addressObj.province || '').toLowerCase().trim()
  const full = String(displayName || '').toLowerCase()

  // 1. Explicitly check if the address belongs to a non-QC city/municipality/province
  for (const nonQc of NON_QC_LOCALITIES) {
    const isCityMatch = city && (city === nonQc || city.startsWith(`${nonQc} `) || city.endsWith(` ${nonQc}`))
    const isMunMatch = municipality && (municipality === nonQc || municipality.startsWith(`${nonQc} `) || municipality.endsWith(` ${nonQc}`))
    const isTownMatch = town && (town === nonQc || town.startsWith(`${nonQc} `) || town.endsWith(` ${nonQc}`))
    const isProvMatch = province && (province === nonQc || province.startsWith(`${nonQc} `) || province.endsWith(` ${nonQc}`))
    const isStateMatch = state && state === nonQc && !state.includes('metro manila')

    if (isCityMatch || isMunMatch || isTownMatch || isProvMatch || isStateMatch) {
      // Unless the city/county explicitly confirms Quezon City, reject
      if (!city.includes('quezon city') && !county.includes('quezon city')) {
        return false
      }
    }
  }

  // 2. Positive confirmation of Quezon City from address components
  if (city.includes('quezon city') || city === 'quezon' || county.includes('quezon city')) {
    return true
  }

  // 3. Positive confirmation from full display name
  if (
    full.includes('quezon city') ||
    full.includes('qc, metro manila') ||
    full.includes('qc, eastern manila district')
  ) {
    // Ensure it's not a street named "Quezon" in another city (e.g. Quezon Blvd, Manila)
    if (city && city !== 'quezon city' && city !== 'quezon' && NON_QC_LOCALITIES.some(l => city.includes(l))) {
      return false
    }
    if (municipality && NON_QC_LOCALITIES.some(l => municipality.includes(l))) {
      return false
    }
    return true
  }

  return false
}

/**
 * Find the matching Barangay from deliveryAreas, strictly within Quezon City
 */
export function matchBarangay(rawText, addressObj = {}, coords = null) {
  if (!rawText && !addressObj) return null

  // Restrict: only match if location is verified to be in Quezon City
  if (!isWithinQuezonCity(addressObj, rawText, coords)) {
    return null
  }

  // Collect potential barangay candidates from OSM address details
  const candidates = [
    addressObj.quarter,
    addressObj.suburb,
    addressObj.village,
    addressObj.neighbourhood,
    addressObj.residential,
    addressObj.city_district,
  ].filter(Boolean)

  // 1. Exact match on OSM candidate fields
  for (const candidate of candidates) {
    const cleanCand = normalize(candidate)
    if (!cleanCand) continue
    const exact = deliveryAreas.find(area => normalize(area.barangay) === cleanCand)
    if (exact) return exact
  }

  // 2. Partial match on OSM candidate fields
  for (const candidate of candidates) {
    const cleanCand = normalize(candidate)
    if (!cleanCand) continue
    const partial = deliveryAreas.find(
      area =>
        cleanCand.includes(normalize(area.barangay)) ||
        normalize(area.barangay).includes(cleanCand)
    )
    if (partial) return partial
  }

  // 3. Match against full rawText (longest name first to avoid prefix collisions)
  if (rawText) {
    const cleanRaw = normalize(rawText)
    const matches = deliveryAreas.filter(area => cleanRaw.includes(normalize(area.barangay)))
    if (matches.length > 0) {
      matches.sort((a, b) => b.barangay.length - a.barangay.length)
      return matches[0]
    }
  }

  return null
}

/**
 * Format OSM address object into a clean Philippine street address
 */
export function formatStreetAddress(addressObj = {}) {
  const parts = []

  // House number / building
  const premises = [
    addressObj.house_number,
    addressObj.house_name,
    addressObj.building,
    addressObj.apartment,
    addressObj.office,
    addressObj.shop,
    addressObj.amenity,
  ].filter(Boolean)
  parts.push(...premises)

  // Road / street / avenue
  const road = addressObj.road || addressObj.pedestrian || addressObj.footway || addressObj.street || ''
  if (road) parts.push(road)

  // Subdivision / village / complex
  const residential = addressObj.residential || addressObj.subdivision || addressObj.neighbourhood || ''
  if (residential && residential !== road) parts.push(residential)

  return [...new Set(parts.filter(Boolean))].join(', ')
}

const geoapifyAddressObject = properties => ({
  house_number: properties.housenumber,
  house_name: properties.name,
  building: properties.building,
  road: properties.street,
  neighbourhood: properties.suburb || properties.neighbourhood,
  quarter: properties.district,
  city_district: properties.district,
  city: properties.city,
  municipality: properties.municipality,
  county: properties.county,
  state: properties.state,
  postcode: properties.postcode,
  country: properties.country,
})

const geoapifyResult = feature => {
  const properties = feature?.properties || {}
  const coords = {
    lat: Number(properties.lat ?? feature?.geometry?.coordinates?.[1]),
    lng: Number(properties.lon ?? feature?.geometry?.coordinates?.[0]),
  }
  const address = geoapifyAddressObject(properties)
  const displayName = properties.formatted || ''
  const isQc = isWithinQuezonCity(address, displayName, coords)
  const matchedArea = isQc ? matchBarangay(displayName, address, coords) : null
  return {
    id: properties.place_id || properties.datasource?.raw?.place_id || displayName,
    displayName,
    name: properties.name || properties.address_line1 || properties.street,
    lat: coords.lat,
    lng: coords.lng,
    street: formatStreetAddress(address) || properties.address_line1 || '',
    barangay: isQc ? (matchedArea?.barangay || properties.suburb || properties.district || '') : '',
    matchedArea,
    isQuezonCity: isQc,
    rawAddress: address,
  }
}

async function fetchGeoapify(path, params) {
  const url = new URL(`https://api.geoapify.com/v1/geocode/${path}`)
  Object.entries({...params,apiKey:GEOAPIFY_API_KEY}).forEach(([key,value])=>url.searchParams.set(key,value))
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Geoapify request failed (${response.status})`)
  return response.json()
}

/**
 * Search Philippine locations with priority for Quezon City
 */
export async function searchPhLocations(query) {
  const clean = String(query || '').trim()
  if (!clean || clean.length < 2) return []

  try {
    if (GEOAPIFY_API_KEY) {
      const data = await fetchGeoapify('autocomplete', {
        text: clean,
        format: 'geojson',
        filter: 'rect:120.96,14.56,121.16,14.79',
        bias: `proximity:${TCR_STORE_COORDS.lng},${TCR_STORE_COORDS.lat}`,
        lang: 'en',
        limit: '8',
      })
      return (data.features || []).map(geoapifyResult).filter(item => item.isQuezonCity)
    }

    const hasQuezonCity = /\b(?:quezon city|qc)\b/i.test(clean)
    const searchParam = hasQuezonCity
      ? clean
      : `${clean}, Quezon City, Metro Manila, Philippines`

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchParam
    )}&countrycodes=ph&format=json&addressdetails=1&namedetails=1&limit=8&viewbox=120.96,14.79,121.16,14.56&bounded=1`

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    })

    if (!response.ok) return []
    const results = await response.json()

    return results.map(item => {
      const addr = item.address || {}
      const coords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
      const isQc = isWithinQuezonCity(addr, item.display_name, coords)
      const matchedArea = isQc ? matchBarangay(item.display_name, addr, coords) : null
      const street = formatStreetAddress(addr) || item.name || clean
      const barangay = isQc ? (matchedArea?.barangay || addr.quarter || addr.suburb || addr.village || '') : ''

      return {
        id: item.place_id,
        displayName: item.display_name,
        name: item.name,
        lat: coords.lat,
        lng: coords.lng,
        street,
        barangay,
        matchedArea,
        isQuezonCity: isQc,
        rawAddress: addr,
      }
    }).filter(item => item.isQuezonCity)
  } catch {
    return []
  }
}

/**
 * Reverse geocode coordinates (lat, lng) to an address in the Philippines
 */
export async function reverseGeocodeCoords(lat, lng) {
  try {
    if (GEOAPIFY_API_KEY) {
      const data = await fetchGeoapify('reverse', {
        lat: String(lat),
        lon: String(lng),
        format: 'geojson',
        lang: 'en',
        limit: '1',
      })
      const feature = data.features?.[0]
      return feature ? geoapifyResult(feature) : null
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&namedetails=1&zoom=18&layer=address`
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    })

    if (!response.ok) return null
    const data = await response.json()
    if (!data || data.error) return null

    const addr = data.address || {}
    const coords = { lat, lng }
    const isQc = isWithinQuezonCity(addr, data.display_name, coords)
    const matchedArea = isQc ? matchBarangay(data.display_name, addr, coords) : null
    const street = formatStreetAddress(addr) || data.name || ''
    const barangay = isQc ? (matchedArea?.barangay || addr.quarter || addr.suburb || addr.village || '') : ''

    return {
      displayName: data.display_name,
      lat,
      lng,
      street,
      barangay,
      matchedArea,
      isQuezonCity: isQc,
      rawAddress: addr,
    }
  } catch {
    return null
  }
}
