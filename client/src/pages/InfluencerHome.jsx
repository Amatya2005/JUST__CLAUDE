import { useCallback, useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import ConnectButton from '../components/ConnectButton'
import { useToast } from '../components/Toast'
import { influencersApi } from '../api'
import './InfluencerHome.css'

export default function InfluencerHome() {
  const showToast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setData(await influencersApi.me())
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const influencer = data?.influencer
  const campaigns = data?.campaigns || []

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container influencer-home">
        {loading ? (
          <div className="skeleton" style={{ height: 180 }} />
        ) : (
          <>
            <h1 className="influencer-greeting">Hi {influencer?.name || 'there'} 👋</h1>

            {influencer?.platform_connected ? (
              <div className="card card-shadow connected-card">
                <div className="connected-header">
                  <span className="badge badge-green">Instagram connected ✓</span>
                </div>
                <div className="connected-profile">
                  <div>
                    <span className="connected-label">Handle</span>
                    <strong>@{influencer.instagram_handle || 'your account'}</strong>
                  </div>
                  <div>
                    <span className="connected-label">Sharing with</span>
                    <strong>{influencer.agency_name || '—'}</strong>
                  </div>
                </div>
                <p className="connected-note">
                  Your agency sees verified metrics only — followers, engagement and audience demographics. They
                  never get access to your account.
                </p>
              </div>
            ) : (
              <div className="connect-prompt">
                <span className="connect-prompt-eyebrow">One step left</span>
                <h2>Connect your Instagram</h2>
                <p>
                  Share verified analytics with your agency so they can report on your campaigns without asking you
                  for screenshots.
                </p>
                <ConnectButton phylloUserId={influencer?.phyllo_user_id} onConnected={load} />
              </div>
            )}

            <section className="influencer-campaigns">
              <h2>Your campaigns</h2>
              {campaigns.length === 0 ? (
                <div className="empty-state card">
                  <h3>No campaigns yet</h3>
                  <p>When an agency adds you to a campaign, it'll show up here.</p>
                </div>
              ) : (
                <div className="influencer-campaign-list">
                  {campaigns.map((c) => (
                    <div key={c.id} className="card card-shadow influencer-campaign">
                      <div>
                        <h3>{c.name}</h3>
                        <p>{c.agency_name}</p>
                      </div>
                      <span className={`badge badge-${c.status === 'active' ? 'purple' : 'gray'}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
