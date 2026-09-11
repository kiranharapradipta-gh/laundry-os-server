import type { Response } from "express";

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
) => {
  res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown,
) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  });
};