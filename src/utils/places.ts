/**
 * Google Places API utility functions for searching gyms and fitness centers
 */

export interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  formatted_phone_number?: string
  website?: string
  types?: string[]
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
}

export interface PlacesSearchResult {
  results: PlaceResult[]
  next_page_token?: string
  status: string
}

/**
 * Search for gyms using Google Places API Text Search
 * @param query - Search query (e.g., "gym in Toronto downtown")
 * @param apiKey - Google Maps API key
 * @param location - Optional location bias (lat, lng)
 * @param radius - Optional radius in meters
 * @returns Array of place results
 */
export const searchGyms = async (
  query: string,
  apiKey: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<PlaceResult[]> => {
  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&type=gym`
    
    if (location) {
      url += `&location=${location.lat},${location.lng}`
    }
    
    if (radius) {
      url += `&radius=${radius}`
    }

    console.log('🔍 Text Search URL:', url.replace(apiKey, 'API_KEY_HIDDEN'))
    const response = await fetch(url)
    const data: PlacesSearchResult = await response.json()

    console.log('🔍 Text Search response status:', data.status)
    
    if (data.status === 'OK') {
      console.log('✅ Text Search successful. Found', data.results?.length || 0, 'results')
      return data.results || []
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.log('⚠️ Text Search: No results found')
      return []
    }

    console.warn('❌ Places API text search failed:', data.status, data.error_message)
    return []
  } catch (error) {
    console.error('❌ Places API text search error:', error)
    return []
  }
}

/**
 * Search for gyms near a location using Nearby Search
 * @param location - Location coordinates (lat, lng)
 * @param radius - Search radius in meters (max 50000)
 * @param apiKey - Google Maps API key
 * @returns Array of place results
 */
export const searchGymsNearby = async (
  location: { lat: number; lng: number },
  radius: number,
  apiKey: string
): Promise<PlaceResult[]> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=gym&key=${apiKey}`
    console.log('🔍 Nearby Search URL:', url.replace(apiKey, 'API_KEY_HIDDEN'))

    const response = await fetch(url)
    const data: PlacesSearchResult = await response.json()

    console.log('🔍 Nearby Search response status:', data.status)
    
    if (data.status === 'OK') {
      console.log('✅ Nearby Search successful. Found', data.results?.length || 0, 'results')
      return data.results || []
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.log('⚠️ Nearby Search: No results found')
      return []
    }

    console.warn('❌ Places API nearby search failed:', data.status, data.error_message)
    return []
  } catch (error) {
    console.error('❌ Places API nearby search error:', error)
    return []
  }
}

/**
 * Get detailed information about a place using Place Details API
 * @param placeId - Google Place ID
 * @param apiKey - Google Maps API key
 * @returns Detailed place information
 */
export const getPlaceDetails = async (
  placeId: string,
  apiKey: string
): Promise<PlaceResult | null> => {
  try {
    const fields = [
      'name',
      'formatted_address',
      'geometry',
      'rating',
      'user_ratings_total',
      'formatted_phone_number',
      'website',
      'types',
      'opening_hours',
      'photos'
    ].join(',')

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.result) {
      return data.result as PlaceResult
    }

    console.warn('Place details failed:', data.status)
    return null
  } catch (error) {
    console.error('Place details error:', error)
    return null
  }
}

/**
 * Search for gyms in a specific area (e.g., "Toronto downtown")
 * This function first geocodes the location, then searches for gyms nearby
 * @param locationQuery - Location query (e.g., "Toronto downtown")
 * @param apiKey - Google Maps API key
 * @param searchRadius - Search radius in meters (default: 5000)
 * @returns Array of place results
 */
export const searchGymsInArea = async (
  locationQuery: string,
  apiKey: string,
  searchRadius: number = 5000
): Promise<PlaceResult[]> => {
  try {
    console.log('🔍 Searching gyms in area:', locationQuery)
    console.log('🔍 Search radius:', searchRadius, 'meters')
    
    // First, geocode the location to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${apiKey}`
    console.log('🔍 Geocoding URL:', geocodeUrl.replace(apiKey, 'API_KEY_HIDDEN'))
    
    const geocodeResponse = await fetch(geocodeUrl)
    const geocodeData = await geocodeResponse.json()
    
    console.log('🔍 Geocoding response status:', geocodeData.status)
    
    if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
      console.warn('❌ Geocoding failed for:', locationQuery, geocodeData.status, geocodeData.error_message)
      
      // Try Text Search as fallback
      console.log('🔄 Trying Text Search as fallback...')
      const textSearchQuery = `gym in ${locationQuery}`
      return await searchGyms(textSearchQuery, apiKey)
    }

    const location = geocodeData.results[0].geometry.location
    const locationCoords = { lat: location.lat, lng: location.lng }
    console.log('✅ Geocoding successful. Coordinates:', locationCoords)

    // Try Nearby Search first
    console.log('🔍 Trying Nearby Search...')
    const nearbyResults = await searchGymsNearby(locationCoords, searchRadius, apiKey)
    console.log('🔍 Nearby Search results:', nearbyResults.length)
    
    // If no results, try Text Search as fallback
    if (nearbyResults.length === 0) {
      console.log('🔄 No results from Nearby Search. Trying Text Search...')
      const textSearchQuery = `gym in ${locationQuery}`
      const textResults = await searchGyms(textSearchQuery, apiKey, locationCoords, searchRadius)
      console.log('🔍 Text Search results:', textResults.length)
      return textResults
    }
    
    return nearbyResults
  } catch (error) {
    console.error('❌ Error searching gyms in area:', error)
    return []
  }
}

/**
 * Convert PlaceResult to gym data format for database
 * @param place - Place result from Places API
 * @returns Gym data object
 */
export const placeToGymData = (place: PlaceResult) => {
  // Extract city and state from formatted_address
  const addressParts = place.formatted_address.split(',')
  const city = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : undefined
  const state = addressParts.length > 2 ? addressParts[addressParts.length - 1].trim() : undefined

  // Extract facilities from types
  const facilityKeywords = ['parking', 'shower', 'locker', 'pool', 'sauna', 'spa', 'cafe', 'wifi']
  const facilities = place.types
    ?.filter(type => facilityKeywords.some(keyword => type.toLowerCase().includes(keyword)))
    .map(type => {
      // Convert type to readable facility name
      if (type.includes('parking')) return 'Parking'
      if (type.includes('shower')) return 'Showers'
      if (type.includes('locker')) return 'Locker Room'
      if (type.includes('pool')) return 'Pool'
      if (type.includes('sauna')) return 'Sauna'
      if (type.includes('spa')) return 'Spa'
      if (type.includes('cafe')) return 'Cafe'
      if (type.includes('wifi')) return 'WiFi'
      return type
    })
    .filter((value, index, self) => self.indexOf(value) === index) || []

  return {
    name: place.name,
    address: place.formatted_address,
    city: city,
    state: state,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    phone: place.formatted_phone_number || undefined,
    website: place.website || undefined,
    description: place.rating
      ? `Rating: ${place.rating}/5 (${place.user_ratings_total || 0} reviews)`
      : undefined,
    facilities: facilities.length > 0 ? facilities : undefined
  }
}

