import { IcPin, IcClock, IcMap, IcCar, IcCheck } from "../components/Icons";

const MAPS_DIRECTIONS = "https://www.google.com/maps/dir/?api=1&destination=Shop+1%2C+29+Robertson+Street%2C+Fortitude+Valley+QLD+4006";
const MAPS_VIEW = "https://www.google.com/maps/search/?api=1&query=Shop+1%2C+29+Robertson+Street%2C+Fortitude+Valley+QLD+4006";
const MAPS_EMBED = "https://www.google.com/maps?q=Shop+1,+29+Robertson+Street,+Fortitude+Valley+QLD+4006&output=embed";

export default function Visit() {
  return (
    <>
      <section className="hero hero-photo-fit" style={{ paddingBottom: 0 }}>
        <div className="wrap hero-fit-wrap">
          <img className="hero-fit-img" src="/assets/images/storefront.jpg" alt="" aria-hidden="true" style={{ maxWidth: "min(100%, 1600px)" }} />
          <div className="hero-content">
            <h1>We Can't Wait to Welcome You!</h1>
            <p className="lede">We look forward to welcoming you to Bagel Days. Stop by for freshly baked bagels, house-made cream cheese, and Campos Specialty Coffee.</p>
            <span className="sr-only">Bagel Days storefront in Fortitude Valley</span>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="loc-cards">
            <div className="loc-card">
              <div className="loc-card-row">
                <div className="ic"><IcPin /></div>
                <div className="loc-card-text">
                  <h4>Address</h4>
                  <p>Shop 1, 29 Robertson Street</p>
                  <p>Fortitude Valley QLD 4006</p>
                  <a href={MAPS_DIRECTIONS} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>Get Directions</a>
                </div>
              </div>
            </div>
            <div className="loc-card">
              <div className="loc-card-row">
                <div className="ic"><IcClock /></div>
                <div className="loc-card-text">
                  <h4>Opening Hours</h4>
                  <p>Monday &ndash; Sunday</p>
                  <p>7:00 AM &ndash; 4:00 PM</p>
                </div>
              </div>
            </div>
            <div className="loc-card">
              <div className="loc-card-row">
                <div className="ic"><IcMap /></div>
                <div className="loc-card-text">
                  <h4>Find Us</h4>
                  <p>In the heart of Fortitude Valley, just a short walk from Fortitude Valley Station.</p>
                  <a href={MAPS_VIEW} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>View on Google Maps</a>
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
              <img src="/assets/images/ic-heart.png" alt="" width="60" height="60" />
            </div>
            <h3 className="script" style={{ fontSize: "1.4rem" }}>We look forward to seeing you soon!</h3>
            <p style={{ marginTop: 10 }}>Thank you for choosing Bagel Days. We can't wait to welcome you with freshly baked bagels and great coffee.</p>
          </div>
        </div>
      </section>
    </>
  );
}
