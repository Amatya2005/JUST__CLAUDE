import { Link } from 'react-router-dom'
import '../pages/Auth.css'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      <div className="auth-panel">
        <Link to="/" className="auth-panel-logo">
          <span className="auth-panel-logo-mark" />
          JustInfluence
        </Link>
        <div className="auth-panel-body">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="auth-panel-footnote">
          Verified data from the Instagram Graph API. No scraping, no estimates.
        </div>
      </div>
      <div className="auth-form-side">{children}</div>
    </div>
  )
}
