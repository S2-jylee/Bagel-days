import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FoodCard from "../components/FoodCard";
import { UberEatsButton, DoorDashButton } from "../components/DeliveryButtons";
import { IcLeaf, IcWhisk, IcBean, IcHeart, IcPin, IcClock, IcPhone } from "../components/Icons";
import { asset } from "../lib/assetUrl";
import { supabase } from "../lib/supabase";
import { useProducts } from "../context/ProductsContext";
import { useSeo } from "../lib/seo";

const BEST_SELLERS_COUNT = 6;
// Used to top up the row when real sales data doesn't have 6 products yet
// (e.g. a slow day, or a brand-new item with no orders) — not shown unless needed.
const FALLBACK_BEST_SELLERS = ["bagel-plain", "bagel-blueberry", "salt-bread", "dessert-signature", "bagel-sesame", "bagel-everything"];

export default function Home() {
  useSeo({
    title: "Bagel Days | Fresh Bagels & Coffee, Fortitude Valley Brisbane",
    description: "Hand-rolled, hand-boiled bagels and Campos Specialty Coffee in Fortitude Valley, Brisbane. Order online for pickup, or get delivery via Uber Eats and DoorDash.",
    path: "/",
  });

  const { products } = useProducts();
  const [salesIds, setSalesIds] = useState(null); // null = not loaded yet

  useEffect(() => {
    supabase
      .rpc("get_product_sales_totals")
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => b.total_qty - a.total_qty);
        setSalesIds(sorted.slice(0, BEST_SELLERS_COUNT).map((r) => r.product_id));
      });
  }, []);

  const bestSellerIds = useMemo(() => {
    const ids = [...(salesIds || [])];
    for (const id of FALLBACK_BEST_SELLERS) {
      if (ids.length >= BEST_SELLERS_COUNT) break;
      if (!ids.includes(id) && products[id]?.isActive !== false) ids.push(id);
    }
    return ids.slice(0, BEST_SELLERS_COUNT);
  }, [salesIds, products]);

  return (
    <>
      <section className="hero home-hero hero-photo-fit">
        <div className="wrap hero-fit-wrap">
          <img className="hero-fit-img" src={asset("/assets/images/hero-main.jpg")} alt="" aria-hidden="true" style={{ maxWidth: "min(100%, 1470px)" }} />
          <div className="hero-content">
            <h1>Bagel Days</h1>
            <p className="script" style={{ fontSize: "1.2rem", display: "block", marginTop: 6 }}>
              Freshly Baked, Every Morning.
            </p>
            <p className="lede hero-overlay-sub">
              Fresh bagles, house-made cream cheese<br /> & Campos Specialty Coffee.
            </p>
            <div className="cta-row hero-overlay-sub">
              <Link to="/menu" className="btn btn-primary btn-lg">View Menu</Link>
              <Link to="/pickup" className="btn btn-ghost btn-lg">Order Online</Link>
            </div>
            <span className="sr-only">Bagel Days signature everything bagel and coffee</span>
          </div>
        </div>
      </section>

      <div className="hero-fit-subtext wrap">
        <p className="lede">
          Fresh bagles, house-made cream cheese<br /> & Campos Specialty Coffee.
        </p>
        <div className="cta-row">
          <Link to="/menu" className="btn btn-primary btn-lg">View Menu</Link>
          <Link to="/pickup" className="btn btn-ghost btn-lg">Order Online</Link>
        </div>
      </div>

      <section className="home-widgets">
        <div className="wrap widgets-grid">
          <div className="widget-card widget-bestsellers">
            <div className="widget-head">
              <h3>Best Sellers</h3>
              <Link to="/menu" className="widget-link">View Full Menu &rarr;</Link>
            </div>
            <div className="mini-grid">
              {bestSellerIds.map((id) => (
                <FoodCard key={id} id={id} small />
              ))}
            </div>
          </div>

          <div className="widget-card widget-about">
            <div className="widget-about-badge">
              <img src={asset("/assets/images/mascot-dog.png")} alt="Bagel Days mascot" />
            </div>
            <div className="widget-about-text">
              <h3>About Bagel Days</h3>
              <p className="widget-about-tagline">Fresh bagels. Great coffee. Good days.</p>
              <p>Handmade daily with slow cold fermentation, house-made cream cheese, and Campos Coffee.</p>
              <Link to="/about" className="widget-about-link">Learn More &rarr;</Link>
            </div>
          </div>

          <div className="widget-card widget-order">
            <div className="widget-order-text">
              <h3>Order Online</h3>
              <p>Order your favourites and enjoy Bagel Days wherever you are.</p>
            </div>
            <div className="widget-btn-col">
              <UberEatsButton full />
              <DoorDashButton full />
            </div>
          </div>

          <div className="widget-card">
            <h3>Visit Us</h3>
            <ul className="widget-info-list">
              <li><IcPin /><span>Shop 1, 29 Robertson Street, Fortitude Valley QLD 4006</span></li>
              <li><IcClock /><span>Mon &ndash; Sun, 7:00 AM &ndash; 4:00 PM</span></li>
              <li>
                <IcPhone />
                <a href="tel:+61712345678" className="widget-phone-link">
                  <span>(07) 1234-5678</span>
                  <span className="call-us-badge">Call Us</span>
                </a>
              </li>
            </ul>
            <Link to="/visit" className="btn btn-primary btn-sm">View on Google Maps</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="wrap">
          <div className="feature"><div className="ic"><IcLeaf /></div><div><h4>Fresh &amp; Natural</h4><p>High quality ingredients for the best flavour.</p></div></div>
          <div className="feature"><div className="ic"><IcWhisk /></div><div><h4>Handmade Everyday</h4><p>Bagels and cream cheese made fresh each morning.</p></div></div>
          <div className="feature"><div className="ic"><IcBean /></div><div><h4>Campos Coffee</h4><p>Proudly serving Campos Specialty Coffee.</p></div></div>
          <div className="feature"><div className="ic"><IcHeart /></div><div><h4>Local &amp; Family Owned</h4><p>A place where good food brings people together.</p></div></div>
        </div>
      </section>
    </>
  );
}
