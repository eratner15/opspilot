import { auth } from "@clerk/nextjs/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type Db } from "@/lib/db";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export interface Context {
  userId: string | null;
  organizationId: string | null;
  userRole: string;
  db: Db;
  kv: KVNamespace | undefined;
  req: Request;
}

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<Context> {
  const { userId, orgId, orgRole } = await auth();

  let db: Db;
  let kv: KVNamespace | undefined;

  try {
    const { env } = await getCloudflareContext();
    db = createDb(env.DB);
    kv = env.KV;
  } catch {
    // Local dev fallback - will fail gracefully for DB operations
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient() as unknown as Db;
    kv = undefined;
  }

  return {
    userId: userId ?? null,
    organizationId: orgId ?? null,
    userRole: orgRole ?? "org:member",
    db,
    kv,
    req: opts.req,
  };
}
