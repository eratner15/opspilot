import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createCustomerSchema, updateCustomerSchema } from "@/lib/validations/customer";
import { generateId } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import type { Db } from "@/lib/db";

async function auditLog(
  ctx: { db: Db; userId: string; organizationId: string },
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, { from: unknown; to: unknown }>
) {
  await ctx.db.auditLog.create({
    data: {
      id: generateId(),
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action,
      entityType,
      entityId,
      changesJson: changes ? JSON.stringify(changes) : null,
      createdAt: new Date().toISOString(),
    },
  });
}

export const customersRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          type: z.enum(["RESIDENTIAL", "COMMERCIAL"]).optional(),
          take: z.number().min(1).max(100).default(25),
          skip: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        organizationId: ctx.organizationId,
        ...(input?.type && { type: input.type }),
        ...(input?.search && {
          OR: [
            { firstName: { contains: input.search } },
            { lastName: { contains: input.search } },
            { phone: { contains: input.search } },
            { email: { contains: input.search } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.customer.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input?.take ?? 25,
          skip: input?.skip ?? 0,
          include: {
            _count: { select: { jobs: true, invoices: true } },
          },
        }),
        ctx.db.customer.count({ where }),
      ]);

      return { items, total };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.db.customer.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
        include: {
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { technician: { select: { firstName: true, lastName: true } } },
          },
          invoices: { orderBy: { createdAt: "desc" }, take: 10 },
          calls: { orderBy: { createdAt: "desc" }, take: 10 },
          quotes: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      return customer;
    }),

  create: protectedProcedure
    .input(createCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const id = generateId();
      const now = new Date().toISOString();
      const customer = await ctx.db.customer.create({
        data: {
          id,
          organizationId: ctx.organizationId,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone.replace(/\D/g, ""),
          email: input.email || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zip: input.zip || null,
          type: input.type,
          equipmentJson: input.equipmentJson || null,
          notes: input.notes || null,
          source: input.source || null,
          createdAt: now,
          updatedAt: now,
        },
      });
      await auditLog(ctx, "customer.create", "Customer", id, {
        name: { from: null, to: `${input.firstName} ${input.lastName}` },
      });
      return customer;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateCustomerSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.customer.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });

      const phone = input.data.phone ? input.data.phone.replace(/\D/g, "") : undefined;
      const customer = await ctx.db.customer.update({
        where: { id: input.id },
        data: {
          ...input.data,
          ...(phone && { phone }),
          email: input.data.email === "" ? null : input.data.email,
          updatedAt: new Date().toISOString(),
        },
      });
      await auditLog(ctx, "customer.update", "Customer", input.id);
      return customer;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.customer.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      await ctx.db.customer.delete({ where: { id: input.id } });
      await auditLog(ctx, "customer.delete", "Customer", input.id);
      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [jobs, invoices] = await Promise.all([
        ctx.db.job.findMany({
          where: { customerId: input.id, organizationId: ctx.organizationId },
          select: { status: true, totalCents: true, completedAt: true },
        }),
        ctx.db.invoice.findMany({
          where: { customerId: input.id, organizationId: ctx.organizationId },
          select: { status: true, totalCents: true, amountPaidCents: true },
        }),
      ]);

      const lifetimeRevenueCents = invoices
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + i.amountPaidCents, 0);

      const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;
      const avgTicketCents = completedJobs > 0
        ? invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.totalCents, 0) / completedJobs
        : 0;

      return {
        totalJobs: jobs.length,
        completedJobs,
        lifetimeRevenueCents,
        avgTicketCents: Math.round(avgTicketCents),
        outstandingCents: invoices
          .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
          .reduce((sum, i) => sum + (i.totalCents - i.amountPaidCents), 0),
      };
    }),
});
