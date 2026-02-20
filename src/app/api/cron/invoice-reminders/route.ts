import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { sendEmail, buildInvoiceEmailHtml } from "@/server/services/email";
import { formatCurrency, formatDate } from "@/lib/utils";


/**
 * Cron: Daily overdue invoice reminder emails.
 * Triggers: "0 0 * * *" (midnight UTC daily) via wrangler.jsonc
 *
 * Logic:
 * - Find SENT invoices past due date
 * - Send reminders at 3, 7, 14 days overdue
 * - Mark OVERDUE status at 14+ days
 * - Skip PAID / CANCELLED / DRAFT invoices
 */
export async function GET(req: Request) {
  // Security: only allow Cloudflare cron or internal calls
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "cron-internal";
  if (authHeader !== `Bearer ${cronSecret}`) {
    // Allow Cloudflare Workers scheduled trigger (no auth header)
    const userAgent = req.headers.get("user-agent") ?? "";
    if (!userAgent.includes("Cloudflare-Workers")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let db;
  let resendApiKey: string | undefined;
  let appUrl = "https://smb.cafecito-ai.com";

  try {
    const { env } = await getCloudflareContext();
    db = createDb(env.DB);
    const cfEnv = env as unknown as Record<string, string | undefined>;
    resendApiKey = cfEnv.RESEND_API_KEY;
    if (cfEnv.NEXT_PUBLIC_APP_URL) appUrl = cfEnv.NEXT_PUBLIC_APP_URL;
  } catch {
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient();
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Find all SENT invoices with a due date
  const sentInvoices = await db.invoice.findMany({
    where: {
      status: "SENT",
      dueDate: { not: null },
    },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      organization: { select: { name: true } },
    },
  });

  let reminded = 0;
  let markedOverdue = 0;
  let skipped = 0;

  for (const invoice of sentInvoices) {
    if (!invoice.dueDate || !invoice.customer.email) {
      skipped++;
      continue;
    }

    const dueDate = new Date(invoice.dueDate);
    dueDate.setUTCHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
      // Not yet overdue
      skipped++;
      continue;
    }

    // Mark OVERDUE at 14+ days
    if (daysOverdue >= 14) {
      await db.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "OVERDUE",
          updatedAt: new Date().toISOString(),
        },
      });
      markedOverdue++;
    }

    // Send reminders at 3, 7, 14 days overdue
    if (daysOverdue === 3 || daysOverdue === 7 || daysOverdue === 14) {
      const publicUrl = `${appUrl}/pay/${invoice.publicToken}`;
      const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`;
      const subject =
        daysOverdue >= 14
          ? `OVERDUE: Invoice ${invoice.invoiceNumber} — Action Required`
          : `Reminder: Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue`;

      try {
        await sendEmail(resendApiKey, {
          to: invoice.customer.email,
          subject,
          html: buildInvoiceReminderHtml({
            customerName,
            invoiceNumber: invoice.invoiceNumber,
            total: formatCurrency(invoice.totalCents - invoice.amountPaidCents),
            dueDate: formatDate(invoice.dueDate),
            daysOverdue,
            publicUrl,
            orgName: invoice.organization.name,
          }),
        });
        reminded++;
      } catch (err) {
        console.error("[cron:invoice-reminders] Email failed:", err instanceof Error ? err.message : "Unknown");
        skipped++;
      }
    } else {
      skipped++;
    }
  }

  console.info("[cron:invoice-reminders]", { reminded, markedOverdue, skipped, total: sentInvoices.length });

  return NextResponse.json({
    success: true,
    reminded,
    markedOverdue,
    skipped,
    total: sentInvoices.length,
  });
}

function buildInvoiceReminderHtml(options: {
  customerName: string;
  invoiceNumber: string;
  total: string;
  dueDate: string;
  daysOverdue: number;
  publicUrl: string;
  orgName: string;
}): string {
  const { customerName, invoiceNumber, total, dueDate, daysOverdue, publicUrl, orgName } = options;
  const isUrgent = daysOverdue >= 14;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice ${invoiceNumber} — Payment Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${isUrgent ? "#dc2626" : "#18181b"};padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${orgName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:${isUrgent ? "#dc2626" : "#71717a"};font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${isUrgent ? "Urgent — Action Required" : "Payment Reminder"}</p>
              <h1 style="margin:0 0 24px;color:#18181b;font-size:28px;font-weight:700;">Invoice ${invoiceNumber}</h1>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:16px;line-height:1.6;">
                Hi ${customerName},<br><br>
                ${
                  isUrgent
                    ? `Your invoice is now <strong>${daysOverdue} days overdue</strong>. Please make payment immediately to avoid service interruption.`
                    : `This is a friendly reminder that invoice ${invoiceNumber} is <strong>${daysOverdue} days overdue</strong>. Please make payment at your earliest convenience.`
                }
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;color:#71717a;font-size:13px;">Amount Due</p>
                    <p style="margin:4px 0 0;color:#dc2626;font-size:24px;font-weight:700;">${total}</p>
                    <p style="margin:4px 0 0;color:#dc2626;font-size:13px;font-weight:500;">Was due ${dueDate} (${daysOverdue} days ago)</p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:${isUrgent ? "#dc2626" : "#18181b"};">
                    <a href="${publicUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Pay Now →</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;">If you've already paid, please disregard this notice or contact us to confirm receipt.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f4f4f5;padding:20px 40px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">Powered by OpsPilot</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
