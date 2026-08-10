import { useState } from "react";
import { CATEGORIES } from "../data/products";
import FoodCard from "../components/FoodCard";
import CartList from "../components/CartList";
import { useCart } from "../context/CartContext";

export default function Menu() {
  const [active, setActive] = useState(CATEGORIES[0].id);
  const { addToCart } = useCart();
  const activeCategory = CATEGORIES.find((c) => c.id === active);

  return (
    <section className="menu-page-section">
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">Menu &amp; Order</span>
          <h1 style={{ fontSize: "clamp(2.2rem,4vw,3.2rem)" }}>Menu &amp; Order</h1>
          <p style={{ maxWidth: "56ch", color: "var(--body)", margin: "8px auto 0" }}>
            Freshly baked every morning using quality ingredients and our signature slow fermentation process.
            Tap <strong>Add to Cart</strong> on any item &mdash; your order builds in the cart on the right.
          </p>
        </div>

        <div className="menu-tabs" role="tablist">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={active === cat.id ? "active" : ""}
              onClick={() => setActive(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="menu-order-layout">
          <div>
            <div className="menu-category active">
              <h2>{activeCategory.label}</h2>
              <div className="card-grid">
                {activeCategory.items.map((id) => (
                  <FoodCard key={id} id={id} />
                ))}
              </div>

              {active === "bagels" && (
                <div className="set-banner">
                  <img src="/assets/images/sandwich-set.jpg" alt="Bagel set" />
                  <div>
                    <h3 style={{ fontSize: "1.2rem" }}>Make It A Set</h3>
                    <p style={{ color: "var(--body)", fontSize: ".9rem" }}>Any Bagel + Cream Cheese + Coffee</p>
                    <div className="price">From $12.50</div>
                  </div>
                  <button className="btn btn-primary" onClick={() => addToCart("set-classic", 1)}>
                    Add Set to Cart
                  </button>
                </div>
              )}
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
