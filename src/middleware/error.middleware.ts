import type {
  ErrorRequestHandler,
} from "express";

import { ZodError } from "zod";
import { AppError } from "../errors/index.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
) => {
  console.error("ERROR:", error);
  logger.error("Unhandled error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    error:
      error instanceof Error
        ? error.message
        : String(error),
  });

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      requestId: req.requestId,
      errors: error.issues.map(
        (issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }),
      ),
    });

    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      requestId: req.requestId,
      ...(error.code
        ? { code: error.code }
        : {}),
      ...(error.details !== undefined
        ? { errors: error.details }
        : {}),
    });

    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    requestId: req.requestId,
  });
};