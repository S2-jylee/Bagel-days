import { useState } from "react";
import { IcBag, IcChat, IcMail, IcInsta, IcTikTok, IcFacebook, IcPhone, IcExternal } from "../components/Icons";
import { asset } from "../lib/assetUrl";

const SOCIAL_LINKS = [
  { ic: IcInsta, label: "Instagram", value: "@bageldays.au", href: "https://www.instagram.com/bageldays.au/" },
  { ic: IcTikTok, label: "TikTok", value: "@bageldays.au", href: "https://www.tiktok.com/@bageldays.au" },
  { ic: IcFacebook, label: "Facebook", value: "Bagel Days (@bageldaysau)", href: "https://www.facebook.com/bageldays.au/" },
];

// TODO: replace with your real Formspree (or similar) endpoint — sign up free at
// https://formspree.io, create a form connected to bageldays.au@gmail.com,
// and paste the form ID below in place of "TODO_FORM_ID".
const FORM_ENDPOINT = "https://formspree.io/f/TODO_FORM_ID";

export default function Contact() {
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
        setStatus({ text: "Something went wrong. Please email us directly at bagledays.au@gmail.com.", type: "err" });
      }
    } catch {
      setStatus({ text: "Something went wrong. Please email us directly at bagledays.au@gmail.com.", type: "err" });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section className="hero hero-photo-fit" style={{ paddingBottom: 0 }}>
        <div className="wrap hero-fit-wrap">
          <img className="hero-fit-img" src={asset("/assets/images/hero-main-contact.png")} alt="" aria-hidden="true" style={{ maxWidth: "min(100%, 1000px)" }} />
          <div className="hero-content">
            <h1>Contact Us</h1>
            <div className="divider" style={{ margin: "14px 0" }}></div>
            <p className="script hero-overlay-sub" style={{ fontSize: "1.2rem" }}>We'd love to hear from you.</p>
            <p className="lede hero-overlay-sub" style={{ marginTop: 14 }}>
              Have a question, catering enquiry, or collaboration idea? Send us a message and we'll get back to you as soon as possible.
            </p>
            <span className="sr-only">Bagel Days coffee and bagel to go</span>
          </div>
        </div>
      </section>

      <div className="hero-fit-subtext wrap">
        <p className="script" style={{ fontSize: "1.2rem" }}>We'd love to hear from you.</p>
        <p className="lede" style={{ marginTop: 14 }}>
          Have a question, catering enquiry, or collaboration idea? Send us a message and we'll get back to you as soon as possible.
        </p>
      </div>

      <section style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="contact-layout">
            <div className="contact-card">
              <h4><IcBag /> Catering &amp; Bulk Orders</h4>
              <div className="divider left"></div>
              <p>Planning an event or placing a bulk order? Please fill out the contact form, and we'll get back to you as soon as possible.</p>
              <img src={asset("/assets/images/catering-box.png")} alt="Catering box with sandwiches and a drink, ready for pickup" className="contact-card-img" />
            </div>

            <div className="contact-card">
              <h4><IcChat /> Send Us a Message</h4>
              <div className="divider left"></div>
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
                <p className="todo-note">
                  TODO: this form posts to Formspree (or a similar form-to-email service). Create a free account, connect a form to{" "}
                  <strong>bagledays.au@gmail.com</strong>, then replace <code>TODO_FORM_ID</code> in <code>src/pages/Contact.jsx</code> with your real form ID so submissions land in your inbox automatically.
                </p>
              </form>
            </div>

            <div className="contact-card">
              <h4><IcPhone /> Get in Touch</h4>
              <div className="divider left"></div>
              <ul className="get-in-touch">
                <li>
                  <span className="ic"><IcMail /></span>
                  <div className="git-text">
                    <span className="git-label">Email</span>
                    <a href="mailto:bageldays.au@gmail.com" className="git-value">bageldays.au@gmail.com</a>
                  </div>
                </li>
                {SOCIAL_LINKS.map(({ ic: Ic, label, value, href }) => (
                  <li key={label}>
                    <span className="ic"><Ic /></span>
                    <div className="git-text">
                      <span className="git-label">{label}</span>
                      <a href={href} target="_blank" rel="noopener noreferrer" className="git-value">{value}</a>
                    </div>
                    <span className="git-ext"><IcExternal /></span>
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
