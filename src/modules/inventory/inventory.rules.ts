import { InventoryTransactionType, Prisma } from "@prisma/client";

export const toDecimal = (
  value: Prisma.Decimal | number | string,
): Prisma.Decimal => {
  return new Prisma.Decimal(value);
};

export const ensurePositiveQuantity = (
  quantity: Prisma.Decimal,
) => {
  if (quantity.lte(0)) {
    throw new Error(
      "Quantity harus lebih besar dari 0",
    );
  }
};

export const ensureNonNegativeStock = (
  stock: Prisma.Decimal,
) => {
  if (stock.lt(0)) {
    throw new Error(
      "Stock tidak boleh kurang dari 0",
    );
  }
};

export const isStockOutTransaction = (
  type: string,
) => {
  return [
    "USAGE",
    "SALE",
    "ADJUSTMENT_OUT",
    "TRANSFER_OUT",
    "WASTE",
  ].includes(type);
};

export const calculateStock = (
  currentStock: Prisma.Decimal,
  quantity: Prisma.Decimal,
  type: string,
) => {
  if (isStockOutTransaction(type)) {
    return currentStock.minus(quantity);
  }

  return currentStock.plus(quantity);
};

export const isLowStock = (
  currentStock: Prisma.Decimal,
  minimumStock: Prisma.Decimal,
) => {
  return currentStock.lte(minimumStock);
};

export const calculateAdjustment = (
  currentStock: Prisma.Decimal,
  actualStock: Prisma.Decimal,
): {
  delta: Prisma.Decimal;
  type: InventoryTransactionType | null;
} => {
  const delta = actualStock.minus(currentStock);

  if (delta.eq(0)) {
    return {
      delta: new Prisma.Decimal(0),
      type: null,
    };
  }

  return {
    delta: delta.abs(),
    type: delta.gt(0)
      ? InventoryTransactionType.ADJUSTMENT_IN
      : InventoryTransactionType.ADJUSTMENT_OUT,
  };
};