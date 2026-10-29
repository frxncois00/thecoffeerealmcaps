import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyDeliveryPin } from '../supabase/functions/delivery-quote/verifyPin.mjs'

const json = body => new Response(JSON.stringify(body))
test('blocked primary geocoder falls back to Photon and verifies city and barangay', async () => {
  const calls = []
  await verifyDeliveryPin(14.72, 121.06, 'North Fairview', { useCache: false, fetchImpl: async url => {
    calls.push(url)
    return calls.length === 1 ? new Response('blocked', { status: 403 }) : json({ features: [{ properties: { city: 'Quezon City', district: 'North Fairview' } }] })
  } })
  assert.equal(calls.length, 2)
  assert.match(calls[1], /photon.*reverse/)
  const primary = new URL(calls[0])
  assert.equal(primary.searchParams.get('layer'), 'address')
  assert.equal(primary.searchParams.get('zoom'), '14')
  assert.deepEqual(new URL(calls[1]).searchParams.getAll('layer'), ['street', 'locality', 'district'])
})

test('establishment pins request surrounding addresses without moving the actual pin', async () => {
  const lat = 14.68123, lng = 121.05123
  const calls = []
  const actual = await verifyDeliveryPin(lat, lng, '', { useCache: false, knownBarangays: ['Central'], fetchImpl: async rawUrl => {
    const url = new URL(rawUrl)
    calls.push(url)
    assert.equal(Number(url.searchParams.get('lat')), lat)
    assert.equal(Number(url.searchParams.get('lon')), lng)
    if (url.hostname.includes('nominatim')) return new Response('', { status: 403 })
    if (url.searchParams.getAll('layer').includes('street')) return json({ features: [{ properties: { city: 'Quezon City', district: 'Central', street: 'Test Street' } }] })
    return json({ features: [{ properties: { name: 'Test establishment', city: 'Quezon City' } }] })
  } })
  assert.equal(actual, 'Central')
  assert.equal(calls.length, 2)
})
test('timeouts and incomplete primary responses can recover through the fallback', async () => {
  let calls = 0
  await verifyDeliveryPin(14.72, 121.06, 'Brgy. Doña Imelda', { useCache: false, fetchImpl: async () => {
    if (++calls === 1) throw new Error('timeout')
    return json({ features: [{ properties: { city: 'Quezon City', district: 'Dona Imelda' } }] })
  } })
  assert.equal(calls, 2)
})
test('unavailable services never skip location verification', async () => {
  await assert.rejects(verifyDeliveryPin(14.72, 121.06, 'North Fairview', { useCache: false, fetchImpl: async () => new Response('', { status: 429 }) }), /Address check is unavailable/)
})
test('outside city and incorrect barangay are rejected', async () => {
  await assert.rejects(verifyDeliveryPin(14.72, 121.06, 'North Fairview', { useCache: false, fetchImpl: async () => json({ address: { city: 'Caloocan', suburb: 'North Fairview' }, features: [{ properties: { city: 'Caloocan', district: 'North Fairview' } }] }) }), /within Quezon City/)
  await assert.rejects(verifyDeliveryPin(14.72, 121.06, 'North Fairview', { useCache: false, fetchImpl: async () => json({ address: { city: 'Quezon City', suburb: 'Fairview' }, features: [{ properties: { city: 'Quezon City', district: 'Fairview' } }] }) }), /Cannot confirm the barangay/)
})
test('verified pins are cached without caching errors or other barangays', async () => {
  let calls = 0
  const fetchImpl = async () => { calls++; return json({ address: { city: 'Quezon City', suburb: 'North Fairview' } }) }
  await verifyDeliveryPin(14.72123, 121.06123, 'North Fairview', { fetchImpl })
  await verifyDeliveryPin(14.72123, 121.06123, 'North Fairview', { fetchImpl })
  assert.equal(calls, 1)
  await assert.rejects(verifyDeliveryPin(14.72123, 121.06123, 'Fairview', { fetchImpl }), /barangay/)
  assert.equal(calls, 4)
})

test('residential and display labels resolve to canonical barangays', async () => {
  assert.equal(await verifyDeliveryPin(14.72, 121.06, 'North Fairview', { useCache: false, fetchImpl: async () => json({ address: { city: 'Quezon City', residential: 'North Fairview' } }) }), 'North Fairview')
  assert.equal(await verifyDeliveryPin(14.72, 121.06, 'Fairview', { useCache: false, knownBarangays: ['Fairview', 'North Fairview'], fetchImpl: async () => json({ address: { city: 'Quezon City', suburb: 'North Fairview Subdivision' } }) }), 'North Fairview')
})

test('the backend resolves the actual barangay rather than trusting the selected name', async () => {
  const actual = await verifyDeliveryPin(14.72, 121.06, 'Fairview', { useCache: false, knownBarangays: ['Fairview', 'North Fairview'], fetchImpl: async () => json({ address: { city: 'Quezon City', suburb: 'North Fairview' } }) })
  assert.equal(actual, 'North Fairview')
})

test('administrative boundary lookup handles missing neighborhood names', async () => {
  const calls = []
  const actual = await verifyDeliveryPin(14.72, 121.06, '', { useCache: false, knownBarangays: ['North Fairview'], fetchImpl: async (url, options) => {
    calls.push({ url, options })
    if (calls.length === 1) return new Response('blocked', { status: 403 })
    if (calls.length === 2) return json({ features: [{ properties: { city: 'Quezon City', district: 'District 5' } }] })
    return json({ elements: [{ tags: { admin_level: '6', name: 'Quezon City' } }, { tags: { admin_level: '10', name: 'North Fairview' } }] })
  } })
  assert.equal(actual, 'North Fairview')
  assert.equal(calls[2].options.method, 'POST')
  assert.match(new URLSearchParams(calls[2].options.body).get('data'), /is_in\(14.72,121.06\)/)
})

test('barangay boundary alone cannot approve a pin outside Quezon City', async () => {
  await assert.rejects(verifyDeliveryPin(14.72, 121.06, 'North Fairview', { useCache: false, fetchImpl: async url => url.includes('interpreter')
    ? json({ elements: [{ tags: { admin_level: '6', name: 'Caloocan' } }, { tags: { admin_level: '10', name: 'North Fairview' } }] })
    : new Response('', { status: 403 }) }), /within Quezon City/)
})
