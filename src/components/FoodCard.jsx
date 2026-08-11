import { useState } from "react";
import { useCart } from "../context/CartContext";
import { PRODUCTS } from "../data/products";
import { IcPlus, IcCheck } from "./Icons";

const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function FoodCard({ id, small }) {
  const p = PRODUCTS[id];
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);

  if (!p) return null;

  const handleAdd = () => {
    addToCart(id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  };

  return (
    <>
      <div className={`food-card${small ? " food-card-small" : ""}`}>
        <button type="button" className="thumb" onClick={() => setOpen(true)} aria-label={`View ${p.name} details`}>
          <img src={p.img} alt={p.name} />
        </button>
        <div className="body">
          <h4>{p.name}</h4>
          {!small && (
            <div className="card-quick-row">
              <span className="card-price">${p.price.toFixed(2)}</span>
              <button
                type="button"
                className={`quick-add-btn${added ? " added" : ""}`}
                onClick={handleAdd}
                aria-label={`Add ${p.name} to cart`}
              >
                {added ? <IcCheck /> : <IcPlus />}
              </button>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="product-modal-overlay" onClick={() => setOpen(false)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="product-modal-close" onClick={() => setOpen(false)} aria-label="Close">
              <IcClose />
            </button>
            <div className="product-modal-img"><img src={p.img} alt={p.name} /></div>
            <div className="product-modal-body">
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <div className="row">
                <span className="price">${p.price.toFixed(2)}</span>
                <button className={`add-btn${added ? " added" : ""}`} onClick={handleAdd}>
                  {added ? "Added ✓" : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
