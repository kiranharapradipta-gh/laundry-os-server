import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";

import {
  adjustInventory,
  createInventory,
  deleteInventory,
  getInventory,
  getInventoryById,
  getInventoryTransactions,
  stockInInventory,
  stockOutInventory,
  updateInventory,
} from "./inventory.controller.js";

import {
  createInventoryItemSchema,
  inventoryIdParamsSchema,
  inventoryListQuerySchema,
  stockAdjustmentSchema,
  stockMovementSchema,
  updateInventoryItemSchema,
} from "./inventory.validation.js";

const router = Router();

router.use(authMiddleware);

/*
 * List
 */
router.get(
  "/",
  requirePermission("inventory.read"),
  validate(inventoryListQuerySchema, "query"),
  asyncHandler(getInventory),
);

/*
 * Create
 */
router.post(
  "/",
  requirePermission("inventory.create"),
  validate(createInventoryItemSchema, "body"),
  asyncHandler(createInventory),
);

/*
 * Transactions
 */
router.get(
  "/:id/transactions",
  requirePermission("inventory.read"),
  validate(inventoryIdParamsSchema, "params"),
  asyncHandler(getInventoryTransactions),
);

/*
 * Stock In
 */
router.post(
  "/:id/stock/in",
  requirePermission("inventory.adjust"),
  validate(inventoryIdParamsSchema, "params"),
  validate(stockMovementSchema, "body"),
  asyncHandler(stockInInventory),
);

/*
 * Stock Out
 */
router.post(
  "/:id/stock/out",
  requirePermission("inventory.adjust"),
  validate(inventoryIdParamsSchema, "params"),
  validate(stockMovementSchema, "body"),
  asyncHandler(stockOutInventory),
);

/*
 * Stock Adjustment
 */
router.post(
  "/:id/adjust",
  requirePermission("inventory.adjust"),
  validate(inventoryIdParamsSchema, "params"),
  validate(stockAdjustmentSchema, "body"),
  asyncHandler(adjustInventory),
);

/*
 * Get detail
 */
router.get(
  "/:id",
  requirePermission("inventory.read"),
  validate(inventoryIdParamsSchema, "params"),
  asyncHandler(getInventoryById),
);

/*
 * Update
 */
router.patch(
  "/:id",
  requirePermission("inventory.update"),
  validate(inventoryIdParamsSchema, "params"),
  validate(updateInventoryItemSchema, "body"),
  asyncHandler(updateInventory),
);

/*
 * Delete
 */
router.delete(
  "/:id",
  requirePermission("inventory.delete"),
  validate(inventoryIdParamsSchema, "params"),
  asyncHandler(deleteInventory),
);

export default router;