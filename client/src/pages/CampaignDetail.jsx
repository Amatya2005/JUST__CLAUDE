import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MetricCard from '../components/MetricCard'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { campaignsApi, devApi } from '../api'
import { formatDateRange, formatEngagement, formatNumber, formatPercent } from '../format'
import './CampaignDetail.css'

const POLL_INTERVAL_MS = 30000

function statusFor(influencer) {
  if (influencer.follower_count != null) return { label: 'Data ready', className: 'badge-purple' }
  if (influencer.platform_connected) return { label: 'Connected', className: 'badge-green' }
  return { label: 'Pending', className: 'badge-gray' }
}

export default function CampaignDetail() {
  const { id } = useParams()
  const showToast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = useCallback(
    async (quiet = false) => {
      try {
        const result = await campaignsApi.get(id)
        setData(result)
      } catch (err) {
        if (!quiet) showToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    },
    [id, showToast]
  )

  useEffect(() => {
    load()
    const timer = setInterval(() => load(true), POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [load])

  async function simulateConnect(influencerId) {
    try {
      await devApi.simulateConnect(influencerId)
      showToast('Simulated connection — analytics fetched')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const campaign = data?.campaign
  const influencers = data?.influencers || []

  const connected = influencers.filter((i) => i.platform_connected)
  const totalReach = influencers.reduce((sum, i) => sum + (Number(i.follower_count) || 0), 0)
  const withEngagement = influencers.filter((i) => i.engagement_rate != null)
  const avgEngagement = withEngagement.length
    ? withEngagement.reduce((sum, i) => sum + Number(i.engagement_rate), 0) / withEngagement.length
    : 0

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container campaign-detail">
        <Link to="/dashboard" className="back-link">
          ← Back to dashboard
        </Link>

        {loading ? (
          <div className="skeleton" style={{ height: 220, marginTop: 20 }} />
        ) : !campaign ? (
          <div className="empty-state card">
            <h3>Campaign not found</h3>
            <p>It may have been deleted, or belongs to another agency.</p>
          </div>
        ) : (
          <>
            <header className="campaign-header">
              <div>
                <h1>{campaign.name}</h1>
                <div className="campaign-header-meta">
                  <span className={`badge badge-${campaign.status === 'active' ? 'purple' : 'gray'}`}>
                    {campaign.status}
                  </span>
                  <span>{formatDateRange(campaign.start_date, campaign.end_date)}</span>
                </div>
                {campaign.description && <p className="campaign-header-desc">{campaign.description}</p>}
              </div>
              <Link to="/dashboard?invite=1" className="btn btn-primary">
                Invite influencer
              </Link>
            </header>

            <section className="roster">
              <h2>Influencer roster</h2>
              {influencers.length === 0 ? (
                <div className="empty-state card">
                  <h3>No influencers yet</h3>
                  <p>Invite creators to this campaign to start collecting verified analytics.</p>
                </div>
              ) : (
                <div className="table-wrap card card-shadow">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Instagram</th>
                        <th>Status</th>
                        <th>Followers</th>
                        <th>Engagement</th>
                        <th>Avg likes</th>
                        <th>Audience score</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {influencers.map((inf) => {
                        const status = statusFor(inf)
                        return (
                          <tr key={inf.id}>
                            <td>
                              <strong>{inf.name || '—'}</strong>
                              <div className="roster-email">{inf.email}</div>
                            </td>
                            <td>{inf.instagram_handle ? `@${inf.instagram_handle}` : '—'}</td>
                            <td>
                              <span className={`badge ${status.className}`}>{status.label}</span>
                            </td>
                            <td>{inf.follower_count != null ? formatNumber(inf.follower_count) : '—'}</td>
                            <td>{formatEngagement(inf.engagement_rate)}</td>
                            <td>{inf.avg_likes != null ? formatNumber(Math.round(inf.avg_likes)) : '—'}</td>
                            <td>
                              {inf.audience_quality_score != null
                                ? `${Math.round(inf.audience_quality_score)}/100`
                                : '—'}
                            </td>
                            <td className="roster-actions">
                              {inf.follower_count != null ? (
                                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(inf)}>
                                  View analytics
                                </button>
                              ) : (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => simulateConnect(inf.id)}
                                  title="Dev helper: simulate a Phyllo connection"
                                >
                                  Simulate connect
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="campaign-summary">
              <h2>Campaign summary</h2>
              <div className="metric-grid">
                <MetricCard label="Total reach" value={formatNumber(totalReach)} hint="Sum of followers" />
                <MetricCard label="Avg engagement" value={formatEngagement(avgEngagement)} />
                <MetricCard label="Connected" value={`${connected.length} / ${influencers.length}`} />
                <MetricCard label="Pending" value={influencers.length - connected.length} />
              </div>
            </section>
          </>
        )}
      </main>

      {selected && <AnalyticsModal influencer={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function AnalyticsModal({ influencer, onClose }) {
  const ageRows = [
    { label: '13-17', value: influencer.age_13_17_pct },
    { label: '18-24', value: influencer.age_18_24_pct },
    { label: '25-34', value: influencer.age_25_34_pct },
    { label: '35-44', value: influencer.age_35_44_pct },
    { label: '45+', value: influencer.age_45_plus_pct },
  ].filter((r) => r.value != null)

  return (
    <Modal title={influencer.name || influencer.email} onClose={onClose}>
      <div className="analytics-panel">
        <div className="analytics-head">
          <span className="analytics-handle">@{influencer.instagram_handle || 'creator'}</span>
          {influencer.is_verified && <span className="badge badge-purple">Verified</span>}
        </div>

        <div className="analytics-topline">
          <div>
            <span>Followers</span>
            <strong>{formatNumber(influencer.follower_count)}</strong>
          </div>
          <div>
            <span>Following</span>
            <strong>{formatNumber(influencer.following_count)}</strong>
          </div>
          <div>
            <span>Posts</span>
            <strong>{formatNumber(influencer.post_count)}</strong>
          </div>
        </div>

        <div className="analytics-engagement">
          <div>
            <span>Engagement</span>
            <strong>{formatEngagement(influencer.engagement_rate)}</strong>
          </div>
          <div>
            <span>Avg likes</span>
            <strong>{formatNumber(Math.round(influencer.avg_likes || 0))}</strong>
          </div>
          <div>
            <span>Avg comments</span>
            <strong>{formatNumber(Math.round(influencer.avg_comments || 0))}</strong>
          </div>
        </div>

        <div className="analytics-section">
          <h4>Audience demographics</h4>
          <div className="analytics-facts">
            <span>
              Quality score <strong>{Math.round(influencer.audience_quality_score || 0)}/100</strong>
            </span>
            <span>
              Fake followers <strong>{formatPercent(influencer.fake_follower_pct, 1)}</strong>
            </span>
            <span>
              Top country <strong>{influencer.top_country || '—'}</strong>
            </span>
          </div>

          {influencer.gender_female_pct != null && (
            <div className="gender-split">
              <div
                className="gender-bar gender-bar-f"
                style={{ width: `${influencer.gender_female_pct}%` }}
                title={`Female ${formatPercent(influencer.gender_female_pct, 0)}`}
              />
              <div
                className="gender-bar gender-bar-m"
                style={{ width: `${influencer.gender_male_pct}%` }}
                title={`Male ${formatPercent(influencer.gender_male_pct, 0)}`}
              />
            </div>
          )}
          {influencer.gender_female_pct != null && (
            <div className="gender-legend">
              <span>♀ {formatPercent(influencer.gender_female_pct, 0)}</span>
              <span>♂ {formatPercent(influencer.gender_male_pct, 0)}</span>
            </div>
          )}

          {ageRows.length > 0 && (
            <div className="age-chart">
              {ageRows.map((row) => (
                <div key={row.label} className="age-row">
                  <span className="age-label">{row.label}</span>
                  <div className="age-track">
                    <div className="age-fill" style={{ width: `${Math.min(100, Number(row.value))}%` }} />
                  </div>
                  <span className="age-value">{formatPercent(row.value, 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {influencer.fetched_at && (
          <div className="analytics-footnote">
            Last updated {new Date(influencer.fetched_at).toLocaleString()}
          </div>
        )}
      </div>
    </Modal>
  )
}
