"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { createJobSchema, type CreateJob, type LineItem } from "@/lib/validations/job";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId") ?? undefined;

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const form = useForm<CreateJob>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      customerId: preselectedCustomerId ?? "",
      technicianId: "",
      title: "",
      description: "",
      category: undefined,
      priority: "NORMAL",
      status: "NEW",
      scheduledAt: "",
      scheduledWindow: undefined,
      notes: "",
      lineItemsJson: "[]",
      totalCents: 0,
    },
  });

  const { data: customers } = api.customers.list.useQuery({ take: 100 });
  const { data: technicians } = api.technicians.list.useQuery({ status: "ACTIVE", take: 50 });

  const createMutation = api.jobs.create.useMutation({
    onSuccess: (job) => {
      toast.success("Job created successfully");
      router.push(`/jobs/${job.id}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPriceCents: 0 }]);
  };

  const removeLineItem = (idx: number) => {
    const updated = lineItems.filter((_, i) => i !== idx);
    setLineItems(updated);
    updateTotal(updated);
  };

  const updateLineItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = lineItems.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setLineItems(updated);
    updateTotal(updated);
  };

  const updateTotal = (items: LineItem[]) => {
    const total = items.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
      0
    );
    form.setValue("totalCents", total);
    form.setValue("lineItemsJson", JSON.stringify(items));
  };

  const totalCents = lineItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
    0
  );

  const onSubmit = (data: CreateJob) => {
    createMutation.mutate({
      ...data,
      customerId: data.customerId || undefined,
      technicianId: data.technicianId || undefined,
      scheduledAt: data.scheduledAt || undefined,
      lineItemsJson: JSON.stringify(lineItems),
      totalCents,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Job" description="Create a new service job">
        <Button variant="outline" asChild>
          <Link href="/jobs">Cancel</Link>
        </Button>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="AC unit not cooling — 2nd floor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HVAC">HVAC</SelectItem>
                          <SelectItem value="PLUMBING">Plumbing</SelectItem>
                          <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                          <SelectItem value="ROOFING">Roofing</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="EMERGENCY">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue or work required..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers?.items.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.firstName} {c.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="technicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technician</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select technician" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {technicians?.items.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.firstName} {t.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledWindow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Window</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select window" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MORNING">Morning (8am–12pm)</SelectItem>
                          <SelectItem value="AFTERNOON">Afternoon (12pm–5pm)</SelectItem>
                          <SelectItem value="EVENING">Evening (5pm–8pm)</SelectItem>
                          <SelectItem value="ALL_DAY">All Day</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No line items yet. Add items to calculate the job total.
                </p>
              ) : (
                <>
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-6">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(idx, "quantity", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Price ($)"
                          min="0"
                          step="0.01"
                          value={item.unitPriceCents / 100}
                          onChange={(e) =>
                            updateLineItem(
                              idx,
                              "unitPriceCents",
                              Math.round((parseFloat(e.target.value) || 0) * 100)
                            )
                          }
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removeLineItem(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-end">
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Total: </span>
                      <span className="font-bold">{formatCurrency(totalCents)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes about this job..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/jobs">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
