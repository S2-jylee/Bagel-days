import { asset, productImageUrl } from "../lib/assetUrl";
import { useSeo } from "../lib/seo";
import { usePageContent } from "../context/PageContentContext";
import { DEFAULT_ABOUT_PHOTOS } from "../lib/aboutPhotos";
import { DEFAULT_ABOUT_CONTENT, aboutIconComponent } from "../lib/aboutContent";

export default function About() {
  useSeo({
    title: "Bagel Days | Our Story — Handmade Bagels in Fortitude Valley",
    description: "Meet Bagel Days: fresh dough made daily, slow cold fermentation, hand-boiled NY-style bagels, house-made cream cheese, and Campos Specialty Coffee in Fortitude Valley, Brisbane.",
    path: "/about",
  });

  const { pages } = usePageContent();
  const aboutPhotos = pages.about?.aboutPhotos || {};
  const overrides = pages.about?.aboutContent || {};
  // A slot's admin-uploaded URL if set, else the bundled default for it.
  const photo = (slot) => productImageUrl(aboutPhotos[slot] || DEFAULT_ABOUT_PHOTOS[slot]);
  // Each list/array item is merged individually (by index) with its default,
  // so an admin edit to just one field (e.g. only the icon) doesn't lose the
  // rest of that item's still-default text.
  const storyList = DEFAULT_ABOUT_CONTENT.storyList.map((d, i) => ({ ...d, ...(overrides.storyList?.[i] || {}) }));
  const candy = { ...DEFAULT_ABOUT_CONTENT.candy, ...(overrides.candy || {}) };
  const specials = DEFAULT_ABOUT_CONTENT.specials.map((d, i) => ({ ...d, ...(overrides.specials?.[i] || {}) }));

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
              {storyList.map((item, i) => {
                const Ic = aboutIconComponent(item.icon);
                return (
                  <li key={i}>
                    <span className="ic"><Ic /></span>
                    <span>
                      {item.lead && <strong>{item.lead}</strong>} {item.rest}
                    </span>
                  </li>
                );
              })}
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
              <p>{candy.p1}</p>
              <p style={{ marginTop: 10 }}>{candy.p2}</p>
              <p style={{ marginTop: 10 }} className="script">{candy.p3}</p>
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
            {specials.map((s, i) => {
              const Ic = aboutIconComponent(s.icon);
              return (
                <div className="special-item" key={i}>
                  <div className="special-item-text">
                    <div className="special-item-icon"><Ic /></div>
                    <span className="num">{s.num}</span>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                  <div className="thumb"><img src={photo(s.slot)} alt={s.title} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
