import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'

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
    email: string
  }
  average_rating?: number
  total_reviews?: number
}

interface Review {
  id: string
  rating: number
  review_text?: string
  created_at: string
  client?: {
    first_name: string
    last_name: string
    profile_image_url?: string
  }
}

const TrainerProfile = () => {
  const { trainerId } = useParams<{ trainerId: string }>()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<TrainerProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'bookings'>('about')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    booking_date: '',
    booking_time: '',
    duration_minutes: 60,
    notes: ''
  })
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review_text: ''
  })
  const [messageText, setMessageText] = useState('')

  useEffect(() => {
    if (trainerId) {
      loadTrainerProfile()
      loadReviews()
      loadCurrentUser()
    }
  }, [trainerId])

  const loadCurrentUser = async () => {
    const user = await api.getCurrentUser()
    setCurrentUser(user)
  }

  const loadTrainerProfile = async () => {
    try {
      // Get trainer user info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_image_url, email')
        .eq('id', trainerId)
        .eq('role', 'trainer')
        .eq('is_trainer_approved', true)
        .single()

      if (userError) throw userError

      // Get trainer profile
      const { data: profileData, error: profileError } = await supabase
        .from('trainer_profiles')
        .select('*')
        .eq('user_id', trainerId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      // Get rating
      const { data: ratingData } = await supabase.rpc('get_trainer_rating', {
        p_trainer_id: trainerId
      })

      setProfile({
        ...profileData,
        user: userData,
        average_rating: ratingData?.[0]?.average_rating || 0,
        total_reviews: ratingData?.[0]?.total_reviews || 0
      })
    } catch (error) {
      console.error('Error loading trainer profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('trainer_reviews')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get client info
      const clientIds = [...new Set(reviewsData.map(r => r.client_id))]
      const { data: clientsData } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_image_url')
        .in('id', clientIds)

      const clientsMap = new Map(
        (clientsData || []).map(c => [c.id, c])
      )

      const reviewsWithClients = reviewsData.map(review => ({
        ...review,
        client: clientsMap.get(review.client_id)
      }))

      setReviews(reviewsWithClients)
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!currentUser) {
        alert('Please sign in to book a session')
        return
      }

      const { error } = await supabase
        .from('trainer_bookings')
        .insert({
          trainer_id: trainerId,
          client_id: currentUser.id,
          booking_date: bookingForm.booking_date,
          booking_time: bookingForm.booking_time,
          duration_minutes: bookingForm.duration_minutes,
          notes: bookingForm.notes || null,
          status: 'pending'
        })

      if (error) throw error

      alert('Booking request sent! The trainer will confirm soon.')
      setShowBookingModal(false)
      setBookingForm({
        booking_date: '',
        booking_time: '',
        duration_minutes: 60,
        notes: ''
      })
    } catch (error: any) {
      console.error('Error creating booking:', error)
      alert(error.message || 'Failed to create booking')
    }
  }

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!currentUser) {
        alert('Please sign in to leave a review')
        return
      }

      const { error } = await supabase
        .from('trainer_reviews')
        .upsert({
          trainer_id: trainerId,
          client_id: currentUser.id,
          rating: reviewForm.rating,
          review_text: reviewForm.review_text || null
        })

      if (error) throw error

      alert('Review submitted!')
      setShowReviewModal(false)
      setReviewForm({ rating: 5, review_text: '' })
      loadReviews()
      loadTrainerProfile()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      alert(error.message || 'Failed to submit review')
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!currentUser) {
        alert('Please sign in to send a message')
        return
      }

      const { error } = await supabase
        .from('trainer_messages')
        .insert({
          trainer_id: trainerId,
          client_id: currentUser.id,
          sender_id: currentUser.id,
          message_text: messageText
        })

      if (error) throw error

      alert('Message sent!')
      setShowMessageModal(false)
      setMessageText('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(error.message || 'Failed to send message')
    }
  }

  const hasReviewed = currentUser && reviews.some(r => r.client?.id === currentUser.id)

  if (loading) {
    return (
      <div className="section-container py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="section-container py-12">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Trainer not found</p>
          <Link to="/marketplace" className="text-primary-600 hover:underline">
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section-container py-8">
      <button
        onClick={() => navigate('/marketplace')}
        className="mb-6 text-primary-600 hover:text-primary-700 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Marketplace</span>
      </button>

      {/* Trainer Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-start space-x-6">
          {profile.user?.profile_image_url ? (
            <img
              src={profile.user.profile_image_url}
              alt={`${profile.user.first_name} ${profile.user.last_name}`}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 text-3xl font-semibold">
                {profile.user?.first_name[0]}{profile.user?.last_name[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.user?.first_name} {profile.user?.last_name}
            </h1>
            {profile.average_rating > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-400 text-xl">★</span>
                  <span className="ml-1 text-lg font-semibold text-gray-900">
                    {profile.average_rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-500">
                  ({profile.total_reviews} {profile.total_reviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
            {profile.specialties && profile.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            )}
            {profile.hourly_rate && (
              <div className="text-2xl font-bold text-primary-600 mb-4">
                ${profile.hourly_rate} <span className="text-lg text-gray-500">/hour</span>
              </div>
            )}
            <div className="flex gap-3">
              {currentUser && currentUser.id !== trainerId && (
                <>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="btn-primary"
                  >
                    Book Session
                  </button>
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Send Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'about'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews ({reviews.length})
            </button>
            {currentUser && (currentUser.id === trainerId || reviews.some(r => r.client?.id === currentUser.id)) && (
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-2 border-b-2 font-medium ${
                  activeTab === 'bookings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Bookings
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'about' && (
            <div className="space-y-6">
              {profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
              )}
              {profile.years_of_experience && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience</h3>
                  <p className="text-gray-700">{profile.years_of_experience} years</p>
                </div>
              )}
              {profile.certifications && profile.certifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Certifications</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {profile.certifications.map((cert, idx) => (
                      <li key={idx}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {currentUser && currentUser.id !== trainerId && !hasReviewed && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="btn-primary"
                  >
                    Write a Review
                  </button>
                </div>
              )}
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {review.client?.profile_image_url ? (
                            <img
                              src={review.client.profile_image_url}
                              alt={`${review.client.first_name} ${review.client.last_name}`}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-semibold">
                                {review.client?.first_name?.[0]}{review.client?.last_name?.[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">
                              {review.client?.first_name} {review.client?.last_name}
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {review.review_text && (
                        <p className="text-gray-700 mt-2">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <BookingsList trainerId={trainerId!} currentUser={currentUser} />
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Book a Session</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={bookingForm.booking_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  value={bookingForm.booking_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, booking_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="30"
                  step="30"
                  value={bookingForm.duration_minutes}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Request Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleReview} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating })}
                      className={`text-3xl ${
                        rating <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review (optional)
                </label>
                <textarea
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Send Message</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Type your message..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Bookings List Component
const BookingsList = ({ trainerId, currentUser }: { trainerId: string; currentUser: any }) => {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [trainerId, currentUser])

  const loadBookings = async () => {
    try {
      let query = supabase
        .from('trainer_bookings')
        .select('*')
        .order('booking_date', { ascending: false })

      if (currentUser?.id === trainerId) {
        query = query.eq('trainer_id', trainerId)
      } else {
        query = query.eq('client_id', currentUser?.id)
      }

      const { data, error } = await query

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBooking = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('trainer_bookings')
        .update({ status })
        .eq('id', bookingId)

      if (error) throw error
      loadBookings()
    } catch (error: any) {
      alert(error.message || 'Failed to update booking')
    }
  }

  if (loading) return <div className="text-center py-4">Loading...</div>

  if (bookings.length === 0) {
    return <p className="text-gray-500 text-center py-8">No bookings yet.</p>
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-semibold text-gray-900">
                {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
              </div>
              <div className="text-sm text-gray-600">
                Duration: {booking.duration_minutes} minutes
              </div>
              {booking.notes && (
                <div className="text-sm text-gray-600 mt-1">Notes: {booking.notes}</div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {booking.status}
              </span>
              {currentUser?.id === trainerId && booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateBooking(booking.id, 'confirmed')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleUpdateBooking(booking.id, 'cancelled')}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TrainerProfile

