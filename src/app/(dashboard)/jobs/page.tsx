"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, LayoutGrid, List, Calendar } from "lucide-react";
import Link from "next/link";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

type JobStatus =
  | "NEW" | "SCHEDULED" | "EN_ROUTE" | "IN_PROGRESS"
  | "COMPLETED" | "INVOICED" | "PAID" | "CANCELLED" | "ON_HOLD";
type JobPriority = "LOW" | "NORMAL" | "HIGH" | "EMERGENCY";

type JobRow = {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  scheduledAt: string | null;
  totalCents: number;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string } | null;
  technician: { id: string; firstName: string; lastName: string } | null;
};

const PRIORITY_COLORS: Record<string, string> = {
  EMERGENCY: "bg-red-50 border-red-200",
  HIGH: "bg-orange-50 border-orange-200",
  NORMAL: "bg-white border-gray-200",
  LOW: "bg-gray-50 border-gray-100",
};

const KANBAN_COLUMNS = [
  { status: "NEW", label: "New" },
  { status: "SCHEDULED", label: "Scheduled" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "COMPLETED", label: "Completed" },
];

function KanbanView({ jobs }: { jobs: JobRow[] }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KANBAN_COLUMNS.map((col) => {
        const colJobs = jobs.filter((j) => j.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2 px-1">
              <h3 className="font-semibold text-sm">{col.label}</h3>
              <Badge variant="secondary" className="text-xs">
                {colJobs.length}
              </Badge>
            </div>
            <div className="space-y-2 min-h-[100px]">
              {colJobs.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No jobs
                </div>
              ) : (
                colJobs.map((job) => (
                  <Card
                    key={job.id}
                    className={cn(
                      "cursor-pointer transition-shadow hover:shadow-md border",
                      PRIORITY_COLORS[job.priority] ?? "bg-white border-gray-200"
                    )}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm leading-tight line-clamp-2">{job.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{job.jobNumber}</p>
                      {job.customer && (
                        <p className="text-xs text-muted-foreground">
                          {job.customer.firstName} {job.customer.lastName}
                        </p>
                      )}
                      {job.scheduledAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(job.scheduledAt)}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {JOB_PRIORITY_LABELS[job.priority] ?? job.priority}
                        </Badge>
                        {job.technician && (
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                            {job.technician.firstName}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const listColumns: ColumnDef<JobRow>[] = [
  {
    accessorKey: "jobNumber",
    header: "Job #",
    cell: ({ row }) => (
      <Link
        href={`/jobs/${row.original.id}`}
        className="font-mono text-sm font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.jobNumber}
      </Link>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium text-sm line-clamp-1">{row.original.title}</span>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) =>
      row.original.customer ? (
        <Link
          href={`/customers/${row.original.customer.id}`}
          className="hover:underline text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.customer.firstName} {row.original.customer.lastName}
        </Link>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    id: "technician",
    header: "Tech",
    cell: ({ row }) =>
      row.original.technician ? (
        <span className="text-sm">
          {row.original.technician.firstName} {row.original.technician.lastName}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">Unassigned</span>
      ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <Badge
        variant={row.original.priority === "EMERGENCY" ? "destructive" : "outline"}
        className="text-xs"
      >
        {JOB_PRIORITY_LABELS[row.original.priority] ?? row.original.priority}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "scheduled",
    header: "Scheduled",
    cell: ({ row }) =>
      row.original.scheduledAt ? (
        <span className="text-sm">{formatDate(row.original.scheduledAt)}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
];

export default function JobsPage() {
  const router = useRouter();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [statusFilter, setStatusFilter] = useState<"ALL" | JobStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | JobPriority>("ALL");

  const { data, isLoading } = api.jobs.list.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    priority: priorityFilter === "ALL" ? undefined : priorityFilter,
    take: 200,
  });

  const jobs = (data?.items ?? []) as JobRow[];

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" description="Manage and track all service jobs">
        <Button variant="outline" asChild>
          <Link href="/jobs/calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </Link>
        </Button>
        <Button asChild>
          <Link href="/jobs/new">New Job</Link>
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "ALL" | JobStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="EN_ROUTE">En Route</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="INVOICED">Invoiced</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as "ALL" | JobPriority)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="EMERGENCY">Emergency</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="mr-1.5 h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={
            statusFilter !== "ALL" || priorityFilter !== "ALL"
              ? "Try adjusting your filters."
              : "Create your first job to get started."
          }
          actionLabel="New Job"
          actionHref="/jobs/new"
        />
      ) : view === "kanban" ? (
        <KanbanView jobs={jobs} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} job{(data?.total ?? 0) !== 1 ? "s" : ""}
          </p>
          <DataTable
            columns={listColumns}
            data={jobs}
            searchKey="title"
            searchPlaceholder="Search jobs..."
            onRowClick={(row) => router.push(`/jobs/${row.id}`)}
          />
        </>
      )}
    </div>
  );
}
