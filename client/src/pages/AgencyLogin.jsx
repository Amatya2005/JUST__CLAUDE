import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import { useToast } from '../components/Toast'
import { authApi } from '../api'
import { saveSession } from '../auth'

export default function AgencyLogin() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [role, setRole] = useState('agency')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (role === 'agency') {
        const data = await authApi.agencyLogin(form)
        saveSession(data.token, 'agency', data.agency)
        navigate('/dashboard')
      } else {
        const data = await authApi.influencerLogin(form)
        saveSession(data.token, 'influencer', data.influencer)
        navigate('/influencer/home')
      }
      showToast('Welcome back')
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Pick up where you left off — your campaigns and creator analytics are waiting."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Log in</h1>
        <p className="auth-form-sub">Choose your account type to continue.</p>

        <div className="role-toggle">
          <button
            type="button"
            className={role === 'agency' ? 'active' : ''}
            onClick={() => setRole('agency')}
          >
            Agency
          </button>
          <button
            type="button"
            className={role === 'influencer' ? 'active' : ''}
            onClick={() => setRole('influencer')}
          >
            Influencer
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="you@agency.com"
            autoComplete="email"
            required
          />
        </div>

        <PasswordInput
          label="Password"
          value={form.password}
          onChange={update('password')}
          placeholder="Your password"
          autoComplete="current-password"
        />

        {error && <div className="form-error">{error}</div>}

        <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Log in'}
        </button>

        <div className="auth-alt">
          New to JustInfluence? <Link to="/signup">Create an agency account</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
