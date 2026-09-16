import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

import {
  calculateAdjustment,
  calculateStock,
  ensureNonNegativeStock,
  ensurePositiveQuantity,
  isLowStock,
  isStockOutTransaction,
  toDecimal,
} from "../src/modules/inventory/inventory.rules.js";

describe("inventory.rules", () => {
  describe("toDecimal", () => {
    it("should convert number to Prisma Decimal", () => {
      const result = toDecimal(10);

      expect(result).toBeInstanceOf(Prisma.Decimal);
      expect(result.toString()).toBe("10");
    });

    it("should convert string to Prisma Decimal", () => {
      const result = toDecimal("12.500");

      expect(result.toString()).toBe("12.5");
    });
  });

  describe("ensurePositiveQuantity", () => {
    it("should accept positive quantity", () => {
      expect(() => {
        ensurePositiveQuantity(toDecimal(10));
      }).not.toThrow();
    });

    it("should reject zero", () => {
      expect(() => {
        ensurePositiveQuantity(toDecimal(0));
      }).toThrow("Quantity harus lebih besar dari 0");
    });

    it("should reject negative quantity", () => {
      expect(() => {
        ensurePositiveQuantity(toDecimal(-1));
      }).toThrow("Quantity harus lebih besar dari 0");
    });
  });

  describe("ensureNonNegativeStock", () => {
    it("should accept zero", () => {
      expect(() => {
        ensureNonNegativeStock(toDecimal(0));
      }).not.toThrow();
    });

    it("should accept positive stock", () => {
      expect(() => {
        ensureNonNegativeStock(toDecimal(10));
      }).not.toThrow();
    });

    it("should reject negative stock", () => {
      expect(() => {
        ensureNonNegativeStock(toDecimal(-0.001));
      }).toThrow("Stock tidak boleh kurang dari 0");
    });
  });

  describe("isStockOutTransaction", () => {
    it("should identify stock-out transactions", () => {
      expect(isStockOutTransaction("USAGE")).toBe(true);
      expect(isStockOutTransaction("SALE")).toBe(true);
      expect(isStockOutTransaction("ADJUSTMENT_OUT")).toBe(true);
      expect(isStockOutTransaction("TRANSFER_OUT")).toBe(true);
      expect(isStockOutTransaction("WASTE")).toBe(true);
    });

    it("should identify stock-in transactions", () => {
      expect(isStockOutTransaction("PURCHASE")).toBe(false);
      expect(isStockOutTransaction("RETURN")).toBe(false);
      expect(isStockOutTransaction("INITIAL_STOCK")).toBe(false);
      expect(isStockOutTransaction("TRANSFER_IN")).toBe(false);
      expect(isStockOutTransaction("ADJUSTMENT_IN")).toBe(false);
    });
  });

  describe("calculateStock", () => {
    it("should increase stock for stock-in transaction", () => {
      const result = calculateStock(
        toDecimal(10),
        toDecimal(5),
        "PURCHASE",
      );

      expect(result.toString()).toBe("15");
    });

    it("should decrease stock for stock-out transaction", () => {
      const result = calculateStock(
        toDecimal(10),
        toDecimal(3),
        "USAGE",
      );

      expect(result.toString()).toBe("7");
    });

    it("should support decimal quantities", () => {
      const result = calculateStock(
        toDecimal("10.5"),
        toDecimal("2.25"),
        "USAGE",
      );

      expect(result.toString()).toBe("8.25");
    });
  });

  describe("isLowStock", () => {
    it("should return true when stock is below minimum", () => {
      expect(
        isLowStock(toDecimal(3), toDecimal(5)),
      ).toBe(true);
    });

    it("should return true when stock equals minimum", () => {
      expect(
        isLowStock(toDecimal(5), toDecimal(5)),
      ).toBe(true);
    });

    it("should return false when stock is above minimum", () => {
      expect(
        isLowStock(toDecimal(6), toDecimal(5)),
      ).toBe(false);
    });
  });

  describe("calculateAdjustment", () => {
    it("should calculate adjustment in", () => {
      const result = calculateAdjustment(
        toDecimal(10),
        toDecimal(15),
      );

      expect(result.delta.toString()).toBe("5");
      expect(result.type).toBe("ADJUSTMENT_IN");
    });

    it("should calculate adjustment out", () => {
      const result = calculateAdjustment(
        toDecimal(15),
        toDecimal(10),
      );

      expect(result.delta.toString()).toBe("5");
      expect(result.type).toBe("ADJUSTMENT_OUT");
    });

    it("should return null type when stock does not change", () => {
      const result = calculateAdjustment(
        toDecimal(10),
        toDecimal(10),
      );

      expect(result.delta.toString()).toBe("0");
      expect(result.type).toBeNull();
    });

    it("should handle decimal adjustment", () => {
      const result = calculateAdjustment(
        toDecimal("10.5"),
        toDecimal("12.75"),
      );

      expect(result.delta.toString()).toBe("2.25");
      expect(result.type).toBe("ADJUSTMENT_IN");
    });
  });
});