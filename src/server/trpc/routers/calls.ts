import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createAuditLog } from '@/server/services/audit';

export const callsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['INCOMING', 'ANSWERED', 'MISSED', 'VOICEMAIL']).optional(),
        search: z.string().optional(),
        take: z.number().min(1).max(100).default(25),
        skip: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        organizationId: ctx.organizationId,
        ...(input?.status && { status: input.status }),
        ...(input?.search && {
          OR: [
            { fromPhone: { contains: input.search } },
            { twilioCallSid: { contains: input.search } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.db.call.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: input?.take ?? 25,
          skip: input?.skip ?? 0,
          include: {
            customer: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
          },
        }),
        ctx.db.call.count({ where }),
      ]);

      return { items, total };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const call = await ctx.db.call.findFirst({
        where: { id: input, organizationId: ctx.organizationId },
        include: {
          customer: true,
        },
      });
      if (!call) throw new TRPCError({ code: 'NOT_FOUND' });

      // Fetch linked job if exists
      const job = call.jobId
        ? await ctx.db.job.findFirst({
            where: { id: call.jobId, organizationId: ctx.organizationId },
            select: { id: true, jobNumber: true, title: true, status: true },
          })
        : null;

      return { call, job };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['INCOMING', 'ANSWERED', 'MISSED', 'VOICEMAIL']),
    }))
    .mutation(async ({ ctx, input }) => {
      const call = await ctx.db.call.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!call) throw new TRPCError({ code: 'NOT_FOUND' });

      const updated = await ctx.db.call.update({
        where: { id: input.id },
        data: { status: input.status, updatedAt: new Date().toISOString() },
      });

      await createAuditLog(ctx, 'call.updateStatus', 'Call', input.id, {
        status: { from: call.status, to: input.status },
      });

      return updated;
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const [total, answered, missed, today] = await Promise.all([
        ctx.db.call.count({ where: { organizationId: ctx.organizationId } }),
        ctx.db.call.count({ where: { organizationId: ctx.organizationId, status: 'ANSWERED' } }),
        ctx.db.call.count({ where: { organizationId: ctx.organizationId, status: 'MISSED' } }),
        ctx.db.call.count({
          where: {
            organizationId: ctx.organizationId,
            createdAt: { gte: new Date().toISOString().slice(0, 10) },
          },
        }),
      ]);
      return { total, answered, missed, today };
    }),
});
