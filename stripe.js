// ⚠️ USE YOUR PUBLISHABLE KEY (starts with pk_test_ or pk_live_)
const stripe = Stripe("pk_live_51Sm7lWAdRfgqgRAmkkprO4VYYaiNWKJUyf88oxpNUynGT04Upm5WFKaFdCpZnKWdq4GoRNR7xR9nYJE4TIkyaKdk00vlyLXjQJ");

// Generic function to handle checkout
async function buyProduct(priceId) {
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }], // Stripe Price ID
    mode: "payment",
    successUrl: window.location.href + "?success=true",
    cancelUrl: window.location.href + "?canceled=true",
  });

  if (error) {
    alert(error.message);
  }
}

// Individual service buttons
function buyResume() {
  buyProduct("price_1SmSivAdRfgqgRAmFiI3jHDl"); // Resume service price ID
}

function buyInterview() {
  buyProduct("price_1SmSitAdRfgqgRAmOKSI7wby"); // Interview prep price ID
}

function buyBundle() {
  buyProduct("price_1SmSirAdRfgqgRAmru8aWfIw"); // Bundle price ID
}
