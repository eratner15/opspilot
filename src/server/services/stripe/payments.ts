import Stripe from "stripe";

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2026-01-28.clover",
  });
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(params: {
  stripeSecretKey: string;
  invoiceId: string;
  invoiceNumber: string;
  amountCents: number;
  customerEmail: string;
  customerName: string;
  orgName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSessionResult> {
  const stripe = createStripeClient(params.stripeSecretKey);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: params.amountCents,
          product_data: {
            name: `Invoice ${params.invoiceNumber}`,
            description: `Payment to ${params.orgName}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId: params.invoiceId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

export async function constructWebhookEvent(params: {
  stripeSecretKey: string;
  webhookSecret: string;
  payload: string;
  signature: string;
}): Promise<Stripe.Event> {
  const stripe = createStripeClient(params.stripeSecretKey);
  return stripe.webhooks.constructEvent(
    params.payload,
    params.signature,
    params.webhookSecret
  );
}
