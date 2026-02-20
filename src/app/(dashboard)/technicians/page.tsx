import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { HardHat } from "lucide-react";
import Link from "next/link";

export default function TechniciansPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Technicians" description="Manage your field team">
        <Button asChild>
          <Link href="/technicians/new">Add Technician</Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={HardHat}
        title="No technicians yet"
        description="Add your first technician to start dispatching."
        actionLabel="Add Technician"
        actionHref="/technicians/new"
      />
    </div>
  );
}
