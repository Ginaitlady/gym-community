import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'

interface Gym {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  description?: string
  facilities?: string[]
  opening_hours?: any
}

interface GymReview {
  id: string
  rating: number
  review_text?: string
  created_at: string
  user?: {
    first_name: string
    last_name: string
    profile_image_url?: string
  }
}

interface CommunityPost {
  id: string
  title: string
  content: string
  created_at: string
  user?: {
    first_name: string
    last_name: string
  }
}

const GymDetail = () => {
  const { gymId } = useParams<{ gymId: string }>()
  const navigate = useNavigate()
  const [gym, setGym] = useState<Gym | null>(null)
  const [reviews, setReviews] = useState<GymReview[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'community'>('about')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' })
  const [membershipForm, setMembershipForm] = useState({
    membership_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  })
  const [hasReviewed, setHasReviewed] = useState(false)
  const [userMembership, setUserMembership] = useState<any>(null)

  useEffect(() => {
    if (gymId) {
      loadGym()
      loadReviews()
      loadCommunityPosts()
      loadCurrentUser()
    }
  }, [gymId])

  useEffect(() => {
    if (currentUser && gymId) {
      checkUserMembership()
    }
  }, [currentUser, gymId])

  const loadCurrentUser = async () => {
    const user = await api.getCurrentUser()
    setCurrentUser(user)
  }

  const loadGym = async () => {
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymId)
        .single()

      if (error) throw error
      setGym(data)
    } catch (error) {
      console.error('Error loading gym:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('gym_reviews')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get user info
      const userIds = [...new Set(reviewsData.map(r => r.user_id))]
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_image_url')
        .in('id', userIds)

      const usersMap = new Map(
        (usersData || []).map(u => [u.id, u])
      )

      const reviewsWithUsers = reviewsData.map(review => ({
        ...review,
        user: usersMap.get(review.user_id)
      }))

      setReviews(reviewsWithUsers)

      // Check if current user has reviewed
      if (currentUser) {
        const userReview = reviewsData.find(r => r.user_id === currentUser.id)
        setHasReviewed(!!userReview)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const loadCommunityPosts = async () => {
    try {
      // Get users who are members of this gym
      const { data: memberships } = await supabase
        .from('gym_memberships')
        .select('user_id')
        .eq('gym_id', gymId)
        .eq('is_active', true)

      if (!memberships || memberships.length === 0) {
        setCommunityPosts([])
        return
      }

      const memberIds = memberships.map(m => m.user_id)

      // Get posts from gym members
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, title, content, created_at, user_id')
        .in('user_id', memberIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Get user info
      const userIds = [...new Set(postsData.map(p => p.user_id))]
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', userIds)

      const usersMap = new Map(
        (usersData || []).map(u => [u.id, u])
      )

      const postsWithUsers = postsData.map(post => ({
        ...post,
        user: usersMap.get(post.user_id)
      }))

      setCommunityPosts(postsWithUsers)
    } catch (error) {
      console.error('Error loading community posts:', error)
    }
  }

  const checkUserMembership = async () => {
    try {
      const { data, error } = await supabase
        .from('gym_memberships')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('gym_id', gymId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setUserMembership(data || null)
    } catch (error) {
      console.error('Error checking membership:', error)
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
        .from('gym_reviews')
        .upsert({
          gym_id: gymId,
          user_id: currentUser.id,
          rating: reviewForm.rating,
          review_text: reviewForm.review_text || null
        })

      if (error) throw error

      alert('Review submitted!')
      setShowReviewModal(false)
      setReviewForm({ rating: 5, review_text: '' })
      loadReviews()
      loadGym()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      alert(error.message || 'Failed to submit review')
    }
  }

  const handleMembership = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!currentUser) {
        alert('Please sign in to add membership')
        return
      }

      const { error } = await supabase
        .from('gym_memberships')
        .insert({
          user_id: currentUser.id,
          gym_id: gymId,
          membership_type: membershipForm.membership_type,
          start_date: membershipForm.start_date,
          end_date: membershipForm.end_date || null,
          is_active: true
        })

      if (error) throw error

      alert('Membership added!')
      setShowMembershipModal(false)
      setMembershipForm({
        membership_type: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      })
      checkUserMembership()
      loadCommunityPosts()
    } catch (error: any) {
      console.error('Error adding membership:', error)
      alert(error.message || 'Failed to add membership')
    }
  }

  if (loading) {
    return (
      <div className="section-container py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="section-container py-12">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Gym not found</p>
          <Link to="/gyms" className="text-primary-600 hover:underline">
            Back to Gym Locator
          </Link>
        </div>
      </div>
    )
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="section-container py-8">
      <button
        onClick={() => navigate('/gyms')}
        className="mb-6 text-primary-600 hover:text-primary-700 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Gym Locator</span>
      </button>

      {/* Gym Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{gym.name}</h1>
        <div className="space-y-2 mb-6">
          <p className="text-gray-700">{gym.address}</p>
          {gym.city && gym.state && (
            <p className="text-gray-600">{gym.city}, {gym.state}</p>
          )}
          {gym.phone && (
            <p className="text-gray-600">📞 {gym.phone}</p>
          )}
          {gym.website && (
            <a
              href={gym.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700"
            >
              🌐 Visit Website
            </a>
          )}
        </div>
        <div className="flex items-center space-x-6 mb-6">
          {averageRating > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400 text-2xl">★</span>
              <span className="text-xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-gray-500">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
        {currentUser && (
          <div className="flex gap-3">
            {!userMembership && (
              <button
                onClick={() => setShowMembershipModal(true)}
                className="btn-primary"
              >
                Add My Membership
              </button>
            )}
            {userMembership && (
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                ✓ Member
              </div>
            )}
            {!hasReviewed && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Write Review
              </button>
            )}
          </div>
        )}
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
            <button
              onClick={() => setActiveTab('community')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'community'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Member Posts ({communityPosts.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'about' && (
            <div className="space-y-6">
              {gym.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{gym.description}</p>
                </div>
              )}
              {gym.facilities && gym.facilities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {gym.facilities.map((facility, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {gym.latitude && gym.longitude && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                  <a
                    href={`https://www.google.com/maps?q=${gym.latitude},${gym.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {currentUser && !hasReviewed && (
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
                          {review.user?.profile_image_url ? (
                            <img
                              src={review.user.profile_image_url}
                              alt={`${review.user.first_name} ${review.user.last_name}`}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-semibold">
                                {review.user?.first_name?.[0]}{review.user?.last_name?.[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">
                              {review.user?.first_name} {review.user?.last_name}
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

          {activeTab === 'community' && (
            <div>
              {communityPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No posts from gym members yet.</p>
                  {userMembership && (
                    <Link to="/community" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
                      Be the first to post →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {communityPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/posts/${post.id}`}
                      className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {post.user && (
                          <span className="font-semibold text-gray-900">
                            {post.user.first_name} {post.user.last_name}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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

      {/* Membership Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Add Membership</h2>
              <button
                onClick={() => setShowMembershipModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleMembership} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membership Type *
                </label>
                <select
                  value={membershipForm.membership_type}
                  onChange={(e) => setMembershipForm({ ...membershipForm, membership_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="day_pass">Day Pass</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={membershipForm.start_date}
                  onChange={(e) => setMembershipForm({ ...membershipForm, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={membershipForm.end_date}
                  onChange={(e) => setMembershipForm({ ...membershipForm, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMembershipModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Membership
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GymDetail

