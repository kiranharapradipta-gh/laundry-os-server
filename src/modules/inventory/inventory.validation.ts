import { z } from "zod";

const decimalInput = z.union([
  z.number().finite(),
  z.string().trim().min(1),
]);

export const inventoryIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  branchId: z.string().uuid().optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  lowStock: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const createInventoryItemSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  unit: z.string().trim().min(1).max(50),
  minimumStock: decimalInput.optional(),
  maximumStock: decimalInput.nullable().optional(),
  costPrice: decimalInput.optional(),
  branchId: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
});

export const updateInventoryItemSchema = z
  .object({
    sku: z.string().trim().min(1).max(100).optional(),
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    unit: z.string().trim().min(1).max(50).optional(),
    minimumStock: decimalInput.optional(),
    maximumStock: decimalInput.nullable().optional(),
    costPrice: decimalInput.optional(),
    branchId: z.string().uuid().nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Minimal satu field harus diisi",
    },
  );

export const stockMovementSchema = z.object({
  quantity: decimalInput,
  type: z.enum([
    "PURCHASE",
    "USAGE",
    "SALE",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "RETURN",
    "WASTE",
    "INITIAL_STOCK",
  ]),
  unitCost: decimalInput.nullable().optional(),
  referenceType: z.string().trim().max(100).nullable().optional(),
  referenceId: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const stockAdjustmentSchema = z.object({
  actualStock: decimalInput,
  reason: z.enum([
    "DAMAGED",
    "LOST",
    "EXPIRED",
    "COUNT_CORRECTION",
    "SYSTEM_CORRECTION",
    "OTHER",
  ]),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type InventoryListQueryInput = z.infer<
  typeof inventoryListQuerySchema
>;

export type CreateInventoryItemInput = z.infer<
  typeof createInventoryItemSchema
>;

export type UpdateInventoryItemInput = z.infer<
  typeof updateInventoryItemSchema
>;

export type StockMovementInput = z.infer<
  typeof stockMovementSchema
>;

export type StockAdjustmentInput = z.infer<
  typeof stockAdjustmentSchema
>;