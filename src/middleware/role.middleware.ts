import type {
  NextFunction,
  Request,
  Response,
} from "express";

export const requireRole = (
  ...allowedRoles: string[]
) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Role tidak memiliki akses",
      });
      return;
    }

    next();
  };
};