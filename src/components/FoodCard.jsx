import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useStock } from "../context/StockContext";
import { PRODUCTS, ADDONS } from "../data/products";
import { IcPlus, IcCheck } from "./Icons";

const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function FoodCard({ id, small }) {
  const p = PRODUCTS[id];
  const { addToCart } = useCart();
  const stock = useStock(id);
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);

  if (!p) return null;

  // No stock number entered in Inventory yet (null) counts as Sold Out, same as 0 —
  // `undefined` means the stock table just hasn't finished loading, so don't flash
  // Sold Out for that split second.
  const soldOut = stock === 0 || stock === null;

  const handleAdd = (addons = []) => {
    addToCart(id, 1, addons);
    setAdded(true);
    setTimeout(() => setAdded(false), 1100);
  };

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) =>
      prev.some((a) => a.name === addon.name)
        ? prev.filter((a) => a.name !== addon.name)
        : [...prev, addon]
    );
  };

  const closeModal = () => {
    setOpen(false);
    setSelectedAddons([]);
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);

  return (
    <>
      <div className={`food-card${small ? " food-card-small" : ""}${soldOut ? " sold-out" : ""}`}>
        <button type="button" className="thumb" onClick={() => setOpen(true)} aria-label={`View ${p.name} details`}>
          <img src={p.img} alt={p.name} />
        </button>
        <div className="body">
          <h4>{p.name}</h4>
          {typeof stock === "number" && stock > 0 && <span className="card-stock">{stock} left</span>}
          {!small && (
            <div className="card-quick-row">
              {soldOut ? (
                <span className="card-sold-out">Sold Out</span>
              ) : (
                <span className="card-price">${p.price.toFixed(2)}</span>
              )}
              <button
                type="button"
                className={`quick-add-btn${added ? " added" : ""}`}
                onClick={() => handleAdd()}
                disabled={soldOut}
                aria-label={`Add ${p.name} to cart`}
              >
                {added ? <IcCheck /> : <IcPlus />}
              </button>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="product-modal-overlay" onClick={closeModal}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="product-modal-close" onClick={closeModal} aria-label="Close">
              <IcClose />
            </button>
            <div className="product-modal-img"><img src={p.img} alt={p.name} /></div>
            <div className="product-modal-body">
              <h3>{p.name}</h3>
              <p>{p.desc}</p>

              <div className="modal-addons">
                <h4>Add-ons</h4>
                <div className="modal-addon-list">
                  {ADDONS.map((a) => {
                    const active = selectedAddons.some((s) => s.name === a.name);
                    return (
                      <button
                        key={a.name}
                        type="button"
                        className={`modal-addon-btn${active ? " active" : ""}`}
                        onClick={() => toggleAddon(a)}
                        disabled={soldOut}
                      >
                        <span>{active ? <IcCheck /> : <IcPlus />} {a.name}</span>
                        <span className="p">${a.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="row">
                {soldOut ? (
                  <span className="card-sold-out">Sold Out</span>
                ) : (
                  <span className="price">${(p.price + addonsTotal).toFixed(2)}</span>
                )}
                <button className={`add-btn${added ? " added" : ""}`} onClick={() => handleAdd(selectedAddons)} disabled={soldOut}>
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
