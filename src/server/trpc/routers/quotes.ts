import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createQuoteSchema, updateQuoteSchema, updateQuoteStatusSchema } from "@/lib/validations/quote";
import { generateId } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/server/services/audit";
import type { LineItem } from "@/lib/validations/quote";
import { callClaudeJSON } from "@/server/services/ai/claude";
import {
  QUOTE_ASSIST_SYSTEM,
  buildQuoteAssistPrompt,
  type QuoteAssistResult,
} from "@/server/services/ai/prompts/quote-assist";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail, buildQuoteEmailHtml } from "@/server/services/email";
import { formatCurrency, formatDate } from "@/lib/utils";

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

      await createAuditLog(ctx, "quote.create", "Quote", id, {
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

      await createAuditLog(ctx, "quote.update", "Quote", id, {
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

      await createAuditLog(ctx, "quote.updateStatus", "Quote", input.id, {
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

      await createAuditLog(ctx, "quote.delete", "Quote", input.id, {
        status: { from: existing.status, to: null },
      });

      return { success: true };
    }),

  sendQuote: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quote.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          organization: { select: { name: true } },
        },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      if (!["DRAFT", "SENT"].includes(quote.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Quote cannot be sent in its current state" });
      }
      if (!quote.customer.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Customer has no email address" });
      }

      let resendApiKey: string | undefined;
      let appUrl = "https://smb.cafecito-ai.com";
      try {
        const { env } = await getCloudflareContext();
        const cfEnv = env as unknown as Record<string, string | undefined>;
        resendApiKey = cfEnv.RESEND_API_KEY;
        if (cfEnv.NEXT_PUBLIC_APP_URL) {
          appUrl = cfEnv.NEXT_PUBLIC_APP_URL;
        }
      } catch {
        // local dev
      }

      const publicUrl = `${appUrl}/quote/${quote.publicToken}`;
      const customerName = `${quote.customer.firstName} ${quote.customer.lastName}`;

      await sendEmail(resendApiKey, {
        to: quote.customer.email,
        subject: `Quote ${quote.quoteNumber} from ${quote.organization.name}`,
        html: buildQuoteEmailHtml({
          customerName,
          quoteNumber: quote.quoteNumber,
          total: formatCurrency(quote.totalCents),
          validUntil: quote.validUntil ? formatDate(quote.validUntil) : undefined,
          publicUrl,
          orgName: quote.organization.name,
        }),
      });

      const updated = await ctx.db.quote.update({
        where: { id: input.id },
        data: {
          status: "SENT",
          sentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      await createAuditLog(ctx, "quote.send", "Quote", input.id, {
        status: { from: quote.status, to: "SENT" },
      });

      return updated;
    }),

  suggestLineItems: protectedProcedure
    .input(
      z.object({
        jobDescription: z.string().min(5, "Description required"),
        category: z.string().default("OTHER"),
        customerType: z.string().default("RESIDENTIAL"),
      })
    )
    .mutation(async ({ input }) => {
      // Get API key from Cloudflare env
      let apiKey: string | undefined;
      try {
        const { env } = await getCloudflareContext();
        apiKey = env.ANTHROPIC_API_KEY;
      } catch {
        // local dev — fall through to mock
      }

      if (!apiKey) {
        // Return mock suggestions when no API key
        return {
          lineItems: [
            { description: "Service call & diagnostic", quantity: 1, unitPriceCents: 9900 },
            { description: "Labor — repair work", quantity: 2, unitPriceCents: 12500 },
            { description: "Parts & materials", quantity: 1, unitPriceCents: 7500 },
          ],
          notes: "Prices are estimates. Final cost may vary based on parts availability.",
          mock: true,
        };
      }

      const result = await callClaudeJSON<QuoteAssistResult>(
        apiKey,
        [{ role: "user", content: buildQuoteAssistPrompt(input) }],
        { systemPrompt: QUOTE_ASSIST_SYSTEM, maxTokens: 1024 }
      );

      return {
        lineItems: result.lineItems,
        notes: result.notes,
        mock: false,
      };
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
