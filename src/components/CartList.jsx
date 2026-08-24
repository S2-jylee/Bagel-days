import { Link } from "react-router-dom";
import { useCart, fmt } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";

export default function CartList({ showCheckoutButton = true }) {
  const { ids, cart, subtotal, lineUnitPrice, setQty, removeFromCart } = useCart();
  const { products } = useProducts();

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
          ids.map((lid) => {
            const entry = cart[lid];
            const p = products[entry.id];
            if (!p) return null;
            const qty = entry.qty;
            const addons = entry.addons || [];
            return (
              <div className="cart-item" key={lid}>
                <img src={p.img} alt={p.name} />
                <div className="info">
                  <h5>{p.name}</h5>
                  <div className="unit mono">{fmt(lineUnitPrice(lid))}</div>
                  {addons.length > 0 && (
                    <ul className="cart-item-addons">
                      {addons.map((a) => (
                        <li key={a.name}>+ {a.name} ({fmt(a.price)})</li>
                      ))}
                    </ul>
                  )}
                  <div className="qty-row">
                    <button className="qty-btn" onClick={() => setQty(lid, qty - 1)}>&#8722;</button>
                    <span className="qty-val">{qty}</span>
                    <button className="qty-btn" onClick={() => setQty(lid, qty + 1)}>+</button>
                    <span className="remove-link" onClick={() => removeFromCart(lid)}>Remove</span>
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
