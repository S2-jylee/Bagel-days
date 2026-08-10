import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link to="/" className="logo">Bagel Days</Link>
            <p className="tag">Hand-rolled, hand-boiled bagels and Campos Specialty Coffee in the heart of Fortitude Valley, Brisbane. TODO: expand with more local detail for SEO.</p>
            <div className="social-row">
              <a href="https://www.instagram.com/bageldays.au/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
              </a>
              <a href="https://www.tiktok.com/@bageldays.au" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82c-.9-.8-1.5-1.9-1.6-3.12h-3.3v13.2c0 1.6-1.3 2.9-2.9 2.9-1.6 0-2.9-1.3-2.9-2.9 0-1.6 1.3-2.9 2.9-2.9.3 0 .6.05.9.14v-3.35c-.3-.04-.6-.06-.9-.06-3.4 0-6.2 2.8-6.2 6.2s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2V9.1c1.2.9 2.7 1.4 4.3 1.4V7.2c-.9 0-1.8-.3-2.7-.9z"/></svg>
              </a>
              <a href="https://www.facebook.com/bageldays.au/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.5-3H13.5V8.2c0-.87.24-1.46 1.5-1.46h1.6V3.6C16.3 3.55 15.3 3.5 14.2 3.5c-2.4 0-4 1.46-4 4.15v2.85H7.7v3h2.5V21h3.3z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/menu">Menu &amp; Order</Link></li>
              <li><Link to="/pickup">Pickup Order</Link></li>
              <li><Link to="/visit">Visit Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>Shop 1, 29 Robertson Street<br />Fortitude Valley QLD 4006</li>
              <li>bagledays.au@gmail.com</li>
              <li>(07) 1234 5678</li>
              <li>Mon &ndash; Sun: 7:00am &ndash; 4:00pm</li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>&copy; 2026 Bagel Days &middot; Fortitude Valley, Brisbane QLD</span>
          <span className="foot-script">Have a Bagel Day!</span>
        </div>
      </div>
    </footer>
  );
}
