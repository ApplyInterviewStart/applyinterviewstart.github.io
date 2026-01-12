require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// 🔑 PRICE ID → THANK YOU PAGE MAP
const PRICE_TO_SUCCESS_PAGE = {
  // Resume Builder
  "price_1SmuSIAdRfgqgRAmiM2CKoFV":
    "https://applyinterviewstart.com/thankyou-resume.html",

  // Interview Prep
  "price_1SmuSdAdRfgqgRAmLlpOEYAl":
    "https://applyinterviewstart.com/thankyou-interview.html",

  // Resume + Interview Bundle
  "price_1SmuSoAdRfgqgRAmj6VQOjAJ":
    "https://applyinterviewstart.com/thankyou-bundle.html",
};

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
