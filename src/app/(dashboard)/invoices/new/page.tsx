import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Invoice" description="Create an invoice for a customer">
        <Button variant="outline" asChild>
          <Link href="/invoices">Cancel</Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Invoice creation coming in Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
