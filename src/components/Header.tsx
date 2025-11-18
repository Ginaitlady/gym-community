import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SignUpModal from './SignUpModal'
import SignInModal from './SignInModal'
import { api } from '../utils/api'
import { supabase } from '../lib/supabase'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadUser()
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUser = async () => {
    const user = await api.getCurrentUser()
    setCurrentUser(user)
  }

  const handleSignOut = async () => {
    await api.signOut()
    setCurrentUser(null)
    navigate('/')
    window.location.reload()
  }

  const handleRequestTrainer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('trainer_approvals')
        .insert({
          user_id: user.id,
          status: 'pending'
        })

      if (error) {
        if (error.code === '23505') {
          alert('You have already submitted a trainer approval request.')
        } else {
          throw error
        }
      } else {
        alert('Trainer approval request submitted successfully!')
      }
    } catch (error: any) {
      console.error('Error requesting trainer approval:', error)
      alert(error.message || 'Failed to submit request')
    }
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="section-container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold text-primary-600">FitHub</Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link to="/" className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </Link>
                {currentUser && (
                  <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                )}
                <Link to="/marketplace" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Marketplace
                </Link>
                <Link to="/community" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Community
                </Link>
                <Link to="/routines" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Routines
                </Link>
                <Link to="/gyms" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Gyms
                </Link>
                {currentUser && (
                  <Link to="/achievements" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    🏆 Achievements
                  </Link>
                )}
                {currentUser?.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <Link
                    to={`/profile/${currentUser.id}`}
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    {currentUser.first_name} {currentUser.last_name}
                  </Link>
                  {currentUser.role === 'member' && !currentUser.is_trainer_approved && (
                    <button
                      onClick={handleRequestTrainer}
                      className="text-gray-700 hover:text-primary-600 font-medium text-sm"
                    >
                      Become Trainer
                    </button>
                  )}
                  <button onClick={handleSignOut} className="text-gray-700 hover:text-primary-600 font-medium">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsSignInOpen(true)} className="text-gray-700 hover:text-primary-600 font-medium">Sign In</button>
                  <button onClick={() => setIsSignUpOpen(true)} className="btn-primary">Sign Up</button>
                </>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link to="/" className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              {currentUser && (
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              <Link to="/marketplace" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                Marketplace
              </Link>
              <Link to="/community" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                Community
              </Link>
                  <Link to="/routines" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                    Routines
                  </Link>
                  <Link to="/gyms" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                    Gyms
                  </Link>
                  {currentUser && (
                    <Link to="/achievements" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                      🏆 Achievements
                    </Link>
                  )}
                  {currentUser?.role === 'admin' && (
                    <Link to="/admin" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>
                      Admin
                    </Link>
                  )}
              <div className="pt-4 pb-2 space-y-1">
                {currentUser ? (
                  <>
                    <Link
                      to={`/profile/${currentUser.id}`}
                      className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {currentUser.role === 'member' && !currentUser.is_trainer_approved && (
                      <button
                        onClick={() => {
                          handleRequestTrainer()
                          setIsMenuOpen(false)
                        }}
                        className="text-gray-700 hover:text-primary-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                      >
                        Become Trainer
                      </button>
                    )}
                    <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="text-gray-700 hover:text-primary-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsSignInOpen(true)} className="text-gray-700 hover:text-primary-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium">
                      Sign In
                    </button>
                    <button onClick={() => setIsSignUpOpen(true)} className="btn-primary w-full">Sign Up</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      <SignUpModal 
        isOpen={isSignUpOpen} 
        onClose={() => setIsSignUpOpen(false)}
        onSuccess={() => {
          loadUser()
          setIsSignUpOpen(false)
        }}
      />
      <SignInModal 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)}
        onSuccess={() => {
          loadUser()
          setIsSignInOpen(false)
        }}
      />
    </header>
  )
}

export default Header
