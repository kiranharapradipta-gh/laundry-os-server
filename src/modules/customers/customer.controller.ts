import type { Request, Response } from "express";

import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from "./customer.service.js";

import { successResponse } from "../../utils/api-response.js";

export const listCustomersController = async (
  req: Request,
  res: Response,
) => {
  const query =
    res.locals.validatedQuery;

  const result = await listCustomers(
    req.user!.businessId,
    query,
  );

  successResponse(res, result);
};

export const getCustomerController = async (
  req: Request,
  res: Response,
) => {
  const params =
    res.locals.validatedParams as {
      id: string;
    };

  const customer = await getCustomerById(
    req.user!.businessId,
    params.id,
  );

  successResponse(res, customer);
};

export const createCustomerController =
  async (
    req: Request,
    res: Response,
  ) => {
    const body =
      res.locals.validatedBody;

    const customer = await createCustomer(
      req.user!.businessId,
      body,
    );

    successResponse(
      res,
      customer,
      201,
      "Customer berhasil dibuat",
    );
  };

export const updateCustomerController =
  async (
    req: Request,
    res: Response,
  ) => {
    const params =
      res.locals.validatedParams as {
        id: string;
      };

    const body =
      res.locals.validatedBody;

    const customer = await updateCustomer(
      req.user!.businessId,
      params.id,
      body,
    );

    successResponse(
      res,
      customer,
      200,
      "Customer berhasil diperbarui",
    );
  };

export const deleteCustomerController =
  async (
    req: Request,
    res: Response,
  ) => {
    const params =
      res.locals.validatedParams as {
        id: string;
      };

    await deleteCustomer(
      req.user!.businessId,
      params.id,
    );

    successResponse(
      res,
      null,
      200,
      "Customer berhasil dihapus",
    );
  };