import { z } from "zod";

const optionalString = (max: number) =>
  z.string().trim().max(max).optional();

const segmentRuleSchema = z.object({
  field: z.enum([
    "totalOrders",
    "totalSpent",
    "averageOrderValue",
    "status",
    "firstOrderAt",
    "lastOrderAt",
  ]),

  operator: z.enum([
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "within_days",
    "older_than_days",
  ]),

  value: z.union([
    z.string(),
    z.number(),
    z.null(),
  ]),
});

const segmentRulesSchema = z.object({
  all: z
    .array(segmentRuleSchema)
    .max(20)
    .optional(),

  any: z
    .array(segmentRuleSchema)
    .max(20)
    .optional(),
});

export const createCustomerSegmentSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Nama segment wajib diisi")
      .max(100, "Nama segment maksimal 100 karakter"),

    description: optionalString(500),

    color: z
      .string()
      .trim()
      .regex(
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        "Format warna harus HEX, contoh #6366F1",
      )
      .optional(),

    isDynamic: z.boolean().default(false),

    rules: segmentRulesSchema.optional(),

    active: z.boolean().default(true),
  });

export const updateCustomerSegmentSchema =
  createCustomerSegmentSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "Minimal satu field harus diubah",
      },
    );

export const customerSegmentIdSchema =
  z.object({
    id: z.string().uuid(
      "Segment ID tidak valid",
    ),
  });

export const customerSegmentListSchema =
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

    search: z
      .string()
      .trim()
      .max(100)
      .optional(),

    active: z
      .enum(["true", "false"])
      .transform(
        (value) => value === "true",
      )
      .optional(),
  });

export const customerSegmentCustomerIdSchema =
  z.object({
    segmentId: z.string().uuid(
      "Segment ID tidak valid",
    ),

    customerId: z.string().uuid(
      "Customer ID tidak valid",
    ),
  });

export const customerSegmentOnlyIdSchema =
  z.object({
    segmentId: z.string().uuid(
      "Segment ID tidak valid",
    ),
  });

export type CreateCustomerSegmentInput =
  z.infer<
    typeof createCustomerSegmentSchema
  >;

export type UpdateCustomerSegmentInput =
  z.infer<
    typeof updateCustomerSegmentSchema
  >;

export type CustomerSegmentListInput =
  z.infer<
    typeof customerSegmentListSchema
  >;