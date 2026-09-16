import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const transactionMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),

  inventoryItem: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },

  inventoryTransaction: {
    create: vi.fn(),
  },

  stockAdjustment: {
    create: vi.fn(),
  },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),

  inventoryItem: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },

  inventoryTransaction: {
    findMany: vi.fn(),
  },

  branch: {
    findFirst: vi.fn(),
  },
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

import { Prisma } from "@prisma/client";

import {
  adjustStock,
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItemById,
  listInventoryItems,
  listInventoryTransactions,
  stockIn,
  stockOut,
  updateInventoryItem,
} from "../src/modules/inventory/inventory.service.js";

const businessId =
  "4999e4ca-f860-4d3f-84f7-15b04d402eb2";

const otherBusinessId =
  "5999e4ca-f860-4d3f-84f7-15b04d402eb3";

const itemId =
  "11111111-1111-4111-8111-111111111111";

const branchId =
  "22222222-2222-4222-8222-222222222222";

const createItem = (
  overrides: Record<string, unknown> = {},
) => ({
  id: itemId,
  businessId,
  branchId: null,
  sku: "DET-001",
  name: "Detergent",
  description: null,
  unit: "kg",
  currentStock: new Prisma.Decimal("10"),
  minimumStock: new Prisma.Decimal("5"),
  maximumStock: null,
  costPrice: new Prisma.Decimal("15000"),
  active: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();

  transactionMock.$queryRaw.mockResolvedValue([
    {
      id: itemId,
      businessId,
      branchId: null,
      sku: "DET-001",
      name: "Detergent",
      description: null,
      unit: "kg",
      currentStock: new Prisma.Decimal("10"),
      minimumStock: new Prisma.Decimal("5"),
      maximumStock: new Prisma.Decimal("50"),
      costPrice: new Prisma.Decimal("15000"),
      active: true,
    },
  ]);

  prismaMock.$transaction.mockImplementation(async (input: unknown) => {
    if (typeof input === "function") {
      return input(transactionMock);
    }

    if (Array.isArray(input)) {
      return Promise.all(input);
    }

    throw new Error("Unsupported $transaction mock input");
  });

  prismaMock.branch.findFirst.mockResolvedValue({
    id: branchId,
    name: "Main Branch",
  });

  prismaMock.inventoryItem.findFirst.mockResolvedValue(
    createItem(),
  );

  prismaMock.inventoryItem.findUnique.mockResolvedValue(
    null,
  );

  prismaMock.inventoryItem.findMany.mockResolvedValue(
    [createItem()],
  );

  prismaMock.inventoryItem.count.mockResolvedValue(1);

  prismaMock.inventoryItem.create.mockResolvedValue(
    createItem(),
  );

  prismaMock.inventoryItem.update.mockResolvedValue(
    createItem(),
  );

  transactionMock.inventoryItem.findFirst.mockResolvedValue(
    createItem(),
  );

  transactionMock.inventoryItem.update.mockResolvedValue(
    createItem(),
  );

  transactionMock.inventoryTransaction.create.mockResolvedValue(
    {
      id: "transaction-1",
      inventoryItemId: itemId,
      type: "PURCHASE",
      quantity: new Prisma.Decimal("5"),
      beforeStock: new Prisma.Decimal("10"),
      afterStock: new Prisma.Decimal("15"),
    },
  );

  transactionMock.stockAdjustment.create.mockResolvedValue(
    {
      id: "adjustment-1",
      inventoryItemId: itemId,
      quantity: new Prisma.Decimal("5"),
      reason: "COUNT_CORRECTION",
      notes: null,
    },
  );

  prismaMock.inventoryTransaction.findMany.mockResolvedValue(
    [
      {
        id: "transaction-1",
        inventoryItemId: itemId,
        type: "PURCHASE",
        quantity: new Prisma.Decimal("5"),
        beforeStock: new Prisma.Decimal("10"),
        afterStock: new Prisma.Decimal("15"),
      },
    ],
  );
});

describe("Inventory Service", () => {
  describe("getInventoryItemById", () => {
    it("returns inventory item belonging to business", async () => {
      const result =
        await getInventoryItemById(
          businessId,
          itemId,
        );

      expect(result.id).toBe(itemId);

      expect(
        prismaMock.inventoryItem.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: itemId,
          businessId,
        },
        select: expect.any(Object),
      });
    });

    it("throws when inventory item does not exist", async () => {
      prismaMock.inventoryItem.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        getInventoryItemById(
          businessId,
          itemId,
        ),
      ).rejects.toThrow(
        "Inventory item tidak ditemukan",
      );
    });

    it("enforces business isolation", async () => {
      await getInventoryItemById(
        otherBusinessId,
        itemId,
      );

      expect(
        prismaMock.inventoryItem.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: itemId,
            businessId: otherBusinessId,
          },
        }),
      );
    });
  });

  describe("createInventoryItem", () => {
    it("creates inventory item", async () => {
      const result =
        await createInventoryItem(
          businessId,
          {
            sku: "DET-001",
            name: "Detergent",
            unit: "kg",
            minimumStock: "5",
            maximumStock: "50",
            costPrice: "15000",
          },
        );

      expect(result.id).toBe(itemId);

      expect(
        prismaMock.inventoryItem.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId,
            sku: "DET-001",
            name: "Detergent",
            unit: "kg",
            minimumStock: new Prisma.Decimal("5"),
            maximumStock: new Prisma.Decimal("50"),
            costPrice: new Prisma.Decimal("15000"),
          }),
          select: expect.any(Object),
        }),
      );
    });

    it("rejects duplicate SKU", async () => {
      prismaMock.inventoryItem.findUnique.mockResolvedValue(
        {
          id: "existing-item",
        },
      );

      await expect(
        createInventoryItem(
          businessId,
          {
            sku: "DET-001",
            name: "Detergent",
            unit: "kg",
          },
        ),
      ).rejects.toThrow(
        "SKU inventory sudah digunakan",
      );

      expect(
        prismaMock.inventoryItem.create,
      ).not.toHaveBeenCalled();
    });

    it("rejects invalid branch ownership", async () => {
      prismaMock.branch.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        createInventoryItem(
          businessId,
          {
            sku: "DET-001",
            name: "Detergent",
            unit: "kg",
            branchId,
          },
        ),
      ).rejects.toThrow(
        "Branch tidak ditemukan",
      );

      expect(
        prismaMock.inventoryItem.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe("updateInventoryItem", () => {
    it("updates inventory item", async () => {
      const result =
        await updateInventoryItem(
          businessId,
          itemId,
          {
            name: "Detergent Premium",
            minimumStock: "8",
            costPrice: "17000",
          },
        );

      expect(result.id).toBe(itemId);

      expect(
        prismaMock.inventoryItem.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: itemId,
          },
          data: expect.objectContaining({
            name: "Detergent Premium",
            minimumStock:
              new Prisma.Decimal("8"),
            costPrice:
              new Prisma.Decimal("17000"),
          }),
        }),
      );
    });

    it("rejects duplicate SKU during update", async () => {
      prismaMock.inventoryItem.findFirst
        .mockResolvedValueOnce(createItem())
        .mockResolvedValueOnce({
          id: "another-item",
        });

      await expect(
        updateInventoryItem(
          businessId,
          itemId,
          {
            sku: "EXISTING-SKU",
          },
        ),
      ).rejects.toThrow(
        "SKU inventory sudah digunakan",
      );

      expect(
        prismaMock.inventoryItem.update,
      ).not.toHaveBeenCalled();
    });

    it("rejects update for missing inventory item", async () => {
      prismaMock.inventoryItem.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        updateInventoryItem(
          businessId,
          itemId,
          {
            name: "Updated",
          },
        ),
      ).rejects.toThrow(
        "Inventory item tidak ditemukan",
      );
    });
  });

  describe("deleteInventoryItem", () => {
    it("soft deletes inventory item", async () => {
      await deleteInventoryItem(
        businessId,
        itemId,
      );

      expect(
        prismaMock.inventoryItem.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: itemId,
          },
          data: {
            active: false,
          },
        }),
      );
    });

    it("rejects deleting another business item", async () => {
      prismaMock.inventoryItem.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        deleteInventoryItem(
          otherBusinessId,
          itemId,
        ),
      ).rejects.toThrow(
        "Inventory item tidak ditemukan",
      );

      expect(
        prismaMock.inventoryItem.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe("stockIn", () => {
    it("increases stock and creates transaction", async () => {
      await stockIn(
        businessId,
        itemId,
        {
          quantity: "5",
          unitCost: "15000",
          notes: "Pembelian stock",
        },
      );

      expect(
        transactionMock.inventoryItem.update,
      ).toHaveBeenCalledWith({
        where: {
          id: itemId,
        },
        data: {
          currentStock:
            new Prisma.Decimal("15"),
        },
      });

      expect(
        transactionMock.inventoryTransaction.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          inventoryItemId: itemId,
          type: "PURCHASE",
          quantity:
            new Prisma.Decimal("5"),
          beforeStock:
            new Prisma.Decimal("10"),
          afterStock:
            new Prisma.Decimal("15"),
          unitCost:
            new Prisma.Decimal("15000"),
          notes: "Pembelian stock",
        }),
      });
    });

    it("rejects zero quantity", async () => {
      await expect(
        stockIn(
          businessId,
          itemId,
          {
            quantity: "0",
          },
        ),
      ).rejects.toThrow(
        "Quantity harus lebih besar dari 0",
      );

      expect(
        prismaMock.$transaction,
      ).not.toHaveBeenCalled();
    });
  });

  describe("stockOut", () => {
    it("decreases stock and creates transaction", async () => {
      await stockOut(
        businessId,
        itemId,
        {
          quantity: "3",
          notes: "Pemakaian",
        },
      );

      expect(
        transactionMock.inventoryItem.update,
      ).toHaveBeenCalledWith({
        where: {
          id: itemId,
        },
        data: {
          currentStock:
            new Prisma.Decimal("7"),
        },
      });

      expect(
        transactionMock.inventoryTransaction.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          inventoryItemId: itemId,
          type: "USAGE",
          quantity:
            new Prisma.Decimal("3"),
          beforeStock:
            new Prisma.Decimal("10"),
          afterStock:
            new Prisma.Decimal("7"),
        }),
      });
    });

    it("rejects stock out that would make stock negative", async () => {
      await expect(
        stockOut(
          businessId,
          itemId,
          {
            quantity: "11",
          },
        ),
      ).rejects.toThrow(
        "Stock tidak boleh kurang dari 0",
      );

      expect(
        transactionMock.inventoryItem.update,
      ).not.toHaveBeenCalled();

      expect(
        transactionMock.inventoryTransaction.create,
      ).not.toHaveBeenCalled();
    });

    it("rejects stock out for another business item", async () => {
      transactionMock.$queryRaw.mockResolvedValueOnce([
        {
          ...lockedInventoryItem,
          businessId: "22222222-2222-4222-8222-222222222222",
        },
      ]);

      await expect(
        inventoryService.stockOut(
          inventoryItemId,
          businessId,
          {
            quantity: 5,
            type: "PURCHASE",
          },
        ),
      ).rejects.toThrow(
        "Inventory item tidak ditemukan",
      );
    });
  });

  describe("adjustStock", () => {
    it("performs adjustment in", async () => {
      const result =
        await adjustStock(
          businessId,
          itemId,
          {
            actualStock: "15",
            reason: "COUNT_CORRECTION",
            notes: "Hasil stock opname",
          },
        );

      expect(result.changed).toBe(true);
      expect(result.delta.toString()).toBe("5");
      expect(result.type).toBe(
        "ADJUSTMENT_IN",
      );

      expect(
        transactionMock.inventoryItem.update,
      ).toHaveBeenCalledWith({
        where: {
          id: itemId,
        },
        data: {
          currentStock:
            new Prisma.Decimal("15"),
        },
      });

      expect(
        transactionMock.stockAdjustment.create,
      ).toHaveBeenCalledWith({
        data: {
          inventoryItemId: itemId,
          quantity:
            new Prisma.Decimal("5"),
          reason: "COUNT_CORRECTION",
          notes: "Hasil stock opname",
        },
      });

      expect(
        transactionMock.inventoryTransaction.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          inventoryItemId: itemId,
          type: "ADJUSTMENT_IN",
          quantity:
            new Prisma.Decimal("5"),
          beforeStock:
            new Prisma.Decimal("10"),
          afterStock:
            new Prisma.Decimal("15"),
        }),
      });
    });

    it("performs adjustment out", async () => {
      const result =
        await adjustStock(
          businessId,
          itemId,
          {
            actualStock: "7",
            reason: "DAMAGED",
          },
        );

      expect(result.changed).toBe(true);
      expect(result.delta.toString()).toBe("3");
      expect(result.type).toBe(
        "ADJUSTMENT_OUT",
      );

      expect(
        transactionMock.inventoryItem.update,
      ).toHaveBeenCalledWith({
        where: {
          id: itemId,
        },
        data: {
          currentStock:
            new Prisma.Decimal("7"),
        },
      });
    });

    it("does nothing when actual stock is unchanged", async () => {
      const result =
        await adjustStock(
          businessId,
          itemId,
          {
            actualStock: "10",
            reason: "COUNT_CORRECTION",
          },
        );

      expect(result.changed).toBe(false);
      expect(result.delta.toString()).toBe("0");
      expect(result.type).toBeNull();
      expect(result.transaction).toBeNull();
      expect(result.adjustment).toBeNull();

      expect(
        transactionMock.inventoryItem.update,
      ).not.toHaveBeenCalled();

      expect(
        transactionMock.stockAdjustment.create,
      ).not.toHaveBeenCalled();

      expect(
        transactionMock.inventoryTransaction.create,
      ).not.toHaveBeenCalled();
    });

    it("rejects negative actual stock", async () => {
      await expect(
        adjustStock(
          businessId,
          itemId,
          {
            actualStock: "-1",
            reason: "COUNT_CORRECTION",
          },
        ),
      ).rejects.toThrow(
        "Stock tidak boleh kurang dari 0",
      );

      expect(
        prismaMock.$transaction,
      ).not.toHaveBeenCalled();
    });
  });

  describe("listInventoryTransactions", () => {
    it("returns transaction history", async () => {
      const result =
        await listInventoryTransactions(
          businessId,
          itemId,
        );

      expect(result).toHaveLength(1);

      expect(
        prismaMock.inventoryTransaction.findMany,
      ).toHaveBeenCalledWith({
        where: {
          inventoryItem: {
            businessId,
          },
          inventoryItemId: itemId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("rejects transaction history for another business", async () => {
      prismaMock.inventoryItem.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        listInventoryTransactions(
          otherBusinessId,
          itemId,
        ),
      ).rejects.toThrow(
        "Inventory item tidak ditemukan",
      );

      expect(
        prismaMock.inventoryTransaction.findMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe("listInventoryItems", () => {
    it("lists inventory with pagination", async () => {
      const result =
        await listInventoryItems(
          businessId,
          {
            page: 2,
            limit: 10,
          },
        );

      expect(result.items).toHaveLength(1);

      expect(
        prismaMock.inventoryItem.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            businessId,
          },
          skip: 10,
          take: 10,
        }),
      );

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it("supports search filter", async () => {
      await listInventoryItems(
        businessId,
        {
          page: 1,
          limit: 20,
          search: "det",
        },
      );

      expect(
        prismaMock.inventoryItem.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            OR: [
              {
                sku: {
                  contains: "det",
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: "det",
                  mode: "insensitive",
                },
              },
            ],
          }),
        }),
      );
    });

    it("filters low stock items", async () => {
      const lowStockItem = {
        ...inventoryItem,
        currentStock: new Prisma.Decimal("3"),
        minimumStock: new Prisma.Decimal("5"),
      };

      prismaMock.$queryRaw
        .mockResolvedValueOnce([
          lowStockItem,
        ])
        .mockResolvedValueOnce([
          { total: BigInt(1) },
        ]);

      const result = await inventoryService.listInventoryItems(
        businessId,
        {
          page: 1,
          limit: 20,
          lowStock: true,
        },
      );

      expect(result.items).toHaveLength(1);
      expect(
        result.items[0].currentStock.toString(),
      ).toBe("3");
    });
  });
});