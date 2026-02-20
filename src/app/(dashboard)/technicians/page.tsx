"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HardHat } from "lucide-react";
import Link from "next/link";
import { formatPhone } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

type TechRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  type: string;
  skillsJson: string | null;
  status: string;
  _count: { jobs: number };
};

const columns: ColumnDef<TechRow>[] = [
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/technicians/${row.original.id}`}
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
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.type === "EMPLOYEE" ? "Employee" : "Subcontractor"}
      </span>
    ),
  },
  {
    id: "skills",
    header: "Skills",
    cell: ({ row }) => {
      const skills: string[] = row.original.skillsJson
        ? JSON.parse(row.original.skillsJson)
        : [];
      if (skills.length === 0) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              {s}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{skills.length - 3}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "jobs",
    header: "Jobs",
    cell: ({ row }) => row.original._count.jobs,
  },
];

export default function TechniciansPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ON_LEAVE">(
    "ALL"
  );

  const { data, isLoading } = api.technicians.list.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Technicians" description="Manage your field team">
        <Button asChild>
          <Link href="/technicians/new">Add Technician</Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="No technicians yet"
          description={
            statusFilter !== "ALL"
              ? `No technicians with status "${statusFilter}".`
              : "Add your first technician to start dispatching."
          }
          actionLabel="Add Technician"
          actionHref="/technicians/new"
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data.total} technician{data.total !== 1 ? "s" : ""}
          </p>
          <DataTable
            columns={columns}
            data={data.items as TechRow[]}
            searchKey="name"
            searchPlaceholder="Search technicians..."
            onRowClick={(row) => router.push(`/technicians/${row.id}`)}
          />
        </>
      )}
    </div>
  );
}
