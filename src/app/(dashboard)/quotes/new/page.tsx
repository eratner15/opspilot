import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewQuotePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Quote" description="Create a quote for a customer">
        <Button variant="outline" asChild>
          <Link href="/quotes">Cancel</Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Quote Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Quote builder coming in Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
