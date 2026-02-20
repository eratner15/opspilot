import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
} from "@/lib/validations/invoice";
import { generateId, formatCurrency, formatDate } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/server/services/audit";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail, buildInvoiceEmailHtml } from "@/server/services/email";

function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `INV${year}${month}-${random}`;
}

type LineItemInput = { description: string; quantity: number; unitPriceCents: number };

function calcTotals(lineItems: LineItemInput[], taxRateBps: number) {
  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
    0
  );
  const taxCents = Math.round((subtotalCents * taxRateBps) / 10000);
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}

export const invoicesRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
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
            { invoiceNumber: { contains: input.search } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.invoice.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: input?.take ?? 25,
          skip: input?.skip ?? 0,
          include: {
            customer: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        ctx.db.invoice.count({ where }),
      ]);

      return { items, total };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
        include: {
          customer: true,
          job: { select: { id: true, jobNumber: true, title: true, category: true } },
        },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      return invoice;
    }),

  create: protectedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const customer = await ctx.db.customer.findFirst({
        where: { id: input.customerId, organizationId: ctx.organizationId },
      });
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });

      const { subtotalCents, taxCents, totalCents } = calcTotals(
        input.lineItems,
        input.taxRateBps ?? 0
      );

      const id = generateId();
      const now = new Date().toISOString();

      const invoice = await ctx.db.invoice.create({
        data: {
          id,
          organizationId: ctx.organizationId,
          invoiceNumber: generateInvoiceNumber(),
          customerId: input.customerId,
          jobId: input.jobId,
          status: "DRAFT",
          publicToken: generateId(),
          lineItemsJson: JSON.stringify(input.lineItems),
          subtotalCents,
          taxRateBps: input.taxRateBps ?? 0,
          taxCents,
          totalCents,
          amountPaidCents: 0,
          dueDate: input.dueDate,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        },
      });

      await createAuditLog(ctx, "invoice.create", "Invoice", id, {
        status: { from: null, to: "DRAFT" },
        totalCents: { from: null, to: totalCents },
      });

      return invoice;
    }),

  createFromJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await ctx.db.job.findFirst({
        where: { id: input.jobId, organizationId: ctx.organizationId },
        include: { customer: true },
      });
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });

      // Parse line items from job
      type JobLineItem = { description: string; quantity: number; unitPriceCents: number };
      let lineItems: JobLineItem[] = [];
      if (job.lineItemsJson) {
        try {
          lineItems = JSON.parse(job.lineItemsJson) as JobLineItem[];
        } catch {
          lineItems = [];
        }
      }
      if (lineItems.length === 0) {
        lineItems = [{ description: `Service: ${job.title ?? job.category}`, quantity: 1, unitPriceCents: 0 }];
      }

      const { subtotalCents, taxCents, totalCents } = calcTotals(lineItems, 0);

      const id = generateId();
      const now = new Date().toISOString();
      // Default due date: 30 days from now
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      if (!job.customerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Job has no associated customer" });
      }

      const invoice = await ctx.db.invoice.create({
        data: {
          id,
          organizationId: ctx.organizationId,
          invoiceNumber: generateInvoiceNumber(),
          customerId: job.customerId,
          jobId: job.id,
          status: "DRAFT",
          publicToken: generateId(),
          lineItemsJson: JSON.stringify(lineItems),
          subtotalCents,
          taxRateBps: 0,
          taxCents,
          totalCents,
          amountPaidCents: 0,
          dueDate,
          notes: null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await createAuditLog(ctx, "invoice.createFromJob", "Invoice", id, {
        status: { from: null, to: "DRAFT" },
        jobId: { from: null, to: job.id },
      });

      return invoice;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(updateInvoiceSchema))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.invoice.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      if (existing.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only DRAFT invoices can be edited" });
      }

      const { id, ...rest } = input;
      const lineItems: LineItemInput[] = rest.lineItems ?? (JSON.parse(existing.lineItemsJson) as LineItemInput[]);
      const taxRateBps = rest.taxRateBps ?? existing.taxRateBps;
      const { subtotalCents, taxCents, totalCents } = calcTotals(lineItems, taxRateBps);

      const updated = await ctx.db.invoice.update({
        where: { id },
        data: {
          ...(rest.customerId !== undefined && { customerId: rest.customerId }),
          ...(rest.jobId !== undefined && { jobId: rest.jobId }),
          ...(rest.lineItems !== undefined && { lineItemsJson: JSON.stringify(rest.lineItems) }),
          taxRateBps,
          subtotalCents,
          taxCents,
          totalCents,
          ...(rest.dueDate !== undefined && { dueDate: rest.dueDate }),
          ...(rest.notes !== undefined && { notes: rest.notes }),
          updatedAt: new Date().toISOString(),
        },
      });

      await createAuditLog(ctx, "invoice.update", "Invoice", id, {
        totalCents: { from: existing.totalCents, to: totalCents },
      });

      return updated;
    }),

  updateStatus: protectedProcedure
    .input(updateInvoiceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.invoice.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });

      const updated = await ctx.db.invoice.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.status === "SENT" && { sentAt: new Date().toISOString() }),
          ...(input.status === "PAID" && { paidAt: new Date().toISOString() }),
          updatedAt: new Date().toISOString(),
        },
      });

      await createAuditLog(ctx, "invoice.updateStatus", "Invoice", input.id, {
        status: { from: existing.status, to: input.status },
      });

      return updated;
    }),

  sendInvoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          organization: { select: { name: true } },
        },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      if (!["DRAFT", "SENT", "OVERDUE"].includes(invoice.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invoice cannot be sent in its current state" });
      }
      if (!invoice.customer.email) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Customer has no email address" });
      }

      let resendApiKey: string | undefined;
      let appUrl = "https://smb.cafecito-ai.com";
      try {
        const { env } = await getCloudflareContext();
        const cfEnv = env as unknown as Record<string, string | undefined>;
        resendApiKey = cfEnv.RESEND_API_KEY;
        if (cfEnv.NEXT_PUBLIC_APP_URL) appUrl = cfEnv.NEXT_PUBLIC_APP_URL;
      } catch {
        // local dev
      }

      const publicUrl = `${appUrl}/pay/${invoice.publicToken}`;
      const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`;

      await sendEmail(resendApiKey, {
        to: invoice.customer.email,
        subject: `Invoice ${invoice.invoiceNumber} from ${invoice.organization.name}`,
        html: buildInvoiceEmailHtml({
          customerName,
          invoiceNumber: invoice.invoiceNumber,
          total: formatCurrency(invoice.totalCents),
          dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : undefined,
          publicUrl,
          orgName: invoice.organization.name,
        }),
      });

      const updated = await ctx.db.invoice.update({
        where: { id: input.id },
        data: {
          status: "SENT",
          sentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      await createAuditLog(ctx, "invoice.send", "Invoice", input.id, {
        status: { from: invoice.status, to: "SENT" },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.invoice.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      if (!["DRAFT", "CANCELLED"].includes(existing.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete active invoice" });
      }

      await ctx.db.invoice.delete({ where: { id: input.id } });

      await createAuditLog(ctx, "invoice.delete", "Invoice", input.id, {
        status: { from: existing.status, to: null },
      });

      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, paid, sent, overdue] = await Promise.all([
      ctx.db.invoice.count({ where: { organizationId: ctx.organizationId } }),
      ctx.db.invoice.count({ where: { organizationId: ctx.organizationId, status: "PAID" } }),
      ctx.db.invoice.count({ where: { organizationId: ctx.organizationId, status: "SENT" } }),
      ctx.db.invoice.count({ where: { organizationId: ctx.organizationId, status: "OVERDUE" } }),
    ]);

    const [paidRevenue, outstandingBalance] = await Promise.all([
      ctx.db.invoice.aggregate({
        where: { organizationId: ctx.organizationId, status: "PAID" },
        _sum: { amountPaidCents: true },
      }),
      ctx.db.invoice.aggregate({
        where: { organizationId: ctx.organizationId, status: { in: ["SENT", "OVERDUE"] } },
        _sum: { totalCents: true },
      }),
    ]);

    return {
      total,
      paid,
      sent,
      overdue,
      paidRevenueCents: paidRevenue._sum.amountPaidCents ?? 0,
      outstandingCents: outstandingBalance._sum.totalCents ?? 0,
    };
  }),
});
