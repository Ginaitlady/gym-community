import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

const RoutineDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadRoutine()
    }
  }, [id])

  const loadRoutine = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get routine data
      const { data: routineData, error: routineError } = await supabase
        .from('workout_routines')
        .select('*')
        .eq('id', id)
        .single()

      if (routineError) throw routineError

      // Check if user can view this routine
      if (!routineData.is_public && (!user || user.id !== routineData.user_id)) {
        navigate('/routines')
        return
      }

      // Get user information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('id', routineData.user_id)
        .single()

      if (userError) {
        console.error('Error loading user:', userError)
      }

      setRoutine({
        ...routineData,
        user: userData ? {
          first_name: userData.first_name,
          last_name: userData.last_name
        } : undefined
      })
    } catch (error) {
      console.error('Error loading routine:', error)
      navigate('/routines')
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

  if (!routine) {
    return (
      <div className="section-container py-12">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Routine not found</p>
          <Link to="/routines" className="text-primary-600 hover:underline">
            Back to Routines
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section-container py-8">
      <button
        onClick={() => navigate('/routines')}
        className="mb-6 text-primary-600 hover:text-primary-700 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Routines</span>
      </button>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{routine.name}</h1>
            {routine.user && (
              <Link
                to={`/profile/${routine.user_id}`}
                className="text-gray-600 hover:text-primary-600"
              >
                By {routine.user.first_name} {routine.user.last_name}
              </Link>
            )}
            {routine.is_public && (
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Public
              </span>
            )}
          </div>
        </div>

        {routine.description && (
          <p className="text-gray-700 mb-6">{routine.description}</p>
        )}

        <div className="border-t pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Exercises ({routine.exercises.length})
          </h2>
          <div className="space-y-4">
            {routine.exercises.map((exercise, index) => (
              <div key={index} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {index + 1}. {exercise.name}
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Sets</p>
                    <p className="text-lg font-semibold text-gray-900">{exercise.sets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reps</p>
                    <p className="text-lg font-semibold text-gray-900">{exercise.reps}</p>
                  </div>
                  {exercise.weight !== undefined && exercise.weight > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Weight</p>
                      <p className="text-lg font-semibold text-gray-900">{exercise.weight} kg</p>
                    </div>
                  )}
                  {exercise.rest !== undefined && exercise.rest > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rest</p>
                      <p className="text-lg font-semibold text-gray-900">{exercise.rest} sec</p>
                    </div>
                  )}
                </div>
                {exercise.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>Notes:</strong> {exercise.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t text-sm text-gray-500">
          Created {new Date(routine.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

export default RoutineDetail

