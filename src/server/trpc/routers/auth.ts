import { router, userProcedure } from "../trpc";

export const authRouter = router({
  bootstrap: userProcedure.mutation(async ({ ctx }) => {
    const orgId = ctx.userId;
    const now = new Date().toISOString();

    // Upsert Organization
    const existing = await ctx.db.organization.findFirst({ where: { id: orgId } });
    if (!existing) {
      await ctx.db.organization.create({
        data: {
          id: orgId,
          name: "My Business",
          timezone: "America/New_York",
          plan: "TRIAL",
          planStatus: "ACTIVE",
          createdAt: now,
          updatedAt: now,
        },
      });

      // Seed demo data so dashboard feels alive immediately
      const cust1Id = crypto.randomUUID();
      const cust2Id = crypto.randomUUID();
      const cust3Id = crypto.randomUUID();
      const job1Id = crypto.randomUUID();
      const job2Id = crypto.randomUUID();
      const inv1Id = crypto.randomUUID();

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Demo customers
      await ctx.db.customer.createMany({
        data: [
          {
            id: cust1Id,
            organizationId: orgId,
            firstName: "Maria",
            lastName: "Garcia",
            phone: "8135550101",
            email: "maria.garcia@email.com",
            type: "RESIDENTIAL",
            source: "PHONE",
            createdAt: threeDaysAgo,
            updatedAt: threeDaysAgo,
          },
          {
            id: cust2Id,
            organizationId: orgId,
            firstName: "Robert",
            lastName: "Johnson",
            phone: "8135550102",
            type: "RESIDENTIAL",
            source: "REFERRAL",
            createdAt: yesterday,
            updatedAt: yesterday,
          },
          {
            id: cust3Id,
            organizationId: orgId,
            firstName: "Tampa",
            lastName: "Properties LLC",
            phone: "8135550103",
            type: "COMMERCIAL",
            source: "ONLINE",
            createdAt: now,
            updatedAt: now,
          },
        ],
      });

      // Demo jobs
      await ctx.db.job.createMany({
        data: [
          {
            id: job1Id,
            organizationId: orgId,
            jobNumber: "JOB-001",
            customerId: cust1Id,
            status: "COMPLETED",
            category: "HVAC",
            priority: "NORMAL",
            title: "AC Unit Repair — Compressor",
            description: "Customer reported AC not cooling. AI diagnosed compressor issue.",
            scheduledAt: threeDaysAgo,
            completedAt: yesterday,
            totalCents: 84000,
            createdAt: threeDaysAgo,
            updatedAt: yesterday,
          },
          {
            id: job2Id,
            organizationId: orgId,
            jobNumber: "JOB-002",
            customerId: cust2Id,
            status: "IN_PROGRESS",
            category: "PLUMBING",
            priority: "HIGH",
            title: "Water Heater Replacement",
            description: "Customer called in — AI booked same-day appointment.",
            scheduledAt: now,
            totalCents: 120000,
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
      });

      // Demo invoice (paid)
      await ctx.db.invoice.create({
        data: {
          id: inv1Id,
          organizationId: orgId,
          invoiceNumber: "INV-001",
          customerId: cust1Id,
          jobId: job1Id,
          status: "PAID",
          publicToken: crypto.randomUUID(),
          lineItemsJson: JSON.stringify([
            { description: "Compressor Replacement", quantity: 1, unitPriceCents: 72000 },
            { description: "Labor (2.5 hrs)", quantity: 1, unitPriceCents: 12000 },
          ]),
          subtotalCents: 84000,
          taxRateBps: 700,
          taxCents: 5880,
          totalCents: 89880,
          amountPaidCents: 89880,
          paidAt: yesterday,
          sentAt: threeDaysAgo,
          createdAt: threeDaysAgo,
          updatedAt: yesterday,
        },
      });
    }

    // Upsert User
    const existingUser = await ctx.db.user.findFirst({ where: { clerkUserId: ctx.userId } });
    if (!existingUser) {
      await ctx.db.user.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: orgId,
          clerkUserId: ctx.userId,
          email: "",
          firstName: "",
          lastName: "",
          role: "OWNER",
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    return { organizationId: orgId };
  }),
});
