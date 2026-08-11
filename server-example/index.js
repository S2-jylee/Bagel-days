/**
 * Bagel Days — minimal example backend for Square payments.
 *
 * The checkout page (checkout.html) tokenizes the card in the browser using
 * Square's Web Payments SDK and POSTs the resulting token here. This server
 * takes that token and calls Square's Payments API with your PRIVATE access
 * token, which must never be exposed in browser code.
 *
 * This is a reference example, not a production-ready server. Before going
 * live: add HTTPS, input validation, error logging, idempotency keys, and
 * proper CORS restricted to your domain.
 *
 * Setup:
 *   1. npm install
 *   2. Create a .env file (see .env.example) with:
 *        SQUARE_ACCESS_TOKEN=your_sandbox_or_production_access_token
 *        SQUARE_LOCATION_ID=your_location_id
 *        SUPABASE_URL=https://your-project.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *        TWILIO_ACCOUNT_SID=your_twilio_account_sid
 *        TWILIO_AUTH_TOKEN=your_twilio_auth_token
 *        TWILIO_FROM_NUMBER=+1xxxxxxxxxx   (the Twilio number you send SMS from)
 *   3. node index.js
 *   4. Deploy this somewhere reachable (Render, Railway, a small VPS, etc.)
 *      and point PAYMENT_ENDPOINT in checkout.html at its public URL,
 *      e.g. https://api.bageldays.com.au/api/process-payment
 *
 * On a successful Square payment, the order (name, phone, items, total) is
 * saved to the `orders` table in Supabase — that's what powers the
 * /order-display counter screen and the /admin sales-history page in the
 * frontend. SUPABASE_SERVICE_ROLE_KEY bypasses Row Level Security, so it
 * must only ever live here (server-side), never in browser code.
 *
 * Every order starts as `status: 'pending'`. Staff accept/reject it from
 * /order-display — accepting just flips the status straight from the
 * browser, but rejecting refunds the Square payment and texts the customer,
 * both of which need private keys, so that goes through /api/reject-order
 * below. NOTE: a Twilio *trial* account can only send SMS to phone numbers
 * you've manually verified in the Twilio console — upgrade to a paid
 * account before relying on this for real customers.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client, Environment } = require("square");
const { randomUUID } = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox, // change to Environment.Production when you go live
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Normalizes an Australian mobile number (e.g. "0412 345 678") to E.164
// (+61412345678) for Twilio. Leaves already-international numbers as-is.
function toE164Au(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("61")) return `+${digits}`;
  if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
  return `+61${digits}`;
}

app.post("/api/process-payment", async (req, res) => {
  try {
    const { sourceId, amount, currency, customer, items } = req.body;

    if (!sourceId || !amount) {
      return res.status(400).json({ error: "Missing sourceId or amount" });
    }

    // Square expects amount in the smallest currency unit (cents for AUD)
    const amountInCents = Math.round(Number(amount) * 100);

    const response = await squareClient.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: amountInCents,
        currency: currency || "AUD",
      },
      locationId: process.env.SQUARE_LOCATION_ID,
      note: `Bagel Days order — ${customer?.name || "guest"} (${customer?.phone || "no phone"})`,
    });

    const { error: dbError } = await supabase.from("orders").insert({
      customer_name: customer?.name || "Guest",
      customer_phone: customer?.phone || "",
      items: items || [],
      subtotal: amountInCents / 100,
      total: amountInCents / 100,
      square_payment_id: response.result.payment.id,
      note: customer?.note || null,
    });
    if (dbError) {
      // The customer already paid — don't fail the request over a DB hiccup,
      // just log it so today's order can be reconciled from Square's own
      // dashboard if it's missing from /admin.
      console.error("Failed to save order to Supabase:", dbError);
    }

    // Decrement stock for each ordered item. decrement_stock() is a no-op for
    // untracked items (stock_qty is null) and never goes below 0.
    for (const it of items || []) {
      if (!it.id) continue;
      const { error: stockError } = await supabase.rpc("decrement_stock", { p_product_id: it.id, p_qty: it.qty });
      if (stockError) console.error(`Failed to decrement stock for ${it.id}:`, stockError);
    }

    res.json({
      success: true,
      paymentId: response.result.payment.id,
      status: response.result.payment.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment failed", details: err.message });
  }
});

// Called from /order-display when staff reject a pending order. Refunds the
// original Square payment in full and texts the customer — both use private
// keys, which is why this can't happen straight from the browser. Nothing
// here fails silently: this moves real money, so any error is surfaced back
// to the UI rather than swallowed like the best-effort order-save above.
app.post("/api/reject-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    const { data: order, error: fetchError } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (fetchError || !order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "pending") return res.status(400).json({ error: `Order already ${order.status}` });

    let refundId = null;
    if (order.square_payment_id) {
      const refundResponse = await squareClient.refundsApi.refundPayment({
        idempotencyKey: randomUUID(),
        amountMoney: { amount: Math.round(Number(order.total) * 100), currency: "AUD" },
        paymentId: order.square_payment_id,
        reason: "Order rejected by store",
      });
      refundId = refundResponse.result.refund.id;
    }

    await twilioClient.messages.create({
      to: toE164Au(order.customer_phone),
      from: process.env.TWILIO_FROM_NUMBER,
      body: `Hi ${order.customer_name}, sorry — Bagel Days can't fulfil order #${order.order_no} right now. You've been refunded in full.`,
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "rejected", refund_id: refundId })
      .eq("id", orderId);
    if (updateError) throw updateError;

    res.json({ success: true, refundId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject order", details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Bagel Days payment server running on port ${PORT}`));
