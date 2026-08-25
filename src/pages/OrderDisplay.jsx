import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useStaffAuth } from "../lib/useStaffAuth";
import StaffLogin from "../components/StaffLogin";
import Pagination from "../components/Pagination";
import { fmt } from "../context/CartContext";
import { useProducts } from "../context/ProductsContext";
import { CATEGORIES } from "../data/categories";
import { useSeo } from "../lib/seo";

const FETCH_LIMIT = 60;
const PAGE_SIZE = 10;
// TODO: point this at your deployed /server-example (see PAYMENT_ENDPOINT in Checkout.jsx for the same pattern)
const REJECT_ENDPOINT = "/api/reject-order";

// Two-tone "ding-dong" doorbell chime (synthesized, not a sampled sound).
// Takes an already-unlocked AudioContext — see the "Enable sound" tap in the
// component below. Browsers (especially Safari/iOS, common on shop tablets)
// silently block audio that isn't tied to a real user tap, so a context
// created inside a realtime callback never actually makes sound.
function playChime(ctx) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    function tone(freq, start, duration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.28, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    }
    tone(880, 0, 0.55); // "ding" — A5
    tone(659.25, 0.4, 0.7); // "dong" — E5
  } catch {
    // ignore — audio isn't essential, the visual banner still updates
  }
}

function last4(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.slice(-4) || "----";
}

export default function OrderDisplay() {
  useSeo({
    title: "Bagel Days | Order Display",
    description: "Staff order display for Bagel Days.",
    path: "/order-display",
    noindex: true,
  });

  const { session, loading, signIn } = useStaffAuth();
  const { products } = useProducts();
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState(false);
  const [actionError, setActionError] = useState("");
  const isFirstLoad = useRef(true);
  const audioCtxRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Order line items are stored as a denormalized JSON snapshot (id/name at the
  // time of purchase, not FK'd to products), so historical orders still classify
  // correctly even after a product is later edited or deleted — id lookup first,
  // name as a fallback for older orders placed before a product existed with a
  // matching id (e.g. delivery-platform items entered by name only).
  const categoryLookup = useMemo(() => {
    const byProduct = {};
    const byName = {};
    for (const p of Object.values(products)) {
      const cat = CATEGORIES.find((c) => c.id === p.categoryId);
      if (!cat) continue;
      byProduct[p.id] = cat;
      byName[p.name] = cat;
    }
    return { byProduct, byName };
  }, [products]);

  function itemCategory(it) {
    return categoryLookup.byProduct[it.id] || categoryLookup.byName[it.name];
  }

  function orderCategories(order) {
    const map = new Map();
    for (const it of order.items || []) {
      const cat = itemCategory(it);
      if (cat) map.set(cat.id, cat);
    }
    return [...map.values()];
  }

  function enableSound() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      audioCtxRef.current.resume();
      setSoundEnabled(true);
    } catch {
      // ignore — the display still works without sound
    }
  }

  useEffect(() => {
    if (!session) return;

    async function loadRecent() {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("order_no", { ascending: false })
        .limit(FETCH_LIMIT);
      setOrders(data || []);
      isFirstLoad.current = false;
    }
    loadRecent();

    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        setOrders((prev) => [payload.new, ...prev].sort((a, b) => b.order_no - a.order_no).slice(0, FETCH_LIMIT));
        setSelectedId(null); // a new order always takes over the banner
        setPage(1);
        if (!isFirstLoad.current) playChime(audioCtxRef.current);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session]);

  async function selectOrder(o) {
    setSelectedId(o.id);
    setActionError("");
    if (!o.viewed_at) {
      const viewed_at = new Date().toISOString();
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, viewed_at } : x)));
      await supabase.from("orders").update({ viewed_at }).eq("id", o.id).is("viewed_at", null);
    }
  }

  async function acceptOrder(o) {
    await supabase.from("orders").update({ status: "accepted" }).eq("id", o.id);
  }

  async function rejectOrder(o) {
    if (!window.confirm(`Reject order #${o.order_no}? This refunds the customer in full and texts them — this can't be undone.`)) return;
    setRejecting(true);
    setActionError("");
    try {
      const res = await fetch(REJECT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: o.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `server returned ${res.status}`);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setRejecting(false);
    }
  }

  if (loading) return null;
  if (!session) return <StaffLogin title="Order Display Login" onSignIn={signIn} />;

  const latest = orders.find((o) => o.id === selectedId) || orders[0];
  const rest = orders.filter((o) => o.id !== latest?.id);
  const pageCount = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = rest.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="order-display">
      {!soundEnabled && (
        <button type="button" className="order-display-enable-sound" onClick={enableSound}>
          🔔 Tap to enable order sound
        </button>
      )}
      {latest ? (
        <div className="order-display-banner">
          <div className="order-display-banner-no">Order #{latest.order_no}</div>
          <div className="order-display-banner-name">
            {latest.customer_name} <span className="order-display-banner-phone">&middot; ****{last4(latest.customer_phone)}</span>
          </div>
          <ul className="order-display-items">
            {(latest.items || []).map((it, i) => (
              <li key={i} className="order-display-item-row">
                <div className="order-display-item-info">
                  <div className="order-display-item-name">
                    {it.name} &times; {it.qty}
                    {itemCategory(it) && (
                      <span className={`order-cat-badge cat-${itemCategory(it).id}`}>{itemCategory(it).label}</span>
                    )}
                  </div>
                  {it.addons?.length > 0 && (
                    <ul className="order-display-item-addons">
                      {it.addons.map((a, j) => (
                        <li key={j}>&ndash; {a.name} <span>({fmt(a.price)})</span></li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="order-display-item-price">{fmt(it.unitPrice * it.qty)}</div>
              </li>
            ))}
          </ul>
          <div className="order-display-total">Total {fmt(Number(latest.total))}</div>

          {latest.status === "pending" && (
            <div className="order-display-actions">
              <button type="button" className="btn-accept" onClick={() => acceptOrder(latest)} disabled={rejecting}>
                Accept
              </button>
              <button type="button" className="btn-reject" onClick={() => rejectOrder(latest)} disabled={rejecting}>
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          )}
          {latest.status === "accepted" && <div className="order-display-status-badge accepted">Accepted</div>}
          {latest.status === "rejected" && <div className="order-display-status-badge rejected">Rejected &amp; Refunded</div>}
          {actionError && (
            <p className="order-display-action-error">
              Reject failed — the order is still pending, nothing was refunded or sent. ({actionError})
            </p>
          )}
        </div>
      ) : (
        <div className="order-display-empty">Waiting for orders&hellip;</div>
      )}

      {rest.length > 0 && (
        <div className="order-display-queue">
          <h2>Recent Orders</h2>
          <ul>
            {pageItems.map((o) => (
              <li key={o.id}>
                <button type="button" onClick={() => selectOrder(o)}>
                  <span className="order-display-queue-info">
                    #{o.order_no} &middot; {o.customer_name} &middot; ****{last4(o.customer_phone)}
                    {orderCategories(o).map((cat) => (
                      <span key={cat.id} className={`order-cat-badge cat-${cat.id}`}>{cat.label}</span>
                    ))}
                    <span className={`order-status ${o.viewed_at ? "seen" : "unseen"}`}>
                      {o.viewed_at ? "Confirmed" : "Unconfirmed"}
                    </span>
                    <span className={`order-status status-${o.status}`}>{o.status}</span>
                  </span>
                  <span>{fmt(Number(o.total))}</span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} className="order-display-pagination" />
        </div>
      )}
    </div>
  );
}
