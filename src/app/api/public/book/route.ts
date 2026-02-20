import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { z } from "zod";

const bookingSchema = z.object({
  orgId: z.string().min(1),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  serviceType: z.string().min(1, "Service type required"),
  description: z.string().min(1, "Description required"),
  preferredDate: z.string().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const data = bookingSchema.parse(body);

    let db;
    try {
      const { env } = await getCloudflareContext();
      db = createDb(env.DB);
    } catch {
      const { PrismaClient } = await import("@prisma/client");
      db = new PrismaClient();
    }

    // Verify org exists
    const org = await db.organization.findUnique({ where: { id: data.orgId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Find or create customer by phone
    let customer = await db.customer.findFirst({
      where: { organizationId: data.orgId, phone: data.phone },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: data.orgId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email || null,
          address: data.address || null,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    // Count jobs for job number
    const jobCount = await db.job.count({ where: { organizationId: data.orgId } });
    const jobNumber = `JOB-${String(jobCount + 1).padStart(4, "0")}`;

    // Create job
    const job = await db.job.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: data.orgId,
        customerId: customer.id,
        jobNumber,
        title: `${data.serviceType} — ${data.description.slice(0, 60)}`,
        description: data.description,
        category: data.serviceType,
        status: "NEW",
        priority: "NORMAL",
        scheduledAt: data.preferredDate || null,
        lineItemsJson: "[]",
        totalCents: 0,
        createdAt: now,
        updatedAt: now,
      },
    });

    return NextResponse.json({ success: true, jobNumber: job.jobNumber }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message ?? "Validation error" }, { status: 400 });
    }
    console.error("[booking]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
