import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama customer minimal 2 karakter")
    .max(100),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional(),

  whatsapp: z
    .string()
    .trim()
    .max(30)
    .optional(),

  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(1000)
    .optional(),
});

export const updateCustomerSchema =
  createCustomerSchema.partial();

export const customerListSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  search: z
    .string()
    .trim()
    .max(100)
    .optional(),
});

export const customerIdSchema = z.object({
  id: z.string().uuid("Customer ID tidak valid"),
});

export type CreateCustomerInput =
  z.infer<typeof createCustomerSchema>;

export type UpdateCustomerInput =
  z.infer<typeof updateCustomerSchema>;

export type CustomerListInput =
  z.infer<typeof customerListSchema>;