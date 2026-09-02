import { useState } from "react";
import { IcBag, IcChat, IcMail, IcInsta, IcTikTok, IcFacebook, IcPhone, IcExternal } from "../components/Icons";
import { asset } from "../lib/assetUrl";
import { usePageContent } from "../context/PageContentContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import HeroCarousel from "../components/HeroCarousel";
import { useSeo } from "../lib/seo";

const FORM_ENDPOINT = "https://formspree.io/f/xrpznrnz";

const DEFAULT_CONTENT = {
  title: "Contact Us",
  tagline: "We'd love to hear from you.",
  description: "Have a question, catering enquiry, or collaboration idea? Send us a message and we'll get back to you as soon as possible.",
  images: ["/assets/images/hero-main-contact.png"],
};

export default function Contact() {
  useSeo({
    title: "Bagel Days | Contact Us — Catering & Enquiries",
    description: "Get in touch with Bagel Days for catering, bulk orders, or general enquiries. Follow us on Instagram, TikTok, and Facebook.",
    path: "/contact",
  });

  const { pages } = usePageContent();
  const content = pages.contact || DEFAULT_CONTENT;
  const { settings } = useSiteSettings();
  const socialLinks = [
    { ic: IcInsta, label: "Instagram", value: settings.instagramHandle, href: settings.instagramUrl },
    { ic: IcTikTok, label: "TikTok", value: settings.tiktokHandle, href: settings.tiktokUrl },
    { ic: IcFacebook, label: "Facebook", value: settings.facebookHandle, href: settings.facebookUrl },
  ];

  const [status, setStatus] = useState({ text: "", type: "" });
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus({ text: "Sending...", type: "" });
    const form = e.target;
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setStatus({ text: "Thanks! Your message has been sent — we'll be in touch soon.", type: "ok" });
        form.reset();
      } else {
        setStatus({ text: `Something went wrong. Please email us directly at ${settings.email}.`, type: "err" });
      }
    } catch {
      setStatus({ text: `Something went wrong. Please email us directly at ${settings.email}.`, type: "err" });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="hero hero-photo-fit" style={{ paddingBottom: 0 }}>
        <div className="wrap hero-fit-wrap">
          <HeroCarousel images={content.images} imgClassName="hero-fit-img" imgStyle={{ maxWidth: "min(100%, 1000px)" }} />
          <div className="hero-content">
            <h1>{content.title}</h1>
            <p className="script" style={{ fontSize: "1.2rem" }}>{content.tagline}</p>
            <p className="lede hero-overlay-sub" style={{ marginTop: 14 }}>{content.description}</p>
            <span className="sr-only">Bagel Days coffee and bagel to go</span>
          </div>
        </div>
      </section>

      <div className="hero-fit-subtext wrap">
        <p className="lede">{content.description}</p>
      </div>

      <section style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="contact-layout">
            <div className="contact-card">
              <h4><IcBag /> Catering &amp; Bulk Orders</h4>
              <p>Planning an event or placing a bulk order? Please fill out the contact form, and we'll get back to you as soon as possible.</p>
              <img src={asset("/assets/images/catering-box.png")} alt="Catering box with sandwiches and a drink, ready for pickup" className="contact-card-img" />
            </div>

            <div className="contact-card">
              <h4><IcChat /> Send Us a Message</h4>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-grid">
                  <div className="field"><label>First Name</label><input type="text" name="first_name" required /></div>
                  <div className="field"><label>Last Name</label><input type="text" name="last_name" required /></div>
                  <div className="field full"><label>Email</label><input type="email" name="email" required /></div>
                  <div className="field full"><label>Subject</label><input type="text" name="subject" required /></div>
                  <div className="field full"><label>Message</label><textarea name="message" required></textarea></div>
                </div>
                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 6 }} disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
                </button>
                {status.text && <p className={`form-status ${status.type}`}>{status.text}</p>}
              </form>
            </div>

            <div className="contact-card">
              <h4><IcPhone /> Get in Touch</h4>
              <ul className="get-in-touch">
                <li>
                  <span className="ic"><IcMail /></span>
                  <div className="git-text">
                    <span className="git-label">Email</span>
                    <a href={`mailto:${settings.email}`} className="git-value">{settings.email}</a>
                  </div>
                </li>
                {socialLinks.map(({ ic: Ic, label, value, href }) => (
                  <li key={label}>
                    <span className="ic"><Ic /></span>
                    <div className="git-text">
                      <span className="git-label">{label}</span>
                      <a href={href} target="_blank" rel="noopener noreferrer" className="git-value">{value}</a>
                    </div>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="git-ext" aria-label={`Open ${label}`}><IcExternal /></a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="thank-note">
            <img src={asset("/assets/images/candy-mascot.png")} alt="Candy the mascot" />
            <div>
              <h3 className="script" style={{ fontSize: "1.2rem" }}>Thank you for supporting Bagel Days.</h3>
              <p style={{ marginTop: 6 }}>From our family to yours, thank you for being part of our journey. We can't wait to welcome you soon!</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
