import {
  InventoryTransactionType,
  Prisma,
} from "@prisma/client";

export type InventoryListQuery = {
  page: number;
  limit: number;
  search?: string;
  branchId?: string;
  active?: boolean;
  lowStock?: boolean;
};

export type CreateInventoryItemInput = {
  sku: string;
  name: string;
  description?: string;
  unit: string;
  minimumStock?: Prisma.Decimal | number | string;
  maximumStock?: Prisma.Decimal | number | string | null;
  costPrice?: Prisma.Decimal | number | string;
  branchId?: string | null;
  active?: boolean;
};

export type UpdateInventoryItemInput = {
  sku?: string;
  name?: string;
  description?: string | null;
  unit?: string;
  minimumStock?: Prisma.Decimal | number | string;
  maximumStock?: Prisma.Decimal | number | string | null;
  costPrice?: Prisma.Decimal | number | string;
  branchId?: string | null;
  active?: boolean;
};

export type StockMovementInput = {
  quantity: Prisma.Decimal | number | string;
  type: InventoryTransactionType;
  unitCost?: Prisma.Decimal | number | string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
};

export type StockAdjustmentInput = {
  actualStock: Prisma.Decimal | number | string;
  reason:
    | "DAMAGED"
    | "LOST"
    | "EXPIRED"
    | "COUNT_CORRECTION"
    | "SYSTEM_CORRECTION"
    | "OTHER";
  notes?: string | null;
};