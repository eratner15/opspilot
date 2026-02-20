import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { createTechnicianSchema, updateTechnicianSchema } from "@/lib/validations/technician";
import { generateId } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import type { Db } from "@/lib/db";

async function auditLog(
  ctx: { db: Db; userId: string; organizationId: string },
  action: string,
  entityType: string,
  entityId: string
) {
  await ctx.db.auditLog.create({
    data: {
      id: generateId(),
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action,
      entityType,
      entityId,
      changesJson: null,
      createdAt: new Date().toISOString(),
    },
  });
}

export const techniciansRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
          take: z.number().min(1).max(100).default(50),
          skip: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        organizationId: ctx.organizationId,
        ...(input?.status && { status: input.status }),
      };

      const [items, total] = await Promise.all([
        ctx.db.technician.findMany({
          where,
          orderBy: { firstName: "asc" },
          take: input?.take ?? 50,
          skip: input?.skip ?? 0,
          include: {
            _count: { select: { jobs: true } },
          },
        }),
        ctx.db.technician.count({ where }),
      ]);

      return { items, total };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tech = await ctx.db.technician.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
        include: {
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              customer: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
      if (!tech) throw new TRPCError({ code: "NOT_FOUND", message: "Technician not found" });
      return tech;
    }),

  create: protectedProcedure
    .input(createTechnicianSchema)
    .mutation(async ({ ctx, input }) => {
      const id = generateId();
      const now = new Date().toISOString();
      const tech = await ctx.db.technician.create({
        data: {
          id,
          organizationId: ctx.organizationId,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone.replace(/\D/g, ""),
          email: input.email || null,
          type: input.type,
          skillsJson: input.skillsJson || null,
          status: input.status,
          notes: input.notes || null,
          createdAt: now,
          updatedAt: now,
        },
      });
      await auditLog(ctx, "technician.create", "Technician", id);
      return tech;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateTechnicianSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.technician.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Technician not found" });

      const phone = input.data.phone ? input.data.phone.replace(/\D/g, "") : undefined;
      const tech = await ctx.db.technician.update({
        where: { id: input.id },
        data: {
          ...input.data,
          ...(phone && { phone }),
          email: input.data.email === "" ? null : input.data.email,
          updatedAt: new Date().toISOString(),
        },
      });
      await auditLog(ctx, "technician.update", "Technician", input.id);
      return tech;
    }),
});
