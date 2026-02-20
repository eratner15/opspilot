import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  unitPriceCents: z.number().min(0, "Price must be non-negative"),
});

export type LineItem = z.infer<typeof lineItemSchema>;

export const createQuoteSchema = z.object({
  customerId: z.string().min(1, "Customer required"),
  jobId: z.string().optional(),
  title: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
  taxRateBps: z.number().min(0).max(10000).default(0), // basis points
  notes: z.string().optional(),
  validUntil: z.string().optional(), // ISO date string
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const updateQuoteStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]),
});

export type CreateQuote = z.infer<typeof createQuoteSchema>;
export type UpdateQuote = z.infer<typeof updateQuoteSchema>;
