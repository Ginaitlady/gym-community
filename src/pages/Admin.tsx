import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'
import { geocodeAddress } from '../utils/geocoding'
import { placeToGymData, PlaceResult } from '../utils/places'
import { LoadScript } from '@react-google-maps/api'

interface Post {
  id: string
  title: string
  content: string
  created_at: string
  is_deleted: boolean
  user?: {
    first_name: string
    last_name: string
  }
}

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
  created_at: string
}

const Admin = () => {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'gyms'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [gyms, setGyms] = useState<Gym[]>([])
  
  // Gym form state
  const [newGym, setNewGym] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    website: '',
    description: '',
    facilities: [] as string[],
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  })
  const [facilityInput, setFacilityInput] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Places API search state
  const [searchQuery, setSearchQuery] = useState('Toronto downtown')
  const [searchRadius, setSearchRadius] = useState(5000)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([])
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)
  const [isPlacesLoaded, setIsPlacesLoaded] = useState(false)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      if (activeTab === 'posts') {
        loadPosts()
      } else if (activeTab === 'gyms') {
        loadGyms()
      }
    }
  }, [currentUser, activeTab])

  const checkAdminAccess = async () => {
    try {
      const user = await api.getCurrentUser()
      console.log('🔍 Admin Access Check - Current User:', user)
      console.log('🔍 User Role:', user?.role)
      
      if (!user) {
        console.error('❌ No user found - redirecting to home')
        window.location.href = '/'
        return
      }
      
      if (user.role !== 'admin') {
        console.error('❌ User role is not admin. Current role:', user.role)
        console.error('❌ Redirecting to home')
        window.location.href = '/'
        return
      }
      
      console.log('✅ Admin access granted')
      setCurrentUser(user)
    } catch (error) {
      console.error('❌ Error checking admin access:', error)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const loadGyms = async () => {
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGyms(data || [])
    } catch (error) {
      console.error('Error loading gyms:', error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error

      loadPosts()
    } catch (error: any) {
      console.error('Error deleting post:', error)
      alert(error.message || 'Failed to delete post')
    }
  }

  const handleGeocodeAddress = async () => {
    if (!newGym.address) {
      alert('Please enter an address')
      return
    }

    setIsGeocoding(true)
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      alert('Google Maps API key is not configured')
      setIsGeocoding(false)
      return
    }

    try {
      const fullAddress = `${newGym.address}${newGym.city ? `, ${newGym.city}` : ''}${newGym.state ? `, ${newGym.state}` : ''}`
      const result = await geocodeAddress(fullAddress, apiKey)
      
      if (result) {
        setNewGym(prev => ({
          ...prev,
          latitude: result.lat,
          longitude: result.lng
        }))
        alert(`Coordinates retrieved successfully!\nLatitude: ${result.lat.toFixed(6)}, Longitude: ${result.lng.toFixed(6)}`)
      } else {
        alert('Address not found. Please enter coordinates manually.')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      alert('Error converting address to coordinates.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleAddFacility = () => {
    if (facilityInput.trim() && !newGym.facilities.includes(facilityInput.trim())) {
      setNewGym(prev => ({
        ...prev,
        facilities: [...prev.facilities, facilityInput.trim()]
      }))
      setFacilityInput('')
    }
  }

  const handleRemoveFacility = (facility: string) => {
    setNewGym(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility)
    }))
  }

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newGym.name || !newGym.address) {
      alert('Gym name and address are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('gyms')
        .insert({
          name: newGym.name,
          address: newGym.address,
          city: newGym.city || null,
          state: newGym.state || null,
          latitude: newGym.latitude || null,
          longitude: newGym.longitude || null,
          phone: newGym.phone || null,
          website: newGym.website || null,
          description: newGym.description || null,
          facilities: newGym.facilities.length > 0 ? newGym.facilities : null
        })

      if (error) throw error

      // Reset form
      setNewGym({
        name: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        website: '',
        description: '',
        facilities: [],
        latitude: undefined,
        longitude: undefined
      })
      setFacilityInput('')
      
      alert('Gym added successfully!')
      loadGyms()
    } catch (error: any) {
      console.error('Error creating gym:', error)
      alert(error.message || 'Failed to add gym.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGym = async (gymId: string) => {
    if (!confirm('Are you sure you want to delete this gym?')) return

    try {
      const { error } = await supabase
        .from('gyms')
        .delete()
        .eq('id', gymId)

      if (error) throw error

      loadGyms()
      alert('Gym deleted successfully.')
    } catch (error: any) {
      console.error('Error deleting gym:', error)
      alert(error.message || 'Failed to delete gym.')
    }
  }

  const handleSearchGyms = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a location to search')
      return
    }

    if (!isPlacesLoaded || !placesServiceRef.current || !geocoderRef.current) {
      alert('Google Maps Places Library is still loading. Please try again in a moment.')
      return
    }

    setIsSearching(true)
    setSearchResults([])
    setSelectedPlaces(new Set())

    try {
      console.log('🔍 Starting gym search...')
      console.log('🔍 Search query:', searchQuery)
      console.log('🔍 Search radius:', searchRadius)

      // Step 1: Geocode the location
      const geocodeResult = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { address: searchQuery },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results[0])
            } else {
              reject(new Error(`Geocoding failed: ${status}`))
            }
          }
        )
      })

      const location = geocodeResult.geometry.location
      const locationCoords = { lat: location.lat(), lng: location.lng() }
      console.log('✅ Geocoding successful. Coordinates:', locationCoords)

      // Step 2: Search for gyms nearby
      const nearbyResults = await new Promise<PlaceResult[]>((resolve) => {
        const request: google.maps.places.PlaceSearchRequest = {
          location: locationCoords,
          radius: searchRadius,
          type: 'gym'
        }

        placesServiceRef.current!.nearbySearch(request, (results, status) => {
          if (status === 'OK' && results) {
            console.log('✅ Nearby Search successful. Found', results.length, 'results')
            const placeResults: PlaceResult[] = results.map(place => ({
              place_id: place.place_id || '',
              name: place.name || '',
              formatted_address: place.vicinity || place.formatted_address || '',
              geometry: {
                location: {
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0
                }
              },
              rating: place.rating,
              user_ratings_total: place.user_ratings_total,
              formatted_phone_number: place.formatted_phone_number,
              website: place.website,
              types: place.types
            }))
            resolve(placeResults)
          } else if (status === 'ZERO_RESULTS') {
            console.log('⚠️ Nearby Search: No results found')
            resolve([])
          } else {
            console.warn('❌ Nearby Search failed:', status)
            // Try text search as fallback
            const textRequest: google.maps.places.TextSearchRequest = {
              query: `gym in ${searchQuery}`,
              location: locationCoords,
              radius: searchRadius
            }
            placesServiceRef.current!.textSearch(textRequest, (textResults, textStatus) => {
              if (textStatus === 'OK' && textResults) {
                console.log('✅ Text Search successful. Found', textResults.length, 'results')
                const placeResults: PlaceResult[] = textResults.map(place => ({
                  place_id: place.place_id || '',
                  name: place.name || '',
                  formatted_address: place.formatted_address || '',
                  geometry: {
                    location: {
                      lat: place.geometry?.location?.lat() || 0,
                      lng: place.geometry?.location?.lng() || 0
                    }
                  },
                  rating: place.rating,
                  user_ratings_total: place.user_ratings_total,
                  formatted_phone_number: place.formatted_phone_number,
                  website: place.website,
                  types: place.types
                }))
                resolve(placeResults)
              } else {
                console.warn('❌ Text Search also failed:', textStatus)
                resolve([])
              }
            })
          }
        })
      })

      setSearchResults(nearbyResults)

      if (nearbyResults.length === 0) {
        alert('No search results found.\n\nTry the following:\n1. Increase search radius (e.g., 10000 meters)\n2. Change search query (e.g., "Toronto, ON")\n3. Search a different area')
      } else {
        alert(`Found ${nearbyResults.length} gym(s)!`)
      }
    } catch (error) {
      console.error('❌ Error searching gyms:', error)
      alert(`Error searching for gyms.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the browser console (F12).`)
    } finally {
      setIsSearching(false)
    }
  }

  const handlePlacesLoad = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      // Create a dummy div for PlacesService (it requires a map or div)
      const dummyDiv = document.createElement('div')
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv)
      geocoderRef.current = new window.google.maps.Geocoder()
      setIsPlacesLoaded(true)
      console.log('✅ Google Places Library loaded')
    }
  }

  const handleTogglePlaceSelection = (placeId: string) => {
    const newSelected = new Set(selectedPlaces)
    if (newSelected.has(placeId)) {
      newSelected.delete(placeId)
    } else {
      newSelected.add(placeId)
    }
    setSelectedPlaces(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedPlaces.size === searchResults.length) {
      setSelectedPlaces(new Set())
    } else {
      setSelectedPlaces(new Set(searchResults.map(r => r.place_id)))
    }
  }

  const handleImportSelected = async () => {
    if (selectedPlaces.size === 0) {
      alert('Please select gyms to import')
      return
    }

    if (!confirm(`Add ${selectedPlaces.size} gym(s) to the database?`)) {
      return
    }

    setIsImporting(true)

    try {
      const placesToImport = searchResults.filter(r => selectedPlaces.has(r.place_id))
      const gymsToInsert = placesToImport.map(placeToGymData)

      // Check for duplicates by name and address
      const existingGyms = await supabase
        .from('gyms')
        .select('name, address')

      const existingSet = new Set(
        (existingGyms.data || []).map(g => `${g.name}|${g.address}`)
      )

      const newGyms = gymsToInsert.filter(
        g => !existingSet.has(`${g.name}|${g.address}`)
      )

      if (newGyms.length === 0) {
        alert('All selected gyms already exist in the database.')
        setIsImporting(false)
        return
      }

      const { error } = await supabase
        .from('gyms')
        .insert(newGyms)

      if (error) throw error

      alert(`${newGyms.length} gym(s) added successfully!`)
      setSelectedPlaces(new Set())
      loadGyms()
    } catch (error: any) {
      console.error('Error importing gyms:', error)
      alert(error.message || 'Failed to import gyms.')
    } finally {
      setIsImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="section-container py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  return (
    <div className="section-container py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'posts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Post Management
            </button>
            <button
              onClick={() => setActiveTab('gyms')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'gyms'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Gym Management
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'posts' ? (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No posts found.</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            By {post.user?.first_name} {post.user?.last_name}
                          </span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          {post.is_deleted && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                              Deleted
                            </span>
                          )}
                        </div>
                      </div>
                      {!post.is_deleted && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="ml-4 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Places API Search */}
              <div className="border rounded-lg p-6 bg-blue-50">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Gyms with Google Places API</h2>
                {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                  <LoadScript
                    googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    libraries={['places']}
                    onLoad={handlePlacesLoad}
                  >
                    <div></div>
                  </LoadScript>
                )}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Location
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Toronto downtown, New York, Seoul"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Radius (meters)
                      </label>
                      <input
                        type="number"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                        min="1000"
                        max="50000"
                        step="1000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSearchGyms}
                    disabled={isSearching || !searchQuery.trim() || !isPlacesLoaded}
                    className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {!isPlacesLoaded ? 'Loading Places Library...' : isSearching ? 'Searching...' : 'Search Gyms'}
                  </button>
                  {!isPlacesLoaded && (
                    <p className="text-sm text-gray-600">Loading Google Places Library...</p>
                  )}

                  {searchResults.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Search Results ({searchResults.length})
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSelectAll}
                            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            {selectedPlaces.size === searchResults.length ? 'Deselect All' : 'Select All'}
                          </button>
                          <button
                            onClick={handleImportSelected}
                            disabled={isImporting || selectedPlaces.size === 0}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {isImporting ? 'Importing...' : `Import ${selectedPlaces.size} Selected`}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {searchResults.map((place) => {
                          const isSelected = selectedPlaces.has(place.place_id)
                          return (
                            <div
                              key={place.place_id}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'
                              }`}
                              onClick={() => handleTogglePlaceSelection(place.place_id)}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTogglePlaceSelection(place.place_id)}
                                  className="mt-1"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-1">{place.name}</h4>
                                  <p className="text-sm text-gray-600 mb-2">{place.formatted_address}</p>
                                  {place.rating && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <span className="text-yellow-500">★</span>
                                      <span>{place.rating.toFixed(1)}</span>
                                      {place.user_ratings_total && (
                                        <span className="text-gray-500">({place.user_ratings_total} reviews)</span>
                                      )}
                                    </div>
                                  )}
                                  {place.formatted_phone_number && (
                                    <p className="text-sm text-gray-600 mt-1">📞 {place.formatted_phone_number}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Gym Form */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Gym</h2>
                <form onSubmit={handleCreateGym} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gym Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newGym.name}
                        onChange={(e) => setNewGym({ ...newGym, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Downtown Fitness Center"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newGym.phone}
                        onChange={(e) => setNewGym({ ...newGym, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGym.address}
                        onChange={(e) => setNewGym({ ...newGym, address: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., 123 Main Street"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleGeocodeAddress}
                        disabled={isGeocoding || !newGym.address}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGeocoding ? 'Converting...' : 'Get Coordinates'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newGym.city}
                        onChange={(e) => setNewGym({ ...newGym, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Toronto"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={newGym.state}
                        onChange={(e) => setNewGym({ ...newGym, state: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Ontario"
                      />
                    </div>
                  </div>

                  {(newGym.latitude !== undefined && newGym.longitude !== undefined) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Coordinates:</strong> Latitude {newGym.latitude.toFixed(6)}, Longitude {newGym.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={newGym.website}
                      onChange={(e) => setNewGym({ ...newGym, website: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newGym.description}
                      onChange={(e) => setNewGym({ ...newGym, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter a description for the gym"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facilities (Parking, Showers, Locker Room, etc.)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={facilityInput}
                        onChange={(e) => setFacilityInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddFacility()
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter facility name and press Enter or click Add"
                      />
                      <button
                        type="button"
                        onClick={handleAddFacility}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {newGym.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newGym.facilities.map((facility, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
                          >
                            {facility}
                            <button
                              type="button"
                              onClick={() => handleRemoveFacility(facility)}
                              className="text-primary-700 hover:text-primary-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Gym'}
                  </button>
                </form>
              </div>

              {/* Gym List */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Gym List ({gyms.length})</h2>
                {gyms.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No gyms registered.</p>
                ) : (
                  <div className="space-y-4">
                    {gyms.map((gym) => (
                      <div key={gym.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{gym.name}</h3>
                            <p className="text-sm text-gray-600 mb-1">{gym.address}</p>
                            {gym.city && gym.state && (
                              <p className="text-sm text-gray-500 mb-2">{gym.city}, {gym.state}</p>
                            )}
                            {gym.phone && (
                              <p className="text-sm text-gray-600 mb-1">📞 {gym.phone}</p>
                            )}
                            {gym.website && (
                              <p className="text-sm text-blue-600 mb-1">
                                <a href={gym.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {gym.website}
                                </a>
                              </p>
                            )}
                            {gym.latitude && gym.longitude && (
                              <p className="text-xs text-gray-500 mt-2">
                                Location: {gym.latitude.toFixed(6)}, {gym.longitude.toFixed(6)}
                              </p>
                            )}
                            {gym.facilities && gym.facilities.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {gym.facilities.map((facility, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                  >
                                    {facility}
                                  </span>
                                ))}
                              </div>
                            )}
                            {gym.description && (
                              <p className="text-sm text-gray-600 mt-2">{gym.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteGym(gym.id)}
                            className="ml-4 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin

