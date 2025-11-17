import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'

interface TrainerApproval {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  submitted_at: string
  user?: {
    first_name: string
    last_name: string
    email: string
    role: string
  }
}

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

const Admin = () => {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'approvals' | 'posts'>('approvals')
  const [approvals, setApprovals] = useState<TrainerApproval[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      if (activeTab === 'approvals') {
        loadApprovals()
      } else {
        loadPosts()
      }
    }
  }, [currentUser, activeTab])

  const checkAdminAccess = async () => {
    try {
      const user = await api.getCurrentUser()
      if (!user || user.role !== 'admin') {
        window.location.href = '/'
        return
      }
      setCurrentUser(user)
    } catch (error) {
      console.error('Error checking admin access:', error)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  const loadApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('trainer_approvals')
        .select(`
          *,
          user:users!trainer_approvals_user_id_fkey(first_name, last_name, email, role)
        `)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setApprovals(data || [])
    } catch (error) {
      console.error('Error loading approvals:', error)
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

  const handleApproveTrainer = async (userId: string, approvalId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update approval status
      const { error: approvalError } = await supabase
        .from('trainer_approvals')
        .update({
          status: 'approved',
          admin_id: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', approvalId)

      if (approvalError) throw approvalError

      // Update user role and approval status
      const { error: userError } = await supabase
        .from('users')
        .update({
          role: 'trainer',
          is_trainer_approved: true
        })
        .eq('id', userId)

      if (userError) throw userError

      loadApprovals()
    } catch (error: any) {
      console.error('Error approving trainer:', error)
      alert(error.message || 'Failed to approve trainer')
    }
  }

  const handleRejectTrainer = async (userId: string, approvalId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('trainer_approvals')
        .update({
          status: 'rejected',
          admin_id: user.id,
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', approvalId)

      if (error) throw error

      setRejectionReason('')
      loadApprovals()
    } catch (error: any) {
      console.error('Error rejecting trainer:', error)
      alert(error.message || 'Failed to reject trainer')
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
              onClick={() => setActiveTab('approvals')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'approvals'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Trainer Approvals
              {approvals.filter(a => a.status === 'pending').length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                  {approvals.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
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
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'approvals' ? (
            <div className="space-y-4">
              {approvals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No approval requests.</p>
              ) : (
                approvals.map((approval) => (
                  <div key={approval.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {approval.user?.first_name} {approval.user?.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{approval.user?.email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted: {new Date(approval.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        approval.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : approval.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {approval.status}
                      </span>
                    </div>
                    {approval.rejection_reason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {approval.rejection_reason}
                        </p>
                      </div>
                    )}
                    {approval.status === 'pending' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rejection Reason (if rejecting)
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Optional: Provide a reason for rejection"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproveTrainer(approval.user_id, approval.id)}
                            className="btn-primary"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectTrainer(approval.user_id, approval.id)}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin

