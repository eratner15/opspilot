"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
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
  Zap,
  TrendingUp,
  TrendingDown,
  Bell,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ─── Demo sparkline data ───────────────────────────────────────────────────────

const revenueSparkline = [4200, 3800, 5100, 4600, 6200, 5800, 7100].map((v, i) => ({ i, v }));
const jobsSparkline = [3, 5, 4, 7, 6, 8, 9].map((v, i) => ({ i, v }));
const activeSparkline = [1, 2, 1, 3, 2, 4, 3].map((v, i) => ({ i, v }));
const callsSparkline = [2, 4, 3, 5, 6, 4, 7].map((v, i) => ({ i, v }));

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  sub,
  icon: Icon,
  valueClass,
  trend,
  sparkData,
  sparkColor,
  bgClass,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  valueClass?: string;
  trend?: { pct: number; label: string };
  sparkData: { i: number; v: number }[];
  sparkColor: string;
  bgClass: string;
}) {
  const isUp = trend && trend.pct >= 0;
  return (
    <Card className={`overflow-hidden border-0 shadow-sm ${bgClass}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-foreground/70">{title}</CardTitle>
        <Icon className="h-4 w-4 text-foreground/40" />
      </CardHeader>
      <CardContent className="px-4 pb-0">
        <div className={`text-2xl font-bold ${valueClass ?? ""}`}>{value}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">{sub}</p>
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? "+" : ""}
              {trend.pct}% {trend.label}
            </span>
          )}
        </div>
        {/* Sparkline */}
        <div className="mt-2 -mx-4 -mb-0">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${sparkColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                fill={`url(#spark-${sparkColor})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Revenue Chart ─────────────────────────────────────────────────────────────

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

// ─── AI Action Feed ────────────────────────────────────────────────────────────

type ActivityEntry = {
  id: string;
  action: string;
  createdAt: string;
};

function aiFeedLabel(action: string): { emoji: string; label: string; color: string } {
  if (action.includes("call")) return { emoji: "📞", label: action.replace(/\./g, " → "), color: "text-blue-600" };
  if (action.includes("job")) return { emoji: "🛠️", label: action.replace(/\./g, " → "), color: "text-green-600" };
  if (action.includes("invoice") || action.includes("payment")) return { emoji: "💳", label: action.replace(/\./g, " → "), color: "text-yellow-600" };
  if (action.includes("quote")) return { emoji: "📋", label: action.replace(/\./g, " → "), color: "text-purple-600" };
  return { emoji: "⚡", label: action.replace(/\./g, " → "), color: "text-zinc-600" };
}

function AIActionFeed({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start by adding customers and creating jobs.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3 max-h-[220px] overflow-y-auto">
      {entries.map((entry) => {
        const { emoji, label, color } = aiFeedLabel(entry.action);
        return (
          <div key={entry.id} className="flex gap-3 items-start">
            <span className="text-base shrink-0 mt-0.5">{emoji}</span>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${color}`}>{label}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Revenue Opportunity Widget ────────────────────────────────────────────────

function RevenueOpportunity({ outstandingCents, overdueCount }: { outstandingCents: number; overdueCount: number }) {
  if (outstandingCents === 0) return null;
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="py-4 px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Revenue Opportunity</p>
              <p className="text-sm text-amber-700">
                {formatCurrency(outstandingCents)} uncollected
                {overdueCount > 0 && ` · ${overdueCount} overdue invoice${overdueCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white ml-8 sm:ml-0" asChild>
            <Link href="/invoices">Send Reminders</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Onboarding Banner ─────────────────────────────────────────────────────────

function OnboardingBanner() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("opspilot_onboarded");
    if (!onboarded) setShowBanner(true);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Complete your setup</p>
            <p className="text-sm text-blue-700">
              Run the quick setup wizard to configure your business and add your first technician.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-8 sm:ml-0">
          <Button
            size="sm"
            onClick={() => router.push("/onboarding")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Setup
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-blue-600"
            onClick={() => {
              localStorage.setItem("opspilot_onboarded", "true");
              setShowBanner(false);
            }}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────

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

      <OnboardingBanner />

      {/* Revenue Opportunity */}
      {kpis && kpis.outstandingCents > 0 && (
        <RevenueOpportunity
          outstandingCents={kpis.outstandingCents}
          overdueCount={kpis.overdueCount}
        />
      )}

      {/* KPI Cards */}
      {kpisLoading ? (
        <LoadingSkeleton variant="kpi" />
      ) : kpis ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Monthly Revenue"
            value={formatCurrency(kpis.monthlyRevenueCents)}
            sub={monthName}
            icon={DollarSign}
            trend={{ pct: 12, label: "vs last mo" }}
            sparkData={revenueSparkline}
            sparkColor="#3b82f6"
            bgClass="bg-blue-50/60"
          />
          <KPICard
            title="Jobs Completed"
            value={String(kpis.completedThisMonth)}
            sub="This month"
            icon={Briefcase}
            trend={{ pct: 8, label: "vs last mo" }}
            sparkData={jobsSparkline}
            sparkColor="#22c55e"
            bgClass="bg-green-50/60"
          />
          <KPICard
            title="Active Jobs"
            value={String(kpis.activeJobs)}
            sub="Scheduled / En Route / In Progress"
            icon={Clock}
            valueClass={kpis.activeJobs > 0 ? "text-blue-600" : undefined}
            sparkData={activeSparkline}
            sparkColor="#f59e0b"
            bgClass="bg-amber-50/60"
          />
          <KPICard
            title="AI Calls Today"
            value={String(kpis.todayCalls)}
            sub="Handled by AI voice agent"
            icon={Phone}
            trend={{ pct: 5, label: "vs yesterday" }}
            sparkData={callsSparkline}
            sparkColor="#6366f1"
            bgClass="bg-indigo-50/60"
          />
        </div>
      ) : null}

      {/* Second row KPIs */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Customers"
            value={String(kpis.totalCustomers)}
            sub="All time"
            icon={Users}
            sparkData={[{ i: 0, v: 1 }, { i: 1, v: 2 }, { i: 2, v: 2 }, { i: 3, v: 3 }, { i: 4, v: 3 }, { i: 5, v: 4 }, { i: 6, v: kpis.totalCustomers || 1 }]}
            sparkColor="#8b5cf6"
            bgClass="bg-purple-50/60"
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
            sparkData={[{ i: 0, v: 3 }, { i: 1, v: 2 }, { i: 2, v: 4 }, { i: 3, v: 3 }, { i: 4, v: 5 }, { i: 5, v: 4 }, { i: 6, v: 3 }]}
            sparkColor="#ef4444"
            bgClass="bg-red-50/40"
          />
        </div>
      )}

      {/* Charts */}
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

        {/* AI Action Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">AI Activity Feed</CardTitle>
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : (
              <AIActionFeed entries={kpis?.recentActivity ?? []} />
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
