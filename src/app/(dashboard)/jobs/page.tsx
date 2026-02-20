import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" description="Manage and track all service jobs">
        <Button asChild>
          <Link href="/jobs/new">New Job</Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={Briefcase}
        title="No jobs yet"
        description="Create your first job to get started."
        actionLabel="New Job"
        actionHref="/jobs/new"
      />
    </div>
  );
}
