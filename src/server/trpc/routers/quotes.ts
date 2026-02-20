import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createQuoteSchema, updateQuoteSchema, updateQuoteStatusSchema } from "@/lib/validations/quote";
import { generateId } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import type { Db } from "@/lib/db";
import type { LineItem } from "@/lib/validations/quote";

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

function generateQuoteNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `Q${year}${month}-${random}`;
}

function calcTotals(lineItems: LineItem[], taxRateBps: number) {
  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
    0
  );
  const taxCents = Math.round((subtotalCents * taxRateBps) / 10000);
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}

export const quotesRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]).optional(),
          customerId: z.string().optional(),
          search: z.string().optional(),
          take: z.number().min(1).max(100).default(25),
          skip: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        organizationId: ctx.organizationId,
        ...(input?.status && { status: input.status }),
        ...(input?.customerId && { customerId: input.customerId }),
        ...(input?.search && {
          OR: [
            { quoteNumber: { contains: input.search } },
            { title: { contains: input.search } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.quote.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input?.take ?? 25,
          skip: input?.skip ?? 0,
          include: {
            customer: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        ctx.db.quote.count({ where }),
      ]);

      return { items, total };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const quote = await ctx.db.quote.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
        include: {
          customer: true,
        },
      });

      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      return quote;
    }),

  create: protectedProcedure
    .input(createQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify customer belongs to org
      const customer = await ctx.db.customer.findFirst({
        where: { id: input.customerId, organizationId: ctx.organizationId },
      });
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });

      const { subtotalCents, taxCents, totalCents } = calcTotals(input.lineItems, input.taxRateBps ?? 0);
      const id = generateId();
      const now = new Date().toISOString();

      const quote = await ctx.db.quote.create({
        data: {
          id,
          organizationId: ctx.organizationId,
          quoteNumber: generateQuoteNumber(),
          customerId: input.customerId,
          jobId: input.jobId,
          status: "DRAFT",
          publicToken: generateId(),
          title: input.title,
          lineItemsJson: JSON.stringify(input.lineItems),
          subtotalCents,
          taxRateBps: input.taxRateBps ?? 0,
          taxCents,
          totalCents,
          notes: input.notes,
          validUntil: input.validUntil,
          createdAt: now,
          updatedAt: now,
        },
      });

      await auditLog(ctx, "quote.create", "Quote", id, {
        status: { from: null, to: "DRAFT" },
        totalCents: { from: null, to: totalCents },
      });

      return quote;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(updateQuoteSchema))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.quote.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      if (existing.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only DRAFT quotes can be edited" });
      }

      const { id, ...rest } = input;
      const lineItems = rest.lineItems ?? (JSON.parse(existing.lineItemsJson) as LineItem[]);
      const taxRateBps = rest.taxRateBps ?? existing.taxRateBps;
      const { subtotalCents, taxCents, totalCents } = calcTotals(lineItems, taxRateBps);

      const updated = await ctx.db.quote.update({
        where: { id },
        data: {
          ...(rest.customerId !== undefined && { customerId: rest.customerId }),
          ...(rest.jobId !== undefined && { jobId: rest.jobId }),
          ...(rest.title !== undefined && { title: rest.title }),
          ...(rest.lineItems !== undefined && { lineItemsJson: JSON.stringify(rest.lineItems) }),
          taxRateBps,
          subtotalCents,
          taxCents,
          totalCents,
          ...(rest.notes !== undefined && { notes: rest.notes }),
          ...(rest.validUntil !== undefined && { validUntil: rest.validUntil }),
          updatedAt: new Date().toISOString(),
        },
      });

      await auditLog(ctx, "quote.update", "Quote", id, {
        totalCents: { from: existing.totalCents, to: totalCents },
      });

      return updated;
    }),

  updateStatus: protectedProcedure
    .input(updateQuoteStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.quote.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });

      const updated = await ctx.db.quote.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.status === "SENT" && { sentAt: new Date().toISOString() }),
          ...(input.status === "ACCEPTED" && { acceptedAt: new Date().toISOString() }),
          updatedAt: new Date().toISOString(),
        },
      });

      await auditLog(ctx, "quote.updateStatus", "Quote", input.id, {
        status: { from: existing.status, to: input.status },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.quote.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      if (!["DRAFT", "DECLINED", "EXPIRED"].includes(existing.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete active quote" });
      }

      await ctx.db.quote.delete({ where: { id: input.id } });

      await auditLog(ctx, "quote.delete", "Quote", input.id, {
        status: { from: existing.status, to: null },
      });

      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, accepted, sent, draft] = await Promise.all([
      ctx.db.quote.count({ where: { organizationId: ctx.organizationId } }),
      ctx.db.quote.count({ where: { organizationId: ctx.organizationId, status: "ACCEPTED" } }),
      ctx.db.quote.count({ where: { organizationId: ctx.organizationId, status: "SENT" } }),
      ctx.db.quote.count({ where: { organizationId: ctx.organizationId, status: "DRAFT" } }),
    ]);

    const acceptedRevenue = await ctx.db.quote.aggregate({
      where: { organizationId: ctx.organizationId, status: "ACCEPTED" },
      _sum: { totalCents: true },
    });

    return {
      total,
      accepted,
      sent,
      draft,
      acceptedRevenueCents: acceptedRevenue._sum.totalCents ?? 0,
      conversionRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    };
  }),
});
