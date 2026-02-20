/**
 * Centralized audit logging service.
 * All mutations in tRPC routers should call createAuditLog.
 * PII fields (phone, email) are automatically redacted from changesJson.
 */

import type { Db } from "@/lib/db";
import { generateId } from "@/lib/utils";

export type AuditCtx = {
  db: Db;
  userId: string;
  organizationId: string;
};

// PII field names that must be redacted in audit log changes
const PII_FIELDS = new Set(["phone", "email", "firstName", "lastName", "address"]);

function redactPii(changes?: Record<string, { from: unknown; to: unknown }>): string | null {
  if (!changes) return null;

  const redacted: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (PII_FIELDS.has(key)) {
      redacted[key] = { from: value.from != null ? "[REDACTED]" : null, to: value.to != null ? "[REDACTED]" : null };
    } else {
      redacted[key] = value;
    }
  }
  return JSON.stringify(redacted);
}

/**
 * Creates an audit log entry. Never throws — failures are logged but don't break the request.
 */
export async function createAuditLog(
  ctx: AuditCtx,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, { from: unknown; to: unknown }>
): Promise<void> {
  try {
    await ctx.db.auditLog.create({
      data: {
        id: generateId(),
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        action,
        entityType,
        entityId,
        changesJson: redactPii(changes),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Audit log failures must never crash the app
    console.error("[audit] Failed to write audit log:", err instanceof Error ? err.message : "Unknown");
  }
}
