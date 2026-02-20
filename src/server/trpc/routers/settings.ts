import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createAuditLog } from "@/server/services/audit";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createBillingPortalSession } from "@/server/services/stripe/billing";
import { createStripeCustomer, createSubscriptionCheckout } from "@/server/services/stripe/subscriptions";
import { computeTwilioSignature } from "@/server/services/twilio/validate";

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

  // ─── Unit 1B: Stripe Subscription Checkout ────────────────────────────────

  createSubscriptionCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    const org = await ctx.db.organization.findFirst({
      where: { id: ctx.organizationId },
    });
    if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

    let stripeSecretKey: string | undefined;
    let priceId: string | undefined;
    try {
      const { env } = await getCloudflareContext();
      stripeSecretKey = env.STRIPE_SECRET_KEY;
      priceId = env.STRIPE_STARTER_PRICE_ID;
    } catch {
      stripeSecretKey = undefined;
    }

    if (!stripeSecretKey) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Stripe is not configured. Set STRIPE_SECRET_KEY in Worker settings.",
      });
    }

    if (!priceId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Stripe price not configured. Set STRIPE_STARTER_PRICE_ID in Worker settings.",
      });
    }

    // Create Stripe customer if not already on file
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      customerId = await createStripeCustomer({
        stripeSecretKey,
        email: org.email ?? `org-${org.id}@opspilot.app`,
        name: org.name,
      });
      const now = new Date().toISOString();
      await ctx.db.organization.update({
        where: { id: ctx.organizationId },
        data: { stripeCustomerId: customerId, updatedAt: now },
      });
    }

    const { url } = await createSubscriptionCheckout({
      stripeSecretKey,
      customerId,
      priceId,
      returnUrl: "https://smb.cafecito-ai.com/settings",
    });

    return { url };
  }),

  // ─── Unit 2: Voice Webhook Self-Test ─────────────────────────────────────

  testVoiceWebhook: protectedProcedure.mutation(async ({ ctx }) => {
    const steps: Array<{ name: string; passed: boolean; detail: string }> = [];

    const org = await ctx.db.organization.findFirst({
      where: { id: ctx.organizationId },
    });

    if (!org?.twilioPhone) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No AI phone number configured. Set your Twilio phone in Settings → Integrations first.",
      });
    }

    let authToken: string | undefined;
    try {
      const { env } = await getCloudflareContext();
      authToken = env.TWILIO_AUTH_TOKEN;
    } catch {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cloudflare environment not available. Deploy to Workers to run the voice test.",
      });
    }

    if (!authToken) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "TWILIO_AUTH_TOKEN not configured in Worker settings.",
      });
    }

    const activeTechs = await ctx.db.technician.findMany({
      where: { organizationId: ctx.organizationId, status: "ACTIVE" },
      take: 1,
    });
    if (activeTechs.length === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No active technicians found. Add at least one technician before running the voice test.",
      });
    }

    const baseUrl = "https://smb.cafecito-ai.com";
    const voiceUrl = `${baseUrl}/api/webhooks/twilio/voice`;
    const callSid = `CA_TEST_${Date.now()}`;

    const voiceParams: Record<string, string> = {
      CallSid: callSid,
      From: "+15005550006",
      To: org.twilioPhone,
      CallStatus: "ringing",
      Direction: "inbound",
    };

    // Compute Twilio signature for voice URL
    const voiceSig = await computeTwilioSignature(authToken, voiceUrl, voiceParams);

    // Step 1: POST to voice webhook
    let voiceResponse: Response;
    try {
      voiceResponse = await fetch(voiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Twilio-Signature": voiceSig,
        },
        body: new URLSearchParams(voiceParams).toString(),
      });
    } catch (err) {
      steps.push({
        name: "Voice webhook POST",
        passed: false,
        detail: `Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      return { success: false, steps };
    }

    const voiceTwiml = await voiceResponse.text();
    const hasGather = voiceTwiml.includes("<Gather");
    steps.push({
      name: "Voice webhook POST",
      passed: voiceResponse.ok && hasGather,
      detail:
        voiceResponse.ok && hasGather
          ? "OK — TwiML contains <Gather, org found"
          : `Failed (status ${voiceResponse.status}): ${voiceTwiml.slice(0, 200)}`,
    });

    if (!voiceResponse.ok || !hasGather) {
      return { success: false, steps };
    }

    // Extract gather action URL from TwiML
    const actionMatch = voiceTwiml.match(/action="([^"]+)"/);
    if (!actionMatch?.[1]) {
      steps.push({ name: "Parse gather URL", passed: false, detail: "No action attribute in TwiML" });
      return { success: false, steps };
    }

    const gatherPath = actionMatch[1];
    const gatherUrl = gatherPath.startsWith("http") ? gatherPath : `${baseUrl}${gatherPath}`;
    steps.push({ name: "Parse gather URL", passed: true, detail: `Gather URL: ${gatherUrl}` });

    // Step 2: POST to gather webhook
    const gatherParams: Record<string, string> = {
      CallSid: callSid,
      From: "+15005550006",
      To: org.twilioPhone,
      SpeechResult: "My AC unit is broken and not cooling",
      Confidence: "0.9",
    };

    const gatherSig = await computeTwilioSignature(authToken, gatherUrl, gatherParams);

    let gatherResponse: Response;
    try {
      gatherResponse = await fetch(gatherUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Twilio-Signature": gatherSig,
        },
        body: new URLSearchParams(gatherParams).toString(),
      });
    } catch (err) {
      steps.push({
        name: "Gather webhook POST",
        passed: false,
        detail: `Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      return { success: false, steps };
    }

    const gatherTwiml = await gatherResponse.text();
    const hasSay =
      gatherTwiml.includes("<Say") &&
      gatherTwiml.toLowerCase().includes("thank you");
    steps.push({
      name: "Gather webhook POST",
      passed: gatherResponse.ok && hasSay,
      detail:
        gatherResponse.ok && hasSay
          ? "OK — AI processed speech and responded"
          : `Failed (status ${gatherResponse.status}): ${gatherTwiml.slice(0, 200)}`,
    });

    if (!gatherResponse.ok) {
      return { success: false, steps };
    }

    // Extract callId from gather URL for DB verification
    const gatherUrlObj = new URL(gatherUrl);
    const callId = gatherUrlObj.searchParams.get("callId");

    if (callId) {
      // Brief wait for async dispatch
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      // Step 3: Verify Call record in DB
      const call = await ctx.db.call.findFirst({
        where: { id: callId, organizationId: ctx.organizationId },
      });
      steps.push({
        name: "Call record created",
        passed: !!call,
        detail: call
          ? `Call ID: ${callId.slice(-8)}, status: ${call.status}`
          : "Call record not found in DB",
      });

      // Step 4: Verify Job record in DB
      const job = await ctx.db.job.findFirst({
        where: { callId, organizationId: ctx.organizationId },
      });
      steps.push({
        name: "Job record created",
        passed: !!job,
        detail: job
          ? `Job: ${job.jobNumber} — ${job.title}`
          : "No job created (AI may have classified as non-service intent)",
      });
    }

    const allPassed = steps.every((s) => s.passed);
    return { success: allPassed, steps };
  }),

  // ─── Unit 3: Twilio Number Provisioning ──────────────────────────────────

  searchTwilioNumbers: protectedProcedure
    .input(z.object({ areaCode: z.string().length(3).regex(/^\d{3}$/, "Area code must be 3 digits") }))
    .query(async ({ input }) => {
      let env: CloudflareEnv;
      try {
        ({ env } = await getCloudflareContext());
      } catch {
        return [];
      }

      if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) return [];

      const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/US/Local.json?AreaCode=${input.areaCode}&VoiceEnabled=true&SmsEnabled=true`,
          { headers: { Authorization: `Basic ${credentials}` } }
        );
        if (!res.ok) return [];
        const data = (await res.json()) as {
          available_phone_numbers?: Array<{
            friendly_name: string;
            phone_number: string;
            locality: string;
            region: string;
          }>;
        };
        return (data.available_phone_numbers ?? []).slice(0, 5).map((n) => ({
          friendlyName: n.friendly_name,
          phoneNumber: n.phone_number,
          locality: n.locality,
          region: n.region,
        }));
      } catch {
        return [];
      }
    }),

  purchaseTwilioNumber: protectedProcedure
    .input(z.object({ phoneNumber: z.string().regex(/^\+1\d{10}$/, "Format: +1XXXXXXXXXX") }))
    .mutation(async ({ ctx, input }) => {
      let env: CloudflareEnv;
      try {
        ({ env } = await getCloudflareContext());
      } catch {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cloudflare environment not available." });
      }

      if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Twilio credentials not configured." });
      }

      const credentials = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            PhoneNumber: input.phoneNumber,
            VoiceUrl: "https://smb.cafecito-ai.com/api/webhooks/twilio/voice",
            VoiceMethod: "POST",
            SmsUrl: "https://smb.cafecito-ai.com/api/webhooks/twilio/sms",
            SmsMethod: "POST",
          }).toString(),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to purchase number: ${errorText.slice(0, 200)}`,
        });
      }

      const now = new Date().toISOString();
      await ctx.db.organization.update({
        where: { id: ctx.organizationId },
        data: { twilioPhone: input.phoneNumber, updatedAt: now },
      });

      await createAuditLog(ctx, "twilio.number.purchase", "Organization", ctx.organizationId, {
        twilioPhone: { from: null, to: input.phoneNumber },
      });

      return { phoneNumber: input.phoneNumber };
    }),
});
