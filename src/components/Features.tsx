const Features = () => {
  const features = [
    {
      icon: "📊",
      title: "Performance Tracking",
      description: "Systematically manage and analyze your workout records and performance"
    },
    {
      icon: "👥",
      title: "Community",
      description: "Connect with like-minded people and stay motivated together"
    },
    {
      icon: "🎯",
      title: "Goal Setting",
      description: "Set personalized goals and track your progress toward achieving them"
    },
    {
      icon: "💪",
      title: "Trainer Matching",
      description: "Connect with professional trainers and get the best workout programs"
    },
    {
      icon: "📱",
      title: "Mobile App",
      description: "Access your workout records and community anytime, anywhere"
    },
    {
      icon: "🏆",
      title: "Challenges",
      description: "Participate in various challenges to maintain your motivation"
    }
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            All the tools you need for a successful fitness journey
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
