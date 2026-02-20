# OpsPilot — CLAUDE.md

## What This Is
OpsPilot is a $199/month AI-powered operations platform for trades businesses (HVAC, plumbing, electrical, roofing).
AI answers calls → creates jobs → dispatches techs → quoting → invoicing → payments → analytics.
Deployed at smb.cafecito-ai.com via Cloudflare Workers.

## Stack
- Next.js 15 (App Router) + TypeScript (strict)
- Prisma + Cloudflare D1 (via @prisma/adapter-d1)
- Claude Sonnet 4 (Anthropic API)
- Twilio (Voice + SMS)
- Tailwind CSS + shadcn/ui
- Clerk Auth (multi-tenant)
- tRPC (type-safe API)
- Stripe (payments + billing)
- Cloudflare KV (session/cache)
- Resend (transactional email) — optional, skip if no keys
- Cloudflare Workers (hosting via @opennextjs/cloudflare)

## Deployment Target
- Host: Cloudflare Workers via OpenNext
- Domain: smb.cafecito-ai.com (Custom Domain on Worker "opspilot")
- Database: D1 "opspilot-db" (binding: DB, ID: b1f1dfda-73d0-4e31-90aa-e896a24a5560)
- Cache: KV "opspilot-kv" (binding: KV, ID: 2a9d552ccff54a57a676f5d48b395ede)
- Deploy command: `pnpm run deploy` (opennextjs-cloudflare build && opennextjs-cloudflare deploy)
- Preview command: `pnpm run preview` (local Workers runtime)

## Commands
```bash
pnpm dev              # Next.js dev server (Node.js)
pnpm build            # Next.js production build
pnpm preview          # Local Workers runtime preview
pnpm deploy           # Build + deploy to Cloudflare Workers
pnpm tsc --noEmit     # Type check (run after EVERY unit)
pnpm lint             # Lint check
npx prisma generate   # Regenerate Prisma client (with D1 adapter)
npx wrangler d1 migrations apply opspilot-db  # Apply migrations to D1
npx prisma db seed    # Seed demo data
```

## Autonomous Build Rules

### The Loop
1. Read TASKS.md → find first unchecked `- [ ]` task
2. Read this file (CLAUDE.md) for rules
3. Read tasks/lessons.md for past mistakes
4. Build the task following its ACTION section
5. Run the task's VERIFY checklist
6. Fix anything that fails
7. `git add -A && git commit -m "feat(unit-X.X): description"`
8. Mark task `- [x]` with 1-line note in TASKS.md
9. Update progress count in TASKS.md header
10. Move to NEXT unchecked task — DO NOT STOP

### Hard Stops (Require Human)
- Build fails after 3 fix attempts → add to BLOCKED in TASKS.md
- Architectural decision not covered in spec or TASKS.md
- Security question not explicitly covered

### Soft Blocks (Keep Going)
- Missing API key for one service → mock it, note in BLOCKED, continue
- One feature broken → note it, skip to next unit
- UI not pixel-perfect → ship it, polish in Phase 5

## Database: Cloudflare D1 with Prisma

### Prisma D1 Setup
```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

export function createDb(d1: D1Database) {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({ adapter });
}
```

### Accessing D1 in Next.js (via OpenNext)
```typescript
// In tRPC context or API routes:
import { getCloudflareContext } from '@opennextjs/cloudflare';

const { env } = await getCloudflareContext();
const db = createDb(env.DB);
```

### Prisma Schema Provider
```prisma
datasource db {
  provider = "sqlite"  // D1 uses SQLite dialect
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

### D1 vs Postgres — Key Differences
- D1 is SQLite — no native enums, no Decimal, no @db.Text
- Use String for enum fields, validate with Zod at app layer
- No @default(cuid()) — generate IDs in app code with `crypto.randomUUID()` or a cuid library
- JSON fields: store as String, parse/stringify in app layer
- No Decimal type — store money as Int (cents)
- DateTime: store as String (ISO format), not native DateTime
- No onDelete: Cascade in D1 — handle cascading deletes in app code
- DATABASE_URL for local dev: `file:./dev.db` (SQLite file)

## Security (Non-Negotiable)

- **EVERY** database query MUST include `where: { organizationId }` — NO EXCEPTIONS
- tRPC context provides `organizationId` from Clerk — always use `ctx.organizationId`
- Never log PII (phone, email) — use `[REDACTED]`
- All user input validated with Zod before touching database
- Webhook routes MUST verify signatures (Twilio, Stripe, Clerk)
- Public routes (/quote/[token], /pay/[token]) use unguessable `publicToken`, NEVER IDs
- No `any` types. No `@ts-ignore`. No `as any`.
- Never put organizationId in request body — derive from auth context
- All mutations create an audit log entry
- Secrets stored in Cloudflare Worker settings, accessed via env bindings

## Code Patterns

### tRPC Router
```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const exampleRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.example.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(input?.status && { status: input.status }),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }),

  create: protectedProcedure
    .input(createExampleSchema)
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const item = await ctx.db.example.create({
        data: { id, ...input, organizationId: ctx.organizationId },
      });
      await auditLog(ctx, 'example.create', 'Example', id, { status: { from: null, to: 'NEW' } });
      return item;
    }),
});
```

### Server Component Page
```typescript
import { api } from '@/lib/trpc/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';

export default async function ExamplesPage() {
  const items = await api.examples.list();
  return (
    <div className="space-y-6">
      <PageHeader title="Examples" description="Manage your examples">
        <Button asChild><Link href="/examples/new">Add New</Link></Button>
      </PageHeader>
      {items.length === 0 ? (
        <EmptyState icon={FileText} title="No examples yet" description="Create your first one." actionLabel="Add Example" actionHref="/examples/new" />
      ) : (
        <DataTable columns={columns} data={items} searchKey="name" />
      )}
    </div>
  );
}
```

### Client Component Form
```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/trpc/client';
import { toast } from 'sonner';

export function ExampleForm() {
  const form = useForm<CreateExample>({ resolver: zodResolver(createExampleSchema) });
  const createMutation = api.examples.create.useMutation({
    onSuccess: () => { toast.success('Created!'); router.push('/examples'); },
    onError: (err) => { toast.error(err.message); },
  });
  const onSubmit = (data: CreateExample) => createMutation.mutate(data);
}
```

## UI Standards
- Tailwind + shadcn/ui ONLY (also: @tanstack/react-table, recharts, sonner)
- Every list: DataTable with sort, search, filter, pagination, loading skeleton, empty state
- Every form: react-hook-form + zod + inline errors + toast + disabled button during loading
- Server Components by default. "use client" ONLY when hooks/events needed
- Mobile responsive: works at 375px
- cn() for conditional classes
- formatCurrency() — always cents→dollars, 2 decimal places
- formatDate() / formatDateTime() for all dates
- formatPhone() for all phone numbers

## Self-Review Checklist (Run Before Every Commit)
1. `pnpm tsc --noEmit` — ZERO errors
2. Every DB query has organizationId
3. Every mutation has Zod validation
4. Every mutation has audit log
5. Every list has EmptyState
6. No console.log in production
7. All forms have loading + toast
8. No hardcoded strings

## Git
- Commit after EVERY completed unit
- Format: `feat(unit-X.X): description`
- Never commit code that fails type checking
- Tag after each phase gate: `git tag vX-name`

## Key File Locations
- Prisma schema: `prisma/schema.prisma`
- Wrangler config: `wrangler.jsonc`
- OpenNext config: `open-next.config.ts`
- Cloudflare env types: `cloudflare-env.d.ts`
- Zod validations: `src/lib/validations/`
- tRPC routers: `src/server/trpc/routers/`
- AI prompts: `src/server/services/ai/prompts/`
- Shared components: `src/components/shared/`
- Dashboard pages: `src/app/(dashboard)/`
- Public pages: `src/app/(public)/`
- Webhooks: `src/app/api/webhooks/`
- Cron jobs: `src/app/api/cron/`
- Email templates: `src/emails/`
