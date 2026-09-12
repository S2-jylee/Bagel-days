import { useState } from "react";
import { createPortal } from "react-dom";
import { useProducts, groupAddons } from "../context/ProductsContext";
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

// PC-only enhancement: a section's choices resolved to the real, active
// products they represent (a "choose any X" wildcard expands to every
// matching product), deduped and in catalog order — used to show a photo
// per choice instead of just its name. Mobile keeps the plain-text list
// (see .modal-set-section-choices below) since there's no room for a row
// of photo chips on a narrow screen.
function resolveSectionProducts(section, products) {
  const seen = new Set();
  const result = [];
  for (const choice of section.choices) {
    if (choice.type === "product") {
      const p = products[choice.productId];
      if (p && p.isActive !== false && !seen.has(p.id)) {
        seen.add(p.id);
        result.push(p);
      }
    } else if (choice.type === "category") {
      const matches = Object.values(products).filter(
        (p) => p.isActive !== false && p.categoryId === choice.categoryId && (!choice.subcategoryId || p.subcategoryId === choice.subcategoryId)
      );
      for (const p of matches) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          result.push(p);
        }
      }
    }
  }
  return result.sort((a, b) => a.sortOrder - b.sortOrder);
}

// The full product-detail modal, extracted so it can be opened either as a
// card's own modal or nested on top of another modal (e.g. clicking a Set's
// Bagel/Cream Cheese chip opens that item's own detail over the Set's).
function ProductModal({ id, onClose, nested }) {
  const { products } = useProducts();
  const { categories } = useCategories();
  const p = products[id];
  const [nestedId, setNestedId] = useState(null);

  if (!p) return null;

  return createPortal(
    <div
      className={`product-modal-overlay${nested ? " product-modal-overlay-nested" : ""}`}
      onClick={(e) => {
        // Portals still bubble through the React tree, not the DOM tree —
        // without this, clicking the nested modal's own backdrop would
        // also reach the outer Set modal's overlay and close both at once.
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="product-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="product-modal-close" onClick={onClose} aria-label="Close">
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
                // Same info as the PC chip row below, but as plain text with
                // no photos (no room for them on a narrow screen) — a named
                // product is still clickable, opening its own modal nested
                // on top of this one just like a chip does; a "choose any X"
                // wildcard has no single product to open, so it stays plain.
                const choiceParts = section.choices
                  .map((c) => {
                    if (c.type === "product") {
                      const cp = products[c.productId];
                      return cp ? { type: "product", id: cp.id, label: cp.name } : null;
                    }
                    const cat = categories.find((cc) => cc.id === c.categoryId);
                    const scopeLabel = c.subcategoryId ? cat?.subcategories.find((s) => s.id === c.subcategoryId)?.label : cat?.label;
                    return scopeLabel ? { type: "wildcard", label: `Choose any ${scopeLabel}` } : null;
                  })
                  .filter(Boolean);
                if (choiceParts.length === 0) return null;
                const items = resolveSectionProducts(section, products);
                return (
                  <div className="modal-set-section" key={i}>
                    <h4>{section.label}</h4>
                    <p className="modal-set-section-choices">
                      {choiceParts.map((part, pi) => (
                        <span key={pi}>
                          {pi > 0 && " · "}
                          {part.type === "product" ? (
                            <button type="button" className="set-choice-text-link" onClick={() => setNestedId(part.id)}>{part.label}</button>
                          ) : (
                            part.label
                          )}
                        </span>
                      ))}
                    </p>
                    {items.length > 0 && (
                      <div className="modal-set-section-chips">
                        {items.map((it) => (
                          <button
                            type="button"
                            className="set-choice-chip"
                            key={it.id}
                            onClick={() => setNestedId(it.id)}
                          >
                            <img src={it.img} alt="" />
                            <span>{it.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {p.addons.length > 0 && (
            <div className="modal-addons">
              <h4>Add-ons</h4>
              {groupAddons(p.addons).map((g) => (
                <div className="modal-addons-group" key={g.groupId}>
                  <h5>{g.title}</h5>
                  <ul className="modal-addon-list-plain">
                    {g.options.map((a) => (
                      <li key={a.id}>
                        <span>{a.name}</span>
                        <span className="p">${a.price.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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

      {nestedId && <ProductModal id={nestedId} onClose={() => setNestedId(null)} nested />}
    </div>,
    document.body
  );
}

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

      {open && <ProductModal id={id} onClose={() => setOpen(false)} />}
    </>
  );
}
