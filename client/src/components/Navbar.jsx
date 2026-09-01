import { Link, NavLink, useNavigate } from 'react-router-dom'
import { clearSession, getProfile, getRole, getToken } from '../auth'
import './Navbar.css'

export default function Navbar({ variant = 'app' }) {
  const navigate = useNavigate()
  const token = getToken()
  const role = getRole()
  const profile = getProfile()

  function logout() {
    clearSession()
    navigate('/')
  }

  const initials = (profile.name || 'J')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className={`navbar navbar-${variant}`}>
      <div className="navbar-inner">
        <Link to={token ? (role === 'influencer' ? '/influencer/home' : '/dashboard') : '/'} className="navbar-logo">
          <span className="navbar-logo-mark" />
          JustInfluence
        </Link>

        {token && role === 'agency' && (
          <nav className="navbar-links">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard
            </NavLink>
            <NavLink to="/discovery" className={({ isActive }) => (isActive ? 'active' : '')}>
              Discovery
            </NavLink>
          </nav>
        )}

        <div className="navbar-right">
          {token ? (
            <>
              <div className="navbar-user">
                <div className="navbar-avatar">{initials}</div>
                <span className="navbar-username">{profile.name || profile.email}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
