import type { Request, Response } from "express";

import { successResponse } from "../../utils/api-response.js";

import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddressById,
  listCustomerAddresses,
  updateCustomerAddress,
} from "./customer-address.service.js";

export const listCustomerAddressesController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      customerId,
    } = res.locals.validatedParams as {
      customerId: string;
    };

    const addresses =
      await listCustomerAddresses(
        req.user!.businessId,
        customerId,
      );

    successResponse(
      res,
      addresses,
    );
  };

export const getCustomerAddressController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      customerId,
      addressId,
    } = res.locals.validatedParams as {
      customerId: string;
      addressId: string;
    };

    const address =
      await getCustomerAddressById(
        req.user!.businessId,
        customerId,
        addressId,
      );

    successResponse(
      res,
      address,
    );
  };

export const createCustomerAddressController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      customerId,
    } = res.locals.validatedParams as {
      customerId: string;
    };

    const input =
      res.locals.validatedBody;

    const address =
      await createCustomerAddress(
        req.user!.businessId,
        customerId,
        input,
      );

    successResponse(
      res,
      address,
      201,
      "Alamat customer berhasil dibuat",
    );
  };

export const updateCustomerAddressController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      customerId,
      addressId,
    } = res.locals.validatedParams as {
      customerId: string;
      addressId: string;
    };

    const input =
      res.locals.validatedBody;

    const address =
      await updateCustomerAddress(
        req.user!.businessId,
        customerId,
        addressId,
        input,
      );

    successResponse(
      res,
      address,
      200,
      "Alamat customer berhasil diperbarui",
    );
  };

export const deleteCustomerAddressController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      customerId,
      addressId,
    } = res.locals.validatedParams as {
      customerId: string;
      addressId: string;
    };

    await deleteCustomerAddress(
      req.user!.businessId,
      customerId,
      addressId,
    );

    successResponse(
      res,
      null,
      200,
      "Alamat customer berhasil dihapus",
    );
  };