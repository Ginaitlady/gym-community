import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import StreakLeaderboard from './pages/StreakLeaderboard'
import CommunityBoard from './pages/CommunityBoard'
import PostDetail from './pages/PostDetail'
import Profile from './pages/Profile'
import WorkoutRoutines from './pages/WorkoutRoutines'
import RoutineDetail from './pages/RoutineDetail'
import Admin from './pages/Admin'
import GymLocator from './pages/GymLocator'
import GymDetail from './pages/GymDetail'
import Achievements from './pages/Achievements'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<StreakLeaderboard />} />
          <Route path="/community" element={<CommunityBoard />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/routines" element={<WorkoutRoutines />} />
          <Route path="/routines/:id" element={<RoutineDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/gyms" element={<GymLocator />} />
          <Route path="/gyms/:gymId" element={<GymDetail />} />
          <Route path="/achievements" element={<Achievements />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
