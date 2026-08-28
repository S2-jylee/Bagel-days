import { NavLink, Link } from "react-router-dom";
import { IcInsta, IcTikTok } from "./Icons";
import { asset } from "../lib/assetUrl";

const IcFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.5-3H13.5V8.2c0-.87.24-1.46 1.5-1.46h1.6V3.6C16.3 3.55 15.3 3.5 14.2 3.5c-2.4 0-4 1.46-4 4.15v2.85H7.7v3h2.5V21h3.3z"/></svg>
);

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/menu", label: "Menu & Order" },
  { to: "/pickup", label: "Pickup Order" },
  { to: "/visit", label: "Visit Us" },
  { to: "/contact", label: "Contact" },
];

export default function Header({ onOpenMobileNav }) {
  return (
    <header className="site">
      <div className="nav">
        <Link to="/" className="logo">
          <img src={asset("/assets/images/logo-mark.jpg")} alt="Bagel Days logo" />
          Bagel Days
        </Link>
        <nav className="links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <div className="nav-social">
            <a href="https://www.instagram.com/bageldays.au/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IcInsta /></a>
            <a href="https://www.tiktok.com/@bageldays.au" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><IcTikTok /></a>
            <a href="https://www.facebook.com/bageldays.au/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IcFacebook /></a>
          </div>
          <Link to="/pickup" className="btn btn-primary btn-sm">Order Online</Link>
          <button className="menu-toggle" onClick={onOpenMobileNav} aria-label="Open menu">
            <BurgerIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

function BurgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export { NAV_ITEMS };
