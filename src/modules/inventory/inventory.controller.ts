import type { Request, Response } from "express";

import {
  adjustStock,
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItemById,
  listInventoryItems,
  listInventoryTransactions,
  stockIn,
  stockOut,
  updateInventoryItem,
} from "./inventory.service.js";

import { successResponse } from "../../utils/api-response.js";

export const getInventory = async (
  req: Request,
  res: Response,
) => {
  const query =
    res.locals.validatedQuery;

  const result = await listInventoryItems(
    req.user!.businessId,
    query,
  );

  successResponse(res, result);
};

export const getInventoryById = async (
  req: Request,
  res: Response,
) => {
  const params =
    res.locals.validatedParams as {
      id: string;
    };

  const item = await getInventoryItemById(
    req.user!.businessId,
    params.id,
  );

  successResponse(res, item);
};

export const createInventory = async (
  req: Request,
  res: Response,
) => {
  const body =
    res.locals.validatedBody;

  const item = await createInventoryItem(
    req.user!.businessId,
    body,
  );

  successResponse(
    res,
    item,
    201,
    "Inventory berhasil dibuat",
  );
};

export const updateInventory = async (
  req: Request,
  res: Response,
) => {
  const params =
    res.locals.validatedParams as {
      id: string;
    };

  const body =
    res.locals.validatedBody;

  const item = await updateInventoryItem(
    req.user!.businessId,
    params.id,
    body,
  );

  successResponse(
    res,
    item,
    200,
    "Inventory berhasil diperbarui",
  );
};

export const deleteInventory = async (
  req: Request,
  res: Response,
) => {
  const params =
    res.locals.validatedParams as {
      id: string;
    };

  await deleteInventoryItem(
    req.user!.businessId,
    params.id,
  );

  successResponse(
    res,
    null,
    200,
    "Inventory berhasil dihapus",
  );
};

export const stockInInventory = async (
  req: Request,
  res: Response,
) => {
  const params =
    res.locals.validatedParams as {
      id: string;
    };

  const body =
    res.locals.validatedBody;

  const result = await stockIn(
    req.user!.businessId,
    params.id,
    body,
  );

  successResponse(
    res,
    result,
    200,
    "Stock berhasil ditambahkan",
  );
};

export const stockOutInventory = async (
  req: Request,
  res: Response,
) => {
  const params =
    res.locals.validatedParams as {
      id: string;
    };

  const body =
    res.locals.validatedBody;

  const result = await stockOut(
    req.user!.businessId,
    params.id,
    body,
  );

  successResponse(
    res,
    result,
    200,
    "Stock berhasil dikurangi",
  );
};

export const adjustInventory = async (
  req: Request,
  res: Response,
) => {
  const params =
    res.locals.validatedParams as {
      id: string;
    };

  const body =
    res.locals.validatedBody;

  const result = await adjustStock(
    req.user!.businessId,
    params.id,
    body,
  );

  successResponse(
    res,
    result,
    200,
    result.changed
      ? "Stock berhasil disesuaikan"
      : "Stock tidak mengalami perubahan",
  );
};

export const getInventoryTransactions =
  async (
    req: Request,
    res: Response,
  ) => {
    const params =
      res.locals.validatedParams as {
        id: string;
      };

    const result =
      await listInventoryTransactions(
        req.user!.businessId,
        params.id,
      );

    successResponse(res, result);
  };