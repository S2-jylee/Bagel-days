import { useState } from "react";
import { createPortal } from "react-dom";
import { useProducts } from "../context/ProductsContext";
import { useCategories } from "../context/CategoriesContext";
import { IcBag } from "./Icons";
import { IcChevron } from "./DeliveryButtons";
import { ORDER_NOW_URL } from "../lib/orderNow";

const IcClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BADGE_LABELS = { signature: "Signature", best: "Best", new: "New" };

export default function FoodCard({ id, small }) {
  const { products } = useProducts();
  const { categories } = useCategories();
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
              <p className={p.setSections.length > 0 ? "product-modal-desc-bold" : undefined}>{p.desc}</p>

              {p.setSections.length > 0 && (
                <div className="modal-set-sections">
                  {p.setSections.map((section, i) => {
                    const choiceText = section.choices
                      .map((c) => {
                        if (c.type === "product") return products[c.productId]?.name;
                        const cat = categories.find((cc) => cc.id === c.categoryId);
                        const scopeLabel = c.subcategoryId ? cat?.subcategories.find((s) => s.id === c.subcategoryId)?.label : cat?.label;
                        return scopeLabel ? `Choose any ${scopeLabel}` : null;
                      })
                      .filter(Boolean)
                      .join(" · ");
                    if (!choiceText) return null;
                    return (
                      <div className="modal-set-section" key={i}>
                        <h4>{section.label}</h4>
                        <p className="modal-set-section-choices">{choiceText}</p>
                      </div>
                    );
                  })}
                </div>
              )}

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
