import { z } from "zod";

export const createCustomerTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama tag wajib diisi")
    .max(50, "Nama tag maksimal 50 karakter"),

  color: z
    .string()
    .trim()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "Format warna harus HEX, contoh #FF5733",
    )
    .optional(),
});

export const updateCustomerTagSchema =
  createCustomerTagSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "Minimal satu field harus diubah",
      },
    );

export const customerTagIdSchema = z.object({
  id: z.string().uuid("Tag ID tidak valid"),
});

export const customerTagListSchema = z.object({
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

export const customerTagAssignmentSchema =
  z.object({
    customerId: z.string().uuid(
      "Customer ID tidak valid",
    ),

    tagId: z.string().uuid(
      "Tag ID tidak valid",
    ),
  });

export const customerTagCustomerIdSchema =
  z.object({
    customerId: z.string().uuid(
      "Customer ID tidak valid",
    ),
  });

export type CreateCustomerTagInput =
  z.infer<typeof createCustomerTagSchema>;

export type UpdateCustomerTagInput =
  z.infer<typeof updateCustomerTagSchema>;

export type CustomerTagListInput =
  z.infer<typeof customerTagListSchema>;