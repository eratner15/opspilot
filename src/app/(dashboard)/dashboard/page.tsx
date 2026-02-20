"use client";

import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  Briefcase,
  Users,
  Phone,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function KPICard({
  title,
  value,
  sub,
  icon: Icon,
  valueClass,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass ?? ""}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function RevenueChart({ data }: { data: { date: string; revenueCents: number }[] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: d.revenueCents / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          width={45}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = api.analytics.getDashboardKPIs.useQuery();
  const { data: revenueChart, isLoading: chartLoading } =
    api.analytics.getRevenueChart.useQuery();

  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="OpsPilot — Your AI-powered operations center"
      >
        <Button asChild>
          <Link href="/jobs/new">New Job</Link>
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      {kpisLoading ? (
        <LoadingSkeleton variant="kpi" />
      ) : kpis ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Monthly Revenue"
              value={formatCurrency(kpis.monthlyRevenueCents)}
              sub={monthName}
              icon={DollarSign}
            />
            <KPICard
              title="Jobs Completed"
              value={String(kpis.completedThisMonth)}
              sub="This month"
              icon={Briefcase}
            />
            <KPICard
              title="Active Jobs"
              value={String(kpis.activeJobs)}
              sub="Scheduled / En Route / In Progress"
              icon={Clock}
              valueClass={kpis.activeJobs > 0 ? "text-blue-600" : undefined}
            />
            <KPICard
              title="AI Calls Today"
              value={String(kpis.todayCalls)}
              sub="Handled by AI voice agent"
              icon={Phone}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Customers"
              value={String(kpis.totalCustomers)}
              sub="All time"
              icon={Users}
            />
            <KPICard
              title="Outstanding"
              value={formatCurrency(kpis.outstandingCents)}
              sub={
                kpis.overdueCount > 0
                  ? `${kpis.overdueCount} overdue invoice${kpis.overdueCount !== 1 ? "s" : ""}`
                  : "Awaiting payment"
              }
              icon={AlertCircle}
              valueClass={kpis.overdueCount > 0 ? "text-red-600" : "text-orange-600"}
            />
          </div>
        </>
      ) : null}

      {/* Revenue Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Loading chart...
              </div>
            ) : revenueChart ? (
              <RevenueChart data={revenueChart} />
            ) : null}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : !kpis || kpis.recentActivity.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start by adding customers and creating jobs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {kpis.recentActivity.map((entry) => (
                  <div key={entry.id} className="flex gap-3 items-start">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.action.replace(/\./g, " → ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/jobs/new">New Job</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/customers/new">Add Customer</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/technicians/new">Add Technician</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/jobs">View All Jobs</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
