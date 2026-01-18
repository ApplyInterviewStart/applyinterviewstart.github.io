require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- CORS for your frontend
app.use(cors({
  origin: "https://applyinterviewstart.com",
  methods: ["GET", "POST"],
}));

// --- IMPORTANT: Stripe webhook needs RAW body (must be before express.json)
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
    // We only care about successful payments from Stripe Checkout
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Customer email collected by Checkout
      const customerEmail =
        (session.customer_details && session.customer_details.email) ||
        session.customer_email ||
        "";

      // We'll use line items to know which price was purchased
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
      const first = lineItems.data && lineItems.data[0];
      const priceId = first && first.price ? first.price.id : "";

      if (!customerEmail || !priceId) {
        console.warn("Webhook completed but missing customerEmail or priceId", { customerEmail, priceId });
        return res.status(200).json({ received: true });
      }

      const transporter = makeTransporter_();

      const service = SERVICE_BY_PRICE_ID[priceId];

      // If we don't recognize the price, just notify admin with basics
      if (!service) {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USER,
          subject: "Stripe purchase received (unknown priceId)",
          text:
`A Stripe Checkout purchase completed.

Email: ${customerEmail}
Price ID: ${priceId}
Session ID: ${session.id}

(Price ID not mapped in SERVICE_BY_PRICE_ID on server)`,
        });

        return res.status(200).json({ received: true });
      }

      // Email to customer with scheduling link
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: customerEmail,
        subject: `${service.emailSubjectCustomer}`,
        text:
`Thanks — your payment is confirmed ✅

Service: ${service.name}
Duration: ${service.duration}

Schedule here:
${service.calendlyLink}

If you don’t see a calendar invite, don’t worry — scheduling through the link above is enough.
(If you use Google Calendar and the invite lands in Trash/Spam, you can still schedule using the link.)

— ApplyInterviewStart
https://applyinterviewstart.com`,
      });

      // Email to you (admin) with quick info + link
      const adminTo = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USER;

      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: adminTo,
        subject: `${service.emailSubjectAdmin}`,
        text:
`New paid booking ✅

Service: ${service.name}
Duration: ${service.duration}
Customer email: ${customerEmail}

Calendly link:
${service.calendlyLink}

Stripe Session:
${session.id}`,
        replyTo: customerEmail,
      });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err.message);
    return res.status(500).send("Webhook handler failed");
  }
});

// After webhook route, use JSON parser for normal routes
app.use(express.json());

// 🔑 PRICE ID → THANK YOU PAGE MAP (for redirect after checkout)
const PRICE_TO_SUCCESS_PAGE = {
  "price_1SmuSIAdRfgqgRAmiM2CKoFV": "https://applyinterviewstart.com/thankyou-resume.html",
  "price_1SmuSdAdRfgqgRAmLlpOEYAl": "https://applyinterviewstart.com/thankyou-interview.html",
  "price_1SqjR0AdRfgqgRAmkhlk4xay": "https://applyinterviewstart.com/thankyou-consult.html",
  "price_1SmuSoAdRfgqgRAmj6VQOjAJ": "https://applyinterviewstart.com/thankyou-bundle.html", // optional legacy
};

// ✅ Price → service info (used for webhook emails)
const SERVICE_BY_PRICE_ID = {
  // Resume (you can keep this, but resume flow already has career questions + email)
  "price_1SmuSIAdRfgqgRAmiM2CKoFV": {
    name: "Resume Writing",
    duration: "Async (form + follow-up)",
    calendlyLink: "https://applyinterviewstart.com/thankyou-resume.html",
    emailSubjectCustomer: "Your Resume Writing purchase is confirmed ✅",
    emailSubjectAdmin: "New purchase: Resume Writing ✅",
  },

  // Interview Prep
  "price_1SmuSdAdRfgqgRAmLlpOEYAl": {
    name: "Interview Prep",
    duration: "1 hour",
    calendlyLink: "https://calendly.com/applyinterviewstart-4a8l/interview-prep?hide_event_type_details=1",
    emailSubjectCustomer: "Interview Prep confirmed ✅ Schedule your session",
    emailSubjectAdmin: "New purchase: Interview Prep ✅",
  },

  // Career Consult (TEST price you just created)
  "price_1SqjR0AdRfgqgRAmkhlk4xay": {
    name: "Career Consult",
    duration: "1 hour",
    calendlyLink: "https://calendly.com/applyinterviewstart-4a8l/career-consult?hide_event_type_details=1",
    emailSubjectCustomer: "Career Consult confirmed ✅ Schedule your session",
    emailSubjectAdmin: "New purchase: Career Consult ✅",
  },
};

app.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;
  const successUrl = PRICE_TO_SUCCESS_PAGE[priceId];

  if (!successUrl) return res.status(400).json({ error: "Invalid price ID" });

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

function makeTransporter_() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Missing SMTP env vars. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

app.get("/", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
