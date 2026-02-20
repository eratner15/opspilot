import { createStripeClient } from "./payments";

export async function createBillingPortalSession(params: {
  stripeSecretKey: string;
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const stripe = createStripeClient(params.stripeSecretKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });
  return { url: session.url };
}
