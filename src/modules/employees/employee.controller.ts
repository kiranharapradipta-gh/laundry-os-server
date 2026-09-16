import type {
  Request,
  Response,
} from "express";

import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployeeShifts,
  listEmployees,
  updateEmployee,
  updateEmployeeStatus,
} from "./employee.service.js";

import type {
  CreateEmployeeInput,
  EmployeeListInput,
  EmployeeShiftListInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from "./employee.validation.js";

import {
  successResponse,
} from "../../utils/api-response.js";

export const getEmployees =
  async (
    req: Request,
    res: Response,
  ) => {
    const query =
      res.locals.validatedQuery as EmployeeListInput;

    const result =
      await listEmployees(
        req.user!.businessId,
        query,
      );

    successResponse(res, result);
  };

export const getEmployee =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      id,
    } =
      res.locals.validatedParams as {
        id: string;
      };

    const result =
      await getEmployeeById(
        req.user!.businessId,
        id,
      );

    successResponse(res, result);
  };

export const createEmployeeController =
  async (
    req: Request,
    res: Response,
  ) => {
    const body =
      res.locals.validatedBody as CreateEmployeeInput;

    const result =
      await createEmployee(
        req.user!.businessId,
        body,
      );

    successResponse(
      res,
      result,
      201,
      "Employee berhasil dibuat",
    );
  };

export const updateEmployeeController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      id,
    } =
      res.locals.validatedParams as {
        id: string;
      };

    const body =
      res.locals.validatedBody as UpdateEmployeeInput;

    const result =
      await updateEmployee(
        req.user!.businessId,
        id,
        body,
      );

    successResponse(
      res,
      result,
      200,
      "Employee berhasil diperbarui",
    );
  };

export const updateEmployeeStatusController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      id,
    } =
      res.locals.validatedParams as {
        id: string;
      };

    const body =
      res.locals.validatedBody as UpdateEmployeeStatusInput;

    const result =
      await updateEmployeeStatus(
        req.user!.businessId,
        id,
        body,
      );

    successResponse(
      res,
      result,
      200,
      "Status employee berhasil diperbarui",
    );
  };

export const deleteEmployeeController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      id,
    } =
      res.locals.validatedParams as {
        id: string;
      };

    const result =
      await deleteEmployee(
        req.user!.businessId,
        id,
      );

    successResponse(
      res,
      result,
      200,
      "Employee berhasil dinonaktifkan",
    );
  };

export const getEmployeeShifts =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      id,
    } =
      res.locals.validatedParams as {
        id: string;
      };

    const query =
      res.locals.validatedQuery as EmployeeShiftListInput;

    const result =
      await listEmployeeShifts(
        req.user!.businessId,
        id,
        query,
      );

    successResponse(res, result);
  };