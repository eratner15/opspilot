import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitPriceCents: z.number().min(0, "Price must be non-negative"),
});

export type LineItem = z.infer<typeof lineItemSchema>;

export const createJobSchema = z.object({
  customerId: z.string().optional(),
  technicianId: z.string().optional(),
  title: z.string().min(1, "Title required"),
  description: z.string().optional(),
  category: z.enum(["HVAC", "PLUMBING", "ELECTRICAL", "ROOFING", "OTHER"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "EMERGENCY"]).default("NORMAL"),
  status: z.enum(["NEW", "SCHEDULED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED", "INVOICED", "PAID", "CANCELLED", "ON_HOLD"]).default("NEW"),
  scheduledAt: z.string().optional(),
  scheduledWindow: z.enum(["MORNING", "AFTERNOON", "EVENING", "ALL_DAY"]).optional(),
  lineItemsJson: z.string().optional(),
  totalCents: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const updateJobStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["NEW", "SCHEDULED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED", "INVOICED", "PAID", "CANCELLED", "ON_HOLD"]),
  notes: z.string().optional(),
});

export type CreateJob = z.infer<typeof createJobSchema>;
export type UpdateJob = z.infer<typeof updateJobSchema>;
export type UpdateJobStatus = z.infer<typeof updateJobStatusSchema>;
