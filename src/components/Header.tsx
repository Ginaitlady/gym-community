import { useState } from 'react'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="section-container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary-600">FitHub</h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <a href="#home" className="text-gray-900 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </a>
                <a href="#features" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#community" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Community
                </a>
                <a href="#about" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  About
                </a>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-primary-600 font-medium">Sign In</button>
              <button className="btn-primary">Sign Up</button>
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
              <a href="#home" className="text-gray-900 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Home
              </a>
              <a href="#features" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Features
              </a>
              <a href="#community" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                Community
              </a>
              <a href="#about" className="text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                About
              </a>
              <div className="pt-4 pb-2 space-y-1">
                <button className="text-gray-700 hover:text-primary-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium">
                  Sign In
                </button>
                <button className="btn-primary w-full">Sign Up</button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
