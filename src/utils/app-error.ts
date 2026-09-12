import { AppError } from "../errors/app-error.js";

export const notFound = (message: string) =>
  new AppError(message, 404);

export const conflict = (message: string) =>
  new AppError(message, 409);