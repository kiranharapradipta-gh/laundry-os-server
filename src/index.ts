import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes.js";

import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { httpLoggerMiddleware } from "./middleware/http-logger.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

import customerRoutes from "./modules/customers/customer.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(requestIdMiddleware);
app.use(httpLoggerMiddleware);

/*
 * Routes
 */
app.use("/api/auth", authRoutes);

app.use(
  "/api/customers",
  customerRoutes,
);

/*
 * 404
 */
app.use(notFoundMiddleware);

/*
 * Global error handler
 */
app.use(errorMiddleware);

const port = 3000;

app.listen(port, () => {
  console.log(
    `API running on http://localhost:${port}`,
  );
});