import type { NextFunction, Request, Response } from "express";
import {
  verifyAccessToken,
  type JwtPayload,
} from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).json({
      success: false,
      message: "Authorization header wajib diisi",
    });
    return;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({
      success: false,
      message: "Format Authorization harus Bearer <token>",
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = payload;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Token tidak valid atau sudah expired",
    });
  }
};