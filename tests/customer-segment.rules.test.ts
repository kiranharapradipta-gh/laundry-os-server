import { describe, expect, it } from "vitest";

import {
  evaluateSegmentRule,
  evaluateSegmentRules,
} from "../src/modules/customer-segments/customer-segment.rules.js";

const customer = {
  totalOrders: 10,
  totalSpent: 1500000,
  averageOrderValue: 150000,
  status: "ACTIVE" as const,
  firstOrderAt: new Date("2026-01-01T00:00:00.000Z"),
  lastOrderAt: new Date(),
};

describe("Customer Segment Rule Engine", () => {
  describe("numeric rules", () => {
    it("matches gte", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "totalSpent",
          operator: "gte",
          value: 1000000,
        }),
      ).toBe(true);
    });

    it("rejects gte when value is too low", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "totalSpent",
          operator: "gte",
          value: 2000000,
        }),
      ).toBe(false);
    });

    it("matches gt", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "totalOrders",
          operator: "gt",
          value: 5,
        }),
      ).toBe(true);
    });

    it("matches lt", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "averageOrderValue",
          operator: "lt",
          value: 200000,
        }),
      ).toBe(true);
    });

    it("matches eq", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "totalOrders",
          operator: "eq",
          value: 10,
        }),
      ).toBe(true);
    });

    it("matches neq", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "totalOrders",
          operator: "neq",
          value: 5,
        }),
      ).toBe(true);
    });
  });

  describe("status rules", () => {
    it("matches customer status", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "status",
          operator: "eq",
          value: "ACTIVE",
        }),
      ).toBe(true);
    });

    it("rejects different status", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "status",
          operator: "eq",
          value: "INACTIVE",
        }),
      ).toBe(false);
    });
  });

  describe("null rules", () => {
    it("matches null with eq", () => {
      const customerWithoutOrder = {
        ...customer,
        lastOrderAt: null,
      };

      expect(
        evaluateSegmentRule(
          customerWithoutOrder,
          {
            field: "lastOrderAt",
            operator: "eq",
            value: null,
          },
        ),
      ).toBe(true);
    });

    it("does not match null with neq", () => {
      const customerWithoutOrder = {
        ...customer,
        lastOrderAt: null,
      };

      expect(
        evaluateSegmentRule(
          customerWithoutOrder,
          {
            field: "lastOrderAt",
            operator: "neq",
            value: null,
          },
        ),
      ).toBe(false);
    });

    it("does not match non-null value against null", () => {
      expect(
        evaluateSegmentRule(customer, {
          field: "lastOrderAt",
          operator: "eq",
          value: null,
        }),
      ).toBe(false);
    });
  });

  describe("relative date rules", () => {
    it("matches within_days", () => {
      const recentCustomer = {
        ...customer,
        lastOrderAt: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ),
      };

      expect(
        evaluateSegmentRule(
          recentCustomer,
          {
            field: "lastOrderAt",
            operator: "within_days",
            value: 7,
          },
        ),
      ).toBe(true);
    });

    it("rejects within_days when date is too old", () => {
      const oldCustomer = {
        ...customer,
        lastOrderAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ),
      };

      expect(
        evaluateSegmentRule(
          oldCustomer,
          {
            field: "lastOrderAt",
            operator: "within_days",
            value: 7,
          },
        ),
      ).toBe(false);
    });

    it("matches older_than_days", () => {
      const oldCustomer = {
        ...customer,
        lastOrderAt: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000,
        ),
      };

      expect(
        evaluateSegmentRule(
          oldCustomer,
          {
            field: "lastOrderAt",
            operator: "older_than_days",
            value: 30,
          },
        ),
      ).toBe(true);
    });

    it("rejects older_than_days when customer is recent", () => {
      const recentCustomer = {
        ...customer,
        lastOrderAt: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000,
        ),
      };

      expect(
        evaluateSegmentRule(
          recentCustomer,
          {
            field: "lastOrderAt",
            operator: "older_than_days",
            value: 30,
          },
        ),
      ).toBe(false);
    });
  });

  describe("all rules", () => {
    it("requires every all rule to match", () => {
      expect(
        evaluateSegmentRules(customer, {
          all: [
            {
              field: "totalOrders",
              operator: "gte",
              value: 5,
            },
            {
              field: "totalSpent",
              operator: "gte",
              value: 1000000,
            },
          ],
        }),
      ).toBe(true);
    });

    it("rejects when one all rule fails", () => {
      expect(
        evaluateSegmentRules(customer, {
          all: [
            {
              field: "totalOrders",
              operator: "gte",
              value: 5,
            },
            {
              field: "totalSpent",
              operator: "gte",
              value: 5000000,
            },
          ],
        }),
      ).toBe(false);
    });
  });

  describe("any rules", () => {
    it("matches when at least one any rule matches", () => {
      expect(
        evaluateSegmentRules(customer, {
          any: [
            {
              field: "totalSpent",
              operator: "gte",
              value: 5000000,
            },
            {
              field: "totalOrders",
              operator: "gte",
              value: 10,
            },
          ],
        }),
      ).toBe(true);
    });

    it("rejects when every any rule fails", () => {
      expect(
        evaluateSegmentRules(customer, {
          any: [
            {
              field: "totalSpent",
              operator: "gte",
              value: 5000000,
            },
            {
              field: "totalOrders",
              operator: "gte",
              value: 20,
            },
          ],
        }),
      ).toBe(false);
    });
  });

  describe("combined rules", () => {
    it("requires all and any groups to match", () => {
      expect(
        evaluateSegmentRules(customer, {
          all: [
            {
              field: "status",
              operator: "eq",
              value: "ACTIVE",
            },
          ],
          any: [
            {
              field: "totalOrders",
              operator: "gte",
              value: 10,
            },
            {
              field: "totalSpent",
              operator: "gte",
              value: 5000000,
            },
          ],
        }),
      ).toBe(true);
    });

    it("returns true when rules are empty", () => {
      expect(
        evaluateSegmentRules(customer, {}),
      ).toBe(true);
    });
  });
});