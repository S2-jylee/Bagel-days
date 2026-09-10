import { IcWheat, IcPot, IcCup } from "../components/Icons";
import { asset, productImageUrl } from "../lib/assetUrl";
import { useSeo } from "../lib/seo";
import { usePageContent } from "../context/PageContentContext";
import { DEFAULT_ABOUT_PHOTOS } from "../lib/aboutPhotos";

const SPECIALS = [
  { num: "1. FRESH DOUGH DAILY", title: "Made from scratch", desc: "Every morning using quality ingredients.", slot: "special1" },
  { num: "2. SLOW COLD FERMENTATION", title: "Deeper flavour", desc: "Fermented overnight for the perfect chewy texture.", slot: "special2" },
  { num: "3. HAND-BOILED & OVEN-BAKED", title: "NY-style texture", desc: "Every bagel is hand-boiled before baking.", slot: "special3" },
  { num: "4. HOUSE-MADE CREAM CHEESE", title: "Prepared daily", desc: "In a variety of delicious flavours.", slot: "special4" },
  { num: "5. CAMPOS SPECIALTY COFFEE", title: "Perfectly paired", desc: "Proudly serving Campos Specialty Coffee.", slot: "special5" },
];

export default function About() {
  useSeo({
    title: "Bagel Days | Our Story — Handmade Bagels in Fortitude Valley",
    description: "Meet Bagel Days: fresh dough made daily, slow cold fermentation, hand-boiled NY-style bagels, house-made cream cheese, and Campos Specialty Coffee in Fortitude Valley, Brisbane.",
    path: "/about",
  });

  const { pages } = usePageContent();
  const aboutPhotos = pages.about?.aboutPhotos || {};
  // A slot's admin-uploaded URL if set, else the bundled default for it.
  const photo = (slot) => productImageUrl(aboutPhotos[slot] || DEFAULT_ABOUT_PHOTOS[slot]);

  return (
    <>
      <section className="hero about-hero" style={{ paddingBottom: 0 }}>
        <div className="wrap about-hero-wrap">
          <div className="about-hero-badge">
            <img src={asset("/assets/images/logo-mark.jpg")} alt="" />
            <span>Bagel Days</span>
          </div>
          <div>
            <h1>About Us</h1>
            <p className="script" style={{ fontSize: "1.2rem", marginTop: 10 }}>Freshly Baked, Every Morning.</p>
          </div>
        </div>
      </section>

      <section className="split-section">
        <div className="wrap our-story-grid">
          <div className="our-story-photo"><img src={photo("storyMain")} alt="Hand-rolled bagel dough" /></div>
          <div>
            <h2>Our Story</h2>
            <p className="script" style={{ marginTop: 4, marginBottom: 16 }}>Freshly Crafted Every Morning.</p>
            <ul className="story-list">
              <li>
                <span className="ic"><IcWheat /></span>
                <span><strong>Every morning begins with fresh dough.</strong><br />At Bagel Days, every bagel is made from scratch using premium ingredients and slowly cold-fermented overnight to develop its signature flavour and chewy texture.</span>
              </li>
              <li>
                <span className="ic"><IcPot /></span>
                <span><strong>Each bagel is hand-boiled before being baked fresh in the oven,</strong> creating a crisp golden crust and a soft, chewy centre.</span>
              </li>
              <li>
                <span className="ic"><IcCup /></span>
                <span>To complete the experience, we proudly serve <strong>Campos Specialty Coffee</strong> alongside a selection of house-made cream cheeses, freshly prepared every day to pair perfectly with our bagels.</span>
              </li>
            </ul>
          </div>
          <div className="img-duo">
            <img src={photo("storyTop")} alt="Bagels boiling" />
            <img src={photo("storyBottom")} alt="Bagels baking in the oven" />
          </div>
        </div>

        <div className="wrap">
          <div className="mascot-panel">
            <img src={photo("candy")} alt="Candy the Bagel Days mascot" />
            <div>
              <span className="eyebrow">Meet Candy</span>
              <h3 style={{ fontSize: "1.6rem", marginBottom: 12 }}>Our Beloved Mascot</h3>
              <p>Candy, our beloved mascot, is inspired by our own family Bichon Frise. She represents the warmth, happiness, and sense of family that we hope every guest feels when visiting Bagel Days.</p>
              <p style={{ marginTop: 10 }}>We believe freshly baked bagels have the power to bring people together, create meaningful moments, and brighten everyday life.</p>
              <p style={{ marginTop: 10 }} className="script">From our family to yours, we hope every visit to Bagel Days leaves you with a smile.</p>
            </div>
            <img className="mascot-panel-deco" src={asset("/assets/images/mascot-dog.png")} alt="" />
          </div>
        </div>
      </section>

      <section style={{ background: "var(--cream-alt)", borderTop: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="section-head center">
            <h2>What Makes Bagel Days Special</h2>
          </div>
          <div className="special-grid">
            {SPECIALS.map((s) => (
              <div className="special-item" key={s.num}>
                <span className="num">{s.num}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <div className="thumb"><img src={photo(s.slot)} alt={s.title} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
