import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Customer" description="Add a new customer">
        <Button variant="outline" asChild>
          <Link href="/customers">Cancel</Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Customer creation form coming in Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
