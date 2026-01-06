// Replace with your Stripe publishable key
const stripe = Stripe("pk_live_51Sm7lWAdRfgqgRAmkkprO4VYYaiNWKJUyf88oxpNUynGT04Upm5WFKaFdCpZnKWdq4GoRNR7xR9nYJE4TIkyaKdk00vlyLXjQJ");

async function buyProduct(priceId) {
  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    successUrl: window.location.href + "?success=true",
    cancelUrl: window.location.href + "?canceled=true",
  });

  if (error) {
    alert(error.message);
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
