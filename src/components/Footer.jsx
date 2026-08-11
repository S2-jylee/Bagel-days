import { Link } from "react-router-dom";
import { IcMail, IcPhone, IcInsta, IcTikTok, IcFacebook, IcDonut } from "./Icons";

export default function Footer() {
  return (
    <footer>
      <div className="wrap foot-main">
        <div className="foot-brand">
          <Link to="/" className="logo foot-logo">Bagel<br />Days</Link>
        </div>

        <div className="foot-links">
          <div className="foot-col foot-quicklinks">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/menu">Menu &amp; Order</Link></li>
              <li><Link to="/pickup">Order Online</Link></li>
              <li><Link to="/visit">Visit Us</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </div>

          <div className="foot-col">
            <h4>INFO</h4>
            <ul>
              <li>Shop 1, 29 Robertson Street</li>
              <li>Fortitude Valley QLD 4006</li>
              <li>Mon &ndash; Sun, 7:00AM &ndash; 4:00PM</li>
            </ul>
          </div>

          <div className="foot-col foot-contact">
            <h4>Contact</h4>
            <ul>
              <li><IcMail /><a href="mailto:bagledays.au@gmail.com">bagledays.au@gmail.com</a></li>
              <li><IcPhone /><span>(07) 1234 5678</span></li>
            </ul>
            <div className="foot-social">
              <a href="https://www.instagram.com/bageldays.au/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IcInsta /></a>
              <a href="https://www.tiktok.com/@bageldays.au" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><IcTikTok /></a>
              <a href="https://www.facebook.com/bageldays.au/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IcFacebook /></a>
            </div>
          </div>
        </div>

        <div className="foot-tagline">
          <span className="foot-script">Have a Bagel Day!</span>
          <IcDonut />
        </div>
      </div>

      <div className="wrap">
        <div className="foot-bottom">&copy; 2026 Bagel Days. All rights reserved.</div>
      </div>
    </footer>
  );
}
