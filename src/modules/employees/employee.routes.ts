import { Router } from "express";

import {
  authMiddleware,
} from "../../middleware/auth.middleware.js";

import {
  requirePermission,
} from "../../middleware/permission.middleware.js";

import {
  validate,
} from "../../middleware/validation.middleware.js";

import {
  asyncHandler,
} from "../../utils/async-handler.js";

import {
  createEmployeeController,
  deleteEmployeeController,
  getEmployee,
  getEmployeeShifts,
  getEmployees,
  updateEmployeeController,
  updateEmployeeStatusController,
} from "./employee.controller.js";

import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  employeeListQuerySchema,
  employeeShiftListQuerySchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from "./employee.validation.js";

const router = Router();

router.use(authMiddleware);

/*
|--------------------------------------------------------------------------
| Employee Collection
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  requirePermission("employee.read"),
  validate(
    employeeListQuerySchema,
    "query",
  ),
  asyncHandler(getEmployees),
);

router.post(
  "/",
  requirePermission("employee.create"),
  validate(
    createEmployeeSchema,
    "body",
  ),
  asyncHandler(
    createEmployeeController,
  ),
);

/*
|--------------------------------------------------------------------------
| Employee Resource
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  requirePermission("employee.read"),
  validate(
    employeeIdParamsSchema,
    "params",
  ),
  asyncHandler(getEmployee),
);

router.patch(
  "/:id",
  requirePermission("employee.update"),
  validate(
    employeeIdParamsSchema,
    "params",
  ),
  validate(
    updateEmployeeSchema,
    "body",
  ),
  asyncHandler(
    updateEmployeeController,
  ),
);

/*
|--------------------------------------------------------------------------
| Employee Status
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/status",
  requirePermission("employee.update"),
  validate(
    employeeIdParamsSchema,
    "params",
  ),
  validate(
    updateEmployeeStatusSchema,
    "body",
  ),
  asyncHandler(
    updateEmployeeStatusController,
  ),
);

/*
|--------------------------------------------------------------------------
| Employee Shift History
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/shifts",
  requirePermission("employee.read"),
  validate(
    employeeIdParamsSchema,
    "params",
  ),
  validate(
    employeeShiftListQuerySchema,
    "query",
  ),
  asyncHandler(getEmployeeShifts),
);

/*
|--------------------------------------------------------------------------
| Employee Delete / Terminate
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  requirePermission("employee.delete"),
  validate(
    employeeIdParamsSchema,
    "params",
  ),
  asyncHandler(
    deleteEmployeeController,
  ),
);

export default router;