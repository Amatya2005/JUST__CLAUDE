import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Landing.css'

const FEATURES = [
  {
    title: 'Invite your influencers',
    body: 'Agencies send a magic invite link. Influencers connect their Instagram in one click — no back-and-forth, no screenshots.',
  },
  {
    title: 'Verified analytics',
    body: 'Follower counts, engagement rates and story views pulled directly from the source, not estimated by a third party.',
  },
  {
    title: 'Post-campaign reports',
    body: 'Beautiful dashboards showing reach, impressions and ROI across your full roster — ready to send to the client.',
  },
]

const STEPS = [
  'Agency signs up and creates a campaign',
  'Invite influencers by email — they get a magic link',
  'Influencer connects their Instagram via secure OAuth',
  'Agency sees a live, verified analytics dashboard',
]

export default function Landing() {
  function scrollToFeatures(e) {
    e.preventDefault()
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing">
      <div className="hero">
        <Navbar variant="transparent" />
        <div className="hero-grid-pattern" />
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />

        <div className="hero-content">
          <span className="hero-eyebrow">Built for influencer marketing agencies</span>
          <h1>Connect brands with creators. Measure what matters.</h1>
          <p>
            JustInfluence gives agencies verified influencer analytics — pulled directly from Instagram — and
            beautiful post-campaign reports.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary btn-hero">
              Get started free
            </Link>
            <a href="#features" onClick={scrollToFeatures} className="btn btn-hero btn-hero-secondary">
              See how it works
            </a>
          </div>
        </div>
      </div>

      <section id="features" className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">Features</span>
            <h2>Everything you need to run a campaign</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-card card card-shadow">
                <div className="feature-icon">{String(i + 1).padStart(2, '0')}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-surface">
        <div className="container">
          <div className="section-head">
            <span className="section-eyebrow">How it works</span>
            <h2>From invite to report in four steps</h2>
          </div>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step} className="step">
                <span className="step-number">{i + 1}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="about" className="section">
        <div className="container about-grid">
          <div>
            <span className="section-eyebrow">About</span>
            <h2>No scraping. No guessing.</h2>
            <p className="about-body">
              JustInfluence is built for agencies who are tired of spreadsheets and estimated metrics. We use the
              Instagram Graph API to fetch verified data — the same numbers Meta shows creators in their own
              analytics.
            </p>
            <p className="about-body">
              Every metric on your dashboard is one the creator authorized you to see. That means the numbers in your
              client report hold up under scrutiny.
            </p>
          </div>
          <div className="about-card">
            <div className="about-card-stat">
              <span className="about-card-label">Avg. engagement</span>
              <span className="about-card-value">4.52%</span>
            </div>
            <div className="about-card-divider" />
            <div className="about-card-row">
              <span>Verified followers</span>
              <strong>96.8%</strong>
            </div>
            <div className="about-card-row">
              <span>Audience quality</span>
              <strong>84 / 100</strong>
            </div>
            <div className="about-card-row">
              <span>Data source</span>
              <strong>Instagram Graph API</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="section section-surface pricing">
        <div className="container">
          <h2>Simple per-report pricing. No hidden fees.</h2>
          <p>Request a demo to get started.</p>
          <Link to="/signup" className="btn btn-primary btn-hero">
            Request a demo
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
