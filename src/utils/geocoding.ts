/**
 * Geocoding utility functions for converting addresses to coordinates
 */

export interface GeocodeResult {
  lat: number
  lng: number
  formatted_address?: string
}

/**
 * Convert an address to coordinates using Google Geocoding API
 * @param address - The address to geocode
 * @param apiKey - Google Maps API key
 * @returns Coordinates or null if geocoding fails
 */
export const geocodeAddress = async (
  address: string,
  apiKey: string
): Promise<GeocodeResult | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: data.results[0].formatted_address
      }
    }

    console.warn('Geocoding failed:', data.status, data.error_message)
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Batch geocode multiple addresses
 * @param addresses - Array of addresses to geocode
 * @param apiKey - Google Maps API key
 * @returns Array of geocode results (null for failed addresses)
 */
export const geocodeAddresses = async (
  addresses: string[],
  apiKey: string
): Promise<(GeocodeResult | null)[]> => {
  // Geocoding API has rate limits, so we'll process sequentially with a small delay
  const results: (GeocodeResult | null)[] = []
  
  for (const address of addresses) {
    const result = await geocodeAddress(address, apiKey)
    results.push(result)
    
    // Small delay to avoid rate limiting (50 requests per second limit)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

/**
 * Reverse geocode: Convert coordinates to address
 * @param lat - Latitude
 * @param lng - Longitude
 * @param apiKey - Google Maps API key
 * @returns Formatted address or null
 */
export const reverseGeocode = async (
  lat: number,
  lng: number,
  apiKey: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    )
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address
    }

    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}




