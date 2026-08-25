import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MetricCard from '../components/MetricCard'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { analyticsApi, campaignsApi, influencersApi } from '../api'
import { formatDateRange, formatEngagement, formatNumber } from '../format'
import './Dashboard.css'

export default function AgencyDashboard() {
  const showToast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [campaigns, setCampaigns] = useState([])
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)

  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(Boolean(searchParams.get('invite')))

  const load = useCallback(async () => {
    try {
      const [campaignList, stats] = await Promise.all([campaignsApi.list(), analyticsApi.overview()])
      setCampaigns(campaignList)
      setOverview(stats)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  function closeInvite() {
    setShowInviteModal(false)
    if (searchParams.get('invite')) {
      searchParams.delete('invite')
      setSearchParams(searchParams, { replace: true })
    }
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container dashboard">
        <div className="dashboard-head">
          <div>
            <h1>Dashboard</h1>
            <p>Your campaigns, roster and verified analytics in one place.</p>
          </div>
          <div className="dashboard-head-actions">
            <button className="btn btn-secondary" onClick={() => setShowInviteModal(true)}>
              Invite influencer
            </button>
            <button className="btn btn-primary" onClick={() => setShowCampaignModal(true)}>
              New campaign
            </button>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard label="Total campaigns" value={overview?.total_campaigns ?? 0} loading={loading} />
          <MetricCard label="Influencers" value={overview?.total_influencers ?? 0} loading={loading} />
          <MetricCard
            label="Connected"
            value={overview?.connected_influencers ?? 0}
            hint="Instagram linked"
            loading={loading}
          />
          <MetricCard
            label="Avg engagement"
            value={formatEngagement(overview?.avg_engagement_rate)}
            hint="Across connected creators"
            loading={loading}
          />
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <h2>Your Campaigns</h2>
          </div>

          {loading ? (
            <div className="campaign-grid">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton" style={{ height: 150 }} />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="empty-state card">
              <h3>No campaigns yet</h3>
              <p>Create your first campaign, then invite the creators you're working with.</p>
              <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setShowCampaignModal(true)}>
                Create a campaign
              </button>
            </div>
          ) : (
            <div className="campaign-grid">
              {campaigns.map((c) => (
                <Link key={c.id} to={`/campaigns/${c.id}`} className="campaign-card card card-shadow">
                  <div className="campaign-card-top">
                    <h3>{c.name}</h3>
                    <span className={`badge badge-${c.status === 'active' ? 'purple' : 'gray'}`}>{c.status}</span>
                  </div>
                  <p className="campaign-card-desc">{c.description || 'No description'}</p>
                  <div className="campaign-card-meta">
                    <span>{formatDateRange(c.start_date, c.end_date)}</span>
                    <span>{formatNumber(c.influencer_count)} influencers</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {showCampaignModal && (
        <NewCampaignModal
          onClose={() => setShowCampaignModal(false)}
          onCreated={() => {
            setShowCampaignModal(false)
            load()
          }}
        />
      )}

      {showInviteModal && (
        <InviteModal
          campaigns={campaigns}
          defaultHandle={searchParams.get('handle') || ''}
          onClose={closeInvite}
          onInvited={load}
        />
      )}
    </div>
  )
}

function NewCampaignModal({ onClose, onCreated }) {
  const showToast = useToast()
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' })
  const [saving, setSaving] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await campaignsApi.create(form)
      showToast('Campaign created')
      onCreated()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="New campaign" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Campaign name</label>
          <input className="form-input" value={form.name} onChange={update('name')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows={3} value={form.description} onChange={update('description')} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start date</label>
            <input className="form-input" type="date" value={form.start_date} onChange={update('start_date')} />
          </div>
          <div className="form-group">
            <label className="form-label">End date</label>
            <input className="form-input" type="date" value={form.end_date} onChange={update('end_date')} />
          </div>
        </div>
        <button className="btn btn-primary btn-block" disabled={saving}>
          {saving ? <span className="spinner" /> : 'Create campaign'}
        </button>
      </form>
    </Modal>
  )
}

function InviteModal({ campaigns, defaultHandle, onClose, onInvited }) {
  const showToast = useToast()
  const [email, setEmail] = useState('')
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id || '')
  const [sending, setSending] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    try {
      const data = await influencersApi.invite({ email, campaign_id: campaignId || undefined })
      if (data.invite_link) {
        setInviteLink(data.invite_link)
        showToast('Invite created — share the link')
      } else {
        showToast('This influencer already has an account and was added to the campaign')
      }
      onInvited()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSending(false)
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(inviteLink)
    showToast('Link copied')
  }

  return (
    <Modal title="Invite an influencer" onClose={onClose}>
      {defaultHandle && (
        <p className="invite-prefill">
          Inviting <strong>@{defaultHandle}</strong> — enter the email you have for them.
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Campaign</label>
          <select className="form-select" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">No campaign (roster only)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Influencer email</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="creator@email.com"
            required
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={sending}>
          {sending ? <span className="spinner" /> : 'Send invite'}
        </button>
      </form>

      {inviteLink && (
        <div className="invite-link-box">
          <span className="invite-link-label">Share this link</span>
          <div className="invite-link-row">
            <code>{inviteLink}</code>
            <button className="btn btn-secondary btn-sm" onClick={copyLink}>
              Copy
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
