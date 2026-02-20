export interface WeeklyDigestInput {
  orgName: string;
  weekStart: string; // e.g. "Feb 10, 2026"
  weekEnd: string;   // e.g. "Feb 16, 2026"
  revenueCents: number;
  jobsCompleted: number;
  jobsScheduled: number;
  newCustomers: number;
  totalCalls: number;
  callsConverted: number;
  outstandingCents: number;
  overdueCount: number;
  topTech: { name: string; jobsCompleted: number } | null;
  prevWeekRevenueCents: number;
}

export const WEEKLY_DIGEST_SYSTEM = `You are an AI operations assistant for a trades business (HVAC, plumbing, electrical, roofing).
Generate a concise, professional weekly business summary for the business owner.

Guidelines:
- Be direct and factual — 3-5 sentences max
- Highlight wins, flag concerns, and suggest one actionable insight
- Compare to previous week where data is available
- Tone: professional but warm, like a trusted advisor
- Do NOT use markdown headers or bullet lists — write in plain paragraphs
- Keep it under 120 words`;

export function buildWeeklyDigestPrompt(input: WeeklyDigestInput): string {
  const revenueDelta = input.revenueCents - input.prevWeekRevenueCents;
  const revenueChange =
    input.prevWeekRevenueCents > 0
      ? ` (${revenueDelta >= 0 ? "+" : ""}${Math.round((revenueDelta / input.prevWeekRevenueCents) * 100)}% vs last week)`
      : "";

  const conversionRate =
    input.totalCalls > 0
      ? Math.round((input.callsConverted / input.totalCalls) * 100)
      : 0;

  return `Generate a weekly business summary for ${input.orgName} covering ${input.weekStart} – ${input.weekEnd}.

Key metrics:
- Revenue collected: $${(input.revenueCents / 100).toFixed(2)}${revenueChange}
- Jobs completed: ${input.jobsCompleted}
- Jobs scheduled (upcoming): ${input.jobsScheduled}
- New customers: ${input.newCustomers}
- AI calls handled: ${input.totalCalls} (${conversionRate}% converted to jobs)
- Outstanding invoices: $${(input.outstandingCents / 100).toFixed(2)} (${input.overdueCount} overdue)
${input.topTech ? `- Top performer: ${input.topTech.name} (${input.topTech.jobsCompleted} jobs completed)` : ""}

Write a concise weekly summary paragraph for the business owner. Be specific about performance and suggest one action item.`;
}
