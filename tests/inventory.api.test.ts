import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import request from "supertest";

const prismaMock = vi.hoisted(() => ({
  businessMember: {
    findUnique: vi.fn(),
  },
}));

const inventoryServiceMock = vi.hoisted(() => ({
  listInventoryItems: vi.fn(),
  getInventoryItemById: vi.fn(),
  createInventoryItem: vi.fn(),
  updateInventoryItem: vi.fn(),
  deleteInventoryItem: vi.fn(),
  listInventoryTransactions: vi.fn(),
  stockIn: vi.fn(),
  stockOut: vi.fn(),
  adjustStock: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

vi.mock(
  "../src/modules/inventory/inventory.service.js",
  () => inventoryServiceMock,
);

import { app } from "../src/index.js";
import { signAccessToken } from "../src/utils/jwt.js";

const businessId =
  "4999e4ca-f860-4d3f-84f7-15b04d402eb2";

const userId =
  "11111111-1111-4111-8111-111111111111";

const inventoryId =
  "22222222-2222-4222-8222-222222222222";

const branchId =
  "33333333-3333-4333-8333-333333333333";

const accessToken = signAccessToken({
  userId,
  businessId,
  role: "ADMIN",
});

const authHeader = `Bearer ${accessToken}`;

const fullPermissions = [
  "inventory.read",
  "inventory.create",
  "inventory.update",
  "inventory.delete",
  "inventory.adjust",
];

const setupPermission = (
  permissions = fullPermissions,
) => {
  prismaMock.businessMember.findUnique.mockResolvedValue({
    status: "ACTIVE",
    role: {
      permissions: permissions.map((code) => ({
        permission: {
          code,
        },
      })),
    },
  });
};

const inventoryItem = {
  id: inventoryId,
  businessId,
  branchId,
  sku: "DET-001",
  name: "Detergent",
  description: "Detergent laundry",
  unit: "kg",
  currentStock: "25.000",
  minimumStock: "5.000",
  maximumStock: "100.000",
  costPrice: "15000.00",
  active: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-09-01"),
};

describe("Inventory API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setupPermission();

    inventoryServiceMock.listInventoryItems
      .mockResolvedValue({
        data: [inventoryItem],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

    inventoryServiceMock.getInventoryItemById
      .mockResolvedValue(inventoryItem);

    inventoryServiceMock.createInventoryItem
      .mockResolvedValue(inventoryItem);

    inventoryServiceMock.updateInventoryItem
      .mockResolvedValue({
        ...inventoryItem,
        name: "Detergent Updated",
      });

    inventoryServiceMock.deleteInventoryItem
      .mockResolvedValue(undefined);

    inventoryServiceMock.listInventoryTransactions
      .mockResolvedValue([
        {
          id: "44444444-4444-4444-8444-444444444444",
          inventoryItemId: inventoryId,
          type: "PURCHASE",
          quantity: "10.000",
          beforeStock: "15.000",
          afterStock: "25.000",
          unitCost: "15000.00",
          referenceType: null,
          referenceId: null,
          notes: "Restock",
          createdAt: new Date("2026-09-01"),
        },
      ]);

    inventoryServiceMock.stockIn
      .mockResolvedValue({
        item: inventoryItem,
        transaction: {
          type: "PURCHASE",
          quantity: "10.000",
          beforeStock: "25.000",
          afterStock: "35.000",
        },
      });

    inventoryServiceMock.stockOut
      .mockResolvedValue({
        item: inventoryItem,
        transaction: {
          type: "USAGE",
          quantity: "5.000",
          beforeStock: "25.000",
          afterStock: "20.000",
        },
      });

    inventoryServiceMock.adjustStock
      .mockResolvedValue({
        changed: true,
        item: inventoryItem,
        transaction: {
          type: "ADJUSTMENT_IN",
          quantity: "5.000",
          beforeStock: "25.000",
          afterStock: "30.000",
        },
        adjustment: {
          reason: "COUNT_CORRECTION",
        },
      });
  });

  describe("Authentication", () => {
    it(
      "rejects request without authentication",
      async () => {
        const response =
          await request(app).get(
            "/api/inventory",
          );

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
          success: false,
          message:
            "Authorization header wajib diisi",
        });
      },
    );

    it(
      "rejects malformed authorization header",
      async () => {
        const response =
          await request(app)
            .get("/api/inventory")
            .set(
              "Authorization",
              "Basic something",
            );

        expect(response.status).toBe(401);

        expect(
          response.body.message,
        ).toBe(
          "Format Authorization harus Bearer <token>",
        );
      },
    );

    it(
      "rejects invalid access token",
      async () => {
        const response =
          await request(app)
            .get("/api/inventory")
            .set(
              "Authorization",
              "Bearer invalid-token",
            );

        expect(response.status).toBe(401);

        expect(
          response.body.message,
        ).toBe(
          "Token tidak valid atau sudah expired",
        );
      },
    );
  });

  describe("Permission", () => {
    it(
      "rejects user without business membership",
      async () => {
        prismaMock.businessMember.findUnique
          .mockResolvedValue(null);

        const response =
          await request(app)
            .get("/api/inventory")
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(403);

        expect(
          response.body.message,
        ).toBe(
          "Business membership tidak ditemukan",
        );
      },
    );

    it(
      "rejects inactive business membership",
      async () => {
        prismaMock.businessMember.findUnique
          .mockResolvedValue({
            status: "INACTIVE",
            role: {
              permissions: [],
            },
          });

        const response =
          await request(app)
            .get("/api/inventory")
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(403);

        expect(
          response.body.message,
        ).toBe(
          "Business membership tidak aktif",
        );
      },
    );

    it(
      "rejects user without inventory.read permission",
      async () => {
        setupPermission([]);

        const response =
          await request(app)
            .get("/api/inventory")
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(403);

        expect(
          response.body.message,
        ).toBe(
          "Anda tidak memiliki permission ini",
        );

        expect(
          response.body.requiredPermission,
        ).toBe("inventory.read");
      },
    );

    it(
      "requires inventory.create permission",
      async () => {
        setupPermission([
          "inventory.read",
        ]);

        const response =
          await request(app)
            .post("/api/inventory")
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              sku: "DET-001",
              name: "Detergent",
              unit: "kg",
            });

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("inventory.create");
      },
    );

    it(
      "requires inventory.update permission",
      async () => {
        setupPermission([
          "inventory.read",
        ]);

        const response =
          await request(app)
            .patch(
              `/api/inventory/${inventoryId}`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              name: "Updated",
            });

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("inventory.update");
      },
    );

    it(
      "requires inventory.delete permission",
      async () => {
        setupPermission([
          "inventory.read",
        ]);

        const response =
          await request(app)
            .delete(
              `/api/inventory/${inventoryId}`,
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("inventory.delete");
      },
    );

    it(
      "requires inventory.adjust permission",
      async () => {
        setupPermission([
          "inventory.read",
        ]);

        const response =
          await request(app)
            .post(
              `/api/inventory/${inventoryId}/stock/in`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              quantity: 10,
              type: "PURCHASE",
            });

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("inventory.adjust");
      },
    );
  });

  describe("List", () => {
    it("lists inventory", async () => {
      const response =
        await request(app)
          .get("/api/inventory")
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(
        true,
      );

      expect(
        response.body.data,
      ).toBeDefined();

      expect(
        inventoryServiceMock.listInventoryItems,
      ).toHaveBeenCalledWith(
        businessId,
        {
          page: 1,
          limit: 20,
        },
      );
    });

    it(
      "accepts inventory list filters",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/inventory?page=2&limit=10&search=detergent&branchId=" +
                branchId +
                "&active=true&lowStock=true",
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(200);

        expect(
          inventoryServiceMock.listInventoryItems,
        ).toHaveBeenCalledWith(
          businessId,
          {
            page: 2,
            limit: 10,
            search: "detergent",
            branchId,
            active: true,
            lowStock: true,
          },
        );
      },
    );

    it(
      "rejects invalid inventory list query",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/inventory?page=0&limit=101",
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(400);

        expect(
          response.body.success,
        ).toBe(false);

        expect(
          response.body.message,
        ).toBe("Validation error");

        expect(
          inventoryServiceMock.listInventoryItems,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Get detail", () => {
    it(
      "gets inventory item by id",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/inventory/${inventoryId}`,
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(
          true,
        );

        expect(
          response.body.data.id,
        ).toBe(inventoryId);

        expect(
          inventoryServiceMock.getInventoryItemById,
        ).toHaveBeenCalledWith(
          businessId,
          inventoryId,
        );
      },
    );

    it(
      "rejects invalid inventory id",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/inventory/not-a-uuid",
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(400);

        expect(
          response.body.success,
        ).toBe(false);

        expect(
          inventoryServiceMock.getInventoryItemById,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Create", () => {
    it(
      "creates an inventory item",
      async () => {
        const payload = {
          sku: "DET-001",
          name: "Detergent",
          description:
            "Detergent laundry",
          unit: "kg",
          minimumStock: 5,
          maximumStock: 100,
          costPrice: 15000,
          branchId,
          active: true,
        };

        const response =
          await request(app)
            .post("/api/inventory")
            .set(
              "Authorization",
              authHeader,
            )
            .send(payload);

        expect(response.status).toBe(201);

        expect(response.body.success).toBe(
          true,
        );

        expect(
          response.body.message,
        ).toBe(
          "Inventory berhasil dibuat",
        );

        expect(
          inventoryServiceMock.createInventoryItem,
        ).toHaveBeenCalledWith(
          businessId,
          payload,
        );
      },
    );

    it(
      "creates inventory with minimal payload",
      async () => {
        const payload = {
          sku: "SOAP-001",
          name: "Soap",
          unit: "liter",
        };

        const response =
          await request(app)
            .post("/api/inventory")
            .set(
              "Authorization",
              authHeader,
            )
            .send(payload);

        expect(response.status).toBe(201);

        expect(
          inventoryServiceMock.createInventoryItem,
        ).toHaveBeenCalledWith(
          businessId,
          payload,
        );
      },
    );

    it(
      "rejects invalid create payload",
      async () => {
        const response =
          await request(app)
            .post("/api/inventory")
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              sku: "",
              name: "",
              unit: "",
            });

        expect(response.status).toBe(400);

        expect(
          response.body.message,
        ).toBe("Validation error");

        expect(
          inventoryServiceMock.createInventoryItem,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects maximumStock lower than minimumStock",
      async () => {
        const response =
          await request(app)
            .post("/api/inventory")
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              sku: "DET-002",
              name: "Detergent",
              unit: "kg",
              minimumStock: 20,
              maximumStock: 10,
            });

        expect(response.status).toBe(400);

        expect(
          response.body.message,
        ).toBe("Validation error");

        expect(
          inventoryServiceMock.createInventoryItem,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Update", () => {
    it(
      "updates inventory item",
      async () => {
        const payload = {
          name: "Detergent Updated",
          minimumStock: 10,
        };

        const response =
          await request(app)
            .patch(
              `/api/inventory/${inventoryId}`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send(payload);

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(
          true,
        );

        expect(
          response.body.message,
        ).toBe(
          "Inventory berhasil diperbarui",
        );

        expect(
          inventoryServiceMock.updateInventoryItem,
        ).toHaveBeenCalledWith(
          businessId,
          inventoryId,
          payload,
        );
      },
    );

    it(
      "rejects empty update payload",
      async () => {
        const response =
          await request(app)
            .patch(
              `/api/inventory/${inventoryId}`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({});

        expect(response.status).toBe(400);

        expect(
          response.body.message,
        ).toBe("Validation error");

        expect(
          inventoryServiceMock.updateInventoryItem,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects invalid update id",
      async () => {
        const response =
          await request(app)
            .patch(
              "/api/inventory/not-a-uuid",
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              name: "Updated",
            });

        expect(response.status).toBe(400);

        expect(
          inventoryServiceMock.updateInventoryItem,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Delete", () => {
    it(
      "deletes inventory item",
      async () => {
        const response =
          await request(app)
            .delete(
              `/api/inventory/${inventoryId}`,
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(
          true,
        );

        expect(
          response.body.message,
        ).toBe(
          "Inventory berhasil dihapus",
        );

        expect(
          inventoryServiceMock.deleteInventoryItem,
        ).toHaveBeenCalledWith(
          businessId,
          inventoryId,
        );
      },
    );

    it(
      "rejects invalid delete id",
      async () => {
        const response =
          await request(app)
            .delete(
              "/api/inventory/not-a-uuid",
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(400);

        expect(
          inventoryServiceMock.deleteInventoryItem,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Transactions", () => {
    it(
      "gets inventory transactions",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/inventory/${inventoryId}/transactions`,
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(
          true,
        );

        expect(
          response.body.data,
        ).toHaveLength(1);

        expect(
          inventoryServiceMock.listInventoryTransactions,
        ).toHaveBeenCalledWith(
          businessId,
          inventoryId,
        );
      },
    );

    it(
      "rejects invalid transaction inventory id",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/inventory/not-a-uuid/transactions",
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(400);

        expect(
          inventoryServiceMock.listInventoryTransactions,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Stock movement", () => {
    it(
      "adds stock",
      async () => {
        const payload = {
          quantity: 10,
          type: "PURCHASE",
          unitCost: 15000,
          notes: "Restock",
        };

        const response =
          await request(app)
            .post(
              `/api/inventory/${inventoryId}/stock/in`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send(payload);

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(
          true,
        );

        expect(
          response.body.message,
        ).toBe(
          "Stock berhasil ditambahkan",
        );

        expect(
          inventoryServiceMock.stockIn,
        ).toHaveBeenCalledWith(
          businessId,
          inventoryId,
          payload,
        );
      },
    );

    it(
      "rejects invalid stock-in quantity",
      async () => {
        const response =
          await request(app)
            .post(
              `/api/inventory/${inventoryId}/stock/in`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              quantity: 0,
              type: "PURCHASE",
            });

        expect(response.status).toBe(400);

        expect(
          response.body.message,
        ).toBe("Validation error");

        expect(
          inventoryServiceMock.stockIn,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects invalid stock-in type",
      async () => {
        const response =
          await request(app)
            .post(
              `/api/inventory/${inventoryId}/stock/in`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              quantity: 10,
              type: "INVALID",
            });

        expect(response.status).toBe(400);

        expect(
          inventoryServiceMock.stockIn,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "reduces stock",
      async () => {
        const payload = {
          quantity: 5,
          type: "USAGE",
          notes: "Laundry usage",
        };

        const response =
          await request(app)
            .post(
              `/api/inventory/${inventoryId}/stock/out`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send(payload);

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(
          true,
        );

        expect(
          response.body.message,
        ).toBe(
          "Stock berhasil dikurangi",
        );

        expect(
          inventoryServiceMock.stockOut,
        ).toHaveBeenCalledWith(
          businessId,
          inventoryId,
          payload,
        );
      },
    );
  });

  describe("Stock adjustment", () => {
    it(
      "adjusts stock",
      async () => {
        const payload = {
          actualStock: 30,
          reason: "COUNT_CORRECTION",
          notes: "Physical count",
        };

        const response =
          await request(app)
            .post(
              `/api/inventory/${inventoryId}/adjust`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send(payload);

        expect(response.status).toBe(200);

        expect(response.body.success).toBe(
          true,
        );

        expect(
          response.body.message,
        ).toBe(
          "Stock berhasil disesuaikan",
        );

        expect(
          inventoryServiceMock.adjustStock,
        ).toHaveBeenCalledWith(
          businessId,
          inventoryId,
          payload,
        );
      },
    );

    it(
      "returns unchanged message when adjustment has no delta",
      async () => {
        inventoryServiceMock.adjustStock
          .mockResolvedValueOnce({
            changed: false,
            item: inventoryItem,
            transaction: null,
            adjustment: null,
          });

        const response =
          await request(app)
            .post(
              `/api/inventory/${inventoryId}/adjust`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              actualStock: 25,
              reason: "COUNT_CORRECTION",
            });

        expect(response.status).toBe(200);

        expect(
          response.body.message,
        ).toBe(
          "Stock tidak mengalami perubahan",
        );
      },
    );

    it(
      "rejects invalid adjustment payload",
      async () => {
        const response =
          await request(app)
            .post(
              `/api/inventory/${inventoryId}/adjust`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              actualStock: 10,
              reason: "INVALID_REASON",
            });

        expect(response.status).toBe(400);

        expect(
          response.body.message,
        ).toBe("Validation error");

        expect(
          inventoryServiceMock.adjustStock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects invalid adjustment id",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/inventory/not-a-uuid/adjust",
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              actualStock: 30,
              reason: "COUNT_CORRECTION",
            });

        expect(response.status).toBe(400);

        expect(
          inventoryServiceMock.adjustStock,
        ).not.toHaveBeenCalled();
      },
    );
  });
});