import { Link } from "react-router-dom";
import { IcMail, IcPhone, IcInsta, IcTikTok, IcFacebook, IcDonut } from "./Icons";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Footer() {
  const { settings } = useSiteSettings();

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
              <li>{settings.addressLine1}</li>
              <li>{settings.addressLine2}</li>
              <li>{settings.hoursDays}, {settings.hoursTime}</li>
            </ul>
          </div>

          <div className="foot-col foot-contact">
            <h4>Contact</h4>
            <ul>
              <li><IcMail /><a href={`mailto:${settings.email}`}>{settings.email}</a></li>
              <li><IcPhone /><span>{settings.phone}</span></li>
            </ul>
            <div className="foot-social">
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IcInsta /></a>
              <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><IcTikTok /></a>
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IcFacebook /></a>
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
