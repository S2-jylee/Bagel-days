import { Link } from "react-router-dom";
import { useCart, fmt } from "../context/CartContext";
import { PRODUCTS } from "../data/products";

export default function CartList({ showCheckoutButton = true }) {
  const { ids, cart, subtotal, setQty, removeFromCart } = useCart();

  return (
    <>
      <div className="cart-items">
        {ids.length === 0 ? (
          <div className="cart-empty">
            Your cart is empty.
            <br />
            Add something delicious from the menu!
          </div>
        ) : (
          ids.map((id) => {
            const p = PRODUCTS[id];
            const qty = cart[id];
            return (
              <div className="cart-item" key={id}>
                <img src={p.img} alt={p.name} />
                <div className="info">
                  <h5>{p.name}</h5>
                  <div className="unit mono">{fmt(p.price)} each</div>
                  <div className="qty-row">
                    <button className="qty-btn" onClick={() => setQty(id, qty - 1)}>&#8722;</button>
                    <span className="qty-val">{qty}</span>
                    <button className="qty-btn" onClick={() => setQty(id, qty + 1)}>+</button>
                    <span className="remove-link" onClick={() => removeFromCart(id)}>Remove</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="cart-foot">
        <div className="cart-subtotal">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {showCheckoutButton && (
          <Link
            to="/checkout"
            className="btn btn-primary btn-block"
            aria-disabled={ids.length === 0}
            onClick={(e) => { if (ids.length === 0) e.preventDefault(); }}
            style={ids.length === 0 ? { opacity: 0.5, pointerEvents: "none" } : undefined}
          >
            Checkout
          </Link>
        )}
      </div>
    </>
  );
}
