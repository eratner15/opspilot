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
import { Users, Search } from "lucide-react";
import Link from "next/link";
import { formatPhone } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "@/lib/hooks/use-debounce";

type CustomerRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  type: string;
  city: string | null;
  _count: { jobs: number; invoices: number };
};

const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/customers/${row.original.id}`}
        className="font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.firstName} {row.original.lastName}
      </Link>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => formatPhone(row.original.phone),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "—",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <StatusBadge status={row.original.type} />,
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => row.original.city ?? "—",
  },
  {
    id: "jobs",
    header: "Jobs",
    cell: ({ row }) => row.original._count.jobs,
  },
];

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "RESIDENTIAL" | "COMMERCIAL">("ALL");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = api.customers.list.useQuery({
    search: debouncedSearch || undefined,
    type: typeFilter === "ALL" ? undefined : typeFilter,
    take: 25,
    skip: 0,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage your customer accounts">
        <Button asChild>
          <Link href="/customers/new">Add Customer</Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="RESIDENTIAL">Residential</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description={
            search
              ? `No customers found matching "${search}"`
              : "Add your first customer to get started."
          }
          actionLabel="Add Customer"
          actionHref="/customers/new"
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data.total} customer{data.total !== 1 ? "s" : ""}
          </p>
          <DataTable
            columns={columns}
            data={data.items as CustomerRow[]}
            searchKey="name"
            onRowClick={(row) => router.push(`/customers/${row.id}`)}
          />
        </>
      )}
    </div>
  );
}
