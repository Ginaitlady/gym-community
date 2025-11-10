const Community = () => {
  const testimonials = [
    {
      name: "Michael Chen",
      role: "Member",
      image: "👤",
      text: "Thanks to this platform, I've been able to work out systematically and achieve my goals!"
    },
    {
      name: "Sarah Johnson",
      role: "Trainer",
      image: "👤",
      text: "Communicating and managing members has become much easier. It's a really useful tool."
    },
    {
      name: "David Martinez",
      role: "Member",
      image: "👤",
      text: "I get a lot of motivation from the community. I love the feeling of working out together."
    }
  ]

  return (
    <section id="community" className="py-20 bg-gray-50">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Community Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real testimonials from our community members
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{testimonial.image}</div>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-700 italic">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              Join our performance-driven fitness journey and become part of a community that achieves goals together
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary text-lg px-8">
                Start Free
              </button>
              <button className="btn-secondary text-lg px-8">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Community
