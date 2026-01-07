const stripe = Stripe("pk_test_51Sm7lWAdRfgqgRAmHFC3ixdrrrnLNoGklLSEOIgVwz951N2V87jC6hcfvri3q8dge01fO9KbIRmiv8833r10eqd3003ZRcQs3s");

async function buyProduct(priceId) {
  try {
    const response = await fetch(
      "https://apply-interview-start.onrender.com/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      }
    );

    const session = await response.json();

    if (!session.id) {
      console.error("Session error:", session);
      alert("Stripe session failed");
      return;
    }

    await stripe.redirectToCheckout({
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Checkout error");
  }
}

function buyResume() {
  buyProduct("price_1SmuSIAdRfgqgRAmiM2CKoFV"); // Replace with live Price ID
}

function buyInterview() {
  buyProduct("price_1SmuSdAdRfgqgRAmLlpOEYAl"); // Replace with live Price ID
}

function buyBundle() {
  buyProduct("price_1SmuSoAdRfgqgRAmj6VQOjAJ"); // Replace with live Price ID
}

