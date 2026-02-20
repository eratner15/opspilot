import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewTechnicianPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Technician" description="Add a technician to your team">
        <Button variant="outline" asChild>
          <Link href="/technicians">Cancel</Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Technician Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Technician creation form coming in Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
