import { Link } from "react-router-dom";
import { NAV_ITEMS } from "./Header";

export default function MobileDrawer({ open, onClose }) {
  return (
    <div className={`mobile-drawer${open ? " open" : ""}`}>
      <div className="mobile-drawer-overlay" onClick={onClose} />
      <div className="mobile-drawer-panel">
        <button className="mobile-drawer-close" onClick={onClose} aria-label="Close menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {NAV_ITEMS.map((item) => (
          <Link key={item.to} to={item.to} onClick={onClose}>{item.label}</Link>
        ))}
        <Link to="/pickup" className="btn btn-primary" style={{ marginTop: 16 }} onClick={onClose}>
          Order Online
        </Link>
      </div>
    </div>
  );
}
