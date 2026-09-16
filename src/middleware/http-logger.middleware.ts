import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { logger } from "../utils/logger.js";

export const httpLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs:
        Date.now() - startedAt,
      ...(req.user
        ? {
            userId: req.user.userId,
            businessId:
              req.user.businessId,
          }
        : {}),
    });
  });

  next();
};