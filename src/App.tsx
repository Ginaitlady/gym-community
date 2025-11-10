import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import Community from './components/Community'
import Stats from './components/Stats'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Stats />
        <Community />
      </main>
      <Footer />
    </div>
  )
}

export default App
