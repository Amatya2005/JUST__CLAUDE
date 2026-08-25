import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordInput from '../components/PasswordInput'
import ConnectButton from '../components/ConnectButton'
import { useToast } from '../components/Toast'
import { authApi, influencersApi } from '../api'
import { saveSession } from '../auth'
import './InfluencerJoin.css'

export default function InfluencerJoin() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const showToast = useToast()

  const [invite, setInvite] = useState(null)
  const [inviteError, setInviteError] = useState('')
  const [checking, setChecking] = useState(true)

  const [form, setForm] = useState({ name: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [influencer, setInfluencer] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!token) {
      setInviteError('This invite link is missing its token.')
      setChecking(false)
      return
    }
    authApi
      .getInvite(token)
      .then(setInvite)
      .catch((err) => setInviteError(err.message))
      .finally(() => setChecking(false))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    setSubmitting(true)
    try {
      const data = await authApi.acceptInvite({ token, name: form.name, password: form.password })
      saveSession(data.token, 'influencer', data.influencer)
      setInfluencer(data.influencer)
      setStep(2)
      showToast('Account created')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConnected() {
    setConnected(true)
    try {
      const data = await influencersApi.me()
      setInfluencer(data.influencer)
    } catch {
      // Non-fatal: the success state is already shown.
    }
  }

  if (checking) {
    return (
      <div className="join-status">
        <span className="spinner spinner-dark" />
      </div>
    )
  }

  if (inviteError) {
    return (
      <div className="join-status">
        <div className="card card-shadow join-error-card">
          <h2>Invite not found</h2>
          <p>{inviteError}</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: 18 }}>
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="join-status">
        <div className="join-connect-wrap">
          {connected ? (
            <div className="card card-shadow join-success-card">
              <div className="join-success-icon">✓</div>
              <h2>Instagram connected</h2>
              <p>
                Your agency can now see your verified analytics. You don't need to send screenshots or
                spreadsheets again.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/influencer/home')}>
                Go to your dashboard
              </button>
            </div>
          ) : (
            <div className="join-connect-card">
              <span className="join-step-label">Step 2 of 2</span>
              <h2>Connect your Instagram to share your analytics with your agency</h2>
              <p>
                We use a secure OAuth connection. JustInfluence never sees your password, and you can disconnect
                any time.
              </p>
              <ConnectButton phylloUserId={influencer?.phyllo_user_id} onConnected={handleConnected} />
              <button className="join-skip" onClick={() => navigate('/influencer/home')}>
                I'll do this later
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <AuthLayout
      title="You've been invited to join JustInfluence."
      subtitle={`${invite?.agency_name || 'An agency'} wants to work with you. Set up your account to share verified analytics.`}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <span className="join-step-label">Step 1 of 2</span>
        <h1>Create your account</h1>
        <p className="auth-form-sub">
          Invited by <strong>{invite?.agency_name}</strong>
        </p>

        <div className="form-group">
          <label className="form-label">Your name</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Priya Sharma"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={invite?.email || ''} disabled />
        </div>

        <PasswordInput
          label="Password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={submitting}>
          {submitting ? <span className="spinner" /> : 'Create your account'}
        </button>
      </form>
    </AuthLayout>
  )
}
