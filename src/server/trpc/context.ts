import { auth } from "@clerk/nextjs/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type Db } from "@/lib/db";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export interface Context {
  userId: string | null;
  organizationId: string | null;
  userRole: string;
  db: Db;
  req: Request;
}

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<Context> {
  const { userId, orgId, orgRole } = await auth();

  let db: Db;
  try {
    const { env } = await getCloudflareContext();
    db = createDb(env.DB);
  } catch {
    // Local dev fallback - will fail gracefully for DB operations
    // This handles the case where getCloudflareContext fails outside Workers
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient() as unknown as Db;
  }

  return {
    userId: userId ?? null,
    organizationId: orgId ?? null,
    userRole: orgRole ?? "org:member",
    db,
    req: opts.req,
  };
}
