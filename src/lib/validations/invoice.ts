import { z } from "zod";

export const createInvoiceSchema = z.object({
  customerId: z.string().min(1, "Customer required"),
  jobId: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, "Description required"),
      quantity: z.number().min(0.01),
      unitPriceCents: z.number().min(0),
    })
  ).min(1, "At least one line item required"),
  taxRateBps: z.number().min(0).max(10000).default(0),
  dueDate: z.string().optional(), // ISO date
  notes: z.string().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const updateInvoiceStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
});

export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;
