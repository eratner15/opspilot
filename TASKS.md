# OpsPilot — TASKS.md
## Autonomous Build Task Registry
## Last Updated: 2026-02-19
## Total Progress: 39 / 48 units complete
## Current Phase: 5 — POLISH & SECURITY
## Build Status: IN PROGRESS

---

## INSTRUCTIONS FOR CLAUDE CODE
1. Find the FIRST unchecked task `- [ ]` below
2. Read CLAUDE.md for rules and patterns
3. Read tasks/lessons.md for past mistakes to avoid
4. Build the task following its ACTION section
5. Run the VERIFY checklist for that task
6. Fix anything that fails verification
7. `git add -A && git commit -m "feat(unit-X.X): description"`
8. Mark the task `- [x]` and add a 1-line note
9. Update "Total Progress" count and "Current Phase" above
10. Move to the NEXT unchecked task
11. **DO NOT STOP. DO NOT ASK. KEEP BUILDING.**

If blocked after 3 failed attempts → add to BLOCKED section → skip to next task.
If `pnpm build` fails → fix before continuing.
If all tasks in a phase are done → run Phase Gate → proceed to next phase.

---

## PHASE 0: SCAFFOLD

### Unit 0.0 — Preflight Check + Cloudflare Setup
- [x] Validate environment, install tools, configure Cloudflare deployment — wrangler.jsonc, cloudflare-env.d.ts, open-next.config.ts created; @cloudflare/workers-types installed for D1Database types
  - ACTION:
    - Check Node.js >= 18: `node --version`
    - Check pnpm installed: `pnpm --version` (if not: `npm install -g pnpm`)
    - Check wrangler installed: `npx wrangler --version` (if not: `pnpm add -D wrangler`)
    - Check git initialized: `git status` (if not: `git init`)
    - Create `wrangler.jsonc`:
      ```json
      {
        "$schema": "./node_modules/wrangler/config-schema.json",
        "name": "opspilot",
        "main": ".open-next/worker.js",
        "compatibility_date": "2026-02-07",
        "compatibility_flags": ["nodejs_compat"],
        "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
        "d1_databases": [{
          "binding": "DB",
          "database_name": "opspilot-db",
          "database_id": "b1f1dfda-73d0-4e31-90aa-e896a24a5560"
        }],
        "kv_namespaces": [{
          "binding": "KV",
          "id": "2a9d552ccff54a57a676f5d48b395ede"
        }]
      }
      ```
    - Create `open-next.config.ts`:
      ```typescript
      import { defineCloudflareConfig } from "@opennextjs/cloudflare";
      export default defineCloudflareConfig();
      ```
    - Create `.dev.vars` for local dev secrets (copy from Cloudflare Worker settings):
      ```
      CLERK_SECRET_KEY=sk_test_...
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
      ANTHROPIC_API_KEY=sk-ant-...
      ```
    - Create `.gitignore` with: node_modules, .next, .open-next, .dev.vars, .wrangler, *.db
    - Create `cloudflare-env.d.ts`:
      ```typescript
      interface CloudflareEnv {
        DB: D1Database;
        KV: KVNamespace;
        CLERK_SECRET_KEY: string;
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
        ANTHROPIC_API_KEY: string;
        TWILIO_ACCOUNT_SID?: string;
        TWILIO_AUTH_TOKEN?: string;
        TWILIO_PHONE_NUMBER?: string;
        STRIPE_SECRET_KEY?: string;
        STRIPE_WEBHOOK_SECRET?: string;
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
        RESEND_API_KEY?: string;
      }
      ```
    - Log which secrets are available vs missing (check env). Missing = will be mocked.
  - VERIFY: wrangler.jsonc valid JSON, open-next.config.ts exists, .gitignore exists, cloudflare-env.d.ts typed
  - NOTES:

### Unit 0.1 — Project Init
- [x] Create Next.js 15 app with TypeScript, Tailwind, App Router — Next.js 15 + TypeScript strict + Tailwind + App Router initialized; deploy/preview scripts added
  - ACTION: `pnpm create cloudflare@latest . --framework=next` OR `npx create-next-app@latest . --typescript --tailwind --app --use-pnpm --eslint`
  - If using create-next-app, also: `pnpm add @opennextjs/cloudflare` and `pnpm add -D wrangler`
  - Add to package.json scripts: `"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview"`, `"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"`, `"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"`
  - Enable strict TypeScript in tsconfig.json
  - VERIFY: `pnpm dev` starts, `pnpm tsc --noEmit` passes, Tailwind renders
  - NOTES:

### Unit 0.2 — Core Dependencies
- [x] Install all project dependencies — Prisma, Clerk, tRPC, Zod, react-hook-form, TanStack, recharts, sonner all installed
  - ACTION:
    - `pnpm add prisma @prisma/client @prisma/adapter-d1 @clerk/nextjs @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod date-fns lucide-react recharts react-hook-form @hookform/resolvers @tanstack/react-table sonner`
    - `pnpm add -D @types/node wrangler`
  - VERIFY: `pnpm tsc --noEmit` passes, no breaking peer dep warnings
  - NOTES:

### Unit 0.3 — shadcn/ui Setup
- [x] Initialize shadcn and add all needed components — shadcn New York/zinc initialized, all components added
  - ACTION: `npx shadcn@latest init` (New York, zinc, CSS variables)
  - Then: `npx shadcn@latest add button card input label select dialog dropdown-menu table badge tabs skeleton separator sheet avatar command popover calendar textarea switch tooltip alert-dialog scroll-area form`
  - VERIFY: Can import/render `<Button>`, `cn()` exists in lib/utils
  - NOTES:

### Unit 0.4 — Prisma Schema + D1 Database
- [x] Set up Prisma with D1-compatible schema — Full schema (Org, User, Customer, Technician, Job, Quote, Invoice, Call, AuditLog) with SQLite types; db.ts with D1 adapter; migrations created
  - ACTION:
    - `npx prisma init --datasource-provider sqlite`
    - Edit `prisma/schema.prisma`: set `provider = "sqlite"`, add `previewFeatures = ["driverAdapters"]`
    - Write FULL schema with all models (see docs/V3-SPEC.md Part 4) adapted for SQLite:
      - All IDs: `String @id @default(uuid())`
      - All enums: use `String` fields + Zod validation (not Prisma enum)
      - All DateTime: `String` (store ISO format)
      - All money: `Int` (store cents)
      - All JSON: `String` (store JSON string)
      - No onDelete: Cascade — omit or handle in app
    - Create `src/lib/db.ts` with D1 adapter pattern (see CLAUDE.md)
    - `npx prisma generate`
    - For local dev: `DATABASE_URL=file:./dev.db` in `.env`, `npx prisma db push`
    - For production D1: `npx wrangler d1 migrations create opspilot-db init` then `npx wrangler d1 migrations apply opspilot-db`
  - VERIFY: `prisma generate` succeeds, db.ts exports createDb function, all models compile
  - NOTES:

### Unit 0.5 — Clerk Auth Setup
- [x] Configure authentication middleware, sign-in/sign-up pages, auth helpers — middleware.ts protecting dashboard; sign-in/sign-up pages; ClerkProvider in root layout
  - ACTION:
    - `src/middleware.ts`: Clerk middleware, public routes = /api/webhooks/*, /quote/*, /pay/*, /book/*, /sign-in, /sign-up, /
    - `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`
    - `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`
    - Root layout.tsx wrapped in `<ClerkProvider>`
    - `src/lib/auth.ts`: getCurrentUser(), requireAuth(), getOrganizationId() — uses Clerk
    - If Clerk keys not working: create `src/lib/auth-mock.ts` with hardcoded user/org
  - VERIFY: App builds, auth pages render, auth helpers return typed user/org
  - NOTES:

### Unit 0.6 — Dashboard Layout + All Route Placeholders
- [x] Build sidebar nav, topbar, mobile nav, and placeholder pages for every route — AppSidebar, Topbar, MobileNav built; all route placeholders in place; responsive layout
  - ACTION:
    - `src/app/(dashboard)/layout.tsx` with sidebar + topbar + content area
    - `src/components/layout/app-sidebar.tsx` — 280px, dark zinc-900, nav items with lucide icons
    - `src/components/layout/topbar.tsx` — user avatar, org name
    - `src/components/layout/mobile-nav.tsx` — Sheet-based slide-in
    - Nav items: Dashboard, Jobs, Customers, Technicians, Quotes, Invoices, Calls, Analytics, Settings
    - Placeholder pages for ALL routes
    - Each placeholder: Card with icon + title + "Coming soon"
  - VERIFY: All routes accessible, sidebar highlights active, mobile nav works, no overflow at 375px, `pnpm build` passes
  - NOTES:

### Unit 0.7 — tRPC Setup
- [x] Initialize tRPC with auth context, root router, API route, client hooks — tRPC v11 with superjson, protectedProcedure with Clerk auth, D1 context, TRPCProvider in dashboard layout
  - ACTION:
    - `src/server/trpc/trpc.ts`: init with superjson, protectedProcedure requires auth+organizationId
    - `src/server/trpc/context.ts`: extract auth from Clerk, get D1 via getCloudflareContext(), return {db, userId, organizationId, userRole}
    - `src/server/trpc/router.ts`: empty root router
    - `src/app/api/trpc/[trpc]/route.ts`: Next.js API handler
    - `src/lib/trpc.ts`: createTRPCReact hooks + TRPCProvider
    - Wrap dashboard layout with TRPCProvider + QueryClientProvider
  - VERIFY: tRPC client connects, protectedProcedure rejects unauthed, organizationId in ctx
  - NOTES:

### Unit 0.8 — Seed Script + Shared Components + Utilities
- [x] Create demo seed data and all reusable components — Seed: 1 org, 3 techs, 15 customers, 15 jobs, 5 quotes, 8 invoices; shared components (DataTable, EmptyState, PageHeader, StatusBadge, etc.); utils (formatCurrency, formatDate, formatPhone, etc.)
  - ACTION:
    - `prisma/seed.ts`: 1 org "Comfort Pro HVAC", 1 owner, 3 techs, 15 customers (FL addresses), 30 jobs (all statuses), 5 quotes, 8 invoices — adapted for SQLite types (ISO dates, cents, JSON strings)
    - `src/components/shared/data-table.tsx` — TanStack Table with sort, search, filter, pagination
    - `src/components/shared/empty-state.tsx` — icon + title + description + CTA
    - `src/components/shared/loading-skeleton.tsx` — card + table variants
    - `src/components/shared/confirm-dialog.tsx` — AlertDialog wrapper
    - `src/components/shared/page-header.tsx` — title + description + action slot
    - `src/components/shared/status-badge.tsx` — colored badge by status
    - `src/components/shared/currency-display.tsx` — formatted dollar amount (cents→dollars)
    - `src/lib/utils.ts`: formatCurrency (cents→$X.XX), formatDate, formatDateTime, formatPhone, getInitials, getStatusColor, generateId (crypto.randomUUID)
    - `src/lib/constants.ts`: status labels, nav items, pagination defaults
    - `package.json`: `"prisma": { "seed": "npx tsx prisma/seed.ts" }`
  - VERIFY: Seed compiles, components render, formatCurrency(12345) → "$123.45", `pnpm build` passes
  - NOTES:

### 🚧 PHASE 0 GATE
- [x] Phase 0 quality gate passed
  - `pnpm tsc --noEmit` ✅
  - All routes render ✅
  - Dashboard layout responsive ✅
  - Seed compiles and runs ✅
  - wrangler.jsonc + open-next.config.ts in place ✅
  - Git tagged: `git tag v0-scaffold`

---

## PHASE 1: CORE CRUD

### Unit 1.1 — Customer List Page
- [x] Customers tRPC router + list page with data table — router (list/getById/create/update/delete/getStats), list page with DataTable, search, type filter, pagination, empty state
  - ACTION: `src/server/trpc/routers/customers.ts` (list, getById, create, update, delete — all with organizationId), `src/lib/validations/customer.ts`, `src/app/(dashboard)/customers/page.tsx` with DataTable (Name, Phone, Type, Jobs, Revenue, Last Service), search, filter by type, pagination 25/page, loading skeleton, empty state
  - VERIFY: List loads, search works, type filter works, pagination correct, empty state shows, mobile scrolls
  - NOTES:

### Unit 1.2 — Customer Create/Edit + Detail
- [x] Customer form and detail page with service history — new form with all fields, detail page with stats (revenue/jobs/avg ticket/outstanding), jobs/invoices/quotes tabs, delete confirm
  - ACTION: `customers/new/page.tsx` form (firstName, lastName, phone, email, address, city, state, zip, type, equipmentJson, notes), `customers/[id]/page.tsx` with info card, equipment list, service history, calls tab, invoices tab, stats (lifetime revenue, total jobs, avg ticket)
  - VERIFY: Create validates, phone formats, detail loads related data, edit saves + toast
  - NOTES:

### Unit 1.3 — Technician List + Detail
- [x] Technicians tRPC router + list and detail pages — list with DataTable/status filter/skills badges, new form, [id] detail page with skills/job list/stats, deactivate action
  - ACTION: `src/server/trpc/routers/technicians.ts`, `src/lib/validations/technician.ts`, list page (Name, Phone, Type, Skills, Status, Jobs, Rating), filter by status, `technicians/[id]/page.tsx` with info, skills tags, assigned jobs, performance stats
  - VERIFY: List renders seed techs, filter works, detail shows jobs
  - NOTES:

### Unit 1.4 — Job List (Kanban + List Toggle)
- [x] Jobs tRPC router + dual-view list page — router with status transition rules, kanban (4 columns + priority colors), list DataTable, status/priority filters, calendar view; new form with line items + assignment; [id] detail with transitions/activity log
  - ACTION: `src/server/trpc/routers/jobs.ts` (list, getById, create, update, updateStatus), `src/lib/validations/job.ts`, kanban component (columns: New/Scheduled/In Progress/Completed/Invoiced), list view DataTable, tab toggle, filter bar (status, tech, priority, date range)
  - DECISION: Click-based status changes (dropdown on card), not drag-drop.
  - VERIFY: Kanban renders, list sorts, toggle works, filters apply, `pnpm build` passes
  - NOTES:

### Unit 1.5 — Job Create + Detail
- [x] Job creation form and full detail page with status workflow — form with customer/tech selectors, line items builder, schedule; detail page with status dropdown transitions, activity log, line item table, linked invoices
  - ACTION: `jobs/new/page.tsx` (customer selector, category, priority, description, tech assignment, schedule date+window, line items as JSON string), `jobs/[id]/page.tsx` (status badge, transition buttons, customer card, tech card, line items, activity log, actions)
  - STATUS RULES: NEW→SCHEDULED→EN_ROUTE→IN_PROGRESS→COMPLETED→INVOICED→PAID, Any→CANCELLED/ON_HOLD
  - VERIFY: Create validates, transitions enforce rules, line items calc
  - NOTES:

### Unit 1.6 — Job Calendar View
- [x] Week-based calendar with tech rows — CSS grid 7-day calendar, priority-colored job cards, prev/next/today nav, legend
  - ACTION: `jobs/calendar/page.tsx`, CSS grid (7 cols=days, rows=techs), job blocks color-coded by priority, click→detail, day/week toggle, prev/next/today
  - VERIFY: Calendar renders current week, jobs in correct slots, navigation works
  - NOTES:

### Unit 1.7 — Dashboard KPIs
- [x] Analytics router + dashboard with KPIs, chart, activity feed — analyticsRouter (getDashboardKPIs, getRevenueChart, getRecentActivity), recharts line chart 30d, KPI cards (revenue/jobs/active/calls/customers/outstanding), activity feed, quick actions
  - ACTION: `src/server/trpc/routers/analytics.ts` (getDashboardKPIs, getRevenueChart, getRecentActivity), KPI cards (Revenue, Jobs Completed, Avg Ticket, Outstanding, Active Jobs, AI Calls), revenue chart (recharts line 30d), activity feed, update `(dashboard)/page.tsx`
  - VERIFY: KPIs calc from seed data, chart renders, responsive, loading skeletons
  - NOTES:

### Unit 1.8 — Validation + Error Handling Polish
- [x] Audit all routers for Zod, audit logging, error handling, toasts — all routers have Zod+organizationId+auditLog; error.tsx/loading.tsx in dashboard group; Toaster in layout; conditional ClerkProvider for build; dashboard force-dynamic
  - ACTION: Audit every router — Zod on inputs, audit log on mutations, organizationId on queries, toast notifications, error boundaries on dashboard layout
  - VERIFY: Invalid data shows errors, mutations log, network errors toast, `pnpm build`
  - NOTES:

### 🚧 PHASE 1 GATE
- [x] Phase 1 quality gate passed — tsc clean, build passes all routes, v1-crud tagged
  - `pnpm tsc --noEmit` ✅
  - `pnpm build` ✅
  - All CRUD pages functional ✅
  - Dashboard KPIs render ✅
  - Git tagged: `git tag v1-crud`

---

## PHASE 2: VOICE & AI

### Unit 2.1 — Claude API Service + AI Prompts
- [x] Claude wrapper with retry, cost tracking, all prompt templates — callClaude (retry×3, cost calc), callClaudeJSON, classifier prompt, voice-agent prompt, mock fallbacks; @anthropic-ai/sdk installed
  - ACTION: `src/server/services/ai/claude.ts` (callClaude with retry×3, cost calc — NO PII in logs), classifier prompt, voice-agent prompt. Access ANTHROPIC_API_KEY from Cloudflare env.
  - If no key: mock responses returning realistic structured data
  - VERIFY: callClaude works or mocks correctly, classifier returns valid JSON
  - NOTES:

### Unit 2.2 — Twilio Voice Webhook
- [x] Incoming call handler with TwiML response flow — voice/route.ts (sig verify, org lookup, Call record), gather/route.ts (transcript → Claude classify → auto-create Job)
  - ACTION: `src/app/api/webhooks/twilio/voice/route.ts` (verify sig, lookup org by To#, lookup customer by From#, create Call, return TwiML), voice-gather handler (speech → Claude classify → create job)
  - VERIFY: Endpoint returns valid TwiML XML, Call record created
  - NOTES:

### Unit 2.3 — Call → Job → Dispatch Pipeline
- [x] Auto-create jobs from calls, dispatch techs via SMS — dispatch.ts (matchTechnician, sendDispatchSms via fetch, dispatchJob); wired into gather webhook; Twilio REST API for SMS
  - ACTION: `src/server/services/dispatch.ts` (createJobFromCall, matchTech, dispatchTechnician SMS, sendCustomerConfirmation SMS)
  - VERIFY: Creates valid Job, tech matching works, SMS sends or mocks
  - NOTES:

### Unit 2.4 — SMS Reply Handling
- [x] Process tech SMS replies (YES/NO) — sms/route.ts: sig verify, tech lookup by phone, YES→confirm, NO→unassign+reassign to next available tech
  - ACTION: `src/app/api/webhooks/twilio/sms/route.ts` (verify sig, parse, YES→update job, NO→flag for reassignment)
  - VERIFY: YES updates status, NO flags job, unknown handled gracefully
  - NOTES:

### Unit 2.5 — Call Log Pages
- [x] Call list and detail pages — callsRouter (list/getById/updateStatus/getStats), list page with status filter/search, detail page with AI analysis panel (confidence color-coding), transcript, linked job
  - ACTION: `src/server/trpc/routers/calls.ts`, `calls/page.tsx` (table with filters), `calls/[id]/page.tsx` (AI analysis, transcript, linked entities, confidence color-coding)
  - VERIFY: List renders, filters work, confidence color-coded
  - NOTES:

### Unit 2.6 — Voice Integration Test + Fallbacks
- [x] E2E test script and fallback error handling — scripts/test-voice-flow.ts: 26 tests pass (classifier, TwiML, form parsing, greetings, fallbacks, PII checks); professional fallbacks in all error paths
  - ACTION: `scripts/test-voice-flow.ts`, fallbacks: Claude fail→"Leave message", no tech→"Call within 1 hour"
  - VERIFY: Full pipeline works mocked, fallbacks professional, no PII in logs
  - NOTES:

### 🚧 PHASE 2 GATE
- [x] Phase 2 quality gate passed — tsc clean, voice/AI pipeline verified, v2-voice tagged
  - Voice/AI endpoints valid ✅
  - Call→Job pipeline correct ✅
  - Call log pages render ✅
  - Git tagged: `git tag v2-voice`

---

## PHASE 3: QUOTING & INVOICING

### Unit 3.1 — Quote Builder
- [x] Quotes tRPC router + line item builder UI — quotesRouter (list/getById/create/update/updateStatus/delete/getStats), list page with DataTable/status filter/search, quote builder with customer search, dynamic line items, tax calc, totals
  - ACTION: `src/server/trpc/routers/quotes.ts`, quote builder component (customer selector, dynamic line items, subtotal+tax+total, Save Draft + Send)
  - VERIFY: Line items calc, add/remove rows, validation prevents empty
  - NOTES:

### Unit 3.2 — AI Quote Assist
- [x] Claude-powered line item suggestions — quote-assist.ts prompt, suggestLineItems tRPC mutation, AI Suggest button in quote builder with mock fallback
  - ACTION: `src/server/services/ai/prompts/quote-assist.ts`, "AI Suggest" button, editable suggestions
  - VERIFY: Returns reasonable items, editable, loading state
  - NOTES:

### Unit 3.3 — Send Quote + Public Quote Page
- [x] Email delivery and customer-facing signature flow — sendQuote tRPC mutation, Resend email (mock if no key), /quote/[token] public page with signature canvas, accept/decline API
  - ACTION: React Email template, send via Resend (or mock), `/quote/[token]` public page (NO AUTH, signature canvas, accept/decline)
  - VERIFY: Public page loads without auth, signature works on mobile, accept→job
  - NOTES:

### Unit 3.4 — Invoice Creation + List
- [x] Invoices tRPC router, list page, create-from-job — invoicesRouter (list/getById/create/createFromJob/update/updateStatus/sendInvoice/delete/getStats), list page with DataTable/overdue highlighting, new invoice form, email sending
  - ACTION: `src/server/trpc/routers/invoices.ts`, invoice list (Number, Customer, Amount, Status, Due Date), create from completed job with pre-filled line items
  - VERIFY: Creation pulls correct line items, amounts match, overdue highlighted
  - NOTES:

### Unit 3.5 — Stripe Payment Flow
- [x] Public payment page + Stripe Checkout + webhook — payments.ts service, /pay/[token] public page with Stripe checkout or simulate button, checkout+simulate API routes, Stripe webhook verifies sig + marks invoice PAID; tsc clean
  - ACTION: `src/server/services/stripe/payments.ts`, `/pay/[token]` public page, `src/app/api/webhooks/stripe/route.ts` (verify sig)
  - If no STRIPE keys: "Simulate Payment" button
  - VERIFY: Checkout creates or mocked, invoice→PAID on webhook
  - NOTES:

### Unit 3.6 — QuickBooks Sync
- [x] Async QBO integration (optional) — QBO sync.ts with pushInvoice/pushPayment; refreshes OAuth tokens; skips silently if QBO_CLIENT_ID/SECRET/REFRESH_TOKEN/REALM_ID not configured; tsc clean
  - ACTION: `src/server/services/quickbooks/sync.ts` (pushInvoice, pushPayment — queue-based, skip if no tokens)
  - VERIFY: Failures don't crash app, skip silently if unconfigured
  - NOTES:

### Unit 3.7 — Auto-Reminders (Cron)
- [x] Daily overdue invoice reminder emails — /api/cron/invoice-reminders sends reminders at 3/7/14 days overdue, marks OVERDUE at 14d, skips PAID/CANCELLED, Cloudflare cron trigger in wrangler.jsonc; tsc clean
  - ACTION: `src/app/api/cron/invoice-reminders/route.ts` (find SENT invoices 3/7/14 days overdue, send reminder, OVERDUE at 14d)
  - NOTE: Cloudflare Workers cron triggers via wrangler.jsonc `triggers.crons`
  - VERIFY: Identifies overdue invoices, paid invoices NOT reminded
  - NOTES:

### Unit 3.8 — Quotes + Invoices Detail Pages
- [x] Detail pages with full actions and status timelines — quotes/[id] with send/delete/status-change/public-link; invoices/[id] with send/mark-paid/cancel/delete/stripe-id; both show line items, totals, sidebar with customer+dates+linked-job; tsc clean
  - ACTION: `quotes/[id]/page.tsx`, `invoices/[id]/page.tsx`, status timelines, context-aware actions
  - VERIFY: Details show all info, actions show/hide by status, `pnpm build`
  - NOTES:

### 🚧 PHASE 3 GATE
- [x] Phase 3 quality gate passed
  - Quotes: create, send, public sign ✅
  - Invoices: create, send, public pay ✅
  - `pnpm tsc --noEmit` ✅
  - Git tagged: `git tag v3-billing` ✅

---

## PHASE 4: ANALYTICS & REPORTING

### Unit 4.1 — Analytics API
- [x] Expanded analytics queries — getRevenueByPeriod (day/week/month grouping), getJobsByCategory, getTechPerformance (completion rate), getCallMetrics (conversion rate), getOutstandingInvoices, getCustomerMetrics; tsc clean
  - ACTION: getRevenueByPeriod, getJobsByCategory, getTechPerformance, getCallMetrics, getOutstandingInvoices, getCustomerMetrics
  - VERIFY: Correct aggregates, date filtering, group-by
  - NOTES:

### Unit 4.2 — Analytics Dashboard Page
- [x] Full analytics page with charts and date picker — date range picker (7/30/90d), recharts line+bar charts, tech performance table, outstanding invoices list, call metrics KPIs; responsive; tsc clean
  - ACTION: `analytics/page.tsx` with date range picker, revenue chart, category breakdown, tech table, outstanding invoices, call metrics
  - VERIFY: All charts render, date picker updates all, responsive
  - NOTES:

### Unit 4.3 — Tech Performance Enhancement
- [x] Performance metrics on technician detail — revenue sparkline (AreaChart 6mo), jobs-by-status progress bars, team comparison bar chart + rank cards; tsc clean
  - ACTION: Revenue sparkline, jobs by status, avg completion time, team comparison
  - VERIFY: Data displays, comparisons make sense
  - NOTES:

### Unit 4.4 — Weekly Digest Email
- [x] AI-generated weekly summary — Claude prompt (weekly-digest.ts), HTML email template, cron Monday 8AM (/api/cron/weekly-digest), OWNER-only, mock if no Resend key; tsc clean
  - ACTION: Claude prompt for weekly briefing, React Email template, cron Monday 8AM
  - VERIFY: Data correct, Claude generates coherent summary, only OWNER receives
  - NOTES:

### 🚧 PHASE 4 GATE
- [x] Phase 4 quality gate passed
  - Analytics renders ✅
  - Weekly digest configured ✅
  - `pnpm tsc --noEmit` ✅
  - Git tagged: `git tag v4-analytics`

---

## PHASE 5: POLISH & SECURITY

### Unit 5.1 — Audit Logging Middleware
- [x] Comprehensive audit logging on all mutations — centralized audit.ts with PII redaction (phone/email/name/address), never-throw wrapper, all 6 routers updated to import from service; tsc clean
  - ACTION: `src/server/services/audit.ts`, add to every mutation, redact PII
  - VERIFY: Every mutation logs, no PII
  - NOTES:

### Unit 5.2 — Rate Limiting
- [ ] Rate limiter using Cloudflare KV
  - ACTION: `src/lib/rate-limit.ts` using KV binding (100/min per user, 1000/min per org), add to tRPC middleware, return 429
  - NOTE: Use Cloudflare KV instead of Upstash since we're already on CF
  - VERIFY: Rate limiter works, exceeding returns 429
  - NOTES:

### Unit 5.3 — Webhook Signature Verification
- [ ] Verify signatures on all webhooks
  - ACTION: Audit ALL webhook routes — Twilio, Stripe, Clerk. 401 for invalid.
  - VERIFY: Invalid sigs→401, valid pass through
  - NOTES:

### Unit 5.4 — Error Boundaries + Loading States Audit
- [ ] Error boundaries and full UX audit
  - ACTION: error.tsx for each route group, loading.tsx, audit every page
  - VERIFY: Errors caught, every list has empty state, every async has loading
  - NOTES:

### Unit 5.5 — Mobile Responsive Audit
- [ ] Fix every page at 375px
  - ACTION: Test all pages at 375px, fix tables/forms/sidebar/charts/dialogs
  - VERIFY: Every page usable at 375px, no horizontal overflow
  - NOTES:

### Unit 5.6 — Settings Pages
- [ ] Org, team, billing, integrations settings
  - ACTION: `settings/page.tsx` (org profile), team management (OWNER only), billing (Stripe Portal), integrations status
  - VERIFY: Settings save, RBAC works
  - NOTES:

### Unit 5.7 — Observability
- [ ] Error tracking and analytics
  - ACTION: Sentry (pnpm add @sentry/nextjs), PostHog (posthog-js), no PII
  - If no keys: skip, add to BLOCKED
  - VERIFY: Captures with context, no PII
  - NOTES:

### Unit 5.8 — Final Build Verification
- [ ] Zero-error build + security audit
  - ACTION: `pnpm tsc --noEmit`, `pnpm build`, full security checklist
  - VERIFY: Zero errors, all checklist items pass
  - NOTES:

### 🚧 PHASE 5 GATE
- [ ] Phase 5 quality gate passed
  - Security controls ✅, Mobile ✅, Error handling ✅
  - Git tagged: `git tag v5-hardened`

---

## PHASE 6: LAUNCH

### Unit 6.1 — Seed Script Enhancement
- [ ] Demo-quality seed data
  - ACTION: Realistic FL names/addresses, good chart data, calls with transcripts
  - VERIFY: Dashboard looks impressive, charts show trends
  - NOTES:

### Unit 6.2 — Onboarding Flow
- [ ] First-login setup wizard
  - ACTION: Detect first login → Welcome→Org Setup→Add Tech→Dashboard
  - VERIFY: New user sees onboarding, returning user→dashboard
  - NOTES:

### Unit 6.3 — Landing Page
- [ ] Marketing page with hero, features, pricing
  - ACTION: `src/app/page.tsx` — Hero, features (Capture/Execute/Grow), pricing ($199/$349/Enterprise), FAQ
  - VERIFY: Loads fast, responsive, CTAs work
  - NOTES:

### Unit 6.4 — Public Pages Polish
- [ ] Polish quote, invoice, booking pages
  - ACTION: Polish /quote/[token], /pay/[token], create /book/[slug]
  - VERIFY: All work without auth, professional, mobile-friendly
  - NOTES:

### Unit 6.5 — Deploy to Cloudflare + README
- [ ] First production deploy and documentation
  - ACTION: `pnpm deploy` to push to Cloudflare Workers at smb.cafecito-ai.com, README.md (quickstart, architecture, env vars), .env.example, final commit
  - VERIFY: smb.cafecito-ai.com loads, README clear, `BUILD_COMPLETE` created
  - NOTES:

### 🚧 PHASE 6 GATE — FINAL
- [ ] All phases complete, production ready
  - 48/48 units ✅
  - smb.cafecito-ai.com live ✅
  - Git tagged: `git tag v3.0-launch`
  - `BUILD_COMPLETE` created ✅

---

## BLOCKED
| Unit | Description | Severity |
|------|-------------|----------|

## DECISIONS MADE (Without Human)
| Unit | Decision | Rationale |
|------|----------|-----------|

## SESSION LOG
| Session | Started | Units Completed | Notes |
|---------|---------|-----------------|-------|
| 1 | 2026-02-19 | 0.0-0.8, Phase 0 Gate | Scaffold complete, seed working, TSC clean |
