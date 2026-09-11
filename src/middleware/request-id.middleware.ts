import { randomUUID } from "node:crypto";
import type {
  NextFunction,
  Request,
  Response,
} from "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId =
    req.header("X-Request-ID") ??
    randomUUID();

  req.requestId = requestId;

  res.setHeader(
    "X-Request-ID",
    requestId,
  );

  next();
};