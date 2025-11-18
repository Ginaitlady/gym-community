import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface TrainerProfile {
  user_id: string
  specialties: string[]
  certifications: string[]
  hourly_rate?: number
  bio?: string
  years_of_experience?: number
  languages?: string[]
  user?: {
    first_name: string
    last_name: string
    profile_image_url?: string
  }
  average_rating?: number
  total_reviews?: number
}

const TrainerMarketplace = () => {
  const [trainers, setTrainers] = useState<TrainerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience'>('rating')

  useEffect(() => {
    loadTrainers()
  }, [sortBy])

  const loadTrainers = async () => {
    try {
      setLoading(true)
      
      // Get all approved trainers
      const { data: approvedTrainers, error: trainersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_image_url')
        .eq('role', 'trainer')
        .eq('is_trainer_approved', true)

      if (trainersError) throw trainersError

      if (!approvedTrainers || approvedTrainers.length === 0) {
        setTrainers([])
        setLoading(false)
        return
      }

      const trainerIds = approvedTrainers.map(t => t.id)

      // Get trainer profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('trainer_profiles')
        .select('*')
        .in('user_id', trainerIds)

      if (profilesError) throw profilesError

      // Get ratings for each trainer
      const trainersWithRatings = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: ratingData } = await supabase.rpc('get_trainer_rating', {
            p_trainer_id: profile.user_id
          })

          const user = approvedTrainers.find(t => t.id === profile.user_id)

          return {
            ...profile,
            user,
            average_rating: ratingData?.[0]?.average_rating || 0,
            total_reviews: ratingData?.[0]?.total_reviews || 0
          }
        })
      )

      // Sort trainers
      let sortedTrainers = [...trainersWithRatings]
      if (sortBy === 'rating') {
        sortedTrainers.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      } else if (sortBy === 'price') {
        sortedTrainers.sort((a, b) => (a.hourly_rate || 999999) - (b.hourly_rate || 999999))
      } else if (sortBy === 'experience') {
        sortedTrainers.sort((a, b) => (b.years_of_experience || 0) - (a.years_of_experience || 0))
      }

      setTrainers(sortedTrainers)
    } catch (error) {
      console.error('Error loading trainers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique specialties for filter
  const allSpecialties = Array.from(
    new Set(trainers.flatMap(t => t.specialties || []))
  )

  // Filter trainers
  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = !searchTerm || 
      trainer.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSpecialty = !selectedSpecialty || 
      trainer.specialties?.includes(selectedSpecialty)

    return matchesSearch && matchesSpecialty
  })

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trainer Marketplace</h1>
        <p className="text-gray-600">Find the perfect trainer for your fitness journey</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, specialty..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialty
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Specialties</option>
              {allSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="rating">Highest Rated</option>
              <option value="price">Lowest Price</option>
              <option value="experience">Most Experience</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trainers Grid */}
      {filteredTrainers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No trainers found.</p>
          {searchTerm || selectedSpecialty ? (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedSpecialty('')
              }}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainers.map((trainer) => (
            <Link
              key={trainer.user_id}
              to={`/trainers/${trainer.user_id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4 mb-4">
                {trainer.user?.profile_image_url ? (
                  <img
                    src={trainer.user.profile_image_url}
                    alt={`${trainer.user.first_name} ${trainer.user.last_name}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-xl font-semibold">
                      {trainer.user?.first_name?.[0]}{trainer.user?.last_name?.[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {trainer.user?.first_name} {trainer.user?.last_name}
                  </h3>
                  {trainer.average_rating > 0 && (
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1 text-sm font-semibold text-gray-900">
                          {trainer.average_rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({trainer.total_reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {trainer.specialties && trainer.specialties.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {trainer.specialties.slice(0, 3).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                    {trainer.specialties.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{trainer.specialties.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {trainer.bio && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {trainer.bio}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                {trainer.hourly_rate ? (
                  <div>
                    <span className="text-2xl font-bold text-primary-600">
                      ${trainer.hourly_rate}
                    </span>
                    <span className="text-sm text-gray-500">/hour</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Price on request</div>
                )}
                {trainer.years_of_experience && (
                  <div className="text-sm text-gray-600">
                    {trainer.years_of_experience} years exp.
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default TrainerMarketplace

