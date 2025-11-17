import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface StreakUser {
  user_id: string
  current_streak: number
  longest_streak: number
  user?: {
    first_name: string
    last_name: string
    profile_image_url?: string
  }
}

const StreakLeaderboard = () => {
  const [topStreaks, setTopStreaks] = useState<StreakUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      // Get top streaks
      const { data: streaksData, error: streaksError } = await supabase
        .from('user_streaks')
        .select('*')
        .order('current_streak', { ascending: false })
        .limit(20)

      if (streaksError) throw streaksError

      if (!streaksData || streaksData.length === 0) {
        setTopStreaks([])
        setLoading(false)
        return
      }

      // Get user IDs
      const userIds = streaksData.map(s => s.user_id)

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

      // Combine streaks with user data
      const streaksWithUsers = streaksData.map(streak => ({
        ...streak,
        user: usersMap.get(streak.user_id)
      }))

      setTopStreaks(streaksWithUsers)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔥 Streak Leaderboard</h1>
        <p className="text-gray-600">Compare your workout streaks with the community!</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {topStreaks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No streaks yet. Be the first to start a streak!
          </div>
        ) : (
          <div className="space-y-4">
            {topStreaks.map((streakUser, index) => (
              <div
                key={streakUser.user_id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  index === 0 ? 'bg-yellow-50 border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border-gray-200' :
                  index === 2 ? 'bg-orange-50 border-orange-200' :
                  'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-primary-500'
                  }`}>
                    {index + 1}
                  </div>
                  {streakUser.user?.profile_image_url ? (
                    <img
                      src={streakUser.user.profile_image_url}
                      alt={`${streakUser.user.first_name} ${streakUser.user.last_name}`}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {streakUser.user?.first_name?.[0]}{streakUser.user?.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <Link
                      to={`/profile/${streakUser.user_id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {streakUser.user?.first_name} {streakUser.user?.last_name}
                    </Link>
                    <div className="text-sm text-gray-500">
                      Longest: {streakUser.longest_streak} days
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {streakUser.current_streak}
                  </div>
                  <div className="text-sm text-gray-500">days</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link to="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default StreakLeaderboard

