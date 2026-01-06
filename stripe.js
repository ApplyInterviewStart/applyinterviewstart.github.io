const stripe = Stripe("pk_test_51Sm7lWAdRfgqgRAmHFC3ixdrrrnLNoGklLSEOIgVwz951N2V87jC6hcfvri3q8dge01fO9KbIRmiv8833r10eqd3003ZRcQs3s");

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
