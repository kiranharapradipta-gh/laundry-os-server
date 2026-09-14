import {
  InventoryTransactionType,
  Prisma,
} from "@prisma/client";

import { prisma } from "../../config/database.js";
import {
  conflict,
  notFound,
} from "../../utils/app-error.js";

import {
  calculateAdjustment,
  calculateStock,
  ensureNonNegativeStock,
  ensurePositiveQuantity,
  isLowStock,
  toDecimal,
} from "./inventory.rules.js";

import type {
  CreateInventoryItemInput,
  InventoryListQuery,
  StockAdjustmentInput,
  StockMovementInput,
  UpdateInventoryItemInput,
} from "./inventory.types.js";

const inventoryItemSelect = {
  id: true,
  businessId: true,
  branchId: true,
  sku: true,
  name: true,
  description: true,
  unit: true,
  currentStock: true,
  minimumStock: true,
  maximumStock: true,
  costPrice: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InventoryItemSelect;

const ensureInventoryItem = async (
  businessId: string,
  itemId: string,
) => {
  const item =
    await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        businessId,
      },
      select: inventoryItemSelect,
    });

  if (!item) {
    throw notFound(
      "Inventory item tidak ditemukan",
    );
  }

  return item;
};

const ensureBranch = async (
  businessId: string,
  branchId: string,
) => {
  const branch =
    await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessId,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!branch) {
    throw notFound(
      "Branch tidak ditemukan",
    );
  }

  return branch;
};

export const listInventoryItems = async (
  businessId: string,
  query: InventoryListQuery,
) => {
  const {
    page,
    limit,
    search,
    branchId,
    active,
    lowStock,
  } = query;

  const where: Prisma.InventoryItemWhereInput = {
    businessId,
    ...(branchId
      ? { branchId }
      : {}),
    ...(active !== undefined
      ? { active }
      : {}),
    ...(search
      ? {
          OR: [
            {
              sku: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] =
    await prisma.$transaction([
      prisma.inventoryItem.findMany({
        where,
        orderBy: {
          name: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
        select: inventoryItemSelect,
      }),
      prisma.inventoryItem.count({
        where,
      }),
    ]);

  const filteredItems =
    lowStock === true
      ? items.filter((item) =>
          isLowStock(
            item.currentStock,
            item.minimumStock,
          ),
        )
      : items;

  return {
    items: filteredItems,
    pagination: {
      page,
      limit,
      total:
        lowStock === true
          ? filteredItems.length
          : total,
      totalPages:
        lowStock === true
          ? Math.ceil(
              filteredItems.length / limit,
            )
          : Math.ceil(total / limit),
    },
  };
};

export const getInventoryItemById =
  async (
    businessId: string,
    itemId: string,
  ) => {
    return ensureInventoryItem(
      businessId,
      itemId,
    );
  };

export const createInventoryItem =
  async (
    businessId: string,
    input: CreateInventoryItemInput,
  ) => {
    if (input.branchId) {
      await ensureBranch(
        businessId,
        input.branchId,
      );
    }

    const existing =
      await prisma.inventoryItem.findUnique({
        where: {
          businessId_sku: {
            businessId,
            sku: input.sku,
          },
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      throw conflict(
        "SKU inventory sudah digunakan",
      );
    }

    return prisma.inventoryItem.create({
      data: {
        businessId,
        sku: input.sku,
        name: input.name,
        description:
          input.description ?? null,
        unit: input.unit,
        minimumStock:
          input.minimumStock !== undefined
            ? toDecimal(
                input.minimumStock,
              )
            : new Prisma.Decimal(0),
        maximumStock:
          input.maximumStock !== undefined
            ? input.maximumStock === null
              ? null
              : toDecimal(
                  input.maximumStock,
                )
            : null,
        costPrice:
          input.costPrice !== undefined
            ? toDecimal(input.costPrice)
            : new Prisma.Decimal(0),
        branchId:
          input.branchId ?? null,
        active:
          input.active ?? true,
      },
      select: inventoryItemSelect,
    });
  };

export const updateInventoryItem =
  async (
    businessId: string,
    itemId: string,
    input: UpdateInventoryItemInput,
  ) => {
    await ensureInventoryItem(
      businessId,
      itemId,
    );

    if (input.branchId) {
      await ensureBranch(
        businessId,
        input.branchId,
      );
    }

    if (input.sku) {
      const existing =
        await prisma.inventoryItem.findFirst({
          where: {
            businessId,
            sku: input.sku,
            NOT: {
              id: itemId,
            },
          },
          select: {
            id: true,
          },
        });

      if (existing) {
        throw conflict(
          "SKU inventory sudah digunakan",
        );
      }
    }

    return prisma.inventoryItem.update({
      where: {
        id: itemId,
      },
      data: {
        ...(input.sku !== undefined
          ? { sku: input.sku }
          : {}),
        ...(input.name !== undefined
          ? { name: input.name }
          : {}),
        ...(input.description !== undefined
          ? {
              description:
                input.description,
            }
          : {}),
        ...(input.unit !== undefined
          ? { unit: input.unit }
          : {}),
        ...(input.minimumStock !== undefined
          ? {
              minimumStock:
                toDecimal(
                  input.minimumStock,
                ),
            }
          : {}),
        ...(input.maximumStock !== undefined
          ? {
              maximumStock:
                input.maximumStock === null
                  ? null
                  : toDecimal(
                      input.maximumStock,
                    ),
            }
          : {}),
        ...(input.costPrice !== undefined
          ? {
              costPrice: toDecimal(
                input.costPrice,
              ),
            }
          : {}),
        ...(input.branchId !== undefined
          ? {
              branchId:
                input.branchId,
            }
          : {}),
        ...(input.active !== undefined
          ? {
              active: input.active,
            }
          : {}),
      },
      select: inventoryItemSelect,
    });
  };

export const deleteInventoryItem =
  async (
    businessId: string,
    itemId: string,
  ) => {
    await ensureInventoryItem(
      businessId,
      itemId,
    );

    return prisma.inventoryItem.update({
      where: {
        id: itemId,
      },
      data: {
        active: false,
      },
      select: inventoryItemSelect,
    });
  };

const createStockTransaction =
  async (
    businessId: string,
    itemId: string,
    input: StockMovementInput,
  ) => {
    const quantity = toDecimal(
      input.quantity,
    );

    ensurePositiveQuantity(quantity);

    return prisma.$transaction(
      async (tx) => {
        const item =
          await tx.inventoryItem.findFirst({
            where: {
              id: itemId,
              businessId,
            },
          });

        if (!item) {
          throw notFound(
            "Inventory item tidak ditemukan",
          );
        }

        const beforeStock =
          new Prisma.Decimal(
            item.currentStock,
          );

        const afterStock =
          calculateStock(
            beforeStock,
            quantity,
            input.type,
          );

        ensureNonNegativeStock(
          afterStock,
        );

        await tx.inventoryItem.update({
          where: {
            id: itemId,
          },
          data: {
            currentStock: afterStock,
          },
        });

        return tx.inventoryTransaction.create(
          {
            data: {
              inventoryItemId: itemId,
              type: input.type,
              quantity,
              beforeStock,
              afterStock,
              unitCost:
                input.unitCost !==
                undefined &&
                input.unitCost !== null
                  ? toDecimal(
                      input.unitCost,
                    )
                  : null,
              referenceType:
                input.referenceType ??
                null,
              referenceId:
                input.referenceId ??
                null,
              notes:
                input.notes ?? null,
            },
          },
        );
      },
    );
  };

export const stockIn = async (
  businessId: string,
  itemId: string,
  input: Omit<
    StockMovementInput,
    "type"
  >,
) => {
  return createStockTransaction(
    businessId,
    itemId,
    {
      ...input,
      type:
        InventoryTransactionType.PURCHASE,
    },
  );
};

export const stockOut = async (
  businessId: string,
  itemId: string,
  input: Omit<
    StockMovementInput,
    "type"
  >,
) => {
  return createStockTransaction(
    businessId,
    itemId,
    {
      ...input,
      type:
        InventoryTransactionType.USAGE,
    },
  );
};

export const adjustStock = async (
  businessId: string,
  itemId: string,
  input: StockAdjustmentInput,
) => {
  const actualStock = toDecimal(
    input.actualStock,
  );

  ensureNonNegativeStock(actualStock);

  return prisma.$transaction(
    async (tx) => {
      const item =
        await tx.inventoryItem.findFirst({
          where: {
            id: itemId,
            businessId,
          },
        });

      if (!item) {
        throw notFound(
          "Inventory item tidak ditemukan",
        );
      }

      const beforeStock =
        new Prisma.Decimal(
          item.currentStock,
        );

      const {
        delta,
        type,
      } = calculateAdjustment(
        beforeStock,
        actualStock,
      );

      // Tidak ada perubahan stok.
      if (type === null) {
        return {
          changed: false,
          delta: new Prisma.Decimal(0),
          type: null,
          beforeStock,
          afterStock: beforeStock,
          adjustment: null,
          transaction: null,
        };
      }

      await tx.inventoryItem.update({
        where: {
          id: itemId,
        },
        data: {
          currentStock: actualStock,
        },
      });

      const adjustment =
        await tx.stockAdjustment.create({
          data: {
            inventoryItemId: itemId,
            quantity: delta,
            reason: input.reason,
            notes: input.notes ?? null,
          },
        });

      const transaction =
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: itemId,
            type,
            quantity: delta,
            beforeStock,
            afterStock: actualStock,
            notes: input.notes ?? null,
          },
        });

      return {
        changed: true,
        delta,
        type,
        beforeStock,
        afterStock: actualStock,
        adjustment,
        transaction,
      };
    },
  );
};

export const listInventoryTransactions =
  async (
    businessId: string,
    itemId: string,
  ) => {
    await ensureInventoryItem(
      businessId,
      itemId,
    );

    return prisma.inventoryTransaction.findMany(
      {
        where: {
          inventoryItem: {
            businessId,
          },
          inventoryItemId: itemId,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    );
  };