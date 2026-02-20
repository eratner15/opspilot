# OpsPilot

AI-powered operations platform for trades businesses (HVAC, plumbing, electrical, roofing).

**Live:** https://smb.cafecito-ai.com

---

## What It Does

- **AI Call Handling** — Twilio Voice + Claude answers every inbound call 24/7, extracts intent, creates jobs automatically
- **Job Dispatch** — Techs receive SMS notifications with job details, schedule management via calendar view
- **Quoting** — Create multi-line quotes, send via email/SMS, customers sign digitally online
- **Invoicing** — Convert jobs to invoices, accept Stripe payments via a public pay link
- **Analytics** — Real-time KPIs: revenue, job completion rate, call volume, top customers
- **Multi-tenant** — Each business is fully isolated via Clerk organizations

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| Database | Cloudflare D1 (SQLite) via Prisma + `@prisma/adapter-d1` |
| API | tRPC v11 with superjson |
| Auth | Clerk (multi-tenant organizations) |
| AI | Claude Sonnet 4 (Anthropic API) |
| Voice/SMS | Twilio |
| Payments | Stripe |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` |
| Styling | Tailwind CSS + shadcn/ui |

---

## Quickstart

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account with Workers + D1 enabled
- Clerk account
- (Optional) Twilio, Stripe, Anthropic accounts

### Local Development

```bash
# 1. Clone and install
git clone <repo>
cd opspilot
pnpm install

# 2. Set up environment
cp .env.example .env
# Fill in CLERK_* keys at minimum (see .env.example)

# 3. Set up local SQLite database
npx prisma generate
npx prisma db push   # creates dev.db
npx prisma db seed   # loads demo data

# 4. Start dev server
pnpm dev             # http://localhost:3000
```

### Production Deploy (Cloudflare Workers)

```bash
# 1. Configure Wrangler (already done in wrangler.jsonc)
npx wrangler login

# 2. Apply migrations to D1
npx wrangler d1 migrations apply opspilot-db

# 3. Set secrets in Cloudflare Worker settings
# (Dashboard → Workers → opspilot → Settings → Variables)

# 4. Deploy
pnpm deploy          # builds + deploys to smb.cafecito-ai.com
```

---

## Environment Variables

See `.env.example` for all required and optional variables.

**Required for local dev:**
- `DATABASE_URL` — `file:./dev.db`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

**Required for production (Cloudflare Worker secrets):**
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY` (for AI call handling)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

---

## Key File Locations

```
src/
├── app/
│   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── dashboard/      # KPI overview + charts
│   │   ├── jobs/           # Job management + calendar
│   │   ├── customers/      # Customer CRM
│   │   ├── calls/          # Call log + AI transcripts
│   │   ├── quotes/         # Quote builder + tracking
│   │   ├── invoices/       # Invoice management
│   │   ├── technicians/    # Tech roster
│   │   └── settings/       # Org settings + integrations
│   ├── (public)/           # Unauthenticated pages
│   │   ├── quote/[token]/  # Customer quote acceptance
│   │   ├── pay/[token]/    # Customer payment page
│   │   └── book/[slug]/    # Online service booking
│   ├── api/
│   │   ├── webhooks/       # Twilio, Stripe, Clerk webhooks
│   │   ├── cron/           # Scheduled jobs (invoice reminders)
│   │   └── public/         # Public API (booking submission)
│   └── onboarding/         # First-login setup wizard
├── server/trpc/routers/    # All tRPC API routes
├── server/services/        # AI, Twilio, Stripe, email services
├── lib/                    # DB, auth, utils, validations
└── components/             # Shared + UI components
prisma/
├── schema.prisma           # D1-compatible schema
├── migrations/             # D1 migration files
└── seed.ts                 # Demo data seed
```

---

## Architecture Notes

### Database (D1 / SQLite)
- All IDs generated with `crypto.randomUUID()` (no CUID/autoincrement)
- Money stored as `Int` cents (never floats)
- Dates stored as `String` ISO format (D1 has no native DateTime)
- JSON data stored as `String` (parse/stringify in app layer)
- No Prisma enums — use `String` fields + Zod validation
- Multi-tenant: every query includes `organizationId`

### Security
- All DB queries scoped by `organizationId` from Clerk auth context
- Public pages use unguessable `publicToken` (UUID), never database IDs
- PII redacted from all logs (`[REDACTED]`)
- Webhook signatures verified (Twilio, Stripe, Clerk)
- Rate limiting via Cloudflare KV (100 req/min per user)
- All mutations include audit log entries

### AI Call Flow
1. Twilio receives inbound call → webhooks to `/api/webhooks/twilio/voice`
2. Twilio streams audio → transcription
3. Claude analyzes transcript → extracts intent, customer info, urgency
4. Job auto-created in database
5. SMS dispatched to assigned technician

---

## Commands

```bash
pnpm dev              # Next.js dev server
pnpm build            # Production build
pnpm preview          # Local Workers runtime preview
pnpm deploy           # Build + deploy to Cloudflare
pnpm tsc --noEmit     # Type check
pnpm lint             # Lint
npx prisma generate   # Regenerate Prisma client
npx prisma db seed    # Seed demo data
npx wrangler d1 migrations apply opspilot-db  # Apply D1 migrations
```

---

## License

Private / proprietary. All rights reserved.
