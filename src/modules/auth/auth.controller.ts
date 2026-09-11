import type { Request, Response } from "express";
import {
  changePassword,
  getMe,
  login,
  logoutSession,
  refreshSession,
} from "./auth.service.js";

import type { RefreshTokenInput } from "./auth.types.js";

export const loginController = async (
  req: Request,
  res: Response,
) => {
  const input = req.body;

  try {
    const result = await login(input);

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Login gagal",
    });
  }
};

export const refreshController = async (
  req: Request,
  res: Response,
) => {
  const refreshToken =
    req.body?.refreshToken;

  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: "Refresh token wajib diisi",
    });
    return;
  }

  try {
    const result = await refreshSession(
      refreshToken,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Refresh token tidak valid",
    });
  }
};

export const meController = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await getMe(
      req.user.userId,
      req.user.businessId,
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unauthorized",
    });
  }
};

export const changePasswordController = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  const input = req.body;

  try {
    const result = await changePassword(
      req.user.userId,
      input,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Gagal mengubah password",
    });
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  const refreshToken =
    req.body?.refreshToken;

  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: "Refresh token wajib diisi",
    });
    return;
  }

  try {
    const result = await logoutSession(
      req.user.userId,
      refreshToken,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Logout gagal",
    });
  }
};