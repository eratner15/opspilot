import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { createCheckoutSession } from "@/server/services/stripe/payments";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    let db;
    let stripeSecretKey: string | undefined;
    let appUrl = "https://smb.cafecito-ai.com";
    try {
      const { env } = await getCloudflareContext();
      db = createDb(env.DB);
      const cfEnv = env as unknown as Record<string, string | undefined>;
      stripeSecretKey = cfEnv.STRIPE_SECRET_KEY;
      if (cfEnv.NEXT_PUBLIC_APP_URL) appUrl = cfEnv.NEXT_PUBLIC_APP_URL;
    } catch {
      const { PrismaClient } = await import("@prisma/client");
      db = new PrismaClient();
    }

    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const invoice = await db.invoice.findUnique({
      where: { publicToken: token },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        organization: { select: { name: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
    }
    if (invoice.status === "CANCELLED") {
      return NextResponse.json({ error: "Invoice has been cancelled" }, { status: 400 });
    }
    if (!invoice.customer.email) {
      return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });
    }

    const balanceDueCents = invoice.totalCents - invoice.amountPaidCents;
    if (balanceDueCents <= 0) {
      return NextResponse.json({ error: "Invoice balance is already zero" }, { status: 400 });
    }

    const successUrl = `${appUrl}/pay/${token}?paid=true`;
    const cancelUrl = `${appUrl}/pay/${token}`;

    const session = await createCheckoutSession({
      stripeSecretKey,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amountCents: balanceDueCents,
      customerEmail: invoice.customer.email,
      customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      orgName: invoice.organization.name,
      successUrl,
      cancelUrl,
    });

    // Store the session ID on the invoice
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        stripeCheckoutSessionId: session.sessionId,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[pay:checkout]", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
