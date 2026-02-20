"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Receipt, Search } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalCents: number;
  amountPaidCents: number;
  dueDate: string | null;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string };
};

function isOverdue(inv: InvoiceRow): boolean {
  if (inv.status !== "SENT" && inv.status !== "OVERDUE") return false;
  if (!inv.dueDate) return false;
  return new Date(inv.dueDate) < new Date();
}

const columns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice #",
    cell: ({ row }) => (
      <Link
        href={`/invoices/${row.original.id}`}
        className="font-mono font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.invoiceNumber}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.customer.id}`}
        className="hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.customer.firstName} {row.original.customer.lastName}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <StatusBadge status={row.original.status} />
        {isOverdue(row.original) && (
          <span className="text-xs font-medium text-red-500">Overdue</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "totalCents",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.original.totalCents)}</span>
    ),
  },
  {
    id: "balance",
    header: "Balance Due",
    cell: ({ row }) => {
      const balance = row.original.totalCents - row.original.amountPaidCents;
      return (
        <span className={cn("font-medium", balance > 0 && row.original.status !== "PAID" ? "text-amber-600" : "text-green-600")}>
          {formatCurrency(balance)}
        </span>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      if (!row.original.dueDate) return "—";
      const overdue = isOverdue(row.original);
      return (
        <span className={overdue ? "font-medium text-red-500" : ""}>
          {formatDate(row.original.dueDate)}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

type StatusFilter = "ALL" | "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export default function InvoicesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = api.invoices.list.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    take: 25,
    skip: 0,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage billing and payments">
        <Button asChild>
          <Link href="/invoices/new">New Invoice</Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description={
            search
              ? `No invoices found matching "${search}"`
              : "Create your first invoice to start billing."
          }
          actionLabel="New Invoice"
          actionHref="/invoices/new"
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data.total} invoice{data.total !== 1 ? "s" : ""}
          </p>
          <DataTable
            columns={columns}
            data={data.items as InvoiceRow[]}
            searchKey="invoiceNumber"
            onRowClick={(row) => router.push(`/invoices/${row.id}`)}
          />
        </>
      )}
    </div>
  );
}
