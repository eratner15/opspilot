"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Receipt,
  Wrench,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { formatPhone, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useState } from "react";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const { data: customer, isLoading } = api.customers.getById.useQuery({ id });
  const { data: stats } = api.customers.getStats.useQuery({ id });

  const deleteMutation = api.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Customer deleted");
      router.push("/customers");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton variant="card" />;
  if (!customer) return <div className="p-8 text-center text-muted-foreground">Customer not found.</div>;

  const equipment: string[] = customer.equipmentJson
    ? JSON.parse(customer.equipmentJson)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={customer.address ? `${customer.address}, ${customer.city}, ${customer.state}` : "No address on file"}
      >
        <Button variant="outline" asChild>
          <Link href="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/customers/${id}/edit`}>Edit Customer</Link>
        </Button>
      </PageHeader>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="h-4 w-4" />
                Lifetime Revenue
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(stats.lifetimeRevenueCents)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Briefcase className="h-4 w-4" />
                Total Jobs
              </div>
              <div className="text-2xl font-bold mt-1">{stats.totalJobs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="h-4 w-4" />
                Avg Ticket
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(stats.avgTicketCents)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Receipt className="h-4 w-4" />
                Outstanding
              </div>
              <div className="text-2xl font-bold mt-1 text-orange-600">
                {formatCurrency(stats.outstandingCents)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Customer Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={customer.type} />
              </div>
              <Separator />
              <div className="flex items-start gap-2 text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{formatPhone(customer.phone)}</span>
              </div>
              {customer.email && (
                <div className="flex items-start gap-2 text-sm">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-all">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span>
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.state && `, ${customer.state}`}
                    {customer.zip && ` ${customer.zip}`}
                  </span>
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground">
                Customer since {formatDate(customer.createdAt)}
              </div>
            </CardContent>
          </Card>

          {equipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {equipment.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {customer.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </CardContent>
            </Card>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => setShowDelete(true)}
          >
            Delete Customer
          </Button>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="jobs">
            <TabsList>
              <TabsTrigger value="jobs">
                Jobs ({customer.jobs.length})
              </TabsTrigger>
              <TabsTrigger value="invoices">
                Invoices ({customer.invoices.length})
              </TabsTrigger>
              <TabsTrigger value="quotes">
                Quotes ({customer.quotes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="mt-4 space-y-2">
              {customer.jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No jobs yet</p>
              ) : (
                customer.jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.jobNumber} · {JOB_PRIORITY_LABELS[job.priority] ?? job.priority}
                            {job.technician && ` · ${job.technician.firstName} ${job.technician.lastName}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={job.status} />
                          <p className="text-xs text-muted-foreground">
                            {formatDate(job.createdAt)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
              <div className="pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/jobs/new?customerId=${id}`}>+ New Job</Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="mt-4 space-y-2">
              {customer.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet</p>
              ) : (
                customer.invoices.map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {formatDate(inv.dueDate)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={inv.status} />
                          <p className="text-sm font-medium">{formatCurrency(inv.totalCents)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="quotes" className="mt-4 space-y-2">
              {customer.quotes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No quotes yet</p>
              ) : (
                customer.quotes.map((quote) => (
                  <Link key={quote.id} href={`/quotes/${quote.id}`}>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">{quote.title ?? quote.quoteNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {quote.quoteNumber} · {formatDate(quote.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={quote.status} />
                          <p className="text-sm font-medium">{formatCurrency(quote.totalCents)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Customer"
        description={`Are you sure you want to delete ${customer.firstName} ${customer.lastName}? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate({ id })}
        destructive
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
      />
    </div>
  );
}
