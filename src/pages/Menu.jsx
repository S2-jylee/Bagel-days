import { useState, useMemo } from "react";
import { CATEGORIES } from "../data/categories";
import FoodCard from "../components/FoodCard";
import { useProducts } from "../context/ProductsContext";
import { IcDonut, IcTub, IcBread, IcCakeSlice, IcCup, IcBag } from "../components/Icons";
import { IcChevron } from "../components/DeliveryButtons";
import { asset } from "../lib/assetUrl";
import { useSeo, SITE_URL } from "../lib/seo";

// Category/subcategory names only — actual prices load async from Supabase
// (see ProductsContext), so a full item-by-item Menu schema isn't reliable here.
const MENU_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Menu",
  name: "Bagel Days Menu",
  url: `${SITE_URL}menu`,
  hasMenuSection: CATEGORIES.map((cat) => ({
    "@type": "MenuSection",
    name: cat.label,
    hasMenuSection: cat.subcategories?.map((sub) => ({ "@type": "MenuSection", name: sub.label })),
  })),
};

const CATEGORY_ICONS = {
  bagels: IcDonut,
  "cream-cheese": IcTub,
  "salt-bread": IcBread,
  dessert: IcCakeSlice,
  coffee: IcCup,
};

// TODO: replace with the store's real OrderNow link (order-now.app/home/list/shop/<id>/)
// once it's issued — orders are placed entirely on OrderNow, not on this site.
const ORDER_NOW_URL = "https://order-now.app/home/list/shop/TODO";

function OrderNowButton({ className = "delivery-btn delivery-btn-direct" }) {
  return (
    <a href={ORDER_NOW_URL} target="_blank" rel="noopener noreferrer" className={className}>
      <IcBag />
      <span>Order Now</span>
      <IcChevron />
    </a>
  );
}

export default function Menu() {
  useSeo({
    title: "Bagel Days | Menu & Order — Bagels, Cream Cheese, Coffee",
    description: "Browse our full menu of hand-boiled bagels, house-made cream cheese, salt bread, desserts, and Campos Specialty Coffee. Order online for pickup in Fortitude Valley, Brisbane.",
    path: "/menu",
    jsonLd: MENU_JSON_LD,
  });

  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [activeSubcat, setActiveSubcat] = useState(CATEGORIES[0].subcategories?.[0]?.id ?? null);
  const { products, addons } = useProducts();

  const activeCategory = CATEGORIES.find((c) => c.id === activeCat);
  const activeSubcategory = activeCategory.subcategories?.find((s) => s.id === activeSubcat) ?? null;
  const visibleItems = useMemo(() => {
    return Object.values(products)
      .filter((p) => p.isActive !== false && p.categoryId === activeCat && (!activeSubcategory || p.subcategoryId === activeSubcat))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => p.id);
  }, [products, activeCat, activeSubcat, activeSubcategory]);
  // Scoped to whichever category tab is active, same as the product grid —
  // otherwise every add-on ever created (cream cheese swaps, coffee syrups,
  // etc.) piles up in one long list regardless of what's being browsed.
  const addonList = useMemo(
    () => Object.values(addons).filter((a) => !a.categoryId || a.categoryId === activeCat),
    [addons, activeCat]
  );

  function selectCategory(cat) {
    setActiveCat(cat.id);
    setActiveSubcat(cat.subcategories?.[0]?.id ?? null);
  }

  return (
    <section className="menu-page-section">
      <div className="wrap">
        <div className="section-head center">
          <h1 style={{ fontSize: "clamp(2.2rem,4vw,3.2rem)" }}>Menu &amp; Order</h1>
          <p style={{ maxWidth: "56ch", color: "var(--body)", margin: "8px auto 0" }}>
            Freshly baked every morning using quality ingredients and our signature slow fermentation process.
            Browse the menu below, then place your order online.
          </p>
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
            <OrderNowButton />
          </div>
        </div>

        <div className="menu-order-layout">
          <nav className="menu-maincats" aria-label="Menu categories">
            <h3 className="menu-maincats-label">Menu</h3>
            {CATEGORIES.map((cat) => {
              const Ic = CATEGORY_ICONS[cat.id];
              return (
                <button
                  key={cat.id}
                  className={activeCat === cat.id ? "active" : ""}
                  onClick={() => selectCategory(cat)}
                >
                  {Ic && <Ic />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="menu-products">
            <div className="menu-category active">
              <h2>{activeCategory.label}</h2>

              {activeCategory.subcategories && (
                <div className="menu-subcat-pills">
                  {activeCategory.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      className={activeSubcat === sub.id ? "active" : ""}
                      onClick={() => setActiveSubcat(sub.id)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="menu-promo-row">
                {addonList.length > 0 && (
                  <div className="addons-panel">
                    <h4>{activeCategory.label} Add-ons</h4>
                    <p className="addons-panel-hint">Available to add when you order.</p>
                    <ul>
                      {addonList.map((a) => (
                        <li key={a.id}>
                          <span>{a.name}</span>
                          <span className="p">${a.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="set-banner-mini">
                  <img src={asset("/assets/images/sandwich-set.jpg")} alt="Bagel set" />
                  <div>
                    <h4>Make It A Set</h4>
                    <p>Any Bagel + Cream Cheese + Coffee</p>
                    <div className="price">From $12.50</div>
                  </div>
                </div>
              </div>

              <div className="card-grid">
                {visibleItems.map((id) => (
                  <FoodCard key={id} id={id} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
