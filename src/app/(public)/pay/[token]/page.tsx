import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PublicPayClient } from "./public-pay-client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicPayPage({ params }: Props) {
  const { token } = await params;

  let db;
  let hasStripeKeys = false;
  try {
    const { env } = await getCloudflareContext();
    db = createDb(env.DB);
    const cfEnv = env as unknown as Record<string, string | undefined>;
    hasStripeKeys = !!(cfEnv.STRIPE_SECRET_KEY && cfEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  } catch {
    // local dev
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient();
  }

  const invoice = await db.invoice.findUnique({
    where: { publicToken: token },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      organization: { select: { name: true, phone: true } },
    },
  });

  if (!invoice) notFound();

  type LineItem = { description: string; quantity: number; unitPriceCents: number };
  const lineItems: LineItem[] = JSON.parse(invoice.lineItemsJson) as LineItem[];

  const isPaid = invoice.status === "PAID";
  const isCancelled = invoice.status === "CANCELLED";
  const balanceDueCents = invoice.totalCents - invoice.amountPaidCents;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            {invoice.organization.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">Invoice</h1>
          <p className="mt-1 font-mono text-zinc-500">{invoice.invoiceNumber}</p>
        </div>

        {/* Invoice Card */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* Status Banner */}
          {isPaid && (
            <div className="bg-green-500 px-6 py-3 text-center text-sm font-semibold text-white">
              ✓ This invoice has been paid. Thank you!
            </div>
          )}
          {isCancelled && (
            <div className="bg-zinc-500 px-6 py-3 text-center text-sm font-semibold text-white">
              This invoice has been cancelled.
            </div>
          )}
          {invoice.status === "OVERDUE" && (
            <div className="bg-red-500 px-6 py-3 text-center text-sm font-semibold text-white">
              ⚠ This invoice is overdue. Please pay as soon as possible.
            </div>
          )}

          {/* Customer Info */}
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-zinc-400">Bill to</p>
                <p className="mt-0.5 font-semibold text-zinc-900">
                  {invoice.customer.firstName} {invoice.customer.lastName}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-xs font-medium uppercase text-zinc-400">Due date</p>
                  <p
                    className={`mt-0.5 font-semibold ${
                      invoice.status === "OVERDUE" ? "text-red-600" : "text-zinc-900"
                    }`}
                  >
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase text-zinc-400">Invoice date</p>
                <p className="mt-0.5 font-semibold text-zinc-900">{formatDate(invoice.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-6 py-4">
            <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium uppercase text-zinc-400">
                  <th className="pb-2 text-left">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 text-zinc-700">{item.description}</td>
                    <td className="py-3 text-right text-zinc-600">{item.quantity}</td>
                    <td className="py-3 text-right text-zinc-600">
                      {formatCurrency(item.unitPriceCents)}
                    </td>
                    <td className="py-3 text-right font-medium text-zinc-900">
                      {formatCurrency(Math.round(item.quantity * item.unitPriceCents))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-1 border-t border-zinc-100 pt-4">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotalCents)}</span>
              </div>
              {invoice.taxCents > 0 && (
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Tax ({(invoice.taxRateBps / 100).toFixed(2)}%)</span>
                  <span>{formatCurrency(invoice.taxCents)}</span>
                </div>
              )}
              {invoice.amountPaidCents > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Amount paid</span>
                  <span>−{formatCurrency(invoice.amountPaidCents)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900">
                <span>{invoice.amountPaidCents > 0 ? "Balance due" : "Total"}</span>
                <span>{formatCurrency(balanceDueCents)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-zinc-100 px-6 py-4">
              <p className="text-xs font-medium uppercase text-zinc-400">Notes</p>
              <p className="mt-1 text-sm text-zinc-600">{invoice.notes}</p>
            </div>
          )}

          {/* Payment section */}
          {!isPaid && !isCancelled && (
            <PublicPayClient
              invoiceId={invoice.id}
              publicToken={token}
              invoiceNumber={invoice.invoiceNumber}
              balanceDueCents={balanceDueCents}
              customerEmail={invoice.customer.email ?? ""}
              hasStripeKeys={hasStripeKeys}
            />
          )}

          {isPaid && invoice.paidAt && (
            <div className="border-t border-zinc-100 px-6 py-4 text-center text-sm text-zinc-500">
              Paid on {formatDate(invoice.paidAt)}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-400">
          Questions? Contact {invoice.organization.name}
          {invoice.organization.phone ? ` at ${invoice.organization.phone}` : ""}.
        </p>
      </div>
    </div>
  );
}
