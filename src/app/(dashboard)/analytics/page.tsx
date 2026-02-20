"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Phone,
  Users,
  Receipt,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type DateRangeOption = "7d" | "30d" | "90d";

function getDateRange(option: DateRangeOption): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString();
  const days = option === "7d" ? 7 : option === "30d" ? 30 : 90;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  return { startDate: start, endDate: end };
}

const DATE_LABEL: Record<DateRangeOption, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangeOption>("30d");
  const { startDate, endDate } = getDateRange(dateRange);

  const { data: revenue, isLoading: revLoading } = api.analytics.getRevenueByPeriod.useQuery({
    startDate,
    endDate,
    groupBy: dateRange === "90d" ? "week" : "day",
  });

  const { data: byCategory, isLoading: catLoading } = api.analytics.getJobsByCategory.useQuery({
    startDate,
    endDate,
  });

  const { data: techPerf, isLoading: techLoading } = api.analytics.getTechPerformance.useQuery({
    startDate,
    endDate,
  });

  const { data: callMetrics, isLoading: callLoading } = api.analytics.getCallMetrics.useQuery({
    startDate,
    endDate,
  });

  const { data: outstanding, isLoading: outLoading } = api.analytics.getOutstandingInvoices.useQuery();

  const { data: customerMetrics } = api.analytics.getCustomerMetrics.useQuery();

  const totalRevenue = revenue?.reduce((sum, d) => sum + d.revenueCents, 0) ?? 0;
  const chartData = revenue?.map((d) => ({
    date: d.period,
    revenue: d.revenueCents / 100,
  })) ?? [];

  const catChartData = (byCategory ?? []).slice(0, 8).map((c) => ({
    name: c.category.replace(/_/g, " "),
    jobs: c.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Business performance and insights">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeOption)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue ({DATE_LABEL[dateRange]})</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Call Conversion</p>
                <p className="mt-1 text-2xl font-bold">
                  {callLoading ? "—" : `${callMetrics?.conversionRate ?? 0}%`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {callMetrics?.withJob ?? 0} / {callMetrics?.total ?? 0} calls → jobs
                </p>
              </div>
              <Phone className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customers</p>
                <p className="mt-1 text-2xl font-bold">{customerMetrics?.total ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  +{customerMetrics?.newThisMonth ?? 0} this month
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="mt-1 text-2xl font-bold">
                  {outLoading
                    ? "—"
                    : formatCurrency(
                        (outstanding ?? []).reduce((s, i) => s + i.balanceCents, 0)
                      )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(outstanding ?? []).filter((i) => i.isOverdue).length} overdue
                </p>
              </div>
              <Receipt className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue — {DATE_LABEL[dateRange]}</CardTitle>
        </CardHeader>
        <CardContent>
          {revLoading ? (
            <div className="h-56 animate-pulse rounded-md bg-muted" />
          ) : chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No revenue data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)} // MM-DD or MM
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                  labelFormatter={(l: string) => formatDate(l)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs by category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Jobs by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {catLoading ? (
              <div className="h-44 animate-pulse rounded-md bg-muted" />
            ) : catChartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No job data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={catChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Outstanding invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Outstanding Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outLoading ? (
              <LoadingSkeleton variant="table" />
            ) : !outstanding || outstanding.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No outstanding invoices.</p>
            ) : (
              <div className="space-y-2">
                {outstanding.slice(0, 6).map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium">{inv.customerName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", inv.isOverdue ? "text-red-600" : "text-amber-600")}>
                        {formatCurrency(inv.balanceCents)}
                      </p>
                      {inv.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(inv.dueDate)}
                        </p>
                      )}
                    </div>
                    {inv.isOverdue && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Overdue
                      </Badge>
                    )}
                  </Link>
                ))}
                {outstanding.length > 6 && (
                  <p className="pt-2 text-center text-xs text-muted-foreground">
                    +{outstanding.length - 6} more outstanding
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tech performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technician Performance — {DATE_LABEL[dateRange]}</CardTitle>
        </CardHeader>
        <CardContent>
          {techLoading ? (
            <LoadingSkeleton variant="table" />
          ) : !techPerf || techPerf.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No technician data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs font-medium uppercase text-muted-foreground">
                    <th className="pb-2 text-left">Technician</th>
                    <th className="pb-2 text-right">Assigned</th>
                    <th className="pb-2 text-right">Completed</th>
                    <th className="pb-2 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {techPerf.map((t) => (
                    <tr key={t.technicianId}>
                      <td className="py-3 font-medium">
                        <Link href={`/technicians/${t.technicianId}`} className="hover:underline">
                          {t.name}
                        </Link>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{t.assignedJobs}</td>
                      <td className="py-3 text-right text-muted-foreground">{t.completedJobs}</td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            t.completionRate >= 80
                              ? "text-green-600"
                              : t.completionRate >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                          )}
                        >
                          {t.completionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call metrics */}
      {!callLoading && callMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" />
              AI Call Metrics — {DATE_LABEL[dateRange]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Total calls</p>
                <p className="mt-0.5 text-xl font-bold">{callMetrics.total}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created jobs</p>
                <p className="mt-0.5 text-xl font-bold text-green-600">{callMetrics.withJob}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Conversion rate</p>
                <p className="mt-0.5 text-xl font-bold">{callMetrics.conversionRate}%</p>
              </div>
              {Object.entries(callMetrics.statusCounts).map(([status, count]) => (
                <div key={status}>
                  <p className="text-muted-foreground">{status}</p>
                  <p className="mt-0.5 text-xl font-bold">{count as number}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href="/calls">View All Calls →</Link>
        </Button>
      </div>
    </div>
  );
}
