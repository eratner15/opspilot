/**
 * Email service — uses Resend if key is available, otherwise logs to console (mock).
 * IMPORTANT: Do NOT log PII (customer email/phone) in production logs.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  mocked: boolean;
  id?: string;
}

export async function sendEmail(
  resendApiKey: string | undefined,
  options: SendEmailOptions
): Promise<EmailResult> {
  if (!resendApiKey) {
    // Mock mode — no Resend key configured
    console.info("[email:mock]", { subject: options.subject, to: "[REDACTED]" });
    return { success: true, mocked: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from ?? "OpsPilot <noreply@opspilot.ai>",
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { id: string };
  return { success: true, mocked: false, id: data.id };
}

export function buildQuoteEmailHtml(options: {
  customerName: string;
  quoteNumber: string;
  total: string;
  validUntil?: string;
  publicUrl: string;
  orgName: string;
}): string {
  const { customerName, quoteNumber, total, validUntil, publicUrl, orgName } = options;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quote ${quoteNumber} from ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${orgName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#71717a;font-size:14px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">New Quote</p>
              <h1 style="margin:0 0 24px;color:#18181b;font-size:28px;font-weight:700;">Quote ${quoteNumber}</h1>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:16px;line-height:1.6;">Hi ${customerName},<br><br>Please review the attached quote for your service request. Click the button below to view the full details, ask questions, or accept the quote.</p>
              <!-- Amount box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;color:#71717a;font-size:13px;">Quote Total</p>
                    <p style="margin:4px 0 0;color:#18181b;font-size:24px;font-weight:700;">${total}</p>
                    ${validUntil ? `<p style="margin:4px 0 0;color:#71717a;font-size:13px;">Valid until ${validUntil}</p>` : ""}
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#18181b;">
                    <a href="${publicUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">View &amp; Accept Quote →</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;">If you didn't request this quote, you can safely ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:20px 40px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">Powered by OpsPilot · <a href="#" style="color:#a1a1aa;">Unsubscribe</a></p>
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

export function buildInvoiceEmailHtml(options: {
  customerName: string;
  invoiceNumber: string;
  total: string;
  dueDate?: string;
  publicUrl: string;
  orgName: string;
}): string {
  const { customerName, invoiceNumber, total, dueDate, publicUrl, orgName } = options;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice ${invoiceNumber} from ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#18181b;padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${orgName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#71717a;font-size:14px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;">Invoice</p>
              <h1 style="margin:0 0 24px;color:#18181b;font-size:28px;font-weight:700;">${invoiceNumber}</h1>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:16px;line-height:1.6;">Hi ${customerName},<br><br>Your invoice is ready. Please click below to view and pay securely online.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;color:#71717a;font-size:13px;">Amount Due</p>
                    <p style="margin:4px 0 0;color:#18181b;font-size:24px;font-weight:700;">${total}</p>
                    ${dueDate ? `<p style="margin:4px 0 0;color:#ef4444;font-size:13px;font-weight:500;">Due ${dueDate}</p>` : ""}
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#18181b;">
                    <a href="${publicUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Pay Invoice →</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;">If you have questions, reply to this email or contact us directly.</p>
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
