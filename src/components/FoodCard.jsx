import { useState } from "react";
import { createPortal } from "react-dom";
import { useProducts } from "../context/ProductsContext";
import { IcBag } from "./Icons";
import { IcChevron } from "./DeliveryButtons";
import { ORDER_NOW_URL } from "../lib/orderNow";

const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BADGE_LABELS = { signature: "Signature", best: "Best" };

export default function FoodCard({ id, small }) {
  const { products } = useProducts();
  const p = products[id];
  const [open, setOpen] = useState(false);

  if (!p) return null;

  return (
    <>
      <div
        className={`food-card${small ? " food-card-small" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(true))}
        aria-label={`View ${p.name} details`}
      >
        <div className="thumb">
          {p.badge && <span className={`food-card-badge food-card-badge-${p.badge}`}>{BADGE_LABELS[p.badge]}</span>}
          <img src={p.img} alt={p.name} />
        </div>
        <div className="body">
          <h4 className="card-name-trigger">{p.name}</h4>
          {!small && (
            <div className="card-quick-row">
              <span className="card-price">${p.price.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {open && createPortal(
        <div className="product-modal-overlay" onClick={() => setOpen(false)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="product-modal-close" onClick={() => setOpen(false)} aria-label="Close">
              <IcClose />
            </button>
            <div className="product-modal-img"><img src={p.img} alt={p.name} /></div>
            <div className="product-modal-body">
              <div className="product-modal-title-row">
                <h3>{p.name}</h3>
                <span className="product-modal-price">${p.price.toFixed(2)}</span>
              </div>
              {p.variants.map((v, i) => (
                <div className="product-modal-title-row" key={i}>
                  <h3>{v.label}</h3>
                  <span className="product-modal-price">${Number(v.price).toFixed(2)}</span>
                </div>
              ))}
              <p>{p.desc}</p>

              {p.addons.length > 0 && (
                <div className="modal-addons">
                  <h4>Add-ons</h4>
                  <ul className="modal-addon-list-plain">
                    {p.addons.map((a) => (
                      <li key={a.name}>
                        <span>{a.name}</span>
                        <span className="p">${a.price.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <a
                href={ORDER_NOW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="delivery-btn delivery-btn-direct btn-block product-modal-order-btn"
              >
                <IcBag />
                <span>Order Now</span>
                <IcChevron />
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
