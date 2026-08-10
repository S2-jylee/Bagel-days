import CartList from "./CartList";

export default function CartDrawer({ open, onClose }) {
  return (
    <div className={`cart-drawer${open ? " open" : ""}`}>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-panel">
        <div className="cart-head">
          <h3>Your Order</h3>
          <button className="cart-close" onClick={onClose} aria-label="Close cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <CartList />
      </div>
    </div>
  );
}
