import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'

interface Post {
  id: string
  user_id: string
  title: string
  content: string
  image_url?: string
  created_at: string
  updated_at: string
  likes_count?: number
  comments_count?: number
  user?: {
    first_name: string
    last_name: string
    profile_image_url?: string
  }
  is_liked?: boolean
}

const CommunityBoard = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', image_url: '' })
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadPosts()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    const user = await api.getCurrentUser()
    setCurrentUser(user)
  }

  const loadPosts = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      // First, get all posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (postsError) {
        console.error('Error loading posts from database:', postsError)
        throw postsError
      }

      console.log('Posts loaded:', postsData?.length || 0)

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))]
      
      // Fetch user information for all authors
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_image_url')
        .in('id', userIds)

      if (usersError) {
        console.error('Error loading users:', usersError)
        // Continue even if user data fails
      }

      // Create a map of user data
      const usersMap = new Map(
        (usersData || []).map(u => [u.id, u])
      )

      // Get likes count and comments count for each post
      const postsWithCounts = await Promise.all(
        postsData.map(async (post) => {
          const [likesResult, commentsResult, userLike] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id).eq('is_deleted', false),
            user ? supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single() : Promise.resolve({ data: null })
          ])

          const userInfo = usersMap.get(post.user_id)

          return {
            ...post,
            user: userInfo ? {
              first_name: userInfo.first_name,
              last_name: userInfo.last_name,
              profile_image_url: userInfo.profile_image_url
            } : undefined,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            is_liked: !!userLike.data
          }
        })
      )

      setPosts(postsWithCounts)
      console.log('Posts with counts:', postsWithCounts.length)
    } catch (error: any) {
      console.error('Error loading posts:', error)
      alert(`Error loading posts: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to create a post')
        return
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: newPost.title,
          content: newPost.content,
          image_url: newPost.image_url || null
        })

      if (error) throw error

      // Check and award achievements
      const { error: achievementError } = await supabase.rpc('check_and_award_achievements', {
        p_user_id: user.id,
        p_achievement_type: 'community'
      })

      if (achievementError) {
        console.error('Error checking achievements:', achievementError)
      }

      setNewPost({ title: '', content: '', image_url: '' })
      setShowCreateModal(false)
      loadPosts()
    } catch (error: any) {
      console.error('Error creating post:', error)
      alert(error.message || 'Failed to create post')
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to like posts')
        return
      }

      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })
      }

      loadPosts()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  if (loading) {
    return (
      <div className="section-container py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="section-container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Community Board</h1>
        {currentUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Post
          </button>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={newPost.image_url}
                  onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No posts yet. Be the first to share!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {post.user?.profile_image_url ? (
                    <img
                      src={post.user.profile_image_url}
                      alt={`${post.user.first_name} ${post.user.last_name}`}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {post.user?.first_name?.[0]}{post.user?.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <Link
                      to={`/profile/${post.user_id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {post.user?.first_name} {post.user?.last_name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <Link to={`/posts/${post.id}`}>
                <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-primary-600">
                  {post.title}
                </h2>
                <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
              </Link>
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              <div className="flex items-center space-x-6 pt-4 border-t">
                <button
                  onClick={() => handleLike(post.id, post.is_liked || false)}
                  className={`flex items-center space-x-2 ${
                    post.is_liked ? 'text-primary-600' : 'text-gray-500'
                  } hover:text-primary-600 transition-colors`}
                >
                  <svg className="w-5 h-5" fill={post.is_liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{post.likes_count || 0}</span>
                </button>
                <Link
                  to={`/posts/${post.id}`}
                  className="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{post.comments_count || 0}</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommunityBoard

