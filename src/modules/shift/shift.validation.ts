import { z } from "zod";

const moneyInput = z.union([
  z.number().finite().nonnegative(),
  z
    .string()
    .trim()
    .min(1, "Nilai tidak boleh kosong")
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
          "Nilai harus berupa angka >= 0",
      },
    ),
]);

const positiveMoneyInput = z.union([
  z.number().finite().positive(),
  z
    .string()
    .trim()
    .min(1, "Nilai tidak boleh kosong")
    .refine(
      (value) => {
        const parsed = Number(value);

        return (
          Number.isFinite(parsed) &&
          parsed > 0
        );
      },
      {
        message:
          "Nilai harus berupa angka > 0",
      },
    ),
]);

export const shiftIdParamsSchema =
  z.object({
    id: z.string().uuid(),
  });

export const shiftListQuerySchema =
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

    branchId: z
      .string()
      .uuid()
      .optional(),

    employeeId: z
      .string()
      .uuid()
      .optional(),

    status: z
      .enum([
        "OPEN",
        "CLOSED",
        "FORCE_CLOSED",
      ])
      .optional(),
  });

export const openShiftSchema =
  z.object({
    branchId: z.string().uuid(),

    employeeId: z.string().uuid(),

    cashRegisterId:
      z.string().uuid(),

    openingCash: moneyInput,

    notes: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    startedAt: z
      .coerce
      .date()
      .optional(),
  });

export const closeShiftSchema =
  z.object({
    closingCash: moneyInput,

    notes: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    endedAt: z
      .coerce
      .date()
      .optional(),
  });

export const cashMovementSchema =
  z.object({
    type: z.enum([
      "CASH_IN",
      "CASH_OUT",
      "ADJUSTMENT",
    ]),

    amount: positiveMoneyInput,

    description: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    referenceType: z
      .string()
      .trim()
      .max(100)
      .optional(),

    referenceId: z
      .string()
      .trim()
      .max(100)
      .optional(),
  });