import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

// Checkout session endpoint
app.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: "https://applyinterviewstart.com/thankyou.html",
      cancel_url: "https://applyinterviewstart.com/?canceled=true",
    });
  

    res.json({ url: session.url });
  } catch (err) {
    console.error(err); // this will show the exact Stripe error in Render logs
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
