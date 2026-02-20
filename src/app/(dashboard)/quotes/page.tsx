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
import { FileText, Search } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { ColumnDef } from "@tanstack/react-table";

type QuoteRow = {
  id: string;
  quoteNumber: string;
  title: string | null;
  status: string;
  totalCents: number;
  validUntil: string | null;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string };
};

const columns: ColumnDef<QuoteRow>[] = [
  {
    accessorKey: "quoteNumber",
    header: "Quote #",
    cell: ({ row }) => (
      <Link
        href={`/quotes/${row.original.id}`}
        className="font-mono font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.quoteNumber}
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
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => row.original.title ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "totalCents",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.original.totalCents)}</span>
    ),
  },
  {
    accessorKey: "validUntil",
    header: "Valid Until",
    cell: ({ row }) => (row.original.validUntil ? formatDate(row.original.validUntil) : "—"),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

type StatusFilter = "ALL" | "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export default function QuotesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = api.quotes.list.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    take: 25,
    skip: 0,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Quotes" description="Create and manage quotes for customers">
        <Button asChild>
          <Link href="/quotes/new">New Quote</Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
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
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes yet"
          description={
            search
              ? `No quotes found matching "${search}"`
              : "Create your first quote to send to a customer."
          }
          actionLabel="New Quote"
          actionHref="/quotes/new"
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data.total} quote{data.total !== 1 ? "s" : ""}
          </p>
          <DataTable
            columns={columns}
            data={data.items as QuoteRow[]}
            searchKey="quoteNumber"
            onRowClick={(row) => router.push(`/quotes/${row.id}`)}
          />
        </>
      )}
    </div>
  );
}
