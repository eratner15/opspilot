"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  User,
  Calendar,
  Send,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type LineItem = { description: string; quantity: number; unitPriceCents: number };

const STATUS_FLOW: Record<string, { label: string; next: string[]; icon: React.ReactNode }> = {
  DRAFT: {
    label: "Draft",
    next: ["SENT"],
    icon: <Clock className="h-4 w-4" />,
  },
  SENT: {
    label: "Sent",
    next: ["ACCEPTED", "DECLINED", "EXPIRED"],
    icon: <Send className="h-4 w-4" />,
  },
  ACCEPTED: {
    label: "Accepted",
    next: [],
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
  },
  DECLINED: {
    label: "Declined",
    next: [],
    icon: <XCircle className="h-4 w-4 text-red-500" />,
  },
  EXPIRED: {
    label: "Expired",
    next: [],
    icon: <Clock className="h-4 w-4 text-zinc-400" />,
  },
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: quote, isLoading, refetch } = api.quotes.getById.useQuery({ id });

  const sendMutation = api.quotes.sendQuote.useMutation({
    onSuccess: () => {
      toast.success("Quote sent to customer");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = api.quotes.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.quotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Quote deleted");
      router.push("/quotes");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton variant="card" />;
  if (!quote) return <div className="text-muted-foreground">Quote not found.</div>;

  const lineItems: LineItem[] = (() => {
    try {
      return JSON.parse(quote.lineItemsJson) as LineItem[];
    } catch {
      return [];
    }
  })();

  const statusInfo = STATUS_FLOW[quote.status] ?? STATUS_FLOW.DRAFT;
  const publicUrl = `/quote/${quote.publicToken}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote.quoteNumber}
        description={quote.title ?? `Quote for ${quote.customer.firstName} ${quote.customer.lastName}`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/quotes">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Public View
            </a>
          </Button>
          {quote.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={() => sendMutation.mutate({ id: quote.id })}
              disabled={sendMutation.isPending}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {sendMutation.isPending ? "Sending..." : "Send to Customer"}
            </Button>
          )}
          {quote.status === "DRAFT" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {quote.quoteNumber}? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => deleteMutation.mutate({ id: quote.id })}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </PageHeader>

      {/* Status Timeline */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          {statusInfo.icon}
          <StatusBadge status={quote.status} />
        </div>
        {statusInfo.next.length > 0 && (
          <>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex flex-wrap gap-2">
              {statusInfo.next.map((next) => (
                <Button
                  key={next}
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatusMutation.mutate({ id: quote.id, status: next as "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "DRAFT" })}
                  disabled={updateStatusMutation.isPending}
                >
                  Mark {next.charAt(0) + next.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 md:col-span-2">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs font-medium uppercase text-muted-foreground">
                    <th className="pb-2 text-left">Description</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 text-foreground">{item.description}</td>
                      <td className="py-3 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatCurrency(item.unitPriceCents)}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(Math.round(item.quantity * item.unitPriceCents))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 space-y-1 border-t pt-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(quote.subtotalCents)}</span>
                </div>
                {quote.taxCents > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax ({(quote.taxRateBps / 100).toFixed(2)}%)</span>
                    <span>{formatCurrency(quote.taxCents)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(quote.totalCents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Link
                href={`/customers/${quote.customerId}`}
                className="font-medium hover:underline"
              >
                {quote.customer.firstName} {quote.customer.lastName}
              </Link>
              {quote.customer.email && (
                <p className="text-muted-foreground">{quote.customer.email}</p>
              )}
              {quote.customer.phone && (
                <p className="text-muted-foreground">{quote.customer.phone}</p>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(quote.createdAt)}</span>
              </div>
              {quote.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{formatDateTime(quote.sentAt)}</span>
                </div>
              )}
              {quote.validUntil && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid until</span>
                  <span>{formatDate(quote.validUntil)}</span>
                </div>
              )}
              {quote.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepted</span>
                  <Badge variant="outline" className="text-green-600">
                    {formatDateTime(quote.acceptedAt)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags / Job link */}
          {quote.jobId && (
            <Card>
              <CardContent className="pt-4">
                <Link href={`/jobs/${quote.jobId}`} className="text-sm font-medium hover:underline">
                  View linked job →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
