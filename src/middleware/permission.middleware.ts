import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { prisma } from "../config/database.js";
import type { PermissionCode } from "../constants/permissions.js";

export const requirePermission = (
  permissionCode: PermissionCode,
) => {
  return async (
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



    try {
      const membership =
        await prisma.businessMember.findUnique({
          where: {
            businessId_userId: {
              businessId: req.user.businessId,
              userId: req.user.userId,
            },
          },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: "Business membership tidak ditemukan",
        });
        return;
      }

      if (membership.status !== "ACTIVE") {
        res.status(403).json({
          success: false,
          message: "Business membership tidak aktif",
        });
        return;
      }

      const hasPermission =
        membership.role.permissions.some(
          (rolePermission) =>
            rolePermission.permission.code ===
            permissionCode,
        );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: "Anda tidak memiliki permission ini",
          requiredPermission: permissionCode,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};