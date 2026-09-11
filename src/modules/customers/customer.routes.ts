import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";

import {
  createCustomerSchema,
  customerIdSchema,
  customerListSchema,
  updateCustomerSchema,
} from "./customer.validation.js";

import {
  createCustomerController,
  deleteCustomerController,
  getCustomerController,
  listCustomersController,
  updateCustomerController
} from "./customer.controller.js";
import { createCustomerAddressSchema, customerAddressCustomerIdSchema, customerAddressIdSchema, updateCustomerAddressSchema } from "./customer-address.validation.js";
import { createCustomerAddressController, deleteCustomerAddressController, getCustomerAddressController, listCustomerAddressesController, updateCustomerAddressController } from "./customer-address.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  requirePermission("customer.read"),
  validate(customerListSchema, "query"),
  asyncHandler(listCustomersController),
);

router.get(
  "/:customerId/addresses",
  requirePermission("customer.read"),
  validate(
    customerAddressCustomerIdSchema,
    "params",
  ),
  asyncHandler(
    listCustomerAddressesController,
  ),
);

router.get(
  "/:customerId/addresses/:addressId",
  requirePermission("customer.read"),
  validate(
    customerAddressIdSchema,
    "params",
  ),
  asyncHandler(
    getCustomerAddressController,
  ),
);

router.post(
  "/:customerId/addresses",
  requirePermission("customer.update"),
  validate(
    customerAddressCustomerIdSchema,
    "params",
  ),
  validate(
    createCustomerAddressSchema,
    "body",
  ),
  asyncHandler(
    createCustomerAddressController,
  ),
);

router.patch(
  "/:customerId/addresses/:addressId",
  requirePermission("customer.update"),
  validate(
    customerAddressIdSchema,
    "params",
  ),
  validate(
    updateCustomerAddressSchema,
    "body",
  ),
  asyncHandler(
    updateCustomerAddressController,
  ),
);

router.delete(
  "/:customerId/addresses/:addressId",
  requirePermission("customer.update"),
  validate(
    customerAddressIdSchema,
    "params",
  ),
  asyncHandler(
    deleteCustomerAddressController,
  ),
);

router.get(
  "/:id",
  requirePermission("customer.read"),
  validate(customerIdSchema, "params"),
  asyncHandler(getCustomerController),
);

router.post(
  "/",
  requirePermission("customer.create"),
  validate(createCustomerSchema, "body"),
  asyncHandler(createCustomerController),
);

router.patch(
  "/:id",
  requirePermission("customer.update"),
  validate(customerIdSchema, "params"),
  validate(updateCustomerSchema, "body"),
  asyncHandler(updateCustomerController),
);

router.delete(
  "/:id",
  requirePermission("customer.delete"),
  validate(customerIdSchema, "params"),
  asyncHandler(deleteCustomerController),
);

export default router;