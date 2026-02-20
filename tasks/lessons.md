# OpsPilot — Lessons Learned

## D1 / SQLite
- D1 is SQLite — no Postgres enums, no Decimal, no @db.Text
- Prisma D1: provider = "sqlite", previewFeatures = ["driverAdapters"]
- Store dates as ISO strings (String), not DateTime
- Store money as Int (cents), convert at display layer
- Store JSON as String, JSON.parse/stringify at app layer
- Generate IDs with crypto.randomUUID()
- No onDelete: Cascade — handle in app code
- DATABASE_URL=file:./dev.db for local dev

## Cloudflare
- Access bindings via getCloudflareContext() from @opennextjs/cloudflare
- Secrets in Worker settings, .dev.vars for local
- Deploy: opennextjs-cloudflare build && opennextjs-cloudflare deploy
- wrangler.jsonc defines D1 + KV bindings

## Next.js
- Server Components can't use hooks — add "use client"
- loading.tsx same directory as page.tsx
- error.tsx must be client component

## tRPC
- protectedProcedure for all dashboard routes
- superjson transformer for Date serialization
- TRPCProvider in dashboard layout, not root

## Security
- NEVER put organizationId in request body
- NEVER expose internal IDs in public URLs
- Verify webhook signatures in production

## Common Mistakes
- (Claude Code adds new lessons here during build)
