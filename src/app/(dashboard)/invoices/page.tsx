import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";
import Link from "next/link";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage billing and payments">
        <Button asChild>
          <Link href="/invoices/new">New Invoice</Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={Receipt}
        title="No invoices yet"
        description="Create your first invoice to start collecting payments."
        actionLabel="New Invoice"
        actionHref="/invoices/new"
      />
    </div>
  );
}
