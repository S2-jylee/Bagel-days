import { Link } from "react-router-dom";
import { NAV_ITEMS } from "./Header";
import { ORDER_NOW_URL } from "../lib/orderNow";

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
        <a href={ORDER_NOW_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: 16 }} onClick={onClose}>
          Order Online
        </a>
      </div>
    </div>
  );
}
