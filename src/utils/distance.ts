/**
 * Distance calculation utilities using Haversine formula
 */

/**
 * Calculate the distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculate the distance between two coordinates in miles
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in miles
 */
export const calculateDistanceMiles = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  return calculateDistance(lat1, lon1, lat2, lon2) * 0.621371
}

/**
 * Format distance for display
 * @param distanceKm - Distance in kilometers
 * @param unit - 'km' or 'mi'
 * @returns Formatted distance string
 */
export const formatDistance = (distanceKm: number, unit: 'km' | 'mi' = 'km'): string => {
  if (unit === 'mi') {
    const miles = distanceKm * 0.621371
    if (miles < 1) {
      return `${Math.round(miles * 5280)} ft`
    }
    return `${miles.toFixed(1)} mi`
  }
  
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }
  return `${distanceKm.toFixed(1)} km`
}




