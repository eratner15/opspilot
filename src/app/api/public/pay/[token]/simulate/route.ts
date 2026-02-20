import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    let db;
    try {
      const { env } = await getCloudflareContext();
      db = createDb(env.DB);
    } catch {
      const { PrismaClient } = await import("@prisma/client");
      db = new PrismaClient();
    }

    const invoice = await db.invoice.findUnique({
      where: { publicToken: token },
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

    const now = new Date().toISOString();

    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        amountPaidCents: invoice.totalCents,
        paidAt: now,
        updatedAt: now,
      },
    });

    await db.auditLog.create({
      data: {
        id: generateId(),
        organizationId: invoice.organizationId,
        userId: "customer",
        action: "invoice.pay.simulate",
        entityType: "Invoice",
        entityId: invoice.id,
        changesJson: JSON.stringify({
          status: { from: invoice.status, to: "PAID" },
          amountPaidCents: { from: invoice.amountPaidCents, to: invoice.totalCents },
        }),
        createdAt: now,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[pay:simulate]", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
