import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'

interface UserStreak {
  current_streak: number
  longest_streak: number
  last_workout_date: string | null
}

interface Badge {
  id: string
  name: string
  description: string
  icon_url?: string
  badge_type: string
  requirement_value: number
  earned_at?: string
}

interface WorkoutLog {
  id: string
  workout_date: string
  routine_id?: string
  duration_minutes?: number
  notes?: string
  routine_name?: string
}

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [streak, setStreak] = useState<UserStreak | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogWorkout, setShowLogWorkout] = useState(false)
  const [workoutForm, setWorkoutForm] = useState({
    workout_date: new Date().toISOString().split('T')[0],
    routine_id: '',
    duration_minutes: '',
    notes: ''
  })
  const [availableRoutines, setAvailableRoutines] = useState<any[]>([])

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const user = await api.getCurrentUser()
      if (!user) {
        window.location.href = '/'
        return
      }
      setCurrentUser(user)

      await Promise.all([
        loadStreak(user.id),
        loadBadges(user.id),
        loadRecentWorkouts(user.id),
        loadAvailableRoutines(user.id)
      ])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStreak = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      setStreak(data || { current_streak: 0, longest_streak: 0, last_workout_date: null })
    } catch (error) {
      console.error('Error loading streak:', error)
    }
  }

  const loadBadges = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })

      if (error) throw error

      const formattedBadges = (data || []).map((ub: any) => ({
        ...ub.badge,
        earned_at: ub.earned_at
      }))

      setBadges(formattedBadges)
    } catch (error) {
      console.error('Error loading badges:', error)
    }
  }

  const loadRecentWorkouts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .limit(5)

      if (error) throw error

      // Get routine names if routine_id exists
      const workoutsWithRoutines = await Promise.all(
        (data || []).map(async (workout) => {
          if (workout.routine_id) {
            const { data: routineData } = await supabase
              .from('workout_routines')
              .select('name')
              .eq('id', workout.routine_id)
              .single()

            return {
              ...workout,
              routine_name: routineData?.name
            }
          }
          return workout
        })
      )

      setRecentWorkouts(workoutsWithRoutines)
    } catch (error) {
      console.error('Error loading recent workouts:', error)
    }
  }

  const loadAvailableRoutines = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAvailableRoutines(data || [])
    } catch (error) {
      console.error('Error loading routines:', error)
    }
  }

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          workout_date: workoutForm.workout_date,
          routine_id: workoutForm.routine_id || null,
          duration_minutes: workoutForm.duration_minutes ? parseInt(workoutForm.duration_minutes) : null,
          notes: workoutForm.notes || null
        })

      if (error) throw error

      // Trigger badge check (this will be done by the trigger, but we can also call the function)
      const { error: badgeError } = await supabase.rpc('check_and_award_badges', {
        p_user_id: user.id
      })

      if (badgeError) {
        console.error('Error checking badges:', badgeError)
      }

      setWorkoutForm({
        workout_date: new Date().toISOString().split('T')[0],
        routine_id: '',
        duration_minutes: '',
        notes: ''
      })
      setShowLogWorkout(false)
      
      // Reload dashboard
      await loadDashboard()
    } catch (error: any) {
      console.error('Error logging workout:', error)
      alert(error.message || 'Failed to log workout')
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Gamify your fitness journey.</p>
      </div>

      {/* Streak Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-8 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">🔥 Current Streak</h2>
            <p className="text-primary-100">Keep the momentum going!</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{streak?.current_streak || 0}</div>
            <div className="text-primary-100">days</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-sm text-primary-100 mb-1">Longest Streak</div>
            <div className="text-2xl font-bold">{streak?.longest_streak || 0} days</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-sm text-primary-100 mb-1">Last Workout</div>
            <div className="text-lg font-semibold">
              {streak?.last_workout_date 
                ? new Date(streak.last_workout_date).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowLogWorkout(true)}
          className="mt-6 w-full bg-white text-primary-600 font-semibold py-3 rounded-lg hover:bg-primary-50 transition-colors"
        >
          Log Today's Workout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-500 mb-2">Total Workouts</div>
          <div className="text-3xl font-bold text-gray-900">{recentWorkouts.length > 0 ? '5+' : recentWorkouts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-500 mb-2">Badges Earned</div>
          <div className="text-3xl font-bold text-gray-900">{badges.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-500 mb-2">Routines Created</div>
          <div className="text-3xl font-bold text-gray-900">{availableRoutines.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badges Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🏆 Badges</h2>
            <Link to="/leaderboard" className="text-primary-600 hover:text-primary-700 text-sm">
              Compare with Friends →
            </Link>
          </div>
          {badges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No badges yet!</p>
              <p className="text-sm">Log your first workout to earn your first badge.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge) => (
                <div key={badge.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-2">
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} className="w-12 h-12" />
                    ) : (
                      '🏅'
                    )}
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{badge.name}</div>
                  <div className="text-sm text-gray-600">{badge.description}</div>
                  {badge.earned_at && (
                    <div className="text-xs text-gray-400 mt-2">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Workouts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Recent Workouts</h2>
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No workouts logged yet.</p>
              <button
                onClick={() => setShowLogWorkout(true)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Log your first workout →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {new Date(workout.workout_date).toLocaleDateString()}
                      </div>
                      {workout.routine_name && (
                        <div className="text-sm text-gray-600">{workout.routine_name}</div>
                      )}
                      {workout.duration_minutes && (
                        <div className="text-sm text-gray-500">{workout.duration_minutes} minutes</div>
                      )}
                    </div>
                  </div>
                  {workout.notes && (
                    <div className="text-sm text-gray-600 mt-2">{workout.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Workout Modal */}
      {showLogWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Log Workout</h2>
              <button
                onClick={() => setShowLogWorkout(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleLogWorkout} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workout Date *
                </label>
                <input
                  type="date"
                  value={workoutForm.workout_date}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, workout_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Routine (Optional)
                </label>
                <select
                  value={workoutForm.routine_id}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, routine_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a routine</option>
                  {availableRoutines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes, optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={workoutForm.duration_minutes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, duration_minutes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLogWorkout(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Log Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

