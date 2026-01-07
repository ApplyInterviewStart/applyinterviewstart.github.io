// Install dependencies first:
// npm init -y
// npm install express stripe cors dotenv

const express = require("express");
const app = express();
require('dotenv').config(); // ← THIS reads the .env file

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
 // Live secret key
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: "https://applyinterviewstart.com?success=true",
      cancel_url: "https://applyinterviewstart.com?canceled=true",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
