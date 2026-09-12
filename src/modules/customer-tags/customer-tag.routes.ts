import { Router } from "express";

import {
  assignCustomerTagController,
  createCustomerTagController,
  deleteCustomerTagController,
  getCustomerTagController,
  getCustomerTagsController,
  listCustomerTagsController,
  removeCustomerTagController,
  updateCustomerTagController,
} from "./customer-tag.controller.js";

import {
  createCustomerTagSchema,
  customerTagAssignmentSchema,
  customerTagCustomerIdSchema,
  customerTagIdSchema,
  customerTagListSchema,
  updateCustomerTagSchema,
} from "./customer-tag.validation.js";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

import { asyncHandler } from "../../utils/async-handler.js";

const router = Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Customer Tag CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  requirePermission("customer.read"),
  validate(customerTagListSchema, "query"),
  asyncHandler(listCustomerTagsController),
);

router.get(
  "/:id",
  requirePermission("customer.read"),
  validate(customerTagIdSchema, "params"),
  asyncHandler(getCustomerTagController),
);

router.post(
  "/",
  requirePermission("customer.create"),
  validate(createCustomerTagSchema, "body"),
  asyncHandler(createCustomerTagController),
);

router.patch(
  "/:id",
  requirePermission("customer.update"),
  validate(customerTagIdSchema, "params"),
  validate(updateCustomerTagSchema, "body"),
  asyncHandler(updateCustomerTagController),
);

router.delete(
  "/:id",
  requirePermission("customer.delete"),
  validate(customerTagIdSchema, "params"),
  asyncHandler(deleteCustomerTagController),
);

/*
|--------------------------------------------------------------------------
| Customer ↔ Tag Assignment
|--------------------------------------------------------------------------
*/

router.get(
  "/customer/:customerId",
  requirePermission("customer.read"),
  validate(
    customerTagCustomerIdSchema,
    "params",
  ),
  asyncHandler(getCustomerTagsController),
);

router.post(
  "/customer/:customerId/tag/:tagId",
  requirePermission("customer.update"),
  validate(
    customerTagAssignmentSchema,
    "params",
  ),
  asyncHandler(assignCustomerTagController),
);

router.delete(
  "/customer/:customerId/tag/:tagId",
  requirePermission("customer.update"),
  validate(
    customerTagAssignmentSchema,
    "params",
  ),
  asyncHandler(removeCustomerTagController),
);

export default router;