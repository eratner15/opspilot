interface CloudflareEnv {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;
  CLERK_SECRET_KEY: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  ANTHROPIC_API_KEY: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_STARTER_PRICE_ID?: string;
  RESEND_API_KEY?: string;
  // Observability (optional — add keys to enable)
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
}
