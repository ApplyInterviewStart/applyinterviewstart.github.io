const stripe = Stripe("pk_live_51Sm7lWAdRfgqgRAmkkprO4VYYaiNWKJUyf88oxpNUynGT04Upm5WFKaFdCpZnKWdq4GoRNR7xR9nYJE4TIkyaKdk00vlyLXjQJ");

async function buyProduct(priceId) {
  try {
    const response = await fetch(
      "https://YOUR-RENDER-URL.onrender.https://apply-interview-start.onrender.com//create-checkout-session",
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
      console.error(session);
      alert("Stripe session failed");
      return;
    }

    await stripe.redirectToCheckout({
      sessionId: session.id,
    });
  } catch (error) {
    console.error(error);
    alert("Checkout error");
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
