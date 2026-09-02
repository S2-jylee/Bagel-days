import { IcPin, IcClock, IcMap, IcCar, IcCheck } from "../components/Icons";
import { usePageContent } from "../context/PageContentContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { mapsDirectionsUrl, mapsViewUrl } from "../lib/siteSettings";
import { asset } from "../lib/assetUrl";
import HeroCarousel from "../components/HeroCarousel";
import { useSeo } from "../lib/seo";

const DEFAULT_CONTENT = {
  title: "We Can't Wait to Welcome You!",
  description: "We look forward to welcoming you to Bagel Days. Stop by for freshly baked bagels, house-made cream cheese, and Campos Specialty Coffee.",
  images: ["/assets/images/storefront.jpg"],
};

export default function Visit() {
  useSeo({
    title: "Bagel Days | Visit Us — Location & Hours, Fortitude Valley",
    description: "Find Bagel Days at Shop 1, 29 Robertson Street, Fortitude Valley QLD 4006. Open Monday–Sunday, 7:00 AM–4:00 PM. Get directions and view on Google Maps.",
    path: "/visit",
  });

  const { pages } = usePageContent();
  const content = pages.visit || DEFAULT_CONTENT;
  const { settings } = useSiteSettings();

  return (
    <>
      <section className="hero hero-photo-fit" style={{ paddingBottom: 0 }}>
        <div className="wrap hero-fit-wrap">
          <HeroCarousel images={content.images} imgClassName="hero-fit-img" imgStyle={{ maxWidth: "min(100%, 1600px)" }} />
          <div className="hero-content">
            <h1>{content.title}</h1>
            <p className="lede hero-overlay-sub">{content.description}</p>
            <span className="sr-only">Bagel Days storefront in Fortitude Valley</span>
          </div>
        </div>
      </section>

      <div className="hero-fit-subtext wrap">
        <p className="lede">{content.description}</p>
      </div>

      <section className="visit-loc-section">
        <div className="wrap">
          <div className="loc-cards">
            <div className="loc-card">
              <div className="loc-card-row">
                <div className="ic"><IcPin /></div>
                <div className="loc-card-text">
                  <h4>Address</h4>
                  <p>{settings.addressLine1}</p>
                  <p>{settings.addressLine2}</p>
                  <a href={mapsDirectionsUrl(settings)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Get Directions</a>
                </div>
              </div>
            </div>
            <div className="loc-card">
              <div className="loc-card-row">
                <div className="ic"><IcClock /></div>
                <div className="loc-card-text">
                  <h4>Opening Hours</h4>
                  <p>{settings.hoursDays}</p>
                  <p>{settings.hoursTime}</p>
                </div>
              </div>
            </div>
            <div className="loc-card">
              <div className="loc-card-row">
                <div className="ic"><IcMap /></div>
                <div className="loc-card-text">
                  <h4>Find Us</h4>
                  <p>{settings.findUsText}</p>
                  <a href={mapsViewUrl(settings)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>View on Google Maps</a>
                </div>
              </div>
            </div>
          </div>

          <div className="getting-here">
            <div className="ic"><IcCar /></div>
            <div className="getting-here-text">
              <h4 style={{ color: "var(--ink)", fontSize: "1.05rem", marginBottom: 8 }}>Getting Here</h4>
              <p style={{ fontSize: ".92rem" }}>We're conveniently located in the heart of Fortitude Valley.</p>
            </div>
            <ul className="check-list">
              <li><IcCheck /><span>A short walk from Fortitude Valley Station</span></li>
              <li><IcCheck /><span>Bus stops nearby</span></li>
              <li><IcCheck /><span>Easy to find on Robertson Street</span></li>
            </ul>
          </div>

          <div className="closing-note">
            <div className="ic" style={{ width: 60, height: 60, borderRadius: "50%", background: "#fff", overflow: "hidden", margin: "0 auto 14px" }}>
              <img src={asset("/assets/images/ic-heart.png")} alt="" width="60" height="60" />
            </div>
            <h3 className="script" style={{ fontSize: "1.4rem" }}>We look forward to seeing you soon!</h3>
            <p style={{ marginTop: 10 }}>Thank you for choosing Bagel Days. We can't wait to welcome you with freshly baked bagels and great coffee.</p>
          </div>
        </div>
      </section>
    </>
  );
}
