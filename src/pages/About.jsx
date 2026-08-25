import { IcWheat, IcPot, IcCup } from "../components/Icons";
import { asset } from "../lib/assetUrl";
import { useSeo } from "../lib/seo";

const SPECIALS = [
  { num: "1. FRESH DOUGH DAILY", title: "Made from scratch", desc: "Every morning using quality ingredients.", img: asset("/assets/images/dough-rolling.jpg") },
  { num: "2. SLOW COLD FERMENTATION", title: "Deeper flavour", desc: "Fermented overnight for the perfect chewy texture.", img: asset("/assets/images/dough-baking.jpg") },
  { num: "3. HAND-BOILED & OVEN-BAKED", title: "NY-style texture", desc: "Every bagel is hand-boiled before baking.", img: asset("/assets/images/bagel-everything.jpg") },
  { num: "4. HOUSE-MADE CREAM CHEESE", title: "Prepared daily", desc: "In a variety of delicious flavours.", img: asset("/assets/images/cream-plain.jpg") },
  { num: "5. CAMPOS SPECIALTY COFFEE", title: "Perfectly paired", desc: "Proudly serving Campos Specialty Coffee.", img: asset("/assets/images/coffee-flatwhite.jpg") },
];

export default function About() {
  useSeo({
    title: "Bagel Days | Our Story — Handmade Bagels in Fortitude Valley",
    description: "Meet Bagel Days: fresh dough made daily, slow cold fermentation, hand-boiled NY-style bagels, house-made cream cheese, and Campos Specialty Coffee in Fortitude Valley, Brisbane.",
    path: "/about",
  });

  return (
    <>
      <section className="hero" style={{ paddingBottom: 0 }}>
        <div className="wrap" style={{ gridTemplateColumns: "1fr", textAlign: "center" }}>
          <div>
            <h1>Our Story</h1>
            <p className="script" style={{ fontSize: "1.2rem", marginTop: 10 }}>Freshly Crafted Every Morning.</p>
          </div>
        </div>
      </section>

      <section className="split-section">
        <div className="wrap split">
          <div className="img-duo">
            <img src={asset("/assets/images/dough-rolling.jpg")} alt="Hand-rolled bagel dough" />
            <img src={asset("/assets/images/dough-baking.jpg")} alt="Bagels baking in the oven" />
          </div>
          <div>
            <h2>Freshly Crafted Every Morning</h2>
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
            <p>Every item on our menu is freshly made in-house using quality ingredients and crafted with care every day.</p>
          </div>
        </div>

        <div className="wrap">
          <div className="mascot-panel">
            <img src={asset("/assets/images/candy-mascot.png")} alt="Candy the Bagel Days mascot" />
            <div>
              <span className="eyebrow">Meet Candy</span>
              <h3 style={{ fontSize: "1.6rem", marginBottom: 12 }}>Our Beloved Mascot</h3>
              <p>Candy, our beloved mascot, is inspired by our own family Bichon Frise. She represents the warmth, happiness, and sense of family that we hope every guest feels when visiting Bagel Days.</p>
              <p style={{ marginTop: 10 }}>We believe freshly baked bagels have the power to bring people together, create meaningful moments, and brighten everyday life.</p>
              <p style={{ marginTop: 10 }} className="script">From our family to yours, we hope every visit to Bagel Days leaves you with a smile.</p>
            </div>
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
                <div className="thumb"><img src={s.img} alt={s.title} /></div>
                <span className="num">{s.num}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
