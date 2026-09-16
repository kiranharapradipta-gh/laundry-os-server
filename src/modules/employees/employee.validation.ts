import { z } from "zod";

const employeeStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "TERMINATED",
  "ON_LEAVE",
]);

const optionalNullableString = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const employeeIdParamsSchema = z.object({
  id: z.string().uuid("Employee ID tidak valid"),
});

export const employeeListQuerySchema = z.object({
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

  status: employeeStatusSchema.optional(),

  branchId: z
    .string()
    .uuid("Branch ID tidak valid")
    .optional(),

  departmentId: z
    .string()
    .uuid("Department ID tidak valid")
    .optional(),
});

export const createEmployeeSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, "Kode employee wajib diisi")
    .max(50, "Kode employee maksimal 50 karakter"),

  name: z
    .string()
    .trim()
    .min(1, "Nama employee wajib diisi")
    .max(150, "Nama employee maksimal 150 karakter"),

  phone: optionalNullableString(30),

  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .max(255, "Email maksimal 255 karakter")
    .optional()
    .nullable(),

  position: optionalNullableString(100),

  branchId: z
    .string()
    .uuid("Branch ID tidak valid")
    .optional()
    .nullable(),

  departmentId: z
    .string()
    .uuid("Department ID tidak valid")
    .optional()
    .nullable(),

  hiredAt: z
    .coerce
    .date()
    .optional()
    .nullable(),

  baseSalary: z
    .union([
      z.number().finite().nonnegative(),

      z
        .string()
        .trim()
        .min(1, "Gaji pokok tidak boleh kosong")
        .refine(
          (value) => {
            const parsed = Number(value);

            return (
              Number.isFinite(parsed) &&
              parsed >= 0
            );
          },
          {
            message:
              "Gaji pokok harus berupa angka >= 0",
          },
        ),
    ])
    .optional()
    .nullable(),
});

export const updateEmployeeSchema =
  createEmployeeSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        "Minimal satu field harus diubah",
    },
  );

export const updateEmployeeStatusSchema =
  z.object({
    status: employeeStatusSchema,
  });

export const employeeShiftListQuerySchema =
  z.object({
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
  });

export type CreateEmployeeInput = z.infer<
  typeof createEmployeeSchema
>;

export type UpdateEmployeeInput = z.infer<
  typeof updateEmployeeSchema
>;

export type EmployeeListInput = z.infer<
  typeof employeeListQuerySchema
>;

export type UpdateEmployeeStatusInput =
  z.infer<typeof updateEmployeeStatusSchema>;

export type EmployeeShiftListInput =
  z.infer<
    typeof employeeShiftListQuerySchema
  >;