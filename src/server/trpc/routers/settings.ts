import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/server/services/audit";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createBillingPortalSession } from "@/server/services/stripe/billing";

const updateOrgSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  timezone: z.string().optional(),
  twilioPhone: z.string().optional(),
});

export const settingsRouter = router({
  getOrg: protectedProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.organization.findFirst({
      where: { id: ctx.organizationId },
    });
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    return org;
  }),

  updateOrg: protectedProcedure
    .input(updateOrgSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const org = await ctx.db.organization.update({
        where: { id: ctx.organizationId },
        data: {
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zip: input.zip || null,
          timezone: input.timezone || "America/New_York",
          ...(input.twilioPhone !== undefined && { twilioPhone: input.twilioPhone || null }),
          updatedAt: now,
        },
      });
      await createAuditLog(ctx, "org.update", "Organization", ctx.organizationId, {});
      return org;
    }),

  getTeam: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });
  }),

  updateUserRole: protectedProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["OWNER", "ADMIN", "DISPATCHER", "TECHNICIAN"]) }))
    .mutation(async ({ ctx, input }) => {
      // Only OWNER can change roles
      const currentUser = await ctx.db.user.findFirst({
        where: { clerkUserId: ctx.userId, organizationId: ctx.organizationId },
      });
      if (!currentUser || currentUser.role !== "OWNER") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can change roles" });
      }
      // Verify target user belongs to this organization before updating
      const targetUser = await ctx.db.user.findFirst({
        where: { id: input.userId, organizationId: ctx.organizationId },
      });
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      const now = new Date().toISOString();
      const updated = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role, updatedAt: now },
      });
      await createAuditLog(ctx, "user.role_change", "User", input.userId, {
        role: { from: targetUser.role, to: input.role },
      });
      return updated;
    }),

  getIntegrationStatus: protectedProcedure.query(async () => {
    try {
      const { env } = await getCloudflareContext();
      return {
        twilio: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER),
        stripe: !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
        anthropic: !!env.ANTHROPIC_API_KEY,
        resend: !!env.RESEND_API_KEY,
      };
    } catch {
      // Local dev — assume not configured
      return { twilio: false, stripe: false, anthropic: false, resend: false };
    }
  }),

  createBillingPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const org = await ctx.db.organization.findFirst({
      where: { id: ctx.organizationId },
    });
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    if (!org.stripeCustomerId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No Stripe customer found. Contact support to set up billing.",
      });
    }

    let stripeSecretKey: string | undefined;
    try {
      const { env } = await getCloudflareContext();
      stripeSecretKey = env.STRIPE_SECRET_KEY;
    } catch {
      stripeSecretKey = undefined;
    }

    if (!stripeSecretKey) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Stripe is not configured. Set STRIPE_SECRET_KEY in Worker settings.",
      });
    }

    const { url } = await createBillingPortalSession({
      stripeSecretKey,
      stripeCustomerId: org.stripeCustomerId,
      returnUrl: "https://smb.cafecito-ai.com/settings",
    });

    return { url };
  }),
});
