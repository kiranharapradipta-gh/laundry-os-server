import { z } from "zod";

/*
 * UUID
 */
export const uuidSchema = z
  .string()
  .uuid("ID tidak valid");

/*
 * Pagination
 */
export const paginationSchema = z.object({
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

/*
 * Search
 */
export const searchSchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search maksimal 100 karakter")
    .optional(),
});

/*
 * Pagination + Search
 */
export const listQuerySchema = paginationSchema.extend({
  search: z
    .string()
    .trim()
    .max(100, "Search maksimal 100 karakter")
    .optional(),
});

/*
 * ID params
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/*
 * Date range
 */
export const dateRangeSchema = z
  .object({
    startDate: z.coerce
      .date()
      .optional(),

    endDate: z.coerce
      .date()
      .optional(),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      data.startDate <= data.endDate,
    {
      message:
        "Tanggal mulai tidak boleh lebih besar dari tanggal akhir",
      path: ["startDate"],
    },
  );

export type PaginationInput = z.infer<
  typeof paginationSchema
>;

export type ListQueryInput = z.infer<
  typeof listQuerySchema
>;

export type IdParamInput = z.infer<
  typeof idParamSchema
>;

export type DateRangeInput = z.infer<
  typeof dateRangeSchema
>;