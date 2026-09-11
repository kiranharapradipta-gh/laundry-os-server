import type {
  NextFunction,
  Request,
  Response,
} from "express";

import type { ZodType } from "zod";

type ValidationSource =
  | "body"
  | "query"
  | "params";

export const validate = <T>(
  schema: ZodType<T>,
  source: ValidationSource = "body",
) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const result = schema.safeParse(
      req[source],
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: result.error.issues.map(
          (issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }),
        ),
      });

      return;
    }

    if (source === "body") {
      res.locals.validatedBody =
        result.data;
    }

    if (source === "query") {
      res.locals.validatedQuery =
        result.data;
    }

    if (source === "params") {
      res.locals.validatedParams =
        result.data;
    }

    next();
  };
};