import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section id="home" className="bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="section-container py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Your Fitness Journey<br />
            <span className="bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent">
              Starts Here
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join FitHub - where AI-powered routines, community support, and achievements come together to help you reach your goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              to="/dashboard"
              className="bg-white text-purple-600 hover:bg-gray-50 font-semibold py-4 px-10 rounded-xl transition-all duration-200 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started Free
            </Link>
            <Link 
              to="/routines"
              className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 font-semibold py-4 px-10 rounded-xl transition-all duration-200 text-lg"
            >
              Explore Features
            </Link>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Link 
            to="/routines"
            className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <div className="text-4xl font-bold mb-2">AI</div>
            <div className="text-white/90 font-medium">Routines</div>
          </Link>
          <Link 
            to="/community"
            className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <div className="text-4xl font-bold mb-2">👥</div>
            <div className="text-white/90 font-medium">Community</div>
          </Link>
          <Link 
            to="/dashboard"
            className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <div className="text-4xl font-bold mb-2">📊</div>
            <div className="text-white/90 font-medium">Dashboard</div>
          </Link>
          <Link 
            to="/achievements"
            className="bg-white/20 backdrop-blur-md rounded-2xl p-6 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <div className="text-4xl font-bold mb-2">🏆</div>
            <div className="text-white/90 font-medium">Achievements</div>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero

