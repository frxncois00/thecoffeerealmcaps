import React, { useEffect, useRef, useState, useCallback } from 'react'
import { sanitizeAddressText } from '../../utils/inputValidation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Navigation,
  Search,
  Check,
  AlertTriangle,
  Loader2,
  Info,
  X,
  MousePointerClick,
} from 'lucide-react'
import {
  TCR_STORE_COORDS,
  searchPhLocations,
  reverseGeocodeCoords,
} from '../../services/locationService'

// Custom Coffee Realm Pin Icon for Leaflet
const createCoffeePinIcon = () =>
  L.divIcon({
    className: 'tcr-custom-map-pin',
    html: `
      <div class="tcr-pin-wrapper">
        <div class="tcr-pin-pulse"></div>
        <div class="tcr-pin-body">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
            <line x1="6" y1="2" x2="6" y2="4"></line>
            <line x1="10" y1="2" x2="10" y2="4"></line>
            <line x1="14" y1="2" x2="14" y2="4"></line>
          </svg>
        </div>
        <div class="tcr-pin-tip"></div>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -42],
  })

const hasExactAddressDetails = value =>
  /(?:\b\d+[a-z]?(?:[-/]\d+[a-z]?)?\b|\b(?:house|bldg|building|block|blk|lot|unit|room|floor|flr)\b)/i.test(String(value || ''))

const exactPremisePrefix = value => {
  const text = String(value || '').trim()
  const labeled = text.match(/^((?:(?:house|bldg|building|block|blk|lot|unit|room|floor|flr)\.?\s*[a-z0-9-]+(?:\s+|,\s*)?)+)/i)
  if (labeled) return labeled[1].trim().replace(/,$/, '')
  return text.match(/^(\d+[a-z]?(?:[-/]\d+[a-z]?)?)(?=\s|,)/i)?.[1] || ''
}

const withPremise = (premise, street) => {
  const cleanStreet = String(street || '').trim()
  if (!premise || !cleanStreet || cleanStreet.toLowerCase().startsWith(premise.toLowerCase())) return cleanStreet
  return `${premise}, ${cleanStreet}`
}

const withBarangay = (street, barangay) => {
  const cleanStreet = String(street || '').trim().replace(/,?\s*(?:brgy\.?|barangay)\s+[^,]+$/i, '')
  return [cleanStreet, barangay && `Brgy. ${barangay}`].filter(Boolean).join(', ')
}

export default function DeliveryLocationPicker({
  address,
  initialAddress = '',
  initialCoordinates,
  barangay,
  selectedArea,
  onAddressChange,
  onBarangayChange,
  onCoordinatesChange,
  onCoordinatesPreview,
  afterSearch,
}) {
  const mapContainerRef = useRef(null)
  const initialCoordinatesRef = useRef(initialCoordinates)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const handlePinMoveRef = useRef(null)
  const coordinatesPreviewRef = useRef(onCoordinatesPreview)
  const isInternalUpdate = useRef(false)

  const [searchQuery, setSearchQuery] = useState(address || '')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeResultIndex, setActiveResultIndex] = useState(-1)
  const [locationNotice, setLocationNotice] = useState(null)
  const [isOutOfQc, setIsOutOfQc] = useState(false)
  const [holdIndicator, setHoldIndicator] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  const searchTimeoutRef = useRef(null)
  const holdTimerRef = useRef(null)
  const touchStartRef = useRef(null)
  const suppressNextMapClickRef = useRef(false)
  const lastInitialAddressRef = useRef('')
  const locationRequestRef = useRef(0)

  // Initialize query from existing address on mount
  useEffect(() => {
    if (address && !searchQuery) {
      setSearchQuery(address)
    }
  }, [address])

  // Handle Coordinates / Pin Move -> Reverse Geocode
  const handlePinMove = useCallback(
    async (lat, lng, fly = false) => {
      const requestId = ++locationRequestRef.current
      if (fly && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 })
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      }

      // Keep checkout distance and fee responsive while the address lookup runs.
      onCoordinatesChange?.({ lat, lng })
      setIsReverseGeocoding(true)

      const result = await reverseGeocodeCoords(lat, lng)
      if (requestId !== locationRequestRef.current) return
      setIsReverseGeocoding(false)

      if (result) {
        const isQc = result.isQuezonCity
        setIsOutOfQc(!isQc)

        if (!isQc) {
          setLocationNotice({
            type: 'error',
            message: 'We do not deliver outside Quezon City for now. Please choose an address within Quezon City.',
          })
          onBarangayChange('')
        } else {
          onCoordinatesChange?.({ lat, lng })
          setLocationNotice(null)
          if (result.matchedArea) {
            onBarangayChange(result.matchedArea.barangay)
          } else if (result.barangay) {
            onBarangayChange(result.barangay)
          } else {
            onBarangayChange('')
          }
        }

        const geocodedStreet = String(result.street || '').trim()
        const sameStreet = geocodedStreet && searchQuery.toLowerCase().includes(geocodedStreet.toLowerCase())
        const premise = sameStreet ? exactPremisePrefix(searchQuery) : ''
        const formattedAddress = withBarangay(withPremise(premise, result.street), result.barangay)

        if (formattedAddress) {
          isInternalUpdate.current = true
          setSearchQuery(formattedAddress)
          onAddressChange(formattedAddress)
        } else if (result.displayName) {
          const shortAddress = result.displayName.split(',').slice(0, 3).join(', ')
          isInternalUpdate.current = true
          setSearchQuery(shortAddress)
          onAddressChange(shortAddress)
        }
      }
    },
    [onAddressChange, onBarangayChange, onCoordinatesChange, searchQuery]
  )

  useEffect(() => {
    handlePinMoveRef.current = handlePinMove
  }, [handlePinMove])

  useEffect(() => {
    coordinatesPreviewRef.current = onCoordinatesPreview
  }, [onCoordinatesPreview])

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialLat = initialCoordinatesRef.current?.lat ?? TCR_STORE_COORDS.lat
    const initialLng = initialCoordinatesRef.current?.lng ?? TCR_STORE_COORDS.lng

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    })

    // Clean OpenStreetMap Tile Layer
    const primaryTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map)
    let tileErrorCount = 0
    let fallbackTiles = null
    primaryTiles.on('tileerror', () => {
      tileErrorCount += 1
      if (tileErrorCount < 3 || fallbackTiles) return
      map.removeLayer(primaryTiles)
      fallbackTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
        crossOrigin: true,
      }).addTo(map)
    })

    // Store marker
    const pinIcon = createCoffeePinIcon()
    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true,
      autoPan: true,
    }).addTo(map)

    marker.bindPopup('<b>Delivery Pin</b><br>Click anywhere on the map or drag this pin!').openPopup()

    let dragLookupTimer
    marker.on('drag', () => {
      const pos = marker.getLatLng()
      coordinatesPreviewRef.current?.({ lat: pos.lat, lng: pos.lng })
      window.clearTimeout(dragLookupTimer)
      dragLookupTimer = window.setTimeout(() => {
        handlePinMoveRef.current?.(pos.lat, pos.lng, false)
      }, 450)
    })

    // Resolve the final address immediately when dragging stops.
    marker.on('dragend', () => {
      window.clearTimeout(dragLookupTimer)
      const pos = marker.getLatLng()
      handlePinMoveRef.current?.(pos.lat, pos.lng, false)
    })

    // Instant Map Click Listener (Click or tap anywhere to place pin)
    map.on('click', e => {
      if (suppressNextMapClickRef.current) {
        suppressNextMapClickRef.current = false
        return
      }
      const { lat, lng } = e.latlng
      handlePinMoveRef.current?.(lat, lng, false)
    })

    // Keep desktop clicks immediate, but require a short hold on touch
    // devices so a normal swipe/scroll does not move the delivery pin.
    const mapElement = mapContainerRef.current
    const clearTouchHold = () => {
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
      touchStartRef.current = null
    }
    const onTouchStart = event => {
      const touch = event.touches?.[0]
      if (!touch) return
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      const point = map.mouseEventToLatLng(touch)
      holdTimerRef.current = window.setTimeout(() => {
        suppressNextMapClickRef.current = true
        handlePinMoveRef.current?.(point.lat, point.lng, true)
        clearTouchHold()
      }, 650)
    }
    const onTouchMove = event => {
      const touch = event.touches?.[0]
      const start = touchStartRef.current
      if (!touch || !start) return clearTouchHold()
      if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 12) {
        clearTouchHold()
      }
    }
    mapElement?.addEventListener('touchstart', onTouchStart, { passive: true })
    mapElement?.addEventListener('touchmove', onTouchMove, { passive: true })
    mapElement?.addEventListener('touchend', clearTouchHold, { passive: true })
    mapElement?.addEventListener('touchcancel', clearTouchHold, { passive: true })

    mapInstanceRef.current = map
    markerRef.current = marker
    setMapReady(true)

    // Invalidate size after layout render
    setTimeout(() => {
      map.invalidateSize()
    }, 200)
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => map.invalidateSize({ animate: false }))
      : null
    resizeObserver?.observe(mapContainerRef.current)

    return () => {
      window.clearTimeout(dragLookupTimer)
      resizeObserver?.disconnect()
      clearTouchHold()
      mapElement?.removeEventListener('touchstart', onTouchStart)
      mapElement?.removeEventListener('touchmove', onTouchMove)
      mapElement?.removeEventListener('touchend', clearTouchHold)
      mapElement?.removeEventListener('touchcancel', clearTouchHold)
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      setMapReady(false)
    }
  }, [])

  // Perform Address Search (Debounced)
  const handleSearchInput = value => {
    locationRequestRef.current += 1
    onCoordinatesChange?.(null)
    const clean = sanitizeAddressText(value, 200)
    setSearchQuery(clean)
    onAddressChange(clean)
    onBarangayChange('')
    setShowDropdown(true)
    setActiveResultIndex(-1)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!clean || clean.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchPhLocations(clean)
      setSearchResults(results)
      setIsSearching(false)
    }, 350)
  }

  // Select Search Result
  const selectResult = (result, { preserveAddress = false } = {}) => {
    locationRequestRef.current += 1
    onCoordinatesChange?.(null)
    setShowDropdown(false)
    const detailedInput = hasExactAddressDetails(searchQuery) ? searchQuery : ''
    const selectedStreet = withBarangay(
      detailedInput || result.street || result.displayName.split(',')[0],
      result.isQuezonCity ? result.barangay : ''
    )
    if (!preserveAddress) {
      setSearchQuery(selectedStreet)
      onAddressChange(selectedStreet)
    }

    if (result.isQuezonCity && result.matchedArea) {
      onBarangayChange(result.matchedArea.barangay)
    } else if (result.isQuezonCity && result.barangay) {
      onBarangayChange(result.barangay)
    } else {
      onBarangayChange('')
    }

    if (!result.isQuezonCity) {
      setIsOutOfQc(true)
      setLocationNotice({
        type: 'error',
        message: 'We do not deliver outside Quezon City for now. Please choose an address within Quezon City.',
      })
    } else {
      setIsOutOfQc(false)
      setLocationNotice(null)
    }

    if (Number.isFinite(result.lat) && Number.isFinite(result.lng)) {
      if (result.isQuezonCity) onCoordinatesChange?.({ lat: result.lat, lng: result.lng })
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([result.lat, result.lng], 16, { duration: 1.0 })
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([result.lat, result.lng])
        const popupText = result.isQuezonCity && (result.matchedArea || result.barangay)
          ? `<b>${selectedStreet}</b><br>Brgy. ${result.matchedArea?.barangay || result.barangay}`
          : `<b>${selectedStreet}</b><br><span style="color:#e53e3e;font-weight:600;">Outside Delivery Area (QC Only)</span>`
        markerRef.current.bindPopup(popupText).openPopup()
      }
    }
  }

  // Saved addresses are stored as text, so resolve them once when this picker
  // opens or when checkout switches to a different saved address.
  useEffect(() => {
    const cleanAddress = String(initialAddress || '').trim()
    if (!cleanAddress) {
      lastInitialAddressRef.current = ''
      return undefined
    }
    if (cleanAddress === lastInitialAddressRef.current || !mapInstanceRef.current) return undefined
    lastInitialAddressRef.current = cleanAddress
    setSearchQuery(address || cleanAddress)
    if (Number.isFinite(initialCoordinatesRef.current?.lat) && Number.isFinite(initialCoordinatesRef.current?.lng)) return undefined
    let active = true
    searchPhLocations(cleanAddress).then(results => {
      if (!active) return
      const result = results.find(item => item.isQuezonCity) || results[0]
      if (result) selectResult(result, { preserveAddress: true })
    })
    return () => { active = false }
  }, [address, initialAddress, mapReady])

  // Use My Current Location (Browser GPS)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationNotice({
        type: 'error',
        message: 'Geolocation is not supported by your browser.',
      })
      return
    }

    setIsLocating(true)
    setLocationNotice(null)

    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false)
        const { latitude, longitude } = pos.coords
        handlePinMoveRef.current?.(latitude, longitude, true)
      },
      err => {
        setIsLocating(false)
        let msg = 'Could not access your location. Please check your browser permissions or pin manually on the map.'
        if (err.code === 1) {
          msg = 'Location access was denied. Please enable location permissions or pin your address on the map.'
        }
        setLocationNotice({ type: 'warning', message: msg })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="delivery-location-picker">
      {/* Smart Search Bar */}
      <div className="location-search-wrapper">
        <label htmlFor="delivery-address-search" className="location-search-label">
          <span>House no. / Street / Village & Barangay</span>
          <span className="location-qc-badge">Quezon City Only</span>
        </label>
        <div className="location-search-row">
          <div className="location-search-input-box">
            <span className="location-search-icon">
              {isSearching ? (
                <Loader2 className="spinning" size={18} />
              ) : (
                <Search size={18} />
              )}
            </span>
            <input
              id="delivery-address-search"
              type="text"
              value={searchQuery}
              onChange={e => handleSearchInput(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true)
              }}
              placeholder="Search your exact address"
              autoComplete="off"
              required
              maxLength={200}
            />
            {searchQuery && (
              <button
                type="button"
                className="location-clear-btn"
                onClick={() => {
                  setSearchQuery('')
                  locationRequestRef.current += 1
                  onCoordinatesChange?.(null)
                  onBarangayChange('')
                  onAddressChange('')
                  setSearchResults([])
                  setShowDropdown(false)
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="button"
            className={`location-locate-me-btn ${isLocating ? 'is-locating' : ''}`}
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            title="Use current GPS location"
          >
            {isLocating ? (
              <>
                <Loader2 className="spinning" size={15} />
                <span>Locating…</span>
              </>
            ) : (
              <>
                <Navigation size={15} />
                <span>Use Current Location</span>
              </>
            )}
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        {showDropdown && (
          <div className="location-dropdown" role="listbox">
            {searchResults.length > 0 ? searchResults.map((res, idx) => (
              <button
                key={res.id || idx}
                type="button"
                className={`location-dropdown-item ${
                  idx === activeResultIndex ? 'is-active' : ''
                } ${!res.isQuezonCity ? 'is-outside-qc' : ''}`}
                onMouseDown={e => e.preventDefault()}
                onClick={() => selectResult(res)}
              >
                <div className="location-item-icon">
                  <MapPin size={16} />
                </div>
                <div className="location-item-text">
                  <div className="location-item-title">
                    <strong>{res.street || res.name}</strong>
                    {res.isQuezonCity ? (
                      <span className="tag-qc">QC Available</span>
                    ) : (
                      <span className="tag-outside">Outside QC</span>
                    )}
                  </div>
                  <small className="location-item-desc">{res.displayName}</small>
                </div>
              </button>
            )) : !isSearching && searchQuery.trim().length >= 2 && (
              <div className="location-dropdown-empty">
                <strong>No exact Quezon City match</strong>
                <small>Keep your complete address, then place the pin on the map.</small>
              </div>
            )}
          </div>
        )}
      </div>

      {afterSearch}

      {/* Out of Delivery Area Notice */}
      {locationNotice && (
        <div
          className={`location-alert-card ${
            locationNotice.type === 'error' ? 'is-error' : 'is-warning'
          }`}
          role="alert"
        >
          <AlertTriangle size={18} />
          <div>
            <strong>
              {locationNotice.type === 'error'
                ? 'Delivery Area Notice'
                : 'Location Notice'}
            </strong>
            <p>{locationNotice.message}</p>
          </div>
        </div>
      )}

      {/* Interactive Map Box */}
      <div className="tcr-map-card">
        <div className="tcr-map-header">
          <div className="tcr-map-title">
            <MapPin size={16} />
            <span>Click the map, or press and hold on touch devices to pin your address</span>
          </div>
          {isReverseGeocoding && (
            <span className="tcr-map-syncing">
              <Loader2 className="spinning" size={14} />
              Updating address…
            </span>
          )}
        </div>

        <div className="tcr-map-viewport-container">
          <div ref={mapContainerRef} className="tcr-leaflet-map" />
        </div>

        {/* Selected Location Summary Bar */}
        <div className="tcr-map-footer">
          <div className="tcr-map-footer-info">
            <span className="tcr-footer-label">Selected Delivery Area:</span>
            {selectedArea ? (
              <div className="tcr-area-status success">
                <Check size={14} />
                <strong>Brgy. {selectedArea.barangay}</strong>
                <span className="tcr-zone-pill">
                  {selectedArea.estimatedTime}
                </span>
              </div>
            ) : barangay ? (
              <div className="tcr-area-status warning">
                <Info size={14} />
                <span>Brgy. {barangay} (Outside delivery area)</span>
              </div>
            ) : (
              <div className="tcr-area-status empty">
                <span>Click the map, drag the pin, or search your street above</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
