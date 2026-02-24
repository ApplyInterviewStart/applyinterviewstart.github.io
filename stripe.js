const stripe = Stripe("pk_live_51Sm7lWAdRfgqgRAmkkprO4VYYaiNWKJUyf88oxpNUynGT04Upm5WFKaFdCpZnKWdq4GoRNR7xR9nYJE4TIkyaKdk00vlyLXjQJ");

// LIVE price IDs (production)
const LIVE_PRICE_RESUME = "price_1SydgnAdRfgqgRAmUUpti9gd";
const LIVE_PRICE_INTERVIEW = "price_1SyfTgAdRfgqgRAmXHjZBE15";
const LIVE_PRICE_CONSULT = "price_1SyfW2AdRfgqgRAm7PCZnG4V";

async function buyProduct(priceId, serviceKey) {
  try {
    const response = await fetch("https://apply-interview-start.onrender.com/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, serviceKey })
    });

    const session = await response.json();

    if (!session.url) {
      console.error("Session error:", session);
      alert("Stripe session failed");
      return;
    }

    window.location.href = session.url;
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Stripe session failed");
  }
}

function buyResume() {
  buyProduct(LIVE_PRICE_RESUME, "resume");
}

function buyInterview() {
  buyProduct(LIVE_PRICE_INTERVIEW, "interview");
}

function buyConsult() {
  buyProduct(LIVE_PRICE_CONSULT, "consult");
}