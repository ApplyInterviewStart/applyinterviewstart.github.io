require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: "https://applyinterviewstart.com",
  methods: ["GET", "POST"],
}));

/**
 * PRICE ID → THANK YOU PAGE (redirect after Stripe checkout)
 * Must match the price IDs used in stripe.js
 */
const PRICE_TO_SUCCESS_PAGE = {
  // Resume & CV Writing
  "price_1SmOIRAdRfgqgRAmdHnM1lfp": "https://applyinterviewstart.com/thankyou-resume.html",

  // Interview Prep
  "price_1SmOQWAdRfgqgRAm2bnclGAh": "https://applyinterviewstart.com/thankyou-interview.html",

  // Career Consult
  "price_1SqjR0AdRfgqgRAmkhlk4xay": "https://applyinterviewstart.com/thankyou-consult.html",
};

/**
 * Service info used for purchase emails (sent via Apps Script).
 * IMPORTANT: Do NOT put scheduling links in the email.
 * We will include the thank-you page instead (where the embed lives).
 */
const SERVICE_BY_PRICE_ID = {
  "price_1SmOIRAdRfgqgRAmdHnM1lfp": {
    name: "Resume & CV Writing",
    duration: "Intake form + follow-up",
    thankYouUrl: "https://applyinterviewstart.com/thankyou-resume.html",
  },

  "price_1SmOQWAdRfgqgRAm2bnclGAh": {
    name: "Interview Prep",
    duration: "1 hour",
    thankYouUrl: "https://applyinterviewstart.com/thankyou-interview.html",
  },

  "price_1SqjR0AdRfgqgRAmkhlk4xay": {
    name: "Career Consult",
    duration: "1 hour",
    thankYouUrl: "https://applyinterviewstart.com/thankyou-consult.html",
  },
};

/**
 * Stripe webhook (verified) -> call Apps Script to send purchase confirmation email.
 * IMPORTANT: express.raw BEFORE express.json
 */
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET env var");
    return res.status(500).send("Server misconfigured");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const customerEmail =
        (session.customer_details && session.customer_details.email) ||
        session.customer_email ||
        "";

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
      const first = lineItems.data && lineItems.data[0];
      const priceId = first && first.price ? first.price.id : "";

      if (!customerEmail || !priceId) {
        console.warn("Webhook missing customerEmail or priceId", { customerEmail, priceId });
        return res.status(200).json({ received: true });
      }

      const appsScriptUrl = process.env.APPS_SCRIPT_WEBAPP_URL;
      const appsScriptSecret = process.env.APPS_SCRIPT_SECRET;

      if (!appsScriptUrl || !appsScriptSecret) {
        console.error("Missing APPS_SCRIPT_WEBAPP_URL or APPS_SCRIPT_SECRET env vars");
        return res.status(500).send("Server misconfigured");
      }

      const service = SERVICE_BY_PRICE_ID[priceId];

      const payload = service ? {
        secret: appsScriptSecret,
        customerEmail,
        serviceName: service.name,
        duration: service.duration,
        thankYouUrl: service.thankYouUrl,
      } : {
        secret: appsScriptSecret,
        customerEmail,
        serviceName: "Unknown Service (price not mapped)",
        duration: "",
        thankYouUrl: "https://applyinterviewstart.com",
      };

      const resp = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const respText = await resp.text();

      if (!resp.ok) {
        console.error("Apps Script call failed:", resp.status, respText);
      } else {
        console.log("Apps Script OK:", respText);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err.message);
    return res.status(500).send("Webhook handler failed");
  }
});

// After webhook route, use JSON parser
app.use(express.json());

/**
 * Create Stripe Checkout Session
 */
app.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;
  const successUrl = PRICE_TO_SUCCESS_PAGE[priceId];

  if (!successUrl) {
    return res.status(400).json({ error: "Invalid price ID" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: "https://applyinterviewstart.com/?canceled=true",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
