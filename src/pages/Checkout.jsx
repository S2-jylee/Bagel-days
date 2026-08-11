import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart, fmt } from "../context/CartContext";
import { PRODUCTS } from "../data/products";

// ---------------------------------------------------------------
// TODO: replace with your real Square sandbox/production credentials.
// Get these from your Square Developer Dashboard: https://developer.squareup.com/apps
const SQUARE_APP_ID = "TODO_SQUARE_APPLICATION_ID";
const SQUARE_LOCATION_ID = "TODO_SQUARE_LOCATION_ID";
// TODO: point this at your real backend endpoint once it's deployed
// (see /server-example in the project root for a reference implementation).
const PAYMENT_ENDPOINT = "/api/process-payment";
const SQUARE_SDK_URL = "https://sandbox.web.squarecdn.com/v1/square.js"; // switch to production URL when going live
// ---------------------------------------------------------------

export default function Checkout() {
  const { ids, cart, subtotal, lineUnitPrice, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState({ text: "", type: "" });
  const [cardReady, setCardReady] = useState(false);
  const cardContainerRef = useRef(null);
  const squareCardRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!window.Square) {
        await loadScript(SQUARE_SDK_URL).catch(() => {});
      }
      if (cancelled) return;
      if (!window.Square) {
        if (cardContainerRef.current) {
          cardContainerRef.current.innerHTML =
            '<p style="font-size:.85rem;color:var(--body);">Payment form could not load (Square SDK unavailable — no network in this preview). It will load normally once this site is hosted with internet access.</p>';
        }
        return;
      }
      try {
        const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
        const card = await payments.card();
        await card.attach(cardContainerRef.current);
        squareCardRef.current = card;
        setCardReady(true);
      } catch (err) {
        console.error(err);
        if (cardContainerRef.current) {
          cardContainerRef.current.innerHTML =
            '<p style="font-size:.85rem;color:var(--maroon);">Payment form failed to load. Check your Square Application ID / Location ID.</p>';
        }
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  async function handlePay() {
    if (!name.trim() || !phone.trim()) {
      setStatus({ text: "Please enter your name and phone number.", type: "err" });
      return;
    }
    if (!squareCardRef.current) {
      setStatus({ text: "Payment form isn't ready yet.", type: "err" });
      return;
    }
    setStatus({ text: "Processing payment...", type: "" });
    try {
      const result = await squareCardRef.current.tokenize();
      if (result.status !== "OK") {
        setStatus({ text: "Card details couldn't be verified. Please check and try again.", type: "err" });
        return;
      }
      const items = ids.map((lid) => {
        const entry = cart[lid];
        const p = PRODUCTS[entry.id];
        return { id: entry.id, name: p.name, qty: entry.qty, unitPrice: lineUnitPrice(lid), addons: entry.addons || [] };
      });
      const payload = {
        sourceId: result.token,
        amount: subtotal,
        currency: "AUD",
        customer: { name, phone, note },
        items,
      };
      const res = await fetch(PAYMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus({ text: "Payment successful! We'll see you soon.", type: "ok" });
        clearCart();
      } else {
        setStatus({ text: "Payment endpoint not connected yet — see the setup note below.", type: "err" });
      }
    } catch (err) {
      console.error(err);
      setStatus({ text: "Payment endpoint not connected yet — see the setup note below.", type: "err" });
    }
  }

  return (
    <section style={{ paddingBottom: 100 }}>
      <div className="wrap">
        <div className="section-head">
          <h1 style={{ fontSize: "clamp(2rem,3.6vw,2.8rem)" }}>Complete Your Order</h1>
          <p style={{ color: "var(--body)", maxWidth: "56ch", marginTop: 8 }}>
            Review your order, add your details, and pay securely by card.
          </p>
        </div>

        <div className="checkout-layout">
          <div>
            <div className="step-block">
              <h3><span className="step-num">1</span> Your Details</h3>
              <div className="form-grid">
                <div className="field">
                  <label>Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="04xx xxx xxx" />
                </div>
                <div className="field full">
                  <label>Pickup Note (optional)</label>
                  <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. pickup around 8:30am" />
                </div>
              </div>
            </div>

            <div className="step-block">
              <h3><span className="step-num">2</span> Payment</h3>
              <div id="card-container" ref={cardContainerRef}>Loading payment form&hellip;</div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={handlePay} disabled={ids.length === 0}>
                Pay {fmt(subtotal)}
              </button>
              {status.text && <p className={`form-status ${status.type}`}>{status.text}</p>}
              <p className="pay-note">Payments are processed securely by Square. Bagel Days does not see or store your card details.</p>
              <div className="todo-note">
                <strong>Setup needed before this goes live:</strong> this checkout uses Square's Web Payments SDK (currently pointed at Square's <em>sandbox</em>) to tokenize the card in the browser. Card tokenization alone can't charge a card &mdash; for security, Square requires a small server-side endpoint that takes this token and calls Square's Payments API with your private access token. TODO: (1) create a Square account &amp; get your Application ID / Location ID, (2) replace <code>SQUARE_APP_ID</code> / <code>SQUARE_LOCATION_ID</code> in <code>src/pages/Checkout.jsx</code>, (3) deploy a backend endpoint at <code>/api/process-payment</code> (a minimal example server is included in <code>/server-example</code>) and point <code>PAYMENT_ENDPOINT</code> at it, (4) switch the SDK URL from sandbox to production when you're ready to take real payments.
              </div>
            </div>
          </div>

          <aside className="checkout-summary">
            <h3 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Order Summary</h3>
            <div>
              {ids.length === 0 ? (
                <div className="cart-empty">Your cart is empty. <Link to="/menu">Browse the menu &rarr;</Link></div>
              ) : (
                ids.map((lid) => {
                  const entry = cart[lid];
                  const p = PRODUCTS[entry.id];
                  const qty = entry.qty;
                  const unitPrice = lineUnitPrice(lid);
                  return (
                    <div className="cart-item" key={lid}>
                      <img src={p.img} alt={p.name} />
                      <div className="info">
                        <h5>{p.name}</h5>
                        <div className="unit mono">{qty} &times; {fmt(unitPrice)}</div>
                        {entry.addons?.length > 0 && (
                          <div className="unit mono" style={{ fontSize: ".72rem" }}>
                            {entry.addons.map((a) => a.name).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="mono" style={{ alignSelf: "center" }}>{fmt(unitPrice * qty)}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="summary-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="summary-row" style={{ color: "var(--body)", fontSize: ".82rem" }}>
              Tax and any delivery fees are calculated by Square at payment.
            </div>
            <div className="summary-total"><span>Total</span><span>{fmt(subtotal)}</span></div>
            <Link to="/menu" className="btn btn-ghost btn-block" style={{ marginTop: 14 }}>&larr; Edit Order</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
