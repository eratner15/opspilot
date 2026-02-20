import { z } from "zod";

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().min(10, "Valid phone required").regex(/^\d{10,11}$/, "Phone must be 10-11 digits"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL"]).default("RESIDENTIAL"),
  equipmentJson: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomer = z.infer<typeof createCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
