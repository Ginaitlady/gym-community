const Stats = () => {
  const stats = [
    { value: "95%", label: "Goal Achievement", description: "Average goal achievement rate of members" },
    { value: "4.8/5", label: "Satisfaction", description: "Overall member satisfaction rating" },
    { value: "2M+", label: "Workout Records", description: "Total accumulated workout records" },
    { value: "24/7", label: "Support", description: "Get help whenever you need it" }
  ]

  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Results
          </h2>
          <p className="text-xl text-primary-100">
            Data-driven results
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-2">
                {stat.value}
              </div>
              <div className="text-xl font-semibold mb-2">
                {stat.label}
              </div>
              <div className="text-primary-200">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Stats
