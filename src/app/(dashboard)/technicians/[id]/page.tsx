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
  Phone,
  Mail,
  Wrench,
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Award,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { formatPhone, formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const { data: tech, isLoading } = api.technicians.getById.useQuery({ id });
  const { data: teamPerf } = api.analytics.getTechPerformance.useQuery();
  const { data: revenueHistory } = api.analytics.getTechRevenue.useQuery({ technicianId: id, months: 6 });

  const deleteMutation = api.technicians.update.useMutation({
    onSuccess: () => {
      toast.success("Technician deactivated");
      router.push("/technicians");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton variant="card" />;
  if (!tech)
    return <div className="p-8 text-center text-muted-foreground">Technician not found.</div>;

  const skills: string[] = tech.skillsJson ? JSON.parse(tech.skillsJson) : [];

  const completedJobs = tech.jobs.filter((j) => j.status === "COMPLETED" || j.status === "INVOICED" || j.status === "PAID").length;
  const activeJobs = tech.jobs.filter(
    (j) =>
      j.status === "SCHEDULED" || j.status === "EN_ROUTE" || j.status === "IN_PROGRESS"
  ).length;
  const completionRate = tech.jobs.length > 0 ? Math.round((completedJobs / tech.jobs.length) * 100) : 0;
  const revenueFromJobs = tech.jobs.reduce((sum, j) => sum + (j.totalCents ?? 0), 0);

  // Jobs by status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const job of tech.jobs) {
    statusBreakdown[job.status] = (statusBreakdown[job.status] ?? 0) + 1;
  }

  // Avg completion time (createdAt → completedAt)
  const completedWithTime = tech.jobs.filter(
    (j) => (j.status === "COMPLETED" || j.status === "INVOICED" || j.status === "PAID") && j.completedAt
  );
  const avgCompletionDays =
    completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce((sum, j) => {
            const created = new Date(j.createdAt).getTime();
            const completed = new Date(j.completedAt!).getTime();
            return sum + (completed - created) / (1000 * 60 * 60 * 24);
          }, 0) / completedWithTime.length
        )
      : null;

  // Team rank
  const sortedTeam = teamPerf ? [...teamPerf].sort((a, b) => b.completedJobs - a.completedJobs) : [];
  const myRank = sortedTeam.findIndex((t) => t.technicianId === id) + 1;

  // Sparkline data: format month labels
  const sparklineData = revenueHistory?.map((r) => ({
    month: new Date(r.month + "-01").toLocaleDateString("en-US", { month: "short" }),
    revenue: r.revenueCents / 100,
    jobs: r.jobCount,
  })) ?? [];

  // Team comparison: highlight this tech
  const teamComparisonData = sortedTeam.map((t) => ({
    name: t.name.split(" ")[0], // first name only for chart
    completionRate: t.completionRate,
    jobs: t.completedJobs,
    isMe: t.technicianId === id,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${tech.firstName} ${tech.lastName}`}
        description={`${tech.type === "EMPLOYEE" ? "Employee" : "Subcontractor"} · ${tech.jobs.length} total jobs`}
      >
        <Button variant="outline" asChild>
          <Link href="/technicians">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Briefcase className="h-4 w-4" />
              Total Jobs
            </div>
            <div className="text-2xl font-bold mt-1">{tech.jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Briefcase className="h-4 w-4" />
              Active Jobs
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{activeJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Completion Rate
            </div>
            <div className={cn("text-2xl font-bold mt-1", completionRate >= 80 ? "text-green-600" : completionRate >= 50 ? "text-amber-600" : "text-red-600")}>
              {completionRate}%
            </div>
            <div className="text-xs text-muted-foreground">{completedJobs} of {tech.jobs.length} completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Award className="h-4 w-4" />
              Team Rank
            </div>
            <div className="text-2xl font-bold mt-1">
              {myRank > 0 ? `#${myRank}` : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              of {sortedTeam.length} technicians
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue sparkline + performance metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue Sparkline */}
        {sparklineData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Revenue — Last 6 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="techRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#techRevGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Total revenue: {formatCurrency(revenueFromJobs)}</span>
                {avgCompletionDays !== null && (
                  <span>Avg completion: {avgCompletionDays}d</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jobs by Status */}
        {Object.keys(statusBreakdown).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                Jobs by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-1">
                {Object.entries(statusBreakdown).map(([status, count]) => {
                  const pct = tech.jobs.length > 0 ? Math.round((count / tech.jobs.length) * 100) : 0;
                  const barColor =
                    status === "COMPLETED" || status === "INVOICED" || status === "PAID"
                      ? "bg-green-500"
                      : status === "IN_PROGRESS" || status === "EN_ROUTE" || status === "SCHEDULED"
                      ? "bg-blue-500"
                      : status === "CANCELLED"
                      ? "bg-red-400"
                      : "bg-amber-400";
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground">{JOB_STATUS_LABELS[status] ?? status}</span>
                        <span className="font-medium">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Team Comparison */}
      {teamComparisonData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              Team Comparison — Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamComparisonData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Completion Rate"]}
                  />
                  <Bar
                    dataKey="completionRate"
                    radius={[3, 3, 0, 0]}
                    fill="#94a3b8"
                    // highlight current tech
                    label={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {sortedTeam.map((t, i) => (
                <div
                  key={t.technicianId}
                  className={cn(
                    "rounded-lg border p-2 text-xs",
                    t.technicianId === id && "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  )}
                >
                  <div className="font-medium truncate">{t.name}</div>
                  <div className="text-muted-foreground mt-0.5">
                    #{i + 1} · {t.completedJobs} jobs · {t.completionRate}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={tech.status} />
              </div>
              <Separator />
              <div className="flex items-start gap-2 text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{formatPhone(tech.phone)}</span>
              </div>
              {tech.email && (
                <div className="flex items-start gap-2 text-sm">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="break-all">{tech.email}</span>
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground">
                Added {formatDate(tech.createdAt)}
              </div>
            </CardContent>
          </Card>

          {skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {tech.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tech.notes}</p>
              </CardContent>
            </Card>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => setShowDelete(true)}
          >
            Deactivate Technician
          </Button>
        </div>

        {/* Right: Jobs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Jobs ({tech.jobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {tech.jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No jobs assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {tech.jobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.jobNumber} · {JOB_PRIORITY_LABELS[job.priority] ?? job.priority}
                            {job.customer &&
                              ` · ${job.customer.firstName} ${job.customer.lastName}`}
                          </p>
                          {job.scheduledAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDateTime(job.scheduledAt)}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Deactivate Technician"
        description={`Are you sure you want to deactivate ${tech.firstName} ${tech.lastName}? They will no longer receive new job assignments.`}
        onConfirm={() => deleteMutation.mutate({ id, data: { status: "INACTIVE" } })}
        destructive
        confirmLabel={deleteMutation.isPending ? "Deactivating..." : "Deactivate"}
      />
    </div>
  );
}
