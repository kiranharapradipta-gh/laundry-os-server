import { z } from "zod";

export const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Username wajib diisi")
      .optional(),

    email: z
      .string()
      .trim()
      .email("Format email tidak valid")
      .optional(),

    password: z
      .string()
      .min(1, "Password wajib diisi"),
  })
  .refine(
    (data) => data.username || data.email,
    {
      message: "Username atau email wajib diisi",
      path: ["username"],
    },
  );

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, "Refresh token wajib diisi"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Password saat ini wajib diisi"),

    newPassword: z
      .string()
      .min(
        8,
        "Password baru minimal 8 karakter",
      ),
  })
  .refine(
    (data) =>
      data.currentPassword !== data.newPassword,
    {
      message:
        "Password baru harus berbeda dari password saat ini",
      path: ["newPassword"],
    },
  );

export type LoginInput = z.infer<
  typeof loginSchema
>;

export type RefreshTokenInput = z.infer<
  typeof refreshTokenSchema
>;

export type ChangePasswordInput = z.infer<
  typeof changePasswordSchema
>;