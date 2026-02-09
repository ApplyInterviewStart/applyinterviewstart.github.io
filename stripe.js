const stripe = Stripe("pk_live_51Sm7lWAdRfgqgRAmkkprO4VYYaiNWKJUyf88oxpNUynGT04Upm5WFKaFdCpZnKWdq4GoRNR7xR9nYJE4TIkyaKdk00vlyLXjQJ");

// $1 LIVE TEST toggle
const USE_LIVE_TEST_PRICE = true;

// Shared $1 LIVE price (your standalone $1 product)
const LIVE_TEST_PRICE_ID = "price_1SydUOAdRfgqgRAm3XWwEWtM";

// Real LIVE prices (inside each service product)
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
  const priceId = USE_LIVE_TEST_PRICE ? LIVE_TEST_PRICE_ID : LIVE_PRICE_RESUME;
  buyProduct(priceId, "resume");
}

function buyInterview() {
  const priceId = USE_LIVE_TEST_PRICE ? LIVE_TEST_PRICE_ID : LIVE_PRICE_INTERVIEW;
  buyProduct(priceId, "interview");
}

function buyConsult() {
  const priceId = USE_LIVE_TEST_PRICE ? LIVE_TEST_PRICE_ID : LIVE_PRICE_CONSULT;
  buyProduct(priceId, "consult");
}
