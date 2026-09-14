import type { Customer, CustomerStatus } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/client";

export type SegmentRuleField =
  | "totalOrders"
  | "totalSpent"
  | "averageOrderValue"
  | "status"
  | "firstOrderAt"
  | "lastOrderAt";

export type SegmentRuleOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "within_days"
  | "older_than_days";

export interface SegmentRule {
  field: SegmentRuleField;
  operator: SegmentRuleOperator;
  value: string | number | null;
}

export interface SegmentRules {
  all?: SegmentRule[];
  any?: SegmentRule[];
}

type CustomerForSegment = {
  totalOrders: number;
  totalSpent: number | Decimal;
  averageOrderValue: number | Decimal;
  status: Customer["status"];
  firstOrderAt: Date | null;
  lastOrderAt: Date | null;
};

const getFieldValue = (
  customer: CustomerForSegment,
  field: SegmentRuleField,
): string | number | Date | null => {
  switch (field) {
    case "totalOrders":
      return customer.totalOrders;

    case "totalSpent":
      return Number(customer.totalSpent);

    case "averageOrderValue":
      return Number(customer.averageOrderValue);

    case "status":
      return customer.status;

    case "firstOrderAt":
      return customer.firstOrderAt;

    case "lastOrderAt":
      return customer.lastOrderAt;
  }
};

const compareValues = (
  actual: string | number | Date | null,
  operator: SegmentRuleOperator,
  expected: string | number | null,
): boolean => {
  if (actual === null) {
    return operator === "eq" && expected === null;
  }

  if (expected === null) {
    return operator === "neq";
  }

  if (
    operator === "within_days" ||
    operator === "older_than_days"
  ) {
    if (!(actual instanceof Date)) {
      return false;
    }

    const days = Number(expected);

    if (!Number.isFinite(days) || days < 0) {
      return false;
    }

    const now = Date.now();
    const actualTime = actual.getTime();

    if (operator === "within_days") {
      const threshold =
        now - days * 24 * 60 * 60 * 1000;

      return actualTime >= threshold;
    }

    const threshold =
      now - days * 24 * 60 * 60 * 1000;

    return actualTime < threshold;
  }

  if (
    actual instanceof Date
  ) {
    const actualTime = actual.getTime();
    const expectedTime =
      new Date(String(expected)).getTime();

    if (Number.isNaN(expectedTime)) {
      return false;
    }

    switch (operator) {
      case "eq":
        return actualTime === expectedTime;
      case "neq":
        return actualTime !== expectedTime;
      case "gt":
        return actualTime > expectedTime;
      case "gte":
        return actualTime >= expectedTime;
      case "lt":
        return actualTime < expectedTime;
      case "lte":
        return actualTime <= expectedTime;
    }
  }

  if (
    typeof actual === "number"
  ) {
    const numericExpected =
      Number(expected);

    if (Number.isNaN(numericExpected)) {
      return false;
    }

    switch (operator) {
      case "eq":
        return actual === numericExpected;
      case "neq":
        return actual !== numericExpected;
      case "gt":
        return actual > numericExpected;
      case "gte":
        return actual >= numericExpected;
      case "lt":
        return actual < numericExpected;
      case "lte":
        return actual <= numericExpected;
    }
  }

  const actualString = String(actual);
  const expectedString = String(expected);

  switch (operator) {
    case "eq":
      return actualString === expectedString;

    case "neq":
      return actualString !== expectedString;

    case "gt":
      return actualString > expectedString;

    case "gte":
      return actualString >= expectedString;

    case "lt":
      return actualString < expectedString;

    case "lte":
      return actualString <= expectedString;
  }
};

export const evaluateSegmentRule = (
  customer: CustomerForSegment,
  rule: SegmentRule,
): boolean => {
  const actual = getFieldValue(
    customer,
    rule.field,
  );

  return compareValues(
    actual,
    rule.operator,
    rule.value,
  );
};

export const evaluateSegmentRules = (
  customer: CustomerForSegment,
  rules: SegmentRules,
): boolean => {
  const allRules = rules.all ?? [];
  const anyRules = rules.any ?? [];

  const matchesAll =
    allRules.length === 0 ||
    allRules.every((rule) =>
      evaluateSegmentRule(
        customer,
        rule,
      ),
    );

  const matchesAny =
    anyRules.length === 0 ||
    anyRules.some((rule) =>
      evaluateSegmentRule(
        customer,
        rule,
      ),
    );

  return matchesAll && matchesAny;
};

export const isValidSegmentRules = (
  rules: unknown,
): rules is SegmentRules => {
  if (
    typeof rules !== "object" ||
    rules === null ||
    Array.isArray(rules)
  ) {
    return false;
  }

  const value = rules as Record<string, unknown>;

  if (
    value.all !== undefined &&
    !Array.isArray(value.all)
  ) {
    return false;
  }

  if (
    value.any !== undefined &&
    !Array.isArray(value.any)
  ) {
    return false;
  }

  if (
    value.all === undefined &&
    value.any === undefined
  ) {
    return false;
  }

  const isValidRule = (
    rule: unknown,
  ): boolean => {
    if (
      typeof rule !== "object" ||
      rule === null ||
      Array.isArray(rule)
    ) {
      return false;
    }

    const item =
      rule as Record<string, unknown>;

    const validFields = [
      "totalOrders",
      "totalSpent",
      "averageOrderValue",
      "status",
      "firstOrderAt",
      "lastOrderAt",
    ];

    const validOperators = [
      "eq",
      "neq",
      "gt",
      "gte",
      "lt",
      "lte",
      "within_days",
      "older_than_days",
    ];

    if (
      !validFields.includes(
        item.field as string,
      )
    ) {
      return false;
    }

    if (
      !validOperators.includes(
        item.operator as string,
      )
    ) {
      return false;
    }

    const value = item.value;

    if (
      value !== null &&
      typeof value !== "string" &&
      typeof value !== "number"
    ) {
      return false;
    }

    return true;
  };

  const allRules = value.all;
  const anyRules = value.any;

  if (
    allRules !== undefined &&
    !allRules.every(isValidRule)
  ) {
    return false;
  }

  if (
    anyRules !== undefined &&
    !anyRules.every(isValidRule)
  ) {
    return false;
  }

  return true;
};