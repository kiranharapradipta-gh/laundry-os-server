import type {
  Request,
  Response,
} from "express";

import {
  assignCustomerToSegment,
  createCustomerSegment,
  deleteCustomerSegment,
  getCustomerSegmentById,
  listCustomerSegments,
  listSegmentCustomers,
  previewCustomerSegment,
  refreshCustomerSegment,
  removeCustomerFromSegment,
  updateCustomerSegment,
} from "./customer-segment.service.js";

import type {
  CreateCustomerSegmentInput,
  CustomerSegmentListInput,
  UpdateCustomerSegmentInput,
} from "./customer-segment.validation.js";

import {
  successResponse,
} from "../../utils/api-response.js";

export const listCustomerSegmentsController =
  async (
    req: Request,
    res: Response,
  ) => {
    const input =
      res.locals.validatedQuery as CustomerSegmentListInput;

    const businessId =
      req.user!.businessId;

    const result =
      await listCustomerSegments(
        businessId,
        input,
      );

    successResponse(res, result);
  };

export const getCustomerSegmentController =
  async (
    req: Request,
    res: Response,
  ) => {
    const { id } =
      res.locals.validatedParams as {
        id: string;
      };

    const businessId =
      req.user!.businessId;

    const result =
      await getCustomerSegmentById(
        businessId,
        id,
      );

    successResponse(res, result);
  };

export const createCustomerSegmentController =
  async (
    req: Request,
    res: Response,
  ) => {
    const input =
      res.locals.validatedBody as CreateCustomerSegmentInput;

    const businessId =
      req.user!.businessId;

    const result =
      await createCustomerSegment(
        businessId,
        input,
      );

    successResponse(
      res,
      result,
      201,
      "Customer segment berhasil dibuat",
    );
  };

export const updateCustomerSegmentController =
  async (
    req: Request,
    res: Response,
  ) => {
    const { id } =
      res.locals.validatedParams as {
        id: string;
      };

    const input =
      res.locals.validatedBody as UpdateCustomerSegmentInput;

    const businessId =
      req.user!.businessId;

    const result =
      await updateCustomerSegment(
        businessId,
        id,
        input,
      );

    successResponse(
      res,
      result,
      200,
      "Customer segment berhasil diperbarui",
    );
  };

export const deleteCustomerSegmentController =
  async (
    req: Request,
    res: Response,
  ) => {
    const { id } =
      res.locals.validatedParams as {
        id: string;
      };

    const businessId =
      req.user!.businessId;

    await deleteCustomerSegment(
      businessId,
      id,
    );

    successResponse(
      res,
      null,
      200,
      "Customer segment berhasil dihapus",
    );
  };

export const listSegmentCustomersController =
  async (
    req: Request,
    res: Response,
  ) => {
    const { segmentId } =
      res.locals.validatedParams as {
        segmentId: string;
      };

    const businessId =
      req.user!.businessId;

    const result =
      await listSegmentCustomers(
        businessId,
        segmentId,
      );

    successResponse(res, result);
  };

export const assignCustomerToSegmentController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      segmentId,
      customerId,
    } =
      res.locals.validatedParams as {
        segmentId: string;
        customerId: string;
      };

    const businessId =
      req.user!.businessId;

    const result =
      await assignCustomerToSegment(
        businessId,
        segmentId,
        customerId,
      );

    successResponse(
      res,
      result,
      201,
      "Customer berhasil ditambahkan ke segment",
    );
  };

export const removeCustomerFromSegmentController =
  async (
    req: Request,
    res: Response,
  ) => {
    const {
      segmentId,
      customerId,
    } =
      res.locals.validatedParams as {
        segmentId: string;
        customerId: string;
      };

    const businessId =
      req.user!.businessId;

    await removeCustomerFromSegment(
      businessId,
      segmentId,
      customerId,
    );

    successResponse(
      res,
      null,
      200,
      "Customer berhasil dikeluarkan dari segment",
    );
  };

export const refreshCustomerSegmentController =
  async (
    req: Request,
    res: Response,
  ) => {
    const { segmentId } =
      res.locals.validatedParams as {
        segmentId: string;
      };

    const user = req.user!;

    const result =
      await refreshCustomerSegment(
        user.businessId,
        segmentId,
      );

    return successResponse(
      res,
      result,
      200,
      "Segment berhasil di-refresh",
    );
  };

export const previewCustomerSegmentController =
  async (
    req: Request,
    res: Response,
  ) => {
    const { segmentId } =
      res.locals.validatedParams as {
        segmentId: string;
      };

    const user = req.user!;

    const result =
      await previewCustomerSegment(
        user.businessId,
        segmentId,
      );

    return successResponse(
      res,
      result,
      200,
      "Preview segment berhasil",
    );
  };