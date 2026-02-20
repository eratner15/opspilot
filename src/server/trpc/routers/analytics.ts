import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

export const analyticsRouter = router({
  getDashboardKPIs: protectedProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        monthlyInvoices,
        activeJobs,
        completedThisMonth,
        totalCustomers,
        todayCalls,
        outstandingInvoices,
        recentAuditLogs,
      ] = await Promise.all([
        // Paid invoices this month
        ctx.db.invoice.findMany({
          where: {
            organizationId: ctx.organizationId,
            status: "PAID",
            paidAt: { gte: startOfMonth },
          },
          select: { amountPaidCents: true },
        }),
        // Active jobs (in progress)
        ctx.db.job.count({
          where: {
            organizationId: ctx.organizationId,
            status: { in: ["EN_ROUTE", "IN_PROGRESS", "SCHEDULED"] },
          },
        }),
        // Jobs completed this month
        ctx.db.job.count({
          where: {
            organizationId: ctx.organizationId,
            status: "COMPLETED",
            completedAt: { gte: startOfMonth },
          },
        }),
        // Total customers
        ctx.db.customer.count({
          where: { organizationId: ctx.organizationId },
        }),
        // AI calls today
        ctx.db.call.count({
          where: {
            organizationId: ctx.organizationId,
            createdAt: { gte: startOfToday },
          },
        }),
        // Outstanding invoices (SENT + OVERDUE)
        ctx.db.invoice.findMany({
          where: {
            organizationId: ctx.organizationId,
            status: { in: ["SENT", "OVERDUE"] },
          },
          select: { totalCents: true, amountPaidCents: true, status: true },
        }),
        // Recent audit log for activity feed
        ctx.db.auditLog.findMany({
          where: { organizationId: ctx.organizationId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      const monthlyRevenueCents = monthlyInvoices.reduce(
        (sum, inv) => sum + inv.amountPaidCents,
        0
      );

      const outstandingCents = outstandingInvoices.reduce(
        (sum, inv) => sum + (inv.totalCents - inv.amountPaidCents),
        0
      );

      const overdueCount = outstandingInvoices.filter((i) => i.status === "OVERDUE").length;

      return {
        monthlyRevenueCents,
        activeJobs,
        completedThisMonth,
        totalCustomers,
        todayCalls,
        outstandingCents,
        overdueCount,
        recentActivity: recentAuditLogs,
      };
    }),

  getRevenueChart: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(90).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const paidInvoices = await ctx.db.invoice.findMany({
        where: {
          organizationId: ctx.organizationId,
          status: "PAID",
          paidAt: { gte: startDate.toISOString() },
        },
        select: { paidAt: true, amountPaidCents: true },
        orderBy: { paidAt: "asc" },
      });

      // Group by date
      const byDate: Record<string, number> = {};

      // Initialize all days to 0
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        byDate[key] = 0;
      }

      // Sum revenue per day
      for (const inv of paidInvoices) {
        if (!inv.paidAt) continue;
        const key = inv.paidAt.slice(0, 10);
        if (key in byDate) {
          byDate[key] = (byDate[key] ?? 0) + inv.amountPaidCents;
        }
      }

      return Object.entries(byDate).map(([date, revenueCents]) => ({
        date,
        revenueCents,
      }));
    }),

  getRecentActivity: protectedProcedure
    .input(z.object({ take: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.auditLog.findMany({
        where: { organizationId: ctx.organizationId },
        orderBy: { createdAt: "desc" },
        take: input?.take ?? 20,
      });
    }),
});
