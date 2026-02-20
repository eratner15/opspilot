import { z } from "zod";

export const createTechnicianSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().min(10, "Valid phone required").regex(/^\d{10,11}$/, "Phone must be 10-11 digits"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  type: z.enum(["EMPLOYEE", "SUBCONTRACTOR"]).default("EMPLOYEE"),
  skillsJson: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).default("ACTIVE"),
  notes: z.string().optional(),
});

export const updateTechnicianSchema = createTechnicianSchema.partial();

export type CreateTechnician = z.infer<typeof createTechnicianSchema>;
export type UpdateTechnician = z.infer<typeof updateTechnicianSchema>;
