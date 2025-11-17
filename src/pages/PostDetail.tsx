import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
  user?: {
    first_name: string
    last_name: string
    profile_image_url?: string
  }
  likes_count?: number
  is_liked?: boolean
}

interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user?: {
    first_name: string
    last_name: string
    profile_image_url?: string
  }
  likes_count?: number
  is_liked?: boolean
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (id) {
      loadPost()
      loadComments()
      loadCurrentUser()
    }
  }, [id])

  const loadCurrentUser = async () => {
    const user = await api.getCurrentUser()
    setCurrentUser(user)
  }

  const loadPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get post data
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single()

      if (postError) throw postError

      // Get user information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_image_url')
        .eq('id', postData.user_id)
        .single()

      if (userError) {
        console.error('Error loading user:', userError)
      }

      const [likesResult, userLike] = await Promise.all([
        supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', id),
        user ? supabase.from('likes').select('id').eq('post_id', id).eq('user_id', user.id).single() : Promise.resolve({ data: null })
      ])

      setPost({
        ...postData,
        user: userData ? {
          first_name: userData.first_name,
          last_name: userData.last_name,
          profile_image_url: userData.profile_image_url
        } : undefined,
        likes_count: likesResult.count || 0,
        is_liked: !!userLike.data
      })
    } catch (error) {
      console.error('Error loading post:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError

      if (!commentsData || commentsData.length === 0) {
        setComments([])
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))]
      
      // Fetch user information
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_image_url')
        .in('id', userIds)

      if (usersError) {
        console.error('Error loading users:', usersError)
      }

      // Create a map of user data
      const usersMap = new Map(
        (usersData || []).map(u => [u.id, u])
      )

      const commentsWithLikes = await Promise.all(
        commentsData.map(async (comment) => {
          const [likesResult, userLike] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('comment_id', comment.id),
            user ? supabase.from('likes').select('id').eq('comment_id', comment.id).eq('user_id', user.id).single() : Promise.resolve({ data: null })
          ])

          const userInfo = usersMap.get(comment.user_id)

          return {
            ...comment,
            user: userInfo ? {
              first_name: userInfo.first_name,
              last_name: userInfo.last_name,
              profile_image_url: userInfo.profile_image_url
            } : undefined,
            likes_count: likesResult.count || 0,
            is_liked: !!userLike.data
          }
        })
      )

      setComments(commentsWithLikes)
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to comment')
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          user_id: user.id,
          content: newComment
        })

      if (error) throw error

      setNewComment('')
      loadComments()
      loadPost() // Update comment count
    } catch (error: any) {
      console.error('Error adding comment:', error)
      alert(error.message || 'Failed to add comment')
    }
  }

  const handleLikePost = async (isLiked: boolean) => {
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
          .eq('post_id', id)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: id,
            user_id: user.id
          })
      }

      loadPost()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to like comments')
        return
      }

      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          })
      }

      loadComments()
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

  if (!post) {
    return (
      <div className="section-container py-12">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Post not found</p>
          <Link to="/community" className="text-primary-600 hover:underline">
            Back to Community
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section-container py-8">
      <button
        onClick={() => navigate('/community')}
        className="mb-6 text-primary-600 hover:text-primary-700 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Community</span>
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {post.user?.profile_image_url ? (
              <img
                src={post.user.profile_image_url}
                alt={`${post.user.first_name} ${post.user.last_name}`}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-96 object-cover rounded-lg mb-4"
          />
        )}
        <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>
        <div className="flex items-center space-x-6 pt-4 border-t">
          <button
            onClick={() => handleLikePost(post.is_liked || false)}
            className={`flex items-center space-x-2 ${
              post.is_liked ? 'text-primary-600' : 'text-gray-500'
            } hover:text-primary-600 transition-colors`}
          >
            <svg className="w-5 h-5" fill={post.is_liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{post.likes_count || 0}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Comments ({comments.length})</h2>
        {currentUser ? (
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
              required
            />
            <button type="submit" className="btn-primary">
              Post Comment
            </button>
          </form>
        ) : (
          <p className="text-gray-500 mb-4">Please sign in to comment</p>
        )}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4 last:border-0">
              <div className="flex items-start space-x-3 mb-2">
                {comment.user?.profile_image_url ? (
                  <img
                    src={comment.user.profile_image_url}
                    alt={`${comment.user.first_name} ${comment.user.last_name}`}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-sm font-semibold">
                      {comment.user?.first_name?.[0]}{comment.user?.last_name?.[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    to={`/profile/${comment.user_id}`}
                    className="font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {comment.user?.first_name} {comment.user?.last_name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 mb-2">{comment.content}</p>
              <button
                onClick={() => handleLikeComment(comment.id, comment.is_liked || false)}
                className={`flex items-center space-x-2 text-sm ${
                  comment.is_liked ? 'text-primary-600' : 'text-gray-500'
                } hover:text-primary-600 transition-colors`}
              >
                <svg className="w-4 h-4" fill={comment.is_liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{comment.likes_count || 0}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PostDetail

