// stripe.js
const stripe = Stripe("// stripe.js");
const stripe = Stripe("pk_live_YOUR_PUBLISHABLE_KEY"); // your live publishable key

async function buyProduct(priceId) {
  try {
    const response = await fetch("https://applyinterviewstart/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    const session = await response.json();
    await stripe.redirectToCheckout({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    alert("Stripe checkout failed: " + err.message);
  }
}

function buyResume() {
  buyProduct("price_1SmSivAdRfgqgRAmFiI3jHDl");
}

function buyInterview() {
  buyProduct("price_1SmSitAdRfgqgRAmOKSI7wby");
}

function buyBundle() {
  buyProduct("price_1SmSirAdRfgqgRAmru8aWfIw");
}

async function buyProduct(priceId) {
  try {
    const response = await fetch("https://YOUR_BACKEND_DOMAIN/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    const session = await response.json();
    await stripe.redirectToCheckout({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    alert("Stripe checkout failed: " + err.message);
  }
}

function buyResume() {
  buyProduct("price_1SmSivAdRfgqgRAmFiI3jHDl");
}

function buyInterview() {
  buyProduct("price_1SmSitAdRfgqgRAmOKSI7wby");
}

function buyBundle() {
  buyProduct("price_1SmSirAdRfgqgRAmru8aWfIw");
}
