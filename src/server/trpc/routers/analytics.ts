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

  getRevenueByPeriod: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        groupBy: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ ctx, input }) => {
      const paidInvoices = await ctx.db.invoice.findMany({
        where: {
          organizationId: ctx.organizationId,
          status: "PAID",
          paidAt: { gte: input.startDate, lte: input.endDate },
        },
        select: { paidAt: true, amountPaidCents: true },
        orderBy: { paidAt: "asc" },
      });

      const byPeriod: Record<string, number> = {};
      for (const inv of paidInvoices) {
        if (!inv.paidAt) continue;
        let key: string;
        const d = new Date(inv.paidAt);
        if (input.groupBy === "day") {
          key = inv.paidAt.slice(0, 10);
        } else if (input.groupBy === "week") {
          // ISO week: Monday
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d);
          monday.setDate(diff);
          key = monday.toISOString().slice(0, 10);
        } else {
          key = inv.paidAt.slice(0, 7); // YYYY-MM
        }
        byPeriod[key] = (byPeriod[key] ?? 0) + inv.amountPaidCents;
      }

      return Object.entries(byPeriod)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, revenueCents]) => ({ period, revenueCents }));
    }),

  getJobsByCategory: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const jobs = await ctx.db.job.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(input?.startDate && { createdAt: { gte: input.startDate } }),
          ...(input?.endDate && { createdAt: { lte: input.endDate } }),
        },
        select: { category: true, status: true, totalCents: true },
      });

      const byCat: Record<string, { count: number; revenueCents: number; completed: number }> = {};
      for (const job of jobs) {
        const cat = job.category ?? "UNCATEGORIZED";
        if (!byCat[cat]) byCat[cat] = { count: 0, revenueCents: 0, completed: 0 };
        byCat[cat].count++;
        byCat[cat].revenueCents += job.totalCents ?? 0;
        if (job.status === "COMPLETED" || job.status === "PAID" || job.status === "INVOICED") {
          byCat[cat].completed++;
        }
      }

      return Object.entries(byCat)
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.count - a.count);
    }),

  getTechPerformance: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const techs = await ctx.db.technician.findMany({
        where: { organizationId: ctx.organizationId, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
      });

      const results = await Promise.all(
        techs.map(async (tech) => {
          const [assigned, completed] = await Promise.all([
            ctx.db.job.count({
              where: {
                organizationId: ctx.organizationId,
                technicianId: tech.id,
                ...(input?.startDate && { createdAt: { gte: input.startDate } }),
                ...(input?.endDate && { createdAt: { lte: input.endDate } }),
              },
            }),
            ctx.db.job.count({
              where: {
                organizationId: ctx.organizationId,
                technicianId: tech.id,
                status: { in: ["COMPLETED", "INVOICED", "PAID"] },
                ...(input?.startDate && { completedAt: { gte: input.startDate } }),
                ...(input?.endDate && { completedAt: { lte: input.endDate } }),
              },
            }),
          ]);

          return {
            technicianId: tech.id,
            name: `${tech.firstName} ${tech.lastName}`,
            assignedJobs: assigned,
            completedJobs: completed,
            completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
          };
        })
      );

      return results.sort((a, b) => b.completedJobs - a.completedJobs);
    }),

  getCallMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const [total, withJob, byStatus] = await Promise.all([
        ctx.db.call.count({
          where: {
            organizationId: ctx.organizationId,
            ...(input?.startDate && { createdAt: { gte: input.startDate } }),
            ...(input?.endDate && { createdAt: { lte: input.endDate } }),
          },
        }),
        ctx.db.call.count({
          where: {
            organizationId: ctx.organizationId,
            jobId: { not: null },
            ...(input?.startDate && { createdAt: { gte: input.startDate } }),
            ...(input?.endDate && { createdAt: { lte: input.endDate } }),
          },
        }),
        ctx.db.call.groupBy({
          by: ["status"],
          where: {
            organizationId: ctx.organizationId,
            ...(input?.startDate && { createdAt: { gte: input.startDate } }),
            ...(input?.endDate && { createdAt: { lte: input.endDate } }),
          },
          _count: { id: true },
        }),
      ]);

      const conversionRate = total > 0 ? Math.round((withJob / total) * 100) : 0;
      const statusCounts = Object.fromEntries(
        byStatus.map((row) => [row.status, row._count.id])
      );

      return { total, withJob, conversionRate, statusCounts };
    }),

  getOutstandingInvoices: protectedProcedure.query(async ({ ctx }) => {
    const invoices = await ctx.db.invoice.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: { in: ["SENT", "OVERDUE"] },
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 50,
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: `${inv.customer.firstName} ${inv.customer.lastName}`,
      balanceCents: inv.totalCents - inv.amountPaidCents,
      dueDate: inv.dueDate,
      status: inv.status,
      isOverdue: inv.status === "OVERDUE" || (inv.dueDate ? new Date(inv.dueDate) < new Date() : false),
    }));
  }),

  getCustomerMetrics: protectedProcedure.query(async ({ ctx }) => {
    const [total, newThisMonth, withJobs] = await Promise.all([
      ctx.db.customer.count({ where: { organizationId: ctx.organizationId } }),
      ctx.db.customer.count({
        where: {
          organizationId: ctx.organizationId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          },
        },
      }),
      ctx.db.customer.count({
        where: {
          organizationId: ctx.organizationId,
          jobs: { some: {} },
        },
      }),
    ]);

    return {
      total,
      newThisMonth,
      withJobs,
      retention: total > 0 ? Math.round((withJobs / total) * 100) : 0,
    };
  }),
});
