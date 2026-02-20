import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quotes" description="Create and manage quotes for customers">
        <Button asChild>
          <Link href="/quotes/new">New Quote</Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={FileText}
        title="No quotes yet"
        description="Create your first quote to send to a customer."
        actionLabel="New Quote"
        actionHref="/quotes/new"
      />
    </div>
  );
}
