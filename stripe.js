// Stripe publishable key (TEST key is OK for testing)
const stripe = Stripe("pk_test_51Sm7lWAdRfgqgRAmHFC3ixdrrrnLNoGklLSEOIgVwz951N2V87jC6hcfvri3q8dge01fO9KbIRmiv8833r10eqd3003ZRcQs3s");

async function buyProduct(priceId) {
  try {
    const response = await fetch("https://apply-interview-start.onrender.com/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId })
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

// UPDATED TEST PRICE IDs (your latest)
function buyResume() {
  buyProduct("price_1SmOIRAdRfgqgRAmdHnM1lfp");
}

function buyInterview() {
  buyProduct("price_1SmOQWAdRfgqgRAm2bnclGAh");
}

// Your working Career Consult price (keep your existing one if it’s already working)
// If yours is different, replace it here.
function buyConsult() {
  buyProduct("price_1SqjR0AdRfgqgRAmkhlk4xay");
}
