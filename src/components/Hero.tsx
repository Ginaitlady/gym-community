const Hero = () => {
  return (
    <section id="home" className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
      <div className="section-container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Performance-Driven<br />
            Gym Community
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Achieve your goals, grow together, and create outstanding results
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
              Get Started
            </button>
            <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 text-lg">
              Learn More
            </button>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-4xl font-bold mb-2">10K+</div>
            <div className="text-primary-200">Active Members</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-primary-200">Trainers</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-4xl font-bold mb-2">50+</div>
            <div className="text-primary-200">Gyms</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
