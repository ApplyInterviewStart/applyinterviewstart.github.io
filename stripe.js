// Stripe publishable key (TEST key is OK for testing)
const stripe = Stripe("pk_test_51Sm7lWAdRfgqgRAmHFC3ixdrrrnLNoGklLSEOIgVwz951N2V87jC6hcfvri3q8dge01fO9KbIRmiv8833r10eqd3003ZRcQs3s");

// Generic function to create checkout session
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

    // Redirect to Stripe Checkout
    window.location.href = session.url;
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Stripe session failed");
  }
}

// Button functions
function buyResume() {
  // Resume Writing ($79) — replace price ID if needed
  buyProduct("price_1SmuSIAdRfgqgRAmiM2CKoFV");
}

function buyInterview() {
  // Interview Prep ($119) — replace price ID if needed
  buyProduct("price_1SmuSdAdRfgqgRAmLlpOEYAl");
}

function buyConsult() {
  // Career Consult ($99) — IMPORTANT: replace this placeholder with your Career Consult price ID
  buyProduct("price_1SqipxPFQklnj0iwLoRPC1wg");
}
