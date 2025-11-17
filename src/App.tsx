import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CommunityBoard from './pages/CommunityBoard'
import PostDetail from './pages/PostDetail'
import Profile from './pages/Profile'
import WorkoutRoutines from './pages/WorkoutRoutines'
import RoutineDetail from './pages/RoutineDetail'
import Admin from './pages/Admin'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/community" element={<CommunityBoard />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/routines" element={<WorkoutRoutines />} />
          <Route path="/routines/:id" element={<RoutineDetail />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
