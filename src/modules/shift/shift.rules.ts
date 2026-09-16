import { Prisma } from "@prisma/client";

export const toDecimal = (
  value: Prisma.Decimal | number | string,
): Prisma.Decimal => {
  return new Prisma.Decimal(value);
};

export const ensureNonNegative = (
  value: Prisma.Decimal,
  message: string,
) => {
  if (value.lt(0)) {
    throw new Error(message);
  }
};

export const ensurePositive = (
  value: Prisma.Decimal,
  message: string,
) => {
  if (value.lte(0)) {
    throw new Error(message);
  }
};

export const calculateExpectedCash = (
  openingCash: Prisma.Decimal,
  cashIn: Prisma.Decimal,
  cashOut: Prisma.Decimal,
) => {
  return openingCash
    .plus(cashIn)
    .minus(cashOut);
};

export const calculateVariance = (
  actualCash: Prisma.Decimal,
  expectedCash: Prisma.Decimal,
) => {
  return actualCash.minus(expectedCash);
};