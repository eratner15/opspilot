"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
  XCircle,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LineItem = { description: string; quantity: number; unitPriceCents: number };

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <Clock className="h-4 w-4 text-zinc-400" />,
  SENT: <Send className="h-4 w-4 text-blue-500" />,
  PAID: <CheckCircle className="h-4 w-4 text-green-500" />,
  OVERDUE: <AlertTriangle className="h-4 w-4 text-red-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-zinc-400" />,
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: invoice, isLoading, refetch } = api.invoices.getById.useQuery({ id });

  const sendMutation = api.invoices.sendInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice sent to customer");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = api.invoices.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted");
      router.push("/invoices");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton variant="card" />;
  if (!invoice) return <div className="text-muted-foreground">Invoice not found.</div>;

  const lineItems: LineItem[] = (() => {
    try {
      return JSON.parse(invoice.lineItemsJson) as LineItem[];
    } catch {
      return [];
    }
  })();

  const balanceDueCents = invoice.totalCents - invoice.amountPaidCents;
  const canDelete = ["DRAFT", "CANCELLED"].includes(invoice.status);
  const canSend = ["DRAFT", "SENT", "OVERDUE"].includes(invoice.status);
  const publicUrl = `/pay/${invoice.publicToken}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Invoice for ${invoice.customer.firstName} ${invoice.customer.lastName}`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Public Pay Page
            </a>
          </Button>
          {canSend && invoice.customer.email && (
            <Button
              size="sm"
              onClick={() => sendMutation.mutate({ id: invoice.id })}
              disabled={sendMutation.isPending}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {sendMutation.isPending ? "Sending..." : "Send Invoice"}
            </Button>
          )}
          {invoice.status === "SENT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: "PAID" })}
              disabled={updateStatusMutation.isPending}
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-500" />
              Mark Paid
            </Button>
          )}
          {invoice.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: "CANCELLED" })}
              disabled={updateStatusMutation.isPending}
            >
              Cancel Invoice
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {invoice.invoiceNumber}? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => deleteMutation.mutate({ id: invoice.id })}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </PageHeader>

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          {STATUS_ICONS[invoice.status]}
          <StatusBadge status={invoice.status} />
        </div>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex flex-col sm:flex-row sm:gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold">{formatCurrency(invoice.totalCents)}</span>
          </div>
          {invoice.amountPaidCents > 0 && (
            <div>
              <span className="text-muted-foreground">Paid: </span>
              <span className="font-semibold text-green-600">{formatCurrency(invoice.amountPaidCents)}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Balance: </span>
            <span
              className={cn(
                "font-semibold",
                balanceDueCents > 0 && invoice.status !== "PAID" ? "text-amber-600" : "text-green-600"
              )}
            >
              {formatCurrency(balanceDueCents)}
            </span>
          </div>
        </div>
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
                  <span>{formatCurrency(invoice.subtotalCents)}</span>
                </div>
                {invoice.taxCents > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
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
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>{balanceDueCents < invoice.totalCents ? "Balance due" : "Total"}</span>
                  <span
                    className={
                      invoice.status === "PAID"
                        ? "text-green-600"
                        : balanceDueCents > 0
                        ? "text-foreground"
                        : ""
                    }
                  >
                    {formatCurrency(balanceDueCents)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
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
                href={`/customers/${invoice.customerId}`}
                className="font-medium hover:underline"
              >
                {invoice.customer.firstName} {invoice.customer.lastName}
              </Link>
              {invoice.customer.email && (
                <p className="text-muted-foreground">{invoice.customer.email}</p>
              )}
              {invoice.customer.phone && (
                <p className="text-muted-foreground">{invoice.customer.phone}</p>
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
                <span>{formatDate(invoice.createdAt)}</span>
              </div>
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{formatDateTime(invoice.sentAt)}</span>
                </div>
              )}
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due date</span>
                  <span
                    className={
                      invoice.status === "OVERDUE" ? "font-medium text-red-600" : ""
                    }
                  >
                    {formatDate(invoice.dueDate)}
                  </span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-green-600">{formatDateTime(invoice.paidAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked job */}
          {invoice.job && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4" />
                  Linked Job
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <Link href={`/jobs/${invoice.job.id}`} className="font-medium hover:underline">
                  {invoice.job.jobNumber} — {invoice.job.title ?? invoice.job.category}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stripe */}
          {invoice.stripePaymentIntentId && (
            <Card>
              <CardContent className="pt-4 text-xs text-muted-foreground">
                <span className="font-medium">Stripe: </span>
                {invoice.stripePaymentIntentId}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
