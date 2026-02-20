import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Phone } from "lucide-react";

export default function CallsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calls" description="AI-handled call log and recordings" />
      <EmptyState
        icon={Phone}
        title="No calls yet"
        description="Calls will appear here once your AI phone system is configured."
      />
    </div>
  );
}
