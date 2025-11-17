import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../utils/api'

interface Exercise {
  name: string
  sets: number
  reps: number
  weight?: number
  rest?: number
  notes?: string
}

interface WorkoutRoutine {
  id: string
  user_id: string
  name: string
  description?: string
  exercises: Exercise[]
  is_public: boolean
  created_at: string
  user?: {
    first_name: string
    last_name: string
  }
}

const WorkoutRoutines = () => {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    description: '',
    is_public: false,
    exercises: [{ name: '', sets: 3, reps: 10, weight: 0, rest: 60, notes: '' }] as Exercise[]
  })

  useEffect(() => {
    loadRoutines()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    const user = await api.getCurrentUser()
    setCurrentUser(user)
  }

  const loadRoutines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Build query based on login status
      let query = supabase
        .from('workout_routines')
        .select('*')
        .order('created_at', { ascending: false })

      // If user is logged in, show public routines and their own routines
      // If not logged in, show only public routines
      if (user) {
        // For logged in users, RLS will filter to show public routines + own routines
        const { data: routinesData, error: routinesError } = await query
        if (routinesError) {
          console.error('Error loading routines (logged in):', routinesError)
          throw routinesError
        }
        console.log('Routines loaded (logged in):', routinesData?.length || 0)

        if (!routinesData || routinesData.length === 0) {
          setRoutines([])
          setLoading(false)
          return
        }

        // Get unique user IDs
        const userIds = [...new Set(routinesData.map(routine => routine.user_id))]
        
        // Fetch user information
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIds)

        if (usersError) {
          console.error('Error loading users:', usersError)
        }

        // Create a map of user data
        const usersMap = new Map(
          (usersData || []).map(u => [u.id, u])
        )

        // Combine routines with user data
        const routinesWithUsers = routinesData.map(routine => ({
          ...routine,
          user: usersMap.get(routine.user_id) ? {
            first_name: usersMap.get(routine.user_id)!.first_name,
            last_name: usersMap.get(routine.user_id)!.last_name
          } : undefined
        }))

        setRoutines(routinesWithUsers)
      } else {
        // For non-logged in users, only show public routines
        const { data: routinesData, error: routinesError } = await query.eq('is_public', true)
        if (routinesError) {
          console.error('Error loading routines (not logged in):', routinesError)
          throw routinesError
        }
        console.log('Routines loaded (not logged in):', routinesData?.length || 0)

        if (!routinesData || routinesData.length === 0) {
          setRoutines([])
          setLoading(false)
          return
        }

        // Get unique user IDs
        const userIds = [...new Set(routinesData.map(routine => routine.user_id))]
        
        // Fetch user information
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIds)

        if (usersError) {
          console.error('Error loading users:', usersError)
        }

        // Create a map of user data
        const usersMap = new Map(
          (usersData || []).map(u => [u.id, u])
        )

        // Combine routines with user data
        const routinesWithUsers = routinesData.map(routine => ({
          ...routine,
          user: usersMap.get(routine.user_id) ? {
            first_name: usersMap.get(routine.user_id)!.first_name,
            last_name: usersMap.get(routine.user_id)!.last_name
          } : undefined
        }))

        setRoutines(routinesWithUsers)
      }
    } catch (error: any) {
      console.error('Error loading routines:', error)
      alert(`Error loading routines: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExercise = () => {
    setNewRoutine({
      ...newRoutine,
      exercises: [...newRoutine.exercises, { name: '', sets: 3, reps: 10, weight: 0, rest: 60, notes: '' }]
    })
  }

  const handleRemoveExercise = (index: number) => {
    setNewRoutine({
      ...newRoutine,
      exercises: newRoutine.exercises.filter((_, i) => i !== index)
    })
  }

  const handleExerciseChange = (index: number, field: keyof Exercise, value: any) => {
    const updatedExercises = [...newRoutine.exercises]
    updatedExercises[index] = { ...updatedExercises[index], [field]: value }
    setNewRoutine({ ...newRoutine, exercises: updatedExercises })
  }

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to create a workout routine')
        return
      }

      // Validate exercises
      const validExercises = newRoutine.exercises.filter(ex => ex.name.trim() !== '')
      if (validExercises.length === 0) {
        alert('Please add at least one exercise')
        return
      }

      const { error } = await supabase
        .from('workout_routines')
        .insert({
          user_id: user.id,
          name: newRoutine.name,
          description: newRoutine.description || null,
          exercises: validExercises,
          is_public: newRoutine.is_public
        })

      if (error) throw error

      setNewRoutine({
        name: '',
        description: '',
        is_public: false,
        exercises: [{ name: '', sets: 3, reps: 10, weight: 0, rest: 60, notes: '' }]
      })
      setShowCreateModal(false)
      loadRoutines()
    } catch (error: any) {
      console.error('Error creating routine:', error)
      alert(error.message || 'Failed to create workout routine')
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
        <h1 className="text-3xl font-bold text-gray-900">Workout Routines</h1>
        {currentUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Routine
          </button>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Create Workout Routine</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateRoutine} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Routine Name *
                </label>
                <input
                  type="text"
                  value={newRoutine.name}
                  onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRoutine.description}
                  onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newRoutine.is_public}
                    onChange={(e) => setNewRoutine({ ...newRoutine, is_public: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Make this routine public</span>
                </label>
              </div>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">Exercises *</label>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    + Add Exercise
                  </button>
                </div>
                <div className="space-y-4">
                  {newRoutine.exercises.map((exercise, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">Exercise {index + 1}</h4>
                        {newRoutine.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Name *</label>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sets</label>
                          <input
                            type="number"
                            min="1"
                            value={exercise.sets}
                            onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
                          <input
                            type="number"
                            min="1"
                            value={exercise.reps}
                            onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                          <input
                            type="number"
                            min="0"
                            value={exercise.weight || ''}
                            onChange={(e) => handleExerciseChange(index, 'weight', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rest (sec)</label>
                          <input
                            type="number"
                            min="0"
                            value={exercise.rest || ''}
                            onChange={(e) => handleExerciseChange(index, 'rest', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <input
                          type="text"
                          value={exercise.notes || ''}
                          onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
                  Create Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routines.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No workout routines yet. Create one to get started!
          </div>
        ) : (
          routines.map((routine) => (
            <Link
              key={routine.id}
              to={`/routines/${routine.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900">{routine.name}</h3>
                {routine.is_public && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    Public
                  </span>
                )}
              </div>
              {routine.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{routine.description}</p>
              )}
              <div className="text-sm text-gray-500 mb-4">
                <p>{routine.exercises.length} exercises</p>
                {routine.user && (
                  <p className="mt-1">
                    By {routine.user.first_name} {routine.user.last_name}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Created {new Date(routine.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default WorkoutRoutines

