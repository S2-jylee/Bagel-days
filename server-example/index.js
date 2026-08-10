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
 *   1. npm init -y
 *   2. npm install express square cors dotenv
 *   3. Create a .env file with:
 *        SQUARE_ACCESS_TOKEN=your_sandbox_or_production_access_token
 *        SQUARE_LOCATION_ID=your_location_id
 *   4. node index.js
 *   5. Deploy this somewhere reachable (Render, Railway, a small VPS, etc.)
 *      and point PAYMENT_ENDPOINT in checkout.html at its public URL,
 *      e.g. https://api.bageldays.com.au/api/process-payment
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client, Environment } = require("square");
const { randomUUID } = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox, // change to Environment.Production when you go live
});

app.post("/api/process-payment", async (req, res) => {
  try {
    const { sourceId, amount, currency, customer } = req.body;

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

    // TODO: also save the order (items, customer name/phone, total) to your
    // own database or send a notification (email/SMS) to the shop here.

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Bagel Days payment server running on port ${PORT}`));
