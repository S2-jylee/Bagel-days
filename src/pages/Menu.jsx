import { useState, useMemo, useEffect, useRef } from "react";
import { useCategories } from "../context/CategoriesContext";
import FoodCard from "../components/FoodCard";
import { useProducts } from "../context/ProductsContext";
import { IcDonut, IcTub, IcBread, IcCakeSlice, IcCup, IcBowl, IcSet, IcPaperBag, IcTag } from "../components/Icons";
import { IcChevron } from "../components/DeliveryButtons";
import { asset } from "../lib/assetUrl";
import { ORDER_NOW_URL } from "../lib/orderNow";
import { useSeo, SITE_URL } from "../lib/seo";

const CATEGORY_ICONS = {
  bagels: IcDonut,
  "cream-cheese": IcTub,
  "salt-bread": IcBread,
  dessert: IcCakeSlice,
  coffee: IcCup,
  side: IcBowl,
  set: IcSet,
};

function OrderNowButton({ className = "delivery-btn delivery-btn-direct" }) {
  return (
    <a href={ORDER_NOW_URL} target="_blank" rel="noopener noreferrer" className={className}>
      <IcPaperBag />
      <span>Order Now</span>
      <IcChevron />
    </a>
  );
}

export default function Menu() {
  const { categories, loading: categoriesLoading } = useCategories();

  // Category/subcategory names only — actual prices load async from Supabase
  // (see ProductsContext), so a full item-by-item Menu schema isn't reliable here.
  const menuJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Menu",
      name: "Bagel Days Menu",
      url: `${SITE_URL}menu`,
      hasMenuSection: categories.map((cat) => ({
        "@type": "MenuSection",
        name: cat.label,
        hasMenuSection: cat.subcategories?.map((sub) => ({ "@type": "MenuSection", name: sub.label })),
      })),
    }),
    [categories]
  );

  useSeo({
    title: "Bagel Days | Menu & Order — Bagels, Cream Cheese, Coffee",
    description: "Browse our full menu of hand-boiled bagels, house-made cream cheese, salt bread, desserts, and Campos Specialty Coffee. Order online for pickup in Fortitude Valley, Brisbane.",
    path: "/menu",
    jsonLd: menuJsonLd,
  });

  const [activeCat, setActiveCat] = useState(categories[0].id);
  const [activeSubcat, setActiveSubcat] = useState(categories[0].subcategories?.[0]?.id ?? null);
  const { products, addons } = useProducts();

  // Same fix as admin's MenuManager: activeCat/activeSubcat above
  // initialize from DEFAULT_CATEGORIES (a static placeholder shown only
  // until the real, admin-sorted list loads from Supabase), so they could
  // lock onto that placeholder's first category (Bagels) forever instead
  // of whichever one is actually first in the real sort order (e.g. Set,
  // once moved to the top). Sync once, the first time real data arrives.
  const didSyncInitialCategory = useRef(false);
  useEffect(() => {
    if (categoriesLoading || didSyncInitialCategory.current) return;
    didSyncInitialCategory.current = true;
    const first = categories[0];
    setActiveCat(first.id);
    setActiveSubcat(first.subcategories?.[0]?.id ?? null);
  }, [categoriesLoading, categories]);

  const activeCategory = categories.find((c) => c.id === activeCat) ?? categories[0];
  const activeSubcategory = activeCategory.subcategories?.find((s) => s.id === activeSubcat) ?? null;
  // Split into a "Best Menu" row (staff-picked per category in Admin, capped
  // at 6) and everything else — kept as two separate id lists so they render
  // as two visually distinct sections instead of one grid. Best Menu is
  // shared across the whole category regardless of which subcategory tab is
  // open (it's not itself filtered by subcategory) — only the regular list
  // below it changes per tab.
  const { bestIds, regularIds } = useMemo(() => {
    const inCategory = Object.values(products).filter((p) => p.isActive !== false && p.categoryId === activeCat);
    const best = inCategory
      .filter((p) => p.isCategoryBest)
      .sort((a, b) => (a.categoryBestOrder ?? 0) - (b.categoryBestOrder ?? 0))
      .map((p) => p.id);
    // A product with no subcategory set always shows, regardless of which
    // subcategory tab is active — otherwise it's invisible on every tab
    // except "no filter", which isn't reachable once a category has any
    // subcategories (the first one is always selected by default). Best
    // Menu items are NOT excluded here — All Items is meant to show every
    // product in the category regardless of its Best Menu status, so a
    // best-marked item appears in both sections rather than vanishing
    // from the regular list once it's promoted.
    const regular = inCategory
      .filter((p) => !activeSubcategory || !p.subcategoryId || p.subcategoryId === activeSubcat)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => p.id);
    return { bestIds: best, regularIds: regular };
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

  function goToSetCategory() {
    const setCategory = categories.find((c) => c.id === "set");
    if (setCategory) selectCategory(setCategory);
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
          <div className="menu-order-now-row">
            <OrderNowButton />
          </div>
        </div>

        <div className="menu-order-layout">
          <nav className="menu-maincats" aria-label="Menu categories">
            <h3 className="menu-maincats-label">Menu</h3>
            {categories.map((cat) => {
              const Ic = CATEGORY_ICONS[cat.id] || IcTag;
              return (
                <button
                  key={cat.id}
                  className={activeCat === cat.id ? "active" : ""}
                  onClick={() => selectCategory(cat)}
                >
                  {cat.iconUrl ? <img src={cat.iconUrl} alt="" className="menu-maincats-icon" /> : <Ic />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="menu-products">
            <div className="menu-category active">
              <h2>{activeCategory.label}</h2>

              {activeCategory.subcategories.length > 0 && (
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

              {bestIds.length > 0 && (
                <div className="menu-best-section">
                  <div className="card-grid menu-best-grid">
                    {bestIds.map((id) => (
                      <FoodCard key={id} id={id} />
                    ))}
                  </div>
                </div>
              )}

              {bestIds.length > 0 && <hr className="menu-section-divider" />}

              <div className="menu-promo-row">
                <div className="card-grid">
                  {regularIds.map((id) => (
                    <FoodCard key={id} id={id} />
                  ))}
                </div>

                <div className="menu-promo-col">
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

                  <div
                    className="set-banner-mini"
                    role="button"
                    tabIndex={0}
                    onClick={goToSetCategory}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), goToSetCategory())}
                  >
                    <img src={asset("/assets/images/sandwich-set.jpg")} alt="Bagel set" className="set-banner-mini-img" />
                    <div className="set-banner-mini-text">
                      <h4>Make It A Set</h4>
                      <p>Enjoy our great-value set menu!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
