import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import AgencySignup from './pages/AgencySignup'
import AgencyLogin from './pages/AgencyLogin'
import InfluencerJoin from './pages/InfluencerJoin'
import InfluencerHome from './pages/InfluencerHome'
import AgencyDashboard from './pages/AgencyDashboard'
import CampaignDetail from './pages/CampaignDetail'
import Discovery from './pages/Discovery'
import { getRole, getToken } from './auth'

function Protected({ role, children }) {
  const token = getToken()
  if (!token) return <Navigate to="/login" replace />
  if (role && getRole() !== role) {
    return <Navigate to={getRole() === 'influencer' ? '/influencer/home' : '/dashboard'} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<AgencySignup />} />
      <Route path="/login" element={<AgencyLogin />} />
      <Route path="/join" element={<InfluencerJoin />} />
      <Route
        path="/dashboard"
        element={
          <Protected role="agency">
            <AgencyDashboard />
          </Protected>
        }
      />
      <Route
        path="/campaigns/:id"
        element={
          <Protected role="agency">
            <CampaignDetail />
          </Protected>
        }
      />
      <Route
        path="/discovery"
        element={
          <Protected role="agency">
            <Discovery />
          </Protected>
        }
      />
      <Route
        path="/influencer/home"
        element={
          <Protected role="influencer">
            <InfluencerHome />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
