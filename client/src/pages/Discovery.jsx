import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import InfluencerCard from '../components/InfluencerCard'
import { useToast } from '../components/Toast'
import { discoveryApi } from '../api'
import './Discovery.css'

const PLATFORMS = ['instagram', 'tiktok', 'youtube']

export default function Discovery() {
  const showToast = useToast()
  const navigate = useNavigate()

  const [filters, setFilters] = useState({
    q: '',
    platform: 'instagram',
    minFollowers: '',
    maxFollowers: '',
    minEngagement: '',
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setFilters((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSearch(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
      setResults(await discoveryApi.search(params))
    } catch (err) {
      showToast(err.message, 'error')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function inviteCreator(creator) {
    navigate(`/dashboard?invite=1&handle=${encodeURIComponent(creator.username)}`)
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container discovery">
        <div className="discovery-head">
          <h1>Creator Discovery — Public Data</h1>
          <p>Search creators across platforms, then invite them to connect for verified analytics.</p>
        </div>

        <div className="discovery-banner">
          Data shown is public and not account-verified. Invite an influencer to connect their account for verified
          analytics.
        </div>

        <div className="discovery-layout">
          <aside className="discovery-filters card card-shadow">
            <form onSubmit={handleSearch}>
              <div className="form-group">
                <label className="form-label">Search</label>
                <input
                  className="form-input"
                  value={filters.q}
                  onChange={update('q')}
                  placeholder="Name, handle or niche"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Platform</label>
                <select className="form-select" value={filters.platform} onChange={update('platform')}>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Min followers</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={filters.minFollowers}
                  onChange={update('minFollowers')}
                  placeholder="10000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max followers</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={filters.maxFollowers}
                  onChange={update('maxFollowers')}
                  placeholder="500000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Min engagement rate (%)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  min="0"
                  value={filters.minEngagement}
                  onChange={update('minEngagement')}
                  placeholder="2.5"
                />
              </div>

              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Search'}
              </button>
            </form>
          </aside>

          <section className="discovery-results">
            {loading ? (
              <div className="creator-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 200 }} />
                ))}
              </div>
            ) : results === null ? (
              <div className="empty-state card">
                <h3>Search for creators to get started</h3>
                <p>Try searching a niche or category — "fitness", "travel", "beauty".</p>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-state card">
                <h3>No creators found</h3>
                <p>Try widening your follower range or searching a broader term.</p>
              </div>
            ) : (
              <>
                <div className="discovery-count">{results.length} creators found</div>
                <div className="creator-grid">
                  {results.map((creator) => (
                    <InfluencerCard key={creator.id} creator={creator} onInvite={inviteCreator} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
