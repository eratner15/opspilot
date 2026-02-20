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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ChevronDown,
  User,
  HardHat,
  Calendar,
  DollarSign,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useState } from "react";

// Valid next statuses per current status
const NEXT_STATUSES: Record<string, Array<{ status: string; label: string }>> = {
  NEW: [
    { status: "SCHEDULED", label: "Schedule" },
    { status: "CANCELLED", label: "Cancel" },
    { status: "ON_HOLD", label: "Put On Hold" },
  ],
  SCHEDULED: [
    { status: "EN_ROUTE", label: "Mark En Route" },
    { status: "IN_PROGRESS", label: "Start Job" },
    { status: "CANCELLED", label: "Cancel" },
    { status: "ON_HOLD", label: "Put On Hold" },
  ],
  EN_ROUTE: [
    { status: "IN_PROGRESS", label: "Start Job" },
    { status: "SCHEDULED", label: "Back to Scheduled" },
    { status: "CANCELLED", label: "Cancel" },
  ],
  IN_PROGRESS: [
    { status: "COMPLETED", label: "Mark Completed" },
    { status: "ON_HOLD", label: "Put On Hold" },
    { status: "CANCELLED", label: "Cancel" },
  ],
  COMPLETED: [
    { status: "INVOICED", label: "Mark Invoiced" },
    { status: "ON_HOLD", label: "Put On Hold" },
  ],
  INVOICED: [
    { status: "PAID", label: "Mark Paid" },
    { status: "COMPLETED", label: "Back to Completed" },
  ],
  PAID: [],
  CANCELLED: [{ status: "NEW", label: "Reopen" }],
  ON_HOLD: [
    { status: "NEW", label: "Reopen as New" },
    { status: "SCHEDULED", label: "Schedule" },
    { status: "CANCELLED", label: "Cancel" },
  ],
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const { data, isLoading, refetch } = api.jobs.getById.useQuery({ id });

  const updateStatusMutation = api.jobs.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Job status updated");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.jobs.delete.useMutation({
    onSuccess: () => {
      toast.success("Job deleted");
      router.push("/jobs");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton variant="card" />;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Job not found.</div>;

  const job = data;
  const lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }> =
    job.lineItemsJson ? JSON.parse(job.lineItemsJson) : [];

  const nextStatuses = NEXT_STATUSES[job.status] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        description={`${job.jobNumber} · ${JOB_PRIORITY_LABELS[job.priority] ?? job.priority} Priority`}
      >
        <Button variant="outline" asChild>
          <Link href="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        {nextStatuses.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={updateStatusMutation.isPending}>
                Update Status
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                From: {JOB_STATUS_LABELS[job.status] ?? job.status}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {nextStatuses.map((ns) => (
                <DropdownMenuItem
                  key={ns.status}
                  onClick={() => updateStatusMutation.mutate({ id, status: ns.status as Parameters<typeof updateStatusMutation.mutate>[0]["status"] })}
                >
                  {ns.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Info cards */}
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={job.status} />
                <Badge
                  variant={job.priority === "EMERGENCY" ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {JOB_PRIORITY_LABELS[job.priority] ?? job.priority}
                </Badge>
              </div>
              {job.category && (
                <p className="text-sm text-muted-foreground">{job.category}</p>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Created {formatDate(job.createdAt)}</div>
                {job.scheduledAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Scheduled {formatDateTime(job.scheduledAt)}
                    {job.scheduledWindow && ` (${job.scheduledWindow.toLowerCase()})`}
                  </div>
                )}
                {job.completedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Completed {formatDate(job.completedAt)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer card */}
          {job.customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/customers/${job.customer.id}`}
                  className="font-medium hover:underline"
                >
                  {job.customer.firstName} {job.customer.lastName}
                </Link>
                {job.customer.phone && (
                  <p className="text-sm text-muted-foreground mt-1">{job.customer.phone}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Technician card */}
          {job.technician && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardHat className="h-4 w-4" />
                  Technician
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/technicians/${job.technician.id}`}
                  className="font-medium hover:underline"
                >
                  {job.technician.firstName} {job.technician.lastName}
                </Link>
              </CardContent>
            </Card>
          )}

          {job.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{job.notes}</p>
              </CardContent>
            </Card>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => setShowDelete(true)}
          >
            Delete Job
          </Button>
        </div>

        {/* Right: Line items + activity */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          {job.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{job.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Line items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Line Items
              </CardTitle>
              <span className="font-bold">{formatCurrency(job.totalCents)}</span>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No line items
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 text-xs text-muted-foreground font-medium pb-1 border-b">
                    <span className="col-span-6">Description</span>
                    <span className="col-span-2 text-right">Qty</span>
                    <span className="col-span-2 text-right">Unit</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  {lineItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 text-sm">
                      <span className="col-span-6">{item.description}</span>
                      <span className="col-span-2 text-right">{item.quantity}</span>
                      <span className="col-span-2 text-right">
                        {formatCurrency(item.unitPriceCents)}
                      </span>
                      <span className="col-span-2 text-right font-medium">
                        {formatCurrency(Math.round(item.quantity * item.unitPriceCents))}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-end">
                    <span className="font-bold">{formatCurrency(job.totalCents)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          {job.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {job.invoices.map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                        {inv.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due {formatDate(inv.dueDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={inv.status} />
                        <span className="font-medium text-sm">
                          {formatCurrency(inv.totalCents)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity log */}
          {job.activityLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.activityLog.map((entry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{entry.action.replace(".", " → ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Job"
        description={`Are you sure you want to delete "${job.title}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate({ id })}
        destructive
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
      />
    </div>
  );
}
