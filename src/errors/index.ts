import { AppError } from "./app-error.js";

export const badRequest = (
  message: string,
  details?: unknown,
) =>
  new AppError(
    message,
    400,
    "BAD_REQUEST",
    details,
  );

export const unauthorized = (
  message = "Unauthorized",
) =>
  new AppError(
    message,
    401,
    "UNAUTHORIZED",
  );

export const forbidden = (
  message = "Forbidden",
) =>
  new AppError(
    message,
    403,
    "FORBIDDEN",
  );

export const notFound = (
  message = "Resource tidak ditemukan",
) =>
  new AppError(
    message,
    404,
    "NOT_FOUND",
  );

export const conflict = (
  message: string,
) =>
  new AppError(
    message,
    409,
    "CONFLICT",
  );

export { AppError };