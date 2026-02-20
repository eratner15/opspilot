import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { sendEmail } from "@/server/services/email";
import { callClaude } from "@/server/services/ai/claude";
import { buildWeeklyDigestPrompt, WEEKLY_DIGEST_SYSTEM } from "@/server/services/ai/prompts/weekly-digest";
import { formatCurrency } from "@/lib/utils";

export const runtime = "edge";

/**
 * Cron: Weekly digest email to org OWNER users.
 * Triggers: "0 8 * * 1" (Monday 8AM UTC) via wrangler.jsonc
 *
 * Logic:
 * - For each org, gather last 7 days stats vs prior 7 days
 * - Call Claude to generate a natural-language summary
 * - Send email only to OWNER role users of that org
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "cron-internal";
  if (authHeader !== `Bearer ${cronSecret}`) {
    const userAgent = req.headers.get("user-agent") ?? "";
    if (!userAgent.includes("Cloudflare-Workers")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let db;
  let resendApiKey: string | undefined;
  let anthropicKey: string | undefined;
  const appUrl = "https://smb.cafecito-ai.com";

  try {
    const { env } = await getCloudflareContext();
    db = createDb(env.DB);
    const cfEnv = env as unknown as Record<string, string | undefined>;
    resendApiKey = cfEnv.RESEND_API_KEY;
    anthropicKey = cfEnv.ANTHROPIC_API_KEY;
  } catch {
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient();
    anthropicKey = process.env.ANTHROPIC_API_KEY;
    resendApiKey = process.env.RESEND_API_KEY;
  }

  const now = new Date();
  // Last 7 days: Mon 00:00 → Sun 23:59 (i.e., previous calendar week)
  const weekEnd = new Date(now);
  weekEnd.setUTCHours(0, 0, 0, 0); // start of today (Monday)
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekStartISO = weekStart.toISOString();
  const weekEndISO = weekEnd.toISOString();
  const prevWeekStartISO = prevWeekStart.toISOString();

  // Fetch all orgs
  const orgs = await db.organization.findMany({
    include: {
      users: {
        where: { role: "OWNER" },
        select: { email: true, firstName: true, lastName: true },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const org of orgs) {
    const owners = org.users.filter((u) => u.email);
    if (owners.length === 0) {
      skipped++;
      continue;
    }

    try {
      // Gather this week's stats
      const [
        paidInvoicesThisWeek,
        paidInvoicesPrevWeek,
        completedJobsThisWeek,
        scheduledJobs,
        newCustomers,
        callsThisWeek,
        callsConverted,
        outstandingInvoices,
        topTechData,
      ] = await Promise.all([
        db.invoice.findMany({
          where: { organizationId: org.id, status: "PAID", paidAt: { gte: weekStartISO, lt: weekEndISO } },
          select: { amountPaidCents: true },
        }),
        db.invoice.findMany({
          where: { organizationId: org.id, status: "PAID", paidAt: { gte: prevWeekStartISO, lt: weekStartISO } },
          select: { amountPaidCents: true },
        }),
        db.job.count({
          where: { organizationId: org.id, status: { in: ["COMPLETED", "INVOICED", "PAID"] }, completedAt: { gte: weekStartISO, lt: weekEndISO } },
        }),
        db.job.count({
          where: { organizationId: org.id, status: "SCHEDULED", scheduledAt: { gte: weekEndISO } },
        }),
        db.customer.count({
          where: { organizationId: org.id, createdAt: { gte: weekStartISO, lt: weekEndISO } },
        }),
        db.call.count({
          where: { organizationId: org.id, createdAt: { gte: weekStartISO, lt: weekEndISO } },
        }),
        db.call.count({
          where: { organizationId: org.id, jobId: { not: null }, createdAt: { gte: weekStartISO, lt: weekEndISO } },
        }),
        db.invoice.findMany({
          where: { organizationId: org.id, status: { in: ["SENT", "OVERDUE"] } },
          select: { totalCents: true, amountPaidCents: true, status: true },
        }),
        // Top tech: most jobs completed this week
        db.technician.findMany({
          where: { organizationId: org.id, status: "ACTIVE" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            _count: {
              select: {
                jobs: true,
              },
            },
          },
          take: 10,
        }),
      ]);

      const revenueCents = paidInvoicesThisWeek.reduce((s, i) => s + i.amountPaidCents, 0);
      const prevWeekRevenueCents = paidInvoicesPrevWeek.reduce((s, i) => s + i.amountPaidCents, 0);
      const outstandingCents = outstandingInvoices.reduce((s, i) => s + (i.totalCents - i.amountPaidCents), 0);
      const overdueCount = outstandingInvoices.filter((i) => i.status === "OVERDUE").length;

      // Find top tech by completed jobs this week
      let topTech: { name: string; jobsCompleted: number } | null = null;
      if (topTechData.length > 0) {
        // Get completed job count per tech this week
        const techCounts = await Promise.all(
          topTechData.map(async (t) => ({
            name: `${t.firstName} ${t.lastName}`,
            jobsCompleted: await db.job.count({
              where: {
                organizationId: org.id,
                technicianId: t.id,
                status: { in: ["COMPLETED", "INVOICED", "PAID"] },
                completedAt: { gte: weekStartISO, lt: weekEndISO },
              },
            }),
          }))
        );
        const best = techCounts.sort((a, b) => b.jobsCompleted - a.jobsCompleted)[0];
        if (best && best.jobsCompleted > 0) topTech = best;
      }

      const weekStartLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const weekEndLabel = new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      // Generate Claude summary
      let aiSummary = `Great week for ${org.name}! ${completedJobsThisWeek} jobs completed with ${formatCurrency(revenueCents)} in revenue. ${scheduledJobs} jobs scheduled for the coming week.`;
      if (anthropicKey) {
        try {
          const response = await callClaude(
            anthropicKey,
            [{ role: "user", content: buildWeeklyDigestPrompt({
              orgName: org.name,
              weekStart: weekStartLabel,
              weekEnd: weekEndLabel,
              revenueCents,
              jobsCompleted: completedJobsThisWeek,
              jobsScheduled: scheduledJobs,
              newCustomers,
              totalCalls: callsThisWeek,
              callsConverted,
              outstandingCents,
              overdueCount,
              topTech,
              prevWeekRevenueCents,
            }) }],
            { systemPrompt: WEEKLY_DIGEST_SYSTEM, maxTokens: 300 }
          );
          aiSummary = response.content.trim();
        } catch {
          // keep fallback summary
        }
      }

      // Send to each OWNER
      for (const owner of owners) {
        const html = buildWeeklyDigestHtml({
          orgName: org.name,
          ownerName: `${owner.firstName} ${owner.lastName}`,
          weekStart: weekStartLabel,
          weekEnd: weekEndLabel,
          revenueCents,
          prevWeekRevenueCents,
          jobsCompleted: completedJobsThisWeek,
          scheduledJobs,
          newCustomers,
          totalCalls: callsThisWeek,
          callsConverted,
          outstandingCents,
          overdueCount,
          topTech,
          aiSummary,
          appUrl,
        });

        await sendEmail(resendApiKey, {
          to: owner.email,
          subject: `📊 Weekly Digest — ${org.name} — ${weekStartLabel}`,
          html,
        });
        sent++;
      }
    } catch (err) {
      console.error("[cron:weekly-digest] Error for org:", err instanceof Error ? err.message : "Unknown");
      errors++;
    }
  }

  console.info("[cron:weekly-digest]", { sent, skipped, errors, orgs: orgs.length });
  return NextResponse.json({ success: true, sent, skipped, errors, orgs: orgs.length });
}

function buildWeeklyDigestHtml(opts: {
  orgName: string;
  ownerName: string;
  weekStart: string;
  weekEnd: string;
  revenueCents: number;
  prevWeekRevenueCents: number;
  jobsCompleted: number;
  scheduledJobs: number;
  newCustomers: number;
  totalCalls: number;
  callsConverted: number;
  outstandingCents: number;
  overdueCount: number;
  topTech: { name: string; jobsCompleted: number } | null;
  aiSummary: string;
  appUrl: string;
}): string {
  const {
    orgName, ownerName, weekStart, weekEnd, revenueCents, prevWeekRevenueCents,
    jobsCompleted, scheduledJobs, newCustomers, totalCalls, callsConverted,
    outstandingCents, overdueCount, topTech, aiSummary, appUrl,
  } = opts;

  const revenueDelta = revenueCents - prevWeekRevenueCents;
  const revenuePct = prevWeekRevenueCents > 0
    ? Math.round((revenueDelta / prevWeekRevenueCents) * 100)
    : null;
  const revenueArrow = revenueDelta >= 0 ? "▲" : "▼";
  const revenueColor = revenueDelta >= 0 ? "#16a34a" : "#dc2626";
  const conversionRate = totalCalls > 0 ? Math.round((callsConverted / totalCalls) * 100) : 0;

  const statRow = (label: string, value: string, sub?: string) => `
    <td style="padding:16px 20px;text-align:center;border-right:1px solid #e4e4e7;">
      <p style="margin:0;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">${label}</p>
      <p style="margin:4px 0 0;color:#18181b;font-size:22px;font-weight:700;">${value}</p>
      ${sub ? `<p style="margin:2px 0 0;color:#71717a;font-size:11px;">${sub}</p>` : ""}
    </td>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Weekly Digest — ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:28px 40px;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Weekly Digest</p>
              <p style="margin:4px 0 0;color:#ffffff;font-size:22px;font-weight:700;">${orgName}</p>
              <p style="margin:4px 0 0;color:#71717a;font-size:13px;">${weekStart} – ${weekEnd}</p>
            </td>
          </tr>

          <!-- AI Summary -->
          <tr>
            <td style="padding:28px 40px 20px;border-bottom:1px solid #f4f4f5;">
              <p style="margin:0 0 8px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">AI Summary</p>
              <p style="margin:0;color:#3f3f46;font-size:15px;line-height:1.7;">${aiSummary}</p>
            </td>
          </tr>

          <!-- Revenue KPI -->
          <tr>
            <td style="padding:24px 40px;border-bottom:1px solid #f4f4f5;">
              <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Revenue Collected</p>
              <p style="margin:0;color:#18181b;font-size:32px;font-weight:700;">${formatCurrency(revenueCents)}</p>
              ${revenuePct !== null ? `<p style="margin:4px 0 0;color:${revenueColor};font-size:13px;font-weight:600;">${revenueArrow} ${Math.abs(revenuePct)}% vs last week (${formatCurrency(prevWeekRevenueCents)})</p>` : ""}
            </td>
          </tr>

          <!-- Stats Grid -->
          <tr>
            <td style="padding:0;border-bottom:1px solid #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f4f4f5;">
                <tr>
                  ${statRow("Jobs Done", String(jobsCompleted), `${scheduledJobs} scheduled`)}
                  ${statRow("New Customers", String(newCustomers), "this week")}
                  ${statRow("AI Calls", String(totalCalls), `${conversionRate}% converted`)}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Outstanding + Top Tech -->
          <tr>
            <td style="padding:24px 40px;border-bottom:1px solid #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;width:50%;padding-right:16px;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Outstanding</p>
                    <p style="margin:0;color:${overdueCount > 0 ? "#dc2626" : "#18181b"};font-size:20px;font-weight:700;">${formatCurrency(outstandingCents)}</p>
                    ${overdueCount > 0 ? `<p style="margin:2px 0 0;color:#dc2626;font-size:12px;font-weight:500;">${overdueCount} invoice${overdueCount !== 1 ? "s" : ""} overdue</p>` : `<p style="margin:2px 0 0;color:#71717a;font-size:12px;">No overdue invoices</p>`}
                  </td>
                  ${topTech ? `<td style="vertical-align:top;width:50%;padding-left:16px;border-left:1px solid #f4f4f5;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Top Performer</p>
                    <p style="margin:0;color:#18181b;font-size:18px;font-weight:700;">${topTech.name}</p>
                    <p style="margin:2px 0 0;color:#71717a;font-size:12px;">${topTech.jobsCompleted} job${topTech.jobsCompleted !== 1 ? "s" : ""} completed</p>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 40px;">
              <p style="margin:0 0 16px;color:#3f3f46;font-size:14px;">Hi ${ownerName}, view your full dashboard for detailed reports and analytics.</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#18181b;">
                    <a href="${appUrl}/analytics" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">View Dashboard →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:16px 40px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">OpsPilot Weekly Digest · Sent every Monday · <a href="${appUrl}/settings" style="color:#a1a1aa;">Manage preferences</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
