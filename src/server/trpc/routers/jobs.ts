import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createJobSchema, updateJobSchema, updateJobStatusSchema } from "@/lib/validations/job";
import { generateId } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import type { Db } from "@/lib/db";

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["SCHEDULED", "CANCELLED", "ON_HOLD"],
  SCHEDULED: ["EN_ROUTE", "IN_PROGRESS", "CANCELLED", "ON_HOLD", "NEW"],
  EN_ROUTE: ["IN_PROGRESS", "CANCELLED", "ON_HOLD", "SCHEDULED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED", "ON_HOLD", "EN_ROUTE"],
  COMPLETED: ["INVOICED", "ON_HOLD"],
  INVOICED: ["PAID", "COMPLETED"],
  PAID: [],
  CANCELLED: ["NEW"],
  ON_HOLD: ["NEW", "SCHEDULED", "CANCELLED"],
};

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

function generateJobNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `J${year}${month}-${random}`;
}

export const jobsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum([
              "NEW",
              "SCHEDULED",
              "EN_ROUTE",
              "IN_PROGRESS",
              "COMPLETED",
              "INVOICED",
              "PAID",
              "CANCELLED",
              "ON_HOLD",
            ])
            .optional(),
          technicianId: z.string().optional(),
          priority: z.enum(["LOW", "NORMAL", "HIGH", "EMERGENCY"]).optional(),
          customerId: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          take: z.number().min(1).max(200).default(50),
          skip: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        organizationId: ctx.organizationId,
        ...(input?.status && { status: input.status }),
        ...(input?.technicianId && { technicianId: input.technicianId }),
        ...(input?.priority && { priority: input.priority }),
        ...(input?.customerId && { customerId: input.customerId }),
      };

      const [items, total] = await Promise.all([
        ctx.db.job.findMany({
          where,
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          take: input?.take ?? 50,
          skip: input?.skip ?? 0,
          include: {
            customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
            technician: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
        ctx.db.job.count({ where }),
      ]);

      return { items, total };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.job.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
        include: {
          customer: true,
          technician: true,
          invoices: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });

      // Fetch audit log for this job
      const activityLog = await ctx.db.auditLog.findMany({
        where: { entityId: input.id, organizationId: ctx.organizationId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return { ...job, activityLog };
    }),

  create: protectedProcedure
    .input(createJobSchema)
    .mutation(async ({ ctx, input }) => {
      const id = generateId();
      const now = new Date().toISOString();
      const jobNumber = generateJobNumber();

      const job = await ctx.db.job.create({
        data: {
          id,
          organizationId: ctx.organizationId,
          jobNumber,
          customerId: input.customerId || null,
          technicianId: input.technicianId || null,
          title: input.title,
          description: input.description || null,
          category: input.category || null,
          priority: input.priority,
          status: input.status,
          scheduledAt: input.scheduledAt || null,
          scheduledWindow: input.scheduledWindow || null,
          lineItemsJson: input.lineItemsJson || null,
          totalCents: input.totalCents,
          notes: input.notes || null,
          createdAt: now,
          updatedAt: now,
        },
      });

      await auditLog(ctx, "job.create", "Job", id, {
        status: { from: null, to: input.status },
      });

      return job;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateJobSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.job.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });

      const job = await ctx.db.job.update({
        where: { id: input.id },
        data: {
          ...input.data,
          customerId: input.data.customerId === "" ? null : input.data.customerId,
          technicianId: input.data.technicianId === "" ? null : input.data.technicianId,
          updatedAt: new Date().toISOString(),
        },
      });

      await auditLog(ctx, "job.update", "Job", input.id);
      return job;
    }),

  updateStatus: protectedProcedure
    .input(updateJobStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.job.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });

      const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${existing.status} to ${input.status}`,
        });
      }

      const now = new Date().toISOString();
      const completedAt =
        input.status === "COMPLETED" && !existing.completedAt ? now : existing.completedAt;

      const job = await ctx.db.job.update({
        where: { id: input.id },
        data: {
          status: input.status,
          completedAt: completedAt ?? null,
          updatedAt: now,
        },
      });

      await auditLog(ctx, "job.statusChange", "Job", input.id, {
        status: { from: existing.status, to: input.status },
      });

      return job;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.job.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      await ctx.db.job.delete({ where: { id: input.id } });
      await auditLog(ctx, "job.delete", "Job", input.id);
      return { success: true };
    }),
});
