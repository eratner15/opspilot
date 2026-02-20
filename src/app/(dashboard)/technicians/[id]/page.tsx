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
} from "lucide-react";
import Link from "next/link";
import { formatPhone, formatDate, formatDateTime } from "@/lib/utils";
import { JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useState } from "react";

export default function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const { data: tech, isLoading } = api.technicians.getById.useQuery({ id });

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

  const completedJobs = tech.jobs.filter((j) => j.status === "COMPLETED").length;
  const activeJobs = tech.jobs.filter(
    (j) =>
      j.status === "SCHEDULED" || j.status === "EN_ROUTE" || j.status === "IN_PROGRESS"
  ).length;

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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
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
              <Briefcase className="h-4 w-4" />
              Completed
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">{completedJobs}</div>
          </CardContent>
        </Card>
      </div>

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
