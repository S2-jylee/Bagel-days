import { Link } from "react-router-dom";
import { UberEatsButton, DoorDashButton } from "../components/DeliveryButtons";
import HeroCarousel from "../components/HeroCarousel";
import { IcTub, IcCup, IcBag, IcPin } from "../components/Icons";
import { usePageContent } from "../context/PageContentContext";
import { useSeo } from "../lib/seo";

const DEFAULT_CONTENT = {
  title: "Pickup Order",
  tagline: "Fresh bagels, ready when you are.",
  description: "Order your favourite bagels and drinks for pickup or delivery. Freshly made, carefully packed, ready for you.",
  images: ["/assets/images/hero-main.jpg"],
};

const IcBagel = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/></svg>
);

const HIGHLIGHTS = [
  { ic: IcBagel, title: "Freshly Made", desc: "Every morning, in small batches." },
  { ic: IcTub, title: "House-Made Cream Cheese", desc: "Prepared fresh, several flavours." },
  { ic: IcCup, title: "Campos Specialty Coffee", desc: "Brewed to order, every time." },
  { ic: IcBag, title: "Ready for Takeaway", desc: "Carefully packed, ready to go." },
];

export default function Pickup() {
  useSeo({
    title: "Bagel Days | Order Online — Pickup & Delivery, Fortitude Valley",
    description: "Order Bagel Days for pickup, or get delivery via Uber Eats and DoorDash. Freshly made bagels, house-made cream cheese, and Campos Specialty Coffee, ready when you are.",
    path: "/pickup",
  });

  const { pages } = usePageContent();
  const content = pages.pickup || DEFAULT_CONTENT;

  return (
    <>
      <section className="hero home-hero hero-photo-fit">
        <div className="wrap hero-fit-wrap">
          <HeroCarousel images={content.images} imgClassName="hero-fit-img" imgStyle={{ maxWidth: "min(100%, 1470px)" }} />
          <div className="hero-content">
            <h1>{content.title}</h1>
            <p className="script" style={{ fontSize: "1.15rem", marginTop: 8 }}>{content.tagline}</p>
            <p className="lede hero-overlay-sub">{content.description}</p>
            <span className="sr-only">Bagel and coffee ready for order</span>
          </div>
        </div>
      </section>

      <div className="hero-fit-subtext wrap">
        <p className="lede">{content.description}</p>
      </div>

      <section className="pickup-order-section">
        <div className="wrap">
          <div className="section-head center">
            <h2>Choose Your Way to Order</h2>
          </div>
          <div className="delivery-buttons">
            <UberEatsButton />
            <DoorDashButton />
          </div>

          <div className="pickup-highlights">
            {HIGHLIGHTS.map(({ ic: Ic, title, desc }) => (
              <div className="pickup-highlight" key={title}>
                <div className="ic"><Ic /></div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>

          <div className="mini-find">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="ic" style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--maroon)" }}>
                <IcPin />
              </div>
              <div>
                <h4 style={{ color: "var(--ink)", fontSize: "1rem" }}>Need to find us?</h4>
                <p style={{ fontSize: ".9rem" }}>Shop 1, 29 Robertson Street, Fortitude Valley QLD 4006</p>
              </div>
            </div>
            <Link to="/visit" className="btn btn-ghost btn-sm">View on Google Maps</Link>
          </div>
        </div>
      </section>
    </>
  );
}
