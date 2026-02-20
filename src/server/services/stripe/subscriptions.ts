import { createStripeClient } from "./payments";

export async function createStripeCustomer(params: {
  stripeSecretKey: string;
  email: string;
  name: string;
}): Promise<string> {
  const stripe = createStripeClient(params.stripeSecretKey);
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
  });
  return customer.id;
}

export async function createSubscriptionCheckout(params: {
  stripeSecretKey: string;
  customerId: string;
  priceId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const stripe = createStripeClient(params.stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.customerId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: `${params.returnUrl}?subscribed=1`,
    cancel_url: params.returnUrl,
  });
  return { url: session.url! };
}
