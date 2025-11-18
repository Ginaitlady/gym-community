import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'

interface Achievement {
  id: string
  name: string
  description: string
  icon_url?: string
  achievement_type: string
  requirement_value: number
  earned_at?: string
  is_earned?: boolean
}

const Achievements = () => {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [earnedAchievements, setEarnedAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    loadAchievements()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    const user = await api.getCurrentUser()
    setCurrentUser(user)
  }

  const loadAchievements = async () => {
    try {
      setLoading(true)
      const user = await api.getCurrentUser()
      
      // Get all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('achievement_type', { ascending: true })
        .order('requirement_value', { ascending: true })

      if (achievementsError) throw achievementsError

      // Get user's earned achievements
      let earnedIds: string[] = []
      if (user) {
        const { data: userAchievementsData, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', user.id)

        if (userAchievementsError) throw userAchievementsError

        earnedIds = (userAchievementsData || []).map(ua => ua.achievement_id)
        
        // Map earned achievements with earned_at
        const earnedMap = new Map(
          (userAchievementsData || []).map(ua => [ua.achievement_id, ua.earned_at])
        )

        const achievementsWithEarned = (achievementsData || []).map(achievement => ({
          ...achievement,
          is_earned: earnedIds.includes(achievement.id),
          earned_at: earnedMap.get(achievement.id)
        }))

        setAllAchievements(achievementsWithEarned)
        setEarnedAchievements(achievementsWithEarned.filter(a => a.is_earned))
      } else {
        setAllAchievements(achievementsData || [])
        setEarnedAchievements([])
      }
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = filterType === 'all'
    ? allAchievements
    : allAchievements.filter(a => a.achievement_type === filterType)

  const achievementTypes = Array.from(new Set(allAchievements.map(a => a.achievement_type)))

  const getAchievementIcon = (type: string, isEarned: boolean) => {
    if (!isEarned) return '🔒'
    switch (type) {
      case 'workout':
        return '💪'
      case 'community':
        return '📝'
      case 'routine':
        return '📋'
      case 'challenge':
        return '🏆'
      default:
        return '🏅'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Trophy Room</h1>
        <p className="text-gray-600">Track your achievements and unlock new ones!</p>
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {earnedAchievements.length} / {allAchievements.length}
              </div>
              <div className="text-sm text-gray-600">Achievements Unlocked</div>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {achievementTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filterType === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all ${
              achievement.is_earned
                ? 'border-yellow-400 hover:shadow-lg'
                : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">
                {achievement.icon_url ? (
                  <img src={achievement.icon_url} alt={achievement.name} className="w-16 h-16 mx-auto" />
                ) : (
                  getAchievementIcon(achievement.achievement_type, achievement.is_earned || false)
                )}
              </div>
              {!achievement.is_earned && (
                <div className="absolute top-2 right-2 text-2xl">🔒</div>
              )}
            </div>
            <h3 className={`text-xl font-bold text-center mb-2 ${
              achievement.is_earned ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {achievement.name}
            </h3>
            <p className={`text-center mb-4 ${
              achievement.is_earned ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {achievement.description}
            </p>
            {achievement.is_earned && achievement.earned_at && (
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                Earned {new Date(achievement.earned_at).toLocaleDateString()}
              </div>
            )}
            {!achievement.is_earned && (
              <div className="text-center text-sm text-gray-400 pt-4 border-t">
                Keep going to unlock!
              </div>
            )}
          </div>
        ))}
      </div>

      {!currentUser && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 mb-4">Sign in to track your achievements!</p>
          <Link to="/" className="btn-primary inline-block">
            Sign In
          </Link>
        </div>
      )}
    </div>
  )
}

export default Achievements

