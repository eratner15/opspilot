import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewJobPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Job" description="Create a new service job">
        <Button variant="outline" asChild>
          <Link href="/jobs">Cancel</Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Job creation form coming in Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
