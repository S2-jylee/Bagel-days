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
// Single-letter versions for the mobile "star" badges, which sit outside the
// card's own edge instead of on top of the photo — a full word wouldn't fit
// a star that small. Sorted to a fixed order (not badge-toggle order) so the
// staggered pair always stacks the same way regardless of which one staff
// added first.
const STAR_LABELS = { signature: "S", best: "B" };
const STAR_ORDER = ["signature", "best"];
// A softened (not sharp-tipped) 5-point star, precomputed by rounding each
// vertex of a plain star polygon — clip-path's polygon() can't curve
// corners, so this needs an actual path with Q (quadratic curve) segments.
const STAR_PATH =
  "M 11.18 3.67 Q 12.00 2.00 12.82 3.67 L 14.12 6.29 Q 14.94 7.95 16.78 8.22 L 19.67 8.64 Q 21.51 8.91 20.18 10.21 " +
  "L 18.09 12.25 Q 16.76 13.55 17.07 15.38 L 17.56 18.26 Q 17.88 20.09 16.23 19.22 L 13.65 17.87 Q 12.00 17.00 10.35 17.87 " +
  "L 7.77 19.22 Q 6.12 20.09 6.44 18.26 L 6.93 15.38 Q 7.24 13.55 5.91 12.25 L 3.82 10.21 Q 2.49 8.91 4.33 8.64 " +
  "L 7.22 8.22 Q 9.06 7.95 9.88 6.29 Z";

export default function FoodCard({ id, small }) {
  const { products } = useProducts();
  const p = products[id];
  const [open, setOpen] = useState(false);

  if (!p) return null;

  const starBadges = [...p.badges].sort((a, b) => STAR_ORDER.indexOf(a) - STAR_ORDER.indexOf(b));

  return (
    <>
      <div className="food-card-wrap">
        {starBadges.map((b, i) => (
          <span key={b} className={`food-card-star food-card-star-${b} food-card-star-pos-${i}`}>
            <svg viewBox="0 0 24 24" className="food-card-star-shape"><path d={STAR_PATH} /></svg>
            <span className="food-card-star-label">{STAR_LABELS[b]}</span>
          </span>
        ))}
        <div
          className={`food-card${small ? " food-card-small" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(true))}
          aria-label={`View ${p.name} details`}
        >
          <div className="thumb">
            {p.badges.length > 0 && (
              <div className="food-card-badges">
                {p.badges.map((b) => (
                  <span key={b} className={`food-card-badge food-card-badge-${b}`}>{BADGE_LABELS[b]}</span>
                ))}
              </div>
            )}
            <img src={p.img} alt={p.name} />
          </div>
          <div className="body">
            <h4 className="card-name-trigger">{p.name}</h4>
            <div className="card-quick-row">
              <span className="card-price">${p.price.toFixed(2)}</span>
            </div>
          </div>
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
              {p.variants.length > 0 ? (
                <>
                  <h3 className="product-modal-name">{p.name}</h3>
                  <div className="product-modal-title-row">
                    <span className="product-modal-size-label">{p.baseVariantLabel}</span>
                    <span className="product-modal-price">${p.price.toFixed(2)}</span>
                  </div>
                  {p.variants.map((v, i) => (
                    <div className="product-modal-title-row" key={i}>
                      <span className="product-modal-size-label">{v.label}</span>
                      <span className="product-modal-price">${Number(v.price).toFixed(2)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="product-modal-title-row">
                  <h3>{p.name}</h3>
                  <span className="product-modal-price">${p.price.toFixed(2)}</span>
                </div>
              )}
              <p>{p.desc}</p>

              {p.setItems.length > 0 && (() => {
                const items = p.setItems.map((setId) => products[setId]).filter(Boolean);
                const sum = items.reduce((s, sp) => s + sp.price, 0);
                const discount = sum - p.price;
                return (
                  <div className="modal-addons">
                    <h4>What's Included</h4>
                    <ul className="modal-addon-list-plain">
                      {items.map((sp) => (
                        <li key={sp.id}><span>{sp.name}</span><span className="p">${sp.price.toFixed(2)}</span></li>
                      ))}
                    </ul>
                    <div className="modal-set-totals">
                      <span>Total value: ${sum.toFixed(2)}</span>
                      {discount > 0 && <span className="modal-set-discount">You save ${discount.toFixed(2)}</span>}
                    </div>
                  </div>
                );
              })()}

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
