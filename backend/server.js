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

// =============================
// SERVICE CONFIG (single source of truth)
// =============================
const SERVICE_BY_KEY = {
  resume: {
    name: "Resume & CV Writer",
    duration: "Intake form + follow-up",
    thankYouUrl: "https://applyinterviewstart.com/thankyou-resume.html",
  },
  interview: {
    name: "Interview Prep",
    duration: "1 hour",
    thankYouUrl: "https://applyinterviewstart.com/thankyou-interview.html",
  },
  consult: {
    name: "Career Consult",
    duration: "1 hour",
    thankYouUrl: "https://applyinterviewstart.com/thankyou-consult.html",
  },
};

// (Optional) Keep this for backward compatibility if any older links exist
const PRICE_TO_SUCCESS_PAGE = {
  "price_1SmOIRAdRfgqgRAmdHnM1lfp": SERVICE_BY_KEY.resume.thankYouUrl,
  "price_1SmOQWAdRfgqgRAm2bnclGAh": SERVICE_BY_KEY.interview.thankYouUrl,
  "price_1SqjR0AdRfgqgRAmkhlk4xay": SERVICE_BY_KEY.consult.thankYouUrl,
};

const SERVICE_BY_PRICE_ID = {
  "price_1SmOIRAdRfgqgRAmdHnM1lfp": SERVICE_BY_KEY.resume,
  "price_1SmOQWAdRfgqgRAm2bnclGAh": SERVICE_BY_KEY.interview,
  "price_1SqjR0AdRfgqgRAmkhlk4xay": SERVICE_BY_KEY.consult,
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

      // Prefer metadata (needed for $1 test where all priceIds are identical)
      const serviceKey = session.metadata && session.metadata.serviceKey ? session.metadata.serviceKey : "";

      // Fallback to priceId lookup if metadata missing
      let priceId = "";
      if (!serviceKey) {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
        const first = lineItems.data && lineItems.data[0];
        priceId = first && first.price ? first.price.id : "";
      }

      if (!customerEmail) {
        console.warn("Webhook missing customerEmail");
        return res.status(200).json({ received: true });
      }

      const appsScriptUrl = process.env.APPS_SCRIPT_WEBAPP_URL;
      const appsScriptSecret = process.env.APPS_SCRIPT_SECRET;

      if (!appsScriptUrl || !appsScriptSecret) {
        console.error("Missing APPS_SCRIPT_WEBAPP_URL or APPS_SCRIPT_SECRET env vars");
        return res.status(500).send("Server misconfigured");
      }

      const service =
        (serviceKey && SERVICE_BY_KEY[serviceKey]) ||
        (priceId && SERVICE_BY_PRICE_ID[priceId]) ||
        null;

      const payload = service ? {
        secret: appsScriptSecret,
        customerEmail,
        serviceName: service.name,
        duration: service.duration,
        thankYouUrl: service.thankYouUrl,
      } : {
        secret: appsScriptSecret,
        customerEmail,
        serviceName: "Unknown Service (not mapped)",
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
  const { priceId, serviceKey } = req.body;

  // Prefer serviceKey routing (works for $1 test)
  const service = serviceKey && SERVICE_BY_KEY[serviceKey] ? SERVICE_BY_KEY[serviceKey] : null;

  // Backward compatibility: fallback to old price mapping
  const successUrl = service ? service.thankYouUrl : PRICE_TO_SUCCESS_PAGE[priceId];

  if (!priceId || !successUrl) {
    return res.status(400).json({ error: "Invalid request (missing priceId or mapping)" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: "https://applyinterviewstart.com/?canceled=true",

      // Critical: store serviceKey so webhook can identify service even if priceId is $1
      metadata: {
        serviceKey: serviceKey || "",
      },
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
