import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isWithinQuezonCity,
  matchBarangay,
  formatStreetAddress,
} from '../src/services/locationService.js'

describe('Quezon City location restriction and barangay matching', () => {
  it('identifies Quezon City locations correctly', () => {
    // Standard QC address objects from OSM
    assert.equal(
      isWithinQuezonCity(
        { quarter: 'North Fairview', city: 'Quezon City', region: 'Metro Manila' },
        'North Fairview, Quezon City, Metro Manila, Philippines'
      ),
      true
    )

    assert.equal(
      isWithinQuezonCity(
        { quarter: 'Batasan Hills', city: 'Quezon City', region: 'Metro Manila' },
        'Batasan Hills, 2nd District, Quezon City, Metro Manila, Philippines'
      ),
      true
    )

    assert.equal(
      isWithinQuezonCity(
        { suburb: 'Diliman', quarter: 'Bagong Pag-asa', city: 'Quezon City' },
        'TriNoma, North Avenue, Bagong Pag-asa, Diliman, Quezon City, Metro Manila'
      ),
      true
    )

    assert.equal(
      isWithinQuezonCity(
        { road: 'Commonwealth Avenue', quarter: 'Holy Spirit', city: 'Quezon City' },
        'Commonwealth Avenue, Holy Spirit, Quezon City, Philippines'
      ),
      true
    )
  })

  it('strictly rejects locations outside Quezon City even if names resemble QC barangays', () => {
    // San Antonio in Pasig
    assert.equal(
      isWithinQuezonCity(
        { quarter: 'San Antonio', city_district: 'Pasig First District', city: 'Pasig', region: 'Metro Manila' },
        'San Antonio, Pasig First District, Pasig, Metro Manila, Philippines',
        { lat: 14.583, lng: 121.061 }
      ),
      false
    )

    // Santa Cruz in Manila
    assert.equal(
      isWithinQuezonCity(
        { suburb: 'Santa Cruz', city_district: 'Third District', city: 'Manila', region: 'Metro Manila' },
        'Santa Cruz, Third District, Manila, Metro Manila, Philippines',
        { lat: 14.599, lng: 120.980 }
      ),
      false
    )

    // San Jose in SJDM Bulacan
    assert.equal(
      isWithinQuezonCity(
        { city: 'San Jose del Monte', state: 'Bulacan', region: 'Central Luzon' },
        'San Jose del Monte, Bulacan, Central Luzon, Philippines',
        { lat: 14.810, lng: 121.047 }
      ),
      false
    )

    // Bonifacio Global City in Taguig
    assert.equal(
      isWithinQuezonCity(
        { quarter: 'Bonifacio Global City', city: 'Taguig', region: 'Metro Manila' },
        'BGC, Taguig, Metro Manila, Philippines',
        { lat: 14.551, lng: 121.058 }
      ),
      false
    )

    // Ayala Ave in Makati
    assert.equal(
      isWithinQuezonCity(
        { road: 'Ayala Avenue', quarter: 'Bel-Air', city: 'Makati', region: 'Metro Manila' },
        'Ayala Avenue, Bel-Air, Makati, Metro Manila, Philippines',
        { lat: 14.555, lng: 121.023 }
      ),
      false
    )

    // Novaliches part of Caloocan
    assert.equal(
      isWithinQuezonCity(
        { quarter: 'Bagumbong', city: 'Caloocan', region: 'Metro Manila' },
        'Saint Benedict School Novaliches, Bagumbong, Caloocan, Metro Manila',
        { lat: 14.760, lng: 121.027 }
      ),
      false
    )

    // Rodriguez / Montalban, Rizal
    assert.equal(
      isWithinQuezonCity(
        { municipality: 'Rodriguez', state: 'Rizal', region: 'Calabarzon' },
        'Rodriguez, Rizal, Philippines',
        { lat: 14.717, lng: 121.155 }
      ),
      false
    )

    // San Mateo, Rizal
    assert.equal(
      isWithinQuezonCity(
        { municipality: 'San Mateo', state: 'Rizal', region: 'Calabarzon' },
        'San Mateo, Rizal, Philippines',
        { lat: 14.697, lng: 121.121 }
      ),
      false
    )

    // Antipolo, Rizal
    assert.equal(
      isWithinQuezonCity(
        { city: 'Antipolo', state: 'Rizal', region: 'Calabarzon' },
        'Antipolo, Rizal, Philippines',
        { lat: 14.587, lng: 121.176 }
      ),
      false
    )

    // Quezon Avenue in Manila / outside QC
    assert.equal(
      isWithinQuezonCity(
        { road: 'Quezon Boulevard', quarter: 'Quiapo', city: 'Manila' },
        'Quezon Boulevard, Quiapo, Manila, Metro Manila, Philippines',
        { lat: 14.598, lng: 120.986 }
      ),
      false
    )
  })

  it('rejects coordinates far outside Quezon City boundaries', () => {
    // Cebu City coordinates
    assert.equal(
      isWithinQuezonCity(
        {},
        'Cebu City',
        { lat: 10.3157, lng: 123.8854 }
      ),
      false
    )

    // Davao City coordinates
    assert.equal(
      isWithinQuezonCity(
        {},
        'Davao City',
        { lat: 7.1907, lng: 125.4553 }
      ),
      false
    )

    // Baguio City coordinates
    assert.equal(
      isWithinQuezonCity(
        {},
        'Baguio City',
        { lat: 16.4023, lng: 120.5960 }
      ),
      false
    )

    // Cavite coordinates
    assert.equal(
      isWithinQuezonCity(
        {},
        'Bacoor, Cavite',
        { lat: 14.4124, lng: 120.9422 }
      ),
      false
    )
  })

  it('matchBarangay matches valid QC barangays and returns null for outside locations', () => {
    // Valid QC barangay
    const qcResult = matchBarangay(
      'North Fairview, Quezon City',
      { suburb: 'North Fairview', city: 'Quezon City' }
    )
    assert.ok(qcResult)
    assert.equal(qcResult.barangay, 'North Fairview')
    assert.equal(qcResult.zone, 'Zone 1')

    // Pasig San Antonio must return null (NOT match QC San Antonio)
    const pasigResult = matchBarangay(
      'San Antonio, Pasig City',
      { quarter: 'San Antonio', city: 'Pasig' }
    )
    assert.equal(pasigResult, null)

    // Manila Santa Cruz must return null (NOT match QC Santa Cruz)
    const manilaResult = matchBarangay(
      'Santa Cruz, Manila',
      { suburb: 'Santa Cruz', city: 'Manila' }
    )
    assert.equal(manilaResult, null)

    // SJDM Bulacan must return null (NOT match QC San Jose)
    const sjdmResult = matchBarangay(
      'San Jose del Monte, Bulacan',
      { city: 'San Jose del Monte', state: 'Bulacan' }
    )
    assert.equal(sjdmResult, null)
  })

  it('formatStreetAddress formats building, road, and residential details', () => {
    const formatted = formatStreetAddress({
      house_number: 'Lot 1 Block 210',
      road: 'Mark Street',
      residential: 'North Fairview',
    })
    assert.equal(formatted, 'Lot 1 Block 210, Mark Street, North Fairview')
  })
})
