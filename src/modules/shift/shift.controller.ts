import type { Request, Response } from "express";
import {
  listShifts,
  getShiftById,
  openShift,
  closeShift,
  listCashMovements,
  addCashMovement,
} from "./shift.service.js";

export const getShifts = async (
  req: Request,
  res: Response,
) => {
  const result = await listShifts(
    req.user!.businessId,
    res.locals.validatedQuery,
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
};

export const getShift = async (
  req: Request,
  res: Response,
) => {
  const result = await getShiftById(
    req.user!.businessId,
    res.locals.validatedParams.id,
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
};

export const createShift = async (
  req: Request,
  res: Response,
) => {
  const result = await openShift(
    req.user!.businessId,
    res.locals.validatedBody,
  );

  return res.status(201).json({
    success: true,
    message: "Shift berhasil dibuka",
    data: result,
  });
};

export const closeShiftController = async (
  req: Request,
  res: Response,
) => {
  const result = await closeShift(
    req.user!.businessId,
    res.locals.validatedParams.id,
    res.locals.validatedBody,
  );

  return res.status(200).json({
    success: true,
    message: "Shift berhasil ditutup",
    data: result,
  });
};

export const getCashMovements = async (
  req: Request,
  res: Response,
) => {
  const result = await listCashMovements(
    req.user!.businessId,
    res.locals.validatedParams.id,
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
};

export const cashIn = async (
  req: Request,
  res: Response,
) => {
  const result = await addCashMovement(
    req.user!.businessId,
    res.locals.validatedParams.id,
    {
      ...res.locals.validatedBody,
      type: "CASH_IN",
    },
  );

  return res.status(201).json({
    success: true,
    message: "Cash in berhasil dicatat",
    data: result,
  });
};

export const cashOut = async (
  req: Request,
  res: Response,
) => {
  const result = await addCashMovement(
    req.user!.businessId,
    res.locals.validatedParams.id,
    {
      ...res.locals.validatedBody,
      type: "CASH_OUT",
    },
  );

  return res.status(201).json({
    success: true,
    message: "Cash out berhasil dicatat",
    data: result,
  });
};