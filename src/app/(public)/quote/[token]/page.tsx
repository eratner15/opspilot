import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PublicQuoteClient } from "./public-quote-client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params;

  let db;
  try {
    const { env } = await getCloudflareContext();
    db = createDb(env.DB);
  } catch {
    // local dev
    const { PrismaClient } = await import("@prisma/client");
    db = new PrismaClient();
  }

  const quote = await db.quote.findUnique({
    where: { publicToken: token },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      organization: { select: { name: true, phone: true } },
    },
  });

  if (!quote) notFound();

  // Parse line items
  type LineItem = { description: string; quantity: number; unitPriceCents: number };
  const lineItems: LineItem[] = JSON.parse(quote.lineItemsJson) as LineItem[];

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            {quote.organization.name}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-zinc-900">Service Quote</h1>
          <p className="mt-1 font-mono text-zinc-500">{quote.quoteNumber}</p>
        </div>

        {/* Quote Card */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* Status Banner */}
          {quote.status === "ACCEPTED" && (
            <div className="bg-green-500 px-6 py-3 text-center text-sm font-semibold text-white">
              ✓ This quote has been accepted. Thank you!
            </div>
          )}
          {quote.status === "DECLINED" && (
            <div className="bg-red-500 px-6 py-3 text-center text-sm font-semibold text-white">
              This quote has been declined.
            </div>
          )}
          {quote.status === "EXPIRED" && (
            <div className="bg-zinc-500 px-6 py-3 text-center text-sm font-semibold text-white">
              This quote has expired.
            </div>
          )}

          {/* Customer Info */}
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-zinc-400">Prepared for</p>
                <p className="mt-0.5 font-semibold text-zinc-900">
                  {quote.customer.firstName} {quote.customer.lastName}
                </p>
              </div>
              {quote.validUntil && (
                <div>
                  <p className="text-xs font-medium uppercase text-zinc-400">Valid until</p>
                  <p className="mt-0.5 font-semibold text-zinc-900">{formatDate(quote.validUntil)}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase text-zinc-400">Created</p>
                <p className="mt-0.5 font-semibold text-zinc-900">{formatDate(quote.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-6 py-4">
            {quote.title && (
              <p className="mb-4 text-base font-semibold text-zinc-800">{quote.title}</p>
            )}
            <table className="w-full text-sm">
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

            {/* Totals */}
            <div className="mt-4 space-y-1 border-t border-zinc-100 pt-4">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotalCents)}</span>
              </div>
              {quote.taxCents > 0 && (
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>Tax ({(quote.taxRateBps / 100).toFixed(2)}%)</span>
                  <span>{formatCurrency(quote.taxCents)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900">
                <span>Total</span>
                <span>{formatCurrency(quote.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="border-t border-zinc-100 px-6 py-4">
              <p className="text-xs font-medium uppercase text-zinc-400">Notes</p>
              <p className="mt-1 text-sm text-zinc-600">{quote.notes}</p>
            </div>
          )}

          {/* Signature + Accept/Decline (client component) */}
          {["DRAFT", "SENT"].includes(quote.status) && (
            <PublicQuoteClient
              quoteId={quote.id}
              publicToken={token}
              quoteNumber={quote.quoteNumber}
              orgName={quote.organization.name}
              orgPhone={quote.organization.phone ?? undefined}
            />
          )}

          {/* Already signed */}
          {quote.status === "ACCEPTED" && quote.acceptedAt && (
            <div className="border-t border-zinc-100 px-6 py-4 text-center text-sm text-zinc-500">
              Accepted on {formatDate(quote.acceptedAt)}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-400">
          Questions? Contact {quote.organization.name}
          {quote.organization.phone ? ` at ${quote.organization.phone}` : ""}.
        </p>
      </div>
    </div>
  );
}
