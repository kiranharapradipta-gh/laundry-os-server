import { Router } from "express";

import {
  assignCustomerToSegmentController,
  createCustomerSegmentController,
  deleteCustomerSegmentController,
  getCustomerSegmentController,
  listCustomerSegmentsController,
  listSegmentCustomersController,
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
| Customer Segment CRUD
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

/*
|--------------------------------------------------------------------------
| Segment Members
|--------------------------------------------------------------------------
*/

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

export default router;