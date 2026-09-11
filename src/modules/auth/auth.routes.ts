import { Router } from "express";

import {
  loginController,
  refreshController,
  meController,
  changePasswordController,
  logoutController,
} from "./auth.controller.js";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from "./auth.validation.js";

const router = Router();

router.post(
  "/login",
  validate(loginSchema),
  loginController,
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  refreshController,
);

router.get(
  "/me",
  authMiddleware,
  meController,
);

router.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  changePasswordController,
);

router.post(
  "/logout",
  authMiddleware,
  validate(refreshTokenSchema),
  logoutController,
);

export default router;