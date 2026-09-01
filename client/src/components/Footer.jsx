import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-mark" />
            JustInfluence
          </div>
          <p>Verified influencer analytics for agencies who are done guessing.</p>
        </div>

        <nav className="footer-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#pricing">Contact</a>
          <a href="#privacy">Privacy</a>
        </nav>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} JustInfluence. All rights reserved.</div>
    </footer>
  )
}
