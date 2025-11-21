import { Link } from 'react-router-dom'

const Features = () => {
  const features = [
    {
      icon: "🤖",
      title: "AI Workout Routines",
      description: "Get personalized workout routines powered by AI. Create, customize, and follow expert-designed exercise plans tailored to your goals.",
      link: "/routines",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: "👥",
      title: "Community",
      description: "Connect with fitness enthusiasts, share your progress, get tips, and stay motivated together in our vibrant community.",
      link: "/community",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: "📊",
      title: "Dashboard",
      description: "Track your fitness journey with detailed analytics, workout logs, and streak tracking. See your progress at a glance.",
      link: "/dashboard",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: "🏆",
      title: "Achievements & Challenges",
      description: "Earn badges, unlock achievements, and participate in challenges to keep your motivation high and celebrate milestones.",
      link: "/achievements",
      color: "from-pink-500 to-purple-500"
    },
    {
      icon: "📍",
      title: "Find Gyms",
      description: "Discover gyms near you with detailed information, facilities, and locations. Find the perfect place for your workout.",
      link: "/gyms",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: "🔥",
      title: "Streak Leaderboard",
      description: "Compete with others and see who has the longest workout streak. Stay consistent and climb the leaderboard!",
      link: "/leaderboard",
      color: "from-rose-500 to-pink-500"
    }
  ]

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-white to-purple-50">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our powerful features designed to help you achieve your fitness goals
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group block"
            >
              <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300 h-full border-2 border-transparent hover:border-primary-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 text-3xl transform group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700">
                  <span>Explore →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
