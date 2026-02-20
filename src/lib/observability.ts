/**
 * Observability stub.
 *
 * BLOCKED: Sentry + PostHog require NEXT_PUBLIC_SENTRY_DSN and
 * NEXT_PUBLIC_POSTHOG_KEY environment variables that are not yet configured.
 *
 * To enable full observability:
 *   pnpm add @sentry/nextjs posthog-js
 * Then add keys to Cloudflare Worker environment settings and .dev.vars.
 *
 * This file provides no-op stubs so the rest of the app compiles cleanly.
 */

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.error("[observability]", error, context);
  }
  // TODO: Sentry.captureException(error, { extra: context });
}

export function captureEvent(name: string, properties?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[observability:event]", name, properties);
  }
  // TODO: posthog.capture(name, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[observability:identify]", userId, traits);
  }
  // TODO: posthog.identify(userId, traits);
}
