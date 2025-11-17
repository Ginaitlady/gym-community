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

  useEffect(() => {
    loadProfile()
    loadCurrentUser()
  }, [userId])

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
          </div>
        </div>
      </div>

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

