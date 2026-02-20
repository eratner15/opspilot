import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

interface RespondBody {
  action: "accept" | "decline";
  quoteId: string;
  signatureData?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = (await req.json()) as RespondBody;
    const { action, quoteId, signatureData } = body;

    if (!action || !quoteId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let db;
    try {
      const { env } = await getCloudflareContext();
      db = createDb(env.DB);
    } catch {
      const { PrismaClient } = await import("@prisma/client");
      db = new PrismaClient();
    }

    // Verify token matches quoteId
    const quote = await db.quote.findFirst({
      where: { id: quoteId, publicToken: token },
    });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    if (!["DRAFT", "SENT"].includes(quote.status)) {
      return NextResponse.json(
        { error: "This quote has already been responded to" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newStatus = action === "accept" ? "ACCEPTED" : "DECLINED";

    await db.quote.update({
      where: { id: quoteId },
      data: {
        status: newStatus,
        ...(action === "accept" && {
          acceptedAt: now,
          ...(signatureData && { signatureData }),
        }),
        updatedAt: now,
      },
    });

    // Audit log (no userId on public route — use "customer")
    await db.auditLog.create({
      data: {
        id: generateId(),
        organizationId: quote.organizationId,
        userId: "customer",
        action: `quote.${action}`,
        entityType: "Quote",
        entityId: quoteId,
        changesJson: JSON.stringify({
          status: { from: quote.status, to: newStatus },
        }),
        createdAt: now,
      },
    });

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error("[quote:respond]", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
