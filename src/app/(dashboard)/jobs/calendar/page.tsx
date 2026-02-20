import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function JobCalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Job Calendar" description="Weekly schedule by technician" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Calendar view coming in Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
