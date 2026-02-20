import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import Link from "next/link";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage your customer accounts">
        <Button asChild>
          <Link href="/customers/new">Add Customer</Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={Users}
        title="No customers yet"
        description="Add your first customer to get started."
        actionLabel="Add Customer"
        actionHref="/customers/new"
      />
    </div>
  );
}
