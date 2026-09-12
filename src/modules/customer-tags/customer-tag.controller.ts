import type { Request, Response } from "express";

import {
  assignCustomerTag,
  createCustomerTag,
  deleteCustomerTag,
  getCustomerTagById,
  getCustomerTags,
  listCustomerTags,
  removeCustomerTag,
  updateCustomerTag,
} from "./customer-tag.service.js";

import type {
  CreateCustomerTagInput,
  CustomerTagListInput,
  UpdateCustomerTagInput,
} from "./customer-tag.validation.js";

import {
  successResponse,
} from "../../utils/api-response.js";

export const listCustomerTagsController = async (
  req: Request,
  res: Response,
) => {
  const input =
    res.locals.validatedQuery as CustomerTagListInput;

  const businessId = req.user!.businessId;

  const result = await listCustomerTags(
    businessId,
    input,
  );

  successResponse(res, result);
};

export const getCustomerTagController = async (
  req: Request,
  res: Response,
) => {
  const { id } =
    res.locals.validatedParams as {
      id: string;
    };

  const businessId = req.user!.businessId;

  const result = await getCustomerTagById(
    businessId,
    id,
  );

  successResponse(res, result);
};

export const createCustomerTagController = async (
  req: Request,
  res: Response,
) => {
  const input =
    res.locals.validatedBody as CreateCustomerTagInput;

  const businessId = req.user!.businessId;

  const result = await createCustomerTag(
    businessId,
    input,
  );

  successResponse(
    res,
    result,
    201,
    "Customer tag berhasil dibuat",
  );
};

export const updateCustomerTagController = async (
  req: Request,
  res: Response,
) => {
  const { id } =
    res.locals.validatedParams as {
      id: string;
    };

  const input =
    res.locals.validatedBody as UpdateCustomerTagInput;

  const businessId = req.user!.businessId;

  const result = await updateCustomerTag(
    businessId,
    id,
    input,
  );

  successResponse(
    res,
    result,
    200,
    "Customer tag berhasil diperbarui",
  );
};

export const deleteCustomerTagController = async (
  req: Request,
  res: Response,
) => {
  const { id } =
    res.locals.validatedParams as {
      id: string;
    };

  const businessId = req.user!.businessId;

  await deleteCustomerTag(
    businessId,
    id,
  );

  successResponse(
    res,
    null,
    200,
    "Customer tag berhasil dihapus",
  );
};

export const getCustomerTagsController = async (
  req: Request,
  res: Response,
) => {
  const { customerId } =
    res.locals.validatedParams as {
      customerId: string;
    };

  const businessId = req.user!.businessId;

  const result = await getCustomerTags(
    businessId,
    customerId,
  );

  successResponse(res, result);
};

export const assignCustomerTagController = async (
  req: Request,
  res: Response,
) => {
  const { customerId, tagId } =
    res.locals.validatedParams as {
      customerId: string;
      tagId: string;
    };

  const businessId = req.user!.businessId;

  const result = await assignCustomerTag(
    businessId,
    customerId,
    tagId,
  );

  successResponse(
    res,
    result,
    201,
    "Tag berhasil diberikan kepada customer",
  );
};

export const removeCustomerTagController = async (
  req: Request,
  res: Response,
) => {
  const { customerId, tagId } =
    res.locals.validatedParams as {
      customerId: string;
      tagId: string;
    };

  const businessId = req.user!.businessId;

  await removeCustomerTag(
    businessId,
    customerId,
    tagId,
  );

  successResponse(
    res,
    null,
    200,
    "Tag berhasil dilepas dari customer",
  );
};