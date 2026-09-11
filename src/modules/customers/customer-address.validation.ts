import { z } from "zod";

const optionalString = (max: number) =>
  z.string().trim().max(max).optional();

export const customerAddressIdSchema = z.object({
  customerId: z.string().uuid("Customer ID tidak valid"),
  addressId: z.string().uuid("Address ID tidak valid"),
});

export const customerAddressCustomerIdSchema = z.object({
  customerId: z.string().uuid("Customer ID tidak valid"),
});

export const createCustomerAddressSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Label alamat wajib diisi")
    .max(50),

  recipientName: z
    .string()
    .trim()
    .min(2, "Nama penerima minimal 2 karakter")
    .max(100),

  phone: optionalString(30),

  address: z
    .string()
    .trim()
    .min(5, "Alamat minimal 5 karakter")
    .max(500),

  city: optionalString(100),

  province: optionalString(100),

  postalCode: optionalString(20),

  latitude: z.coerce
    .number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: z.coerce
    .number()
    .min(-180)
    .max(180)
    .optional(),

  deliveryNotes: optionalString(500),

  isDefault: z.boolean().default(false),
});

export const updateCustomerAddressSchema =
  createCustomerAddressSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "Minimal satu field harus diubah",
      },
    );

export type CreateCustomerAddressInput =
  z.infer<typeof createCustomerAddressSchema>;

export type UpdateCustomerAddressInput =
  z.infer<typeof updateCustomerAddressSchema>;