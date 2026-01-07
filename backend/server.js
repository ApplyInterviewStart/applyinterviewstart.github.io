import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: req.body.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://applyinterviewstart.com/?success=true",
      cancel_url: "https://applyinterviewstart.com/?cancelled=true",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err); // this will show the exact Stripe error in Render logs
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
