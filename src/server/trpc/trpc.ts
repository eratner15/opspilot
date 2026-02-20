import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { checkRateLimit } from "@/lib/rate-limit";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.organizationId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  // Rate limit: 100/min per user, 1000/min per org
  const [userLimit, orgLimit] = await Promise.all([
    checkRateLimit(ctx.kv, `user:${ctx.userId}`, 100),
    checkRateLimit(ctx.kv, `org:${ctx.organizationId}`, 1000),
  ]);

  if (!userLimit.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded. Please slow down.",
    });
  }

  if (!orgLimit.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Organization rate limit exceeded.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      db: ctx.db,
      kv: ctx.kv,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

const enforceUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const userProcedure = t.procedure.use(enforceUser);
