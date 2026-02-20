"use client";

import { useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/trpc/client";
import { createQuoteSchema, type CreateQuote } from "@/lib/validations/quote";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";

export default function NewQuotePage() {
  const router = useRouter();
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedSearch = useDebounce(customerSearch, 300);

  const { data: customersData } = api.customers.list.useQuery(
    { search: debouncedSearch || undefined, take: 10, skip: 0 },
    { enabled: debouncedSearch.length > 0 }
  );

  const { data: jobsData } = api.jobs.list.useQuery(
    { take: 50, skip: 0 },
    { enabled: true }
  );

  const createMutation = api.quotes.create.useMutation({
    onSuccess: (quote) => {
      toast.success("Quote created!");
      router.push(`/quotes/${quote.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const form = useForm<CreateQuote>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      customerId: "",
      lineItems: [{ description: "", quantity: 1, unitPriceCents: 0 }],
      taxRateBps: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchLineItems = form.watch("lineItems");
  const watchTaxRateBps = form.watch("taxRateBps");

  const subtotalCents = watchLineItems.reduce(
    (sum, item) => sum + Math.round((item.quantity || 0) * (item.unitPriceCents || 0)),
    0
  );
  const taxCents = Math.round((subtotalCents * (watchTaxRateBps || 0)) / 10000);
  const totalCents = subtotalCents + taxCents;

  const onSubmit = useCallback(
    (data: CreateQuote) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  const selectedCustomerId = form.watch("customerId");

  return (
    <div className="space-y-6">
      <PageHeader title="New Quote" description="Create a quote for a customer">
        <Button variant="outline" asChild>
          <Link href="/quotes">Cancel</Link>
        </Button>
      </PageHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer + Job */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Customer */}
              <div className="space-y-2">
                <Label htmlFor="customerSearch">
                  Customer <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="customerSearch"
                  placeholder="Search by name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                {customersData && customersData.items.length > 0 && (
                  <div className="rounded-md border bg-popover shadow-md">
                    {customersData.items.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          form.setValue("customerId", c.id);
                          setCustomerSearch(`${c.firstName} ${c.lastName}`);
                        }}
                      >
                        {c.firstName} {c.lastName}
                      </button>
                    ))}
                  </div>
                )}
                {selectedCustomerId && (
                  <p className="text-xs text-muted-foreground">ID: {selectedCustomerId}</p>
                )}
                {form.formState.errors.customerId && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.customerId.message}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Quote Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. HVAC Repair & Tune-up"
                  {...form.register("title")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Linked Job */}
              <div className="space-y-2">
                <Label htmlFor="jobId">Link to Job (optional)</Label>
                <Select
                  value={form.watch("jobId") ?? "none"}
                  onValueChange={(v) => form.setValue("jobId", v === "none" ? undefined : v)}
                >
                  <SelectTrigger id="jobId">
                    <SelectValue placeholder="Select job..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {jobsData?.items.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.jobNumber} — {j.title ?? j.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valid Until */}
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input id="validUntil" type="date" {...form.register("validUntil")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitPriceCents: 0 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Header */}
            <div className="hidden grid-cols-[1fr_100px_130px_44px] gap-3 text-xs font-medium text-muted-foreground sm:grid">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit Price</span>
              <span />
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_130px_44px] sm:gap-3 sm:items-start">
                <div>
                  <Input
                    placeholder="Service or part description"
                    {...form.register(`lineItems.${index}.description`)}
                  />
                  {form.formState.errors.lineItems?.[index]?.description && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.lineItems[index]?.description?.message}
                    </p>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1"
                  {...form.register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-7"
                    onChange={(e) => {
                      const dollars = parseFloat(e.target.value) || 0;
                      form.setValue(
                        `lineItems.${index}.unitPriceCents`,
                        Math.round(dollars * 100)
                      );
                    }}
                    defaultValue=""
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {form.formState.errors.lineItems?.root && (
              <p className="text-xs text-destructive">
                {form.formState.errors.lineItems.root.message}
              </p>
            )}
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col items-end gap-1 pt-4">
            {/* Tax Rate */}
            <div className="mb-2 flex w-full max-w-xs items-center justify-end gap-3">
              <Label htmlFor="taxRate" className="whitespace-nowrap text-sm">
                Tax Rate (%)
              </Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="w-24 text-right"
                defaultValue="0"
                onChange={(e) => {
                  const pct = parseFloat(e.target.value) || 0;
                  form.setValue("taxRateBps", Math.round(pct * 100));
                }}
              />
            </div>
            <div className="flex w-full max-w-xs justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotalCents)}</span>
            </div>
            {taxCents > 0 && (
              <div className="flex w-full max-w-xs justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax ({((watchTaxRateBps || 0) / 100).toFixed(2)}%)
                </span>
                <span>{formatCurrency(taxCents)}</span>
              </div>
            )}
            <Separator className="my-1 max-w-xs" />
            <div className="flex w-full max-w-xs justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totalCents)}</span>
            </div>
          </CardFooter>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any notes or terms for this quote..."
              rows={3}
              {...form.register("notes")}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" asChild>
            <Link href="/quotes">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
