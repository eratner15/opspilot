"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { JOB_PRIORITY_LABELS } from "@/lib/constants";

function getWeekDates(referenceDate: Date): Date[] {
  const day = referenceDate.getDay(); // 0=Sunday
  const start = new Date(referenceDate);
  start.setDate(referenceDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRIORITY_BG: Record<string, string> = {
  EMERGENCY: "bg-red-100 border-red-300 text-red-900",
  HIGH: "bg-orange-100 border-orange-300 text-orange-900",
  NORMAL: "bg-blue-100 border-blue-300 text-blue-900",
  LOW: "bg-gray-100 border-gray-200 text-gray-700",
};

export default function JobCalendarPage() {
  const [weekRef, setWeekRef] = useState(new Date());
  const weekDates = getWeekDates(weekRef);
  const dateFrom = weekDates[0].toISOString();
  const dateTo = weekDates[6].toISOString();

  const { data, isLoading } = api.jobs.list.useQuery({
    take: 200,
    dateFrom,
    dateTo,
  });

  const jobs = data?.items ?? [];

  const getJobsForDate = (date: Date) => {
    return jobs.filter((job) => {
      if (!job.scheduledAt) return false;
      const jobDate = new Date(job.scheduledAt);
      return (
        jobDate.getFullYear() === date.getFullYear() &&
        jobDate.getMonth() === date.getMonth() &&
        jobDate.getDate() === date.getDate()
      );
    });
  };

  const prevWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };

  const nextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };

  const today = new Date();

  const weekLabel = `${weekDates[0].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${weekDates[6].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Job Calendar" description="Weekly schedule view">
        <Button variant="outline" asChild>
          <Link href="/jobs">
            <List className="mr-2 h-4 w-4" />
            List View
          </Link>
        </Button>
        <Button asChild>
          <Link href="/jobs/new">New Job</Link>
        </Button>
      </PageHeader>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{weekLabel}</span>
        </div>
        <Button variant="outline" size="icon" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekRef(new Date())}
          className="text-muted-foreground"
        >
          Today
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : (
        <div className="grid grid-cols-7 gap-2 min-h-[500px]">
          {weekDates.map((date, i) => {
            const dayJobs = getJobsForDate(date);
            const isToday =
              date.getFullYear() === today.getFullYear() &&
              date.getMonth() === today.getMonth() &&
              date.getDate() === today.getDate();

            return (
              <div key={i} className="flex flex-col gap-1">
                <div
                  className={cn(
                    "text-center py-1 rounded-lg text-sm font-medium",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <div className="text-xs">{DAY_LABELS[i]}</div>
                  <div>{date.getDate()}</div>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  {dayJobs.length === 0 ? (
                    <div className="flex-1 rounded-lg border border-dashed min-h-[80px]" />
                  ) : (
                    dayJobs.map((job) => (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <Card
                          className={cn(
                            "border cursor-pointer hover:shadow-md transition-shadow",
                            PRIORITY_BG[job.priority] ?? "bg-white border-gray-200"
                          )}
                        >
                          <CardContent className="p-2">
                            <p className="text-xs font-medium line-clamp-2">{job.title}</p>
                            {job.technician && (
                              <p className="text-xs opacity-70 mt-0.5">
                                {job.technician.firstName}
                              </p>
                            )}
                            <StatusBadge status={job.status} className="mt-1 text-[10px] px-1 py-0" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Priority:</span>
        {Object.entries(PRIORITY_BG).map(([priority, cls]) => (
          <span key={priority} className={cn("px-2 py-0.5 rounded border", cls)}>
            {JOB_PRIORITY_LABELS[priority] ?? priority}
          </span>
        ))}
      </div>
    </div>
  );
}
