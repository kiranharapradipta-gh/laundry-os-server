import { Router } from "express";

import {
  assignCustomerToSegmentController,
  createCustomerSegmentController,
  deleteCustomerSegmentController,
  getCustomerSegmentController,
  listCustomerSegmentsController,
  listSegmentCustomersController,
  previewCustomerSegmentController,
  refreshCustomerSegmentController,
  removeCustomerFromSegmentController,
  updateCustomerSegmentController,
} from "./customer-segment.controller.js";

import {
  createCustomerSegmentSchema,
  customerSegmentCustomerIdSchema,
  customerSegmentIdSchema,
  customerSegmentListSchema,
  customerSegmentOnlyIdSchema,
  updateCustomerSegmentSchema,
} from "./customer-segment.validation.js";

import { asyncHandler } from "../../utils/async-handler.js";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Customer Segment Collection
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  requirePermission("customer.read"),
  validate(
    customerSegmentListSchema,
    "query",
  ),
  asyncHandler(
    listCustomerSegmentsController,
  ),
);

router.post(
  "/",
  requirePermission("customer.create"),
  validate(
    createCustomerSegmentSchema,
    "body",
  ),
  asyncHandler(
    createCustomerSegmentController,
  ),
);

/*
|--------------------------------------------------------------------------
| Customer Segment Actions
|--------------------------------------------------------------------------
*/

router.post(
  "/:segmentId/refresh",
  requirePermission("customer.update"),
  validate(
    customerSegmentOnlyIdSchema,
    "params",
  ),
  asyncHandler(
    refreshCustomerSegmentController,
  ),
);

/*
|--------------------------------------------------------------------------
| Customer Segment Members
|--------------------------------------------------------------------------
*/

router.post(
  "/:segmentId/preview",
  requirePermission("customer.read"),
  validate(
    customerSegmentOnlyIdSchema,
    "params",
  ),
  asyncHandler(
    previewCustomerSegmentController,
  ),
);

router.get(
  "/:segmentId/customers",
  requirePermission("customer.read"),
  validate(
    customerSegmentOnlyIdSchema,
    "params",
  ),
  asyncHandler(
    listSegmentCustomersController,
  ),
);

router.post(
  "/:segmentId/customers/:customerId",
  requirePermission("customer.update"),
  validate(
    customerSegmentCustomerIdSchema,
    "params",
  ),
  asyncHandler(
    assignCustomerToSegmentController,
  ),
);

router.delete(
  "/:segmentId/customers/:customerId",
  requirePermission("customer.update"),
  validate(
    customerSegmentCustomerIdSchema,
    "params",
  ),
  asyncHandler(
    removeCustomerFromSegmentController,
  ),
);

/*
|--------------------------------------------------------------------------
| Customer Segment Resource
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  requirePermission("customer.read"),
  validate(
    customerSegmentIdSchema,
    "params",
  ),
  asyncHandler(
    getCustomerSegmentController,
  ),
);

router.patch(
  "/:id",
  requirePermission("customer.update"),
  validate(
    customerSegmentIdSchema,
    "params",
  ),
  validate(
    updateCustomerSegmentSchema,
    "body",
  ),
  asyncHandler(
    updateCustomerSegmentController,
  ),
);

router.delete(
  "/:id",
  requirePermission("customer.delete"),
  validate(
    customerSegmentIdSchema,
    "params",
  ),
  asyncHandler(
    deleteCustomerSegmentController,
  ),
);

export default router;