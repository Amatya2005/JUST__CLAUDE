import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import { useToast } from '../components/Toast'
import { authApi } from '../api'
import { saveSession } from '../auth'

export default function AgencySignup() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const data = await authApi.agencySignup({
        name: form.name,
        email: form.email,
        password: form.password,
      })
      saveSession(data.token, 'agency', data.agency)
      showToast('Welcome to JustInfluence')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Run campaigns on numbers you can prove."
      subtitle="Create your agency account and start inviting creators in under two minutes."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p className="auth-form-sub">Free while you're in beta.</p>

        <div className="form-group">
          <label className="form-label">Agency name</label>
          <input
            className="form-input"
            value={form.name}
            onChange={update('name')}
            placeholder="Northlight Media"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Work email</label>
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm password"
          value={form.confirm}
          onChange={update('confirm')}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />

        {error && <div className="form-error">{error}</div>}

        <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Create agency account'}
        </button>

        <div className="auth-alt">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </form>
    </AuthLayout>
  )
}
