import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import { supabase } from '../lib/supabase'
import { calculateDistance, formatDistance } from '../utils/distance'

interface Gym {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  description?: string
  facilities?: string[]
  average_rating?: number
  total_reviews?: number
}

const mapContainerStyle = {
  width: '100%',
  height: '500px'
}

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
}

const GymLocator = () => {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    loadGyms()
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(location)
          setMapCenter(location)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const loadGyms = async () => {
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      // Get ratings for each gym
      const gymsWithRatings = await Promise.all(
        (data || []).map(async (gym) => {
          const { data: reviewsData } = await supabase
            .from('gym_reviews')
            .select('rating')
            .eq('gym_id', gym.id)

          const ratings = reviewsData?.map(r => r.rating) || []
          const averageRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0

          return {
            ...gym,
            average_rating: averageRating,
            total_reviews: ratings.length
          }
        })
      )

      setGyms(gymsWithRatings)
    } catch (error) {
      console.error('Error loading gyms:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGyms = gyms.filter(gym =>
    gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort gyms by distance if user location is available
  const sortedGyms = useMemo(() => {
    if (!userLocation) return filteredGyms

    return [...filteredGyms].sort((a, b) => {
      if (!a.latitude || !a.longitude) return 1
      if (!b.latitude || !b.longitude) return -1

      const distanceA = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        a.latitude,
        a.longitude
      )
      const distanceB = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        b.latitude,
        b.longitude
      )

      return distanceA - distanceB
    })
  }, [filteredGyms, userLocation])

  const onMapLoad = useCallback(() => {
    // Map is loaded
  }, [])

  if (loading) {
    return (
      <div className="section-container py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="section-container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gym Locator</h1>
        <p className="text-gray-600">Find gyms near you and connect with members</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search gyms by name, address, or city..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gym List */}
        <div className="space-y-4">
          {filteredGyms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500">No gyms found.</p>
            </div>
          ) : (
            sortedGyms.map((gym) => {
              const distance = userLocation && gym.latitude && gym.longitude
                ? formatDistance(calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    gym.latitude,
                    gym.longitude
                  ))
                : null

              return (
              <Link
                key={gym.id}
                to={`/gyms/${gym.id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{gym.name}</h3>
                  {gym.average_rating && gym.average_rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold">{gym.average_rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">({gym.total_reviews})</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{gym.address}</p>
                {gym.city && gym.state && (
                  <p className="text-sm text-gray-500 mb-1">{gym.city}, {gym.state}</p>
                )}
                {distance && (
                  <p className="text-sm text-primary-600 font-semibold mb-3">
                    📍 {distance} away
                  </p>
                )}
                {gym.facilities && gym.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {gym.facilities.slice(0, 3).map((facility, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {facility}
                      </span>
                    ))}
                    {gym.facilities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{gym.facilities.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
              )
            })
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {googleMapsApiKey ? (
            <LoadScript googleMapsApiKey={googleMapsApiKey}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={userLocation ? 12 : 10}
                onLoad={onMapLoad}
              >
                {sortedGyms.map((gym) => {
                  if (!gym.latitude || !gym.longitude) return null
                  return (
                    <Marker
                      key={gym.id}
                      position={{ lat: gym.latitude, lng: gym.longitude }}
                      onClick={() => setSelectedGym(gym)}
                    />
                  )
                })}
                {userLocation && (
                  <Marker
                    position={userLocation}
                    icon={{
                      path: window.google?.maps?.SymbolPath?.CIRCLE || '',
                      scale: 8,
                      fillColor: '#4285F4',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2
                    }}
                  />
                )}
                {selectedGym && selectedGym.latitude && selectedGym.longitude && (
                  <InfoWindow
                    position={{ lat: selectedGym.latitude, lng: selectedGym.longitude }}
                    onCloseClick={() => setSelectedGym(null)}
                  >
                    <div className="p-2">
                      <h3 className="font-bold text-gray-900 mb-1">{selectedGym.name}</h3>
                      <p className="text-sm text-gray-600">{selectedGym.address}</p>
                      <Link
                        to={`/gyms/${selectedGym.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                      >
                        View Details →
                      </Link>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-gray-100">
              <div className="text-center p-6">
                <p className="text-gray-600 mb-2">Google Maps API key not configured</p>
                <p className="text-sm text-gray-500">
                  Add VITE_GOOGLE_MAPS_API_KEY to your .env file
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GymLocator

