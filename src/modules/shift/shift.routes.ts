import { Router } from "express";

import {
  authMiddleware,
} from "../../middleware/auth.middleware.js";

import {
  requirePermission,
} from "../../middleware/permission.middleware.js";

import { validate } from "../../middleware/validation.middleware.js";

import {
  getShifts,
  getShift,
  createShift,
  closeShiftController,
  getCashMovements,
  cashIn,
  cashOut,
} from "./shift.controller.js";

import {
  shiftIdParamsSchema,
  shiftListQuerySchema,
  openShiftSchema,
  closeShiftSchema,
  cashMovementSchema,
} from "./shift.validation.js";

import {
  PERMISSIONS,
} from "../../constants/permissions.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission(PERMISSIONS.SHIFT_READ),
  validate(shiftListQuerySchema, 'query'),
  getShifts,
);

router.get(
  "/:id",
  requirePermission(PERMISSIONS.SHIFT_READ),
  validate(shiftIdParamsSchema, 'params'),
  getShift,
);

router.post(
  "/open",
  requirePermission(PERMISSIONS.SHIFT_OPEN),
  validate(openShiftSchema, 'body'),
  createShift,
);

router.post(
  "/:id/close",
  requirePermission(PERMISSIONS.SHIFT_CLOSE),
  validate(shiftIdParamsSchema, 'params'),
  validate(closeShiftSchema, 'body'),
  closeShiftController,
);

router.get(
  "/:id/cash",
  requirePermission(PERMISSIONS.SHIFT_CASH_READ),
  validate(shiftIdParamsSchema, 'params'),
  getCashMovements,
);

router.post(
  "/:id/cash/in",
  requirePermission(PERMISSIONS.SHIFT_CASH_ADJUST),
  validate(shiftIdParamsSchema, 'params'),
  validate(cashMovementSchema, 'body'),
  cashIn,
);

router.post(
  "/:id/cash/out",
  requirePermission(PERMISSIONS.SHIFT_CASH_ADJUST),
  validate(shiftIdParamsSchema, 'params'),
  validate(cashMovementSchema, 'body'),
  cashOut,
);

export default router;