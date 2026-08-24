import { useState, useMemo } from "react";
import { CATEGORIES } from "../data/categories";
import FoodCard from "../components/FoodCard";
import CartList from "../components/CartList";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";
import { IcDonut, IcTub, IcBread, IcCakeSlice, IcCup } from "../components/Icons";
import { asset } from "../lib/assetUrl";

const CATEGORY_ICONS = {
  bagels: IcDonut,
  "cream-cheese": IcTub,
  "salt-bread": IcBread,
  dessert: IcCakeSlice,
  coffee: IcCup,
};

export default function Menu() {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [activeSubcat, setActiveSubcat] = useState(CATEGORIES[0].subcategories?.[0]?.id ?? null);
  const { addToCart } = useCart();
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
            Tap <strong>Add to Cart</strong> on any item &mdash; your order builds in the cart on the right.
          </p>
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

              {addonList.length > 0 && (
                <div className="addons-panel">
                  <h4>{activeCategory.label} Add-ons</h4>
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

              <div className="card-grid">
                {visibleItems.map((id) => (
                  <FoodCard key={id} id={id} />
                ))}
              </div>

              <div className="set-row">
                <div className="set-banner">
                  <img src={asset("/assets/images/sandwich-set.jpg")} alt="Bagel set" />
                  <div className="set-banner-info">
                    <h3 style={{ fontSize: "1.2rem" }}>Make It A Set</h3>
                    <p style={{ color: "var(--body)", fontSize: ".9rem" }}>Any Bagel + Cream Cheese + Coffee</p>
                    <div className="set-banner-row">
                      <div className="price">From $12.50</div>
                      <button className="btn btn-primary" onClick={() => addToCart("set-classic", 1)}>
                        Add Set to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="menu-cart-panel">
            <div className="cart-head">
              <h3 style={{ fontSize: "1.05rem" }}>Your Order</h3>
            </div>
            <CartList />
          </aside>
        </div>
      </div>
    </section>
  );
}
