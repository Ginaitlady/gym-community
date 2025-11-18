import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  bio?: string
  profile_image_url?: string
  role: string
  is_trainer_approved: boolean
  created_at: string
}

interface UserPost {
  id: string
  title: string
  content: string
  created_at: string
  likes_count: number
  comments_count: number
}

interface UserRoutine {
  id: string
  name: string
  description?: string
  created_at: string
}

interface UserStreak {
  current_streak: number
  longest_streak: number
  last_workout_date: string | null
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<UserPost[]>([])
  const [routines, setRoutines] = useState<UserRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'posts' | 'routines'>('posts')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '', profile_image_url: '' })
  const [streak, setStreak] = useState<UserStreak | null>(null)
  const [trainerProfile, setTrainerProfile] = useState<any>(null)
  const [trainerEditForm, setTrainerEditForm] = useState({
    specialties: [] as string[],
    certifications: [] as string[],
    hourly_rate: '',
    years_of_experience: '',
    languages: [] as string[],
    bio: ''
  })
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newCertification, setNewCertification] = useState('')
  const [newLanguage, setNewLanguage] = useState('')

  useEffect(() => {
    loadProfile()
    loadCurrentUser()
    loadStreak()
    if (currentUser && (currentUser.role === 'trainer' || currentUser.is_trainer_approved)) {
      loadTrainerProfile()
    }
  }, [userId, currentUser])

  useEffect(() => {
    if (profile) {
      if (activeTab === 'posts') {
        loadUserPosts()
      } else {
        loadUserRoutines()
      }
    }
  }, [profile, activeTab])

  const loadCurrentUser = async () => {
    const user = await api.getCurrentUser()
    setCurrentUser(user)
  }

  const loadProfile = async () => {
    try {
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser()
      const isOwnProfile = currentAuthUser && currentAuthUser.id === userId
      
      // If viewing own profile, get all fields. Otherwise, only public fields
      const selectFields = isOwnProfile 
        ? '*' 
        : 'id, first_name, last_name, profile_image_url, bio, role, is_trainer_approved, created_at'
      
      const { data, error } = await supabase
        .from('users')
        .select(selectFields)
        .eq('id', userId)
        .single()

      if (error) throw error

      setProfile(data)
      if (isOwnProfile) {
        setEditForm({
          bio: data.bio || '',
          profile_image_url: data.profile_image_url || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, title, content, created_at')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          const [likesResult, commentsResult] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id).eq('is_deleted', false)
          ])

          return {
            ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0
          }
        })
      )

      setPosts(postsWithCounts)
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const loadUserRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .select('id, name, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRoutines(data || [])
    } catch (error) {
      console.error('Error loading routines:', error)
    }
  }

  const loadStreak = async () => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setStreak(data || { current_streak: 0, longest_streak: 0, last_workout_date: null })
    } catch (error) {
      console.error('Error loading streak:', error)
    }
  }

  const loadTrainerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('trainer_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setTrainerProfile(data)
        setTrainerEditForm({
          specialties: data.specialties || [],
          certifications: data.certifications || [],
          hourly_rate: data.hourly_rate?.toString() || '',
          years_of_experience: data.years_of_experience?.toString() || '',
          languages: data.languages || [],
          bio: data.bio || ''
        })
      }
    } catch (error) {
      console.error('Error loading trainer profile:', error)
    }
  }

  const handleUpdateTrainerProfile = async () => {
    try {
      if (!currentUser || currentUser.id !== userId) return

      const updateData: any = {
        specialties: trainerEditForm.specialties,
        certifications: trainerEditForm.certifications,
        years_of_experience: trainerEditForm.years_of_experience ? parseInt(trainerEditForm.years_of_experience) : null,
        languages: trainerEditForm.languages,
        bio: trainerEditForm.bio || null
      }

      if (trainerEditForm.hourly_rate) {
        updateData.hourly_rate = parseFloat(trainerEditForm.hourly_rate)
      }

      if (trainerProfile) {
        const { error } = await supabase
          .from('trainer_profiles')
          .update(updateData)
          .eq('user_id', userId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('trainer_profiles')
          .insert({
            user_id: userId,
            ...updateData
          })

        if (error) throw error
      }

      setIsEditing(false)
      loadTrainerProfile()
    } catch (error: any) {
      console.error('Error updating trainer profile:', error)
      alert(error.message || 'Failed to update trainer profile')
    }
  }

  const handleUpdateProfile = async () => {
    try {
      if (!currentUser || currentUser.id !== userId) return

      const { error } = await supabase
        .from('users')
        .update({
          bio: editForm.bio,
          profile_image_url: editForm.profile_image_url || null
        })
        .eq('id', userId)

      if (error) throw error

      setIsEditing(false)
      loadProfile()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      alert(error.message || 'Failed to update profile')
    }
  }

  const isOwnProfile = currentUser && currentUser.id === userId

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
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="section-container py-8">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-start space-x-6">
          {profile.profile_image_url ? (
            <img
              src={profile.profile_image_url}
              alt={`${profile.first_name} ${profile.last_name}`}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 text-3xl font-semibold">
                {profile.first_name[0]}{profile.last_name[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.first_name} {profile.last_name}
              </h1>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-primary"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {profile.role}
              </span>
              {profile.role === 'trainer' && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.is_trainer_approved
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {profile.is_trainer_approved ? 'Verified Trainer' : 'Pending Approval'}
                </span>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    value={editForm.profile_image_url}
                    onChange={(e) => setEditForm({ ...editForm, profile_image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button onClick={handleUpdateProfile} className="btn-primary">
                  Save Changes
                </button>
              </div>
            ) : (
              <p className="text-gray-700">{profile.bio || 'No bio yet.'}</p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </p>
            {streak && streak.current_streak > 0 && (
              <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {streak.current_streak} Day Streak
                    </div>
                    <div className="text-sm text-gray-600">
                      Longest: {streak.longest_streak} days
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainer Profile Section */}
      {isOwnProfile && (profile.role === 'trainer' || profile.is_trainer_approved) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Trainer Profile</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Trainer Profile
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {trainerEditForm.specialties.map((spec, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => {
                          setTrainerEditForm({
                            ...trainerEditForm,
                            specialties: trainerEditForm.specialties.filter((_, i) => i !== idx)
                          })
                        }}
                        className="ml-2 text-primary-700 hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newSpecialty.trim() && !trainerEditForm.specialties.includes(newSpecialty.trim())) {
                          setTrainerEditForm({
                            ...trainerEditForm,
                            specialties: [...trainerEditForm.specialties, newSpecialty.trim()]
                          })
                          setNewSpecialty('')
                        }
                      }
                    }}
                    placeholder="Add specialty (press Enter)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSpecialty.trim() && !trainerEditForm.specialties.includes(newSpecialty.trim())) {
                        setTrainerEditForm({
                          ...trainerEditForm,
                          specialties: [...trainerEditForm.specialties, newSpecialty.trim()]
                        })
                        setNewSpecialty('')
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {trainerEditForm.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center"
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => {
                          setTrainerEditForm({
                            ...trainerEditForm,
                            certifications: trainerEditForm.certifications.filter((_, i) => i !== idx)
                          })
                        }}
                        className="ml-2 text-green-700 hover:text-green-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newCertification.trim() && !trainerEditForm.certifications.includes(newCertification.trim())) {
                          setTrainerEditForm({
                            ...trainerEditForm,
                            certifications: [...trainerEditForm.certifications, newCertification.trim()]
                          })
                          setNewCertification('')
                        }
                      }
                    }}
                    placeholder="Add certification (press Enter)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCertification.trim() && !trainerEditForm.certifications.includes(newCertification.trim())) {
                        setTrainerEditForm({
                          ...trainerEditForm,
                          certifications: [...trainerEditForm.certifications, newCertification.trim()]
                        })
                        setNewCertification('')
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={trainerEditForm.hourly_rate}
                    onChange={(e) => setTrainerEditForm({ ...trainerEditForm, hourly_rate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={trainerEditForm.years_of_experience}
                    onChange={(e) => setTrainerEditForm({ ...trainerEditForm, years_of_experience: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {trainerEditForm.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center"
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => {
                          setTrainerEditForm({
                            ...trainerEditForm,
                            languages: trainerEditForm.languages.filter((_, i) => i !== idx)
                          })
                        }}
                        className="ml-2 text-blue-700 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newLanguage.trim() && !trainerEditForm.languages.includes(newLanguage.trim())) {
                          setTrainerEditForm({
                            ...trainerEditForm,
                            languages: [...trainerEditForm.languages, newLanguage.trim()]
                          })
                          setNewLanguage('')
                        }
                      }
                    }}
                    placeholder="Add language (press Enter)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newLanguage.trim() && !trainerEditForm.languages.includes(newLanguage.trim())) {
                        setTrainerEditForm({
                          ...trainerEditForm,
                          languages: [...trainerEditForm.languages, newLanguage.trim()]
                        })
                        setNewLanguage('')
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trainer Bio
                </label>
                <textarea
                  value={trainerEditForm.bio}
                  onChange={(e) => setTrainerEditForm({ ...trainerEditForm, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    if (trainerProfile) {
                      setTrainerEditForm({
                        specialties: trainerProfile.specialties || [],
                        certifications: trainerProfile.certifications || [],
                        hourly_rate: trainerProfile.hourly_rate?.toString() || '',
                        years_of_experience: trainerProfile.years_of_experience?.toString() || '',
                        languages: trainerProfile.languages || [],
                        bio: trainerProfile.bio || ''
                      })
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTrainerProfile}
                  className="flex-1 btn-primary"
                >
                  Save Trainer Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {trainerProfile ? (
                <>
                  {trainerProfile.specialties && trainerProfile.specialties.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {trainerProfile.specialties.map((spec: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {trainerProfile.certifications && trainerProfile.certifications.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Certifications</h3>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        {trainerProfile.certifications.map((cert: string, idx: number) => (
                          <li key={idx}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {trainerProfile.hourly_rate && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Hourly Rate</h3>
                      <p className="text-gray-700">${trainerProfile.hourly_rate}/hour</p>
                    </div>
                  )}
                  {trainerProfile.years_of_experience && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Experience</h3>
                      <p className="text-gray-700">{trainerProfile.years_of_experience} years</p>
                    </div>
                  )}
                  {trainerProfile.languages && trainerProfile.languages.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {trainerProfile.languages.map((lang: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {trainerProfile.bio && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Trainer Bio</h3>
                      <p className="text-gray-700">{trainerProfile.bio}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Complete your trainer profile to appear in the marketplace.</p>
              )}
            </div>
          )}
        </div>
      )}

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
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('routines')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'routines'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Workout Routines ({routines.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'posts' ? (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No posts yet.</p>
              ) : (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{post.likes_count} likes</span>
                      <span>{post.comments_count} comments</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {routines.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No workout routines yet.</p>
              ) : (
                routines.map((routine) => (
                  <Link
                    key={routine.id}
                    to={`/routines/${routine.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{routine.name}</h3>
                    {routine.description && (
                      <p className="text-gray-600 text-sm mb-2">{routine.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Created {new Date(routine.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

