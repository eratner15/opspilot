import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { constructWebhookEvent } from "@/server/services/stripe/payments";
import { generateId } from "@/lib/utils";
import type Stripe from "stripe";

export const runtime = "edge";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let stripeSecretKey: string | undefined;
  let webhookSecret: string | undefined;
  let db;

  try {
    const { env } = await getCloudflareContext();
    db = createDb(env.DB);
    stripeSecretKey = env.STRIPE_SECRET_KEY;
    webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  } catch {
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient();
  }

  if (!stripeSecretKey || !webhookSecret) {
    console.error("[stripe:webhook] Stripe keys not configured");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await constructWebhookEvent({
      stripeSecretKey,
      webhookSecret,
      payload,
      signature,
    });
  } catch (err) {
    console.error("[stripe:webhook] Signature verification failed:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;

      if (!invoiceId) {
        console.error("[stripe:webhook] No invoiceId in session metadata");
        return NextResponse.json({ received: true });
      }

      const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        console.error("[stripe:webhook] Invoice not found:", invoiceId);
        return NextResponse.json({ received: true });
      }

      if (invoice.status === "PAID") {
        // Already paid — idempotent
        return NextResponse.json({ received: true });
      }

      const amountPaid = session.amount_total ?? invoice.totalCents;
      const now = new Date().toISOString();

      await db.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          amountPaidCents: amountPaid,
          paidAt: now,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          updatedAt: now,
        },
      });

      await db.auditLog.create({
        data: {
          id: generateId(),
          organizationId: invoice.organizationId,
          userId: "stripe",
          action: "invoice.pay.stripe",
          entityType: "Invoice",
          entityId: invoiceId,
          changesJson: JSON.stringify({
            status: { from: invoice.status, to: "PAID" },
            amountPaidCents: { from: invoice.amountPaidCents, to: amountPaid },
          }),
          createdAt: now,
        },
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const invoiceId = paymentIntent.metadata?.invoiceId;
      if (invoiceId) {
        console.error("[stripe:webhook] Payment failed for invoice:", invoiceId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe:webhook] Error processing event:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
