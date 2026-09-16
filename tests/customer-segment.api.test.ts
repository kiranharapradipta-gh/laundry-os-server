import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import request from "supertest";

const transactionMock = vi.hoisted(() => ({
  customerSegmentMember: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),

  businessMember: {
    findUnique: vi.fn(),
  },

  customerSegment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },

  customerSegmentMember: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },

  customer: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

import { app } from "../src/app.js";
import { signAccessToken } from "../src/utils/jwt.js";

const businessId =
  "4999e4ca-f860-4d3f-84f7-15b04d402eb2";

const userId =
  "11111111-1111-4111-8111-111111111111";

const segmentId =
  "22222222-2222-4222-8222-222222222222";

const customerId =
  "33333333-3333-4333-8333-333333333333";

const accessToken = signAccessToken({
  userId,
  businessId,
  role: "ADMIN",
});

const authHeader = `Bearer ${accessToken}`;

const fullPermissions = [
  "customer.read",
  "customer.create",
  "customer.update",
  "customer.delete",
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

describe("Customer Segment API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setupPermission();

    prismaMock.$transaction.mockImplementation(
      async (input: unknown) => {
        if (typeof input === "function") {
          return input(transactionMock);
        }

        if (Array.isArray(input)) {
          return Promise.all(input);
        }

        throw new Error(
          "Unsupported $transaction mock input",
        );
      },
    );

    transactionMock.customerSegmentMember.createMany
      .mockResolvedValue({
        count: 0,
      });

    transactionMock.customerSegmentMember.deleteMany
      .mockResolvedValue({
        count: 0,
      });

    prismaMock.customerSegment.count
      .mockResolvedValue(0);

    prismaMock.customerSegment.findMany
      .mockResolvedValue([]);

    prismaMock.customerSegment.findFirst
      .mockResolvedValue(null);

    prismaMock.customerSegment.create
      .mockResolvedValue({
        id: segmentId,
        businessId,
        name: "VIP",
        description: null,
        color: "#6366F1",
        isDynamic: false,
        rules: null,
        active: true,
      });

    prismaMock.customerSegment.update
      .mockResolvedValue({
        id: segmentId,
        businessId,
        name: "VIP Updated",
        description: null,
        color: "#6366F1",
        isDynamic: false,
        rules: null,
        active: true,
      });

    prismaMock.customerSegment.delete
      .mockResolvedValue({
        id: segmentId,
      });

    prismaMock.customerSegmentMember.findMany
      .mockResolvedValue([]);

    prismaMock.customerSegmentMember.findUnique
      .mockResolvedValue(null);

    prismaMock.customerSegmentMember.create
      .mockResolvedValue({
        segmentId,
        customerId,
      });

    prismaMock.customerSegmentMember.delete
      .mockResolvedValue({
        segmentId,
        customerId,
      });

    prismaMock.customer.findFirst
      .mockResolvedValue({
        id: customerId,
        customerCode: "CUS-TEST001",
        name: "Budi Santoso",
        phone: "08123456789",
        totalOrders: 10,
        totalSpent: 500000,
        averageOrderValue: 50000,
        status: "ACTIVE",
        firstOrderAt: new Date("2026-01-01"),
        lastOrderAt: new Date("2026-09-01"),
      });

    prismaMock.customer.findMany
      .mockResolvedValue([]);
  });

  it(
    "rejects request without authentication",
    async () => {
      const response =
        await request(app).get(
          "/api/customer-segments",
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
          .get("/api/customer-segments")
          .set(
            "Authorization",
            "Basic something",
          );

      expect(response.status).toBe(401);

      expect(response.body.message).toBe(
        "Format Authorization harus Bearer <token>",
      );
    },
  );

  it(
    "rejects invalid access token",
    async () => {
      const response =
        await request(app)
          .get("/api/customer-segments")
          .set(
            "Authorization",
            "Bearer invalid-token",
          );

      expect(response.status).toBe(401);

      expect(response.body.message).toBe(
        "Token tidak valid atau sudah expired",
      );
    },
  );

  it(
    "rejects user without business membership",
    async () => {
      prismaMock.businessMember.findUnique
        .mockResolvedValue(null);

      const response =
        await request(app)
          .get("/api/customer-segments")
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(403);

      expect(response.body.message).toBe(
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
          .get("/api/customer-segments")
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(403);

      expect(response.body.message).toBe(
        "Business membership tidak aktif",
      );
    },
  );

  it(
    "rejects user without required permission",
    async () => {
      setupPermission([]);

      const response =
        await request(app)
          .get("/api/customer-segments")
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(403);

      expect(response.body.message).toBe(
        "Anda tidak memiliki permission ini",
      );

      expect(
        response.body.requiredPermission,
      ).toBe("customer.read");
    },
  );

  it(
    "lists customer segments",
    async () => {
      prismaMock.customerSegment.findMany
        .mockResolvedValue([
          {
            id: segmentId,
            name: "VIP",
            description: null,
            color: "#6366F1",
            isDynamic: false,
            rules: null,
            active: true,
            _count: {
              members: 3,
            },
          },
        ]);

      const response =
        await request(app)
          .get("/api/customer-segments")
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        prismaMock.customerSegment.findMany,
      ).toHaveBeenCalled();

      const call =
        prismaMock.customerSegment.findMany
          .mock.calls[0][0];

      expect(
        call.where.businessId,
      ).toBe(businessId);
    },
  );

  it(
    "creates a customer segment",
    async () => {
      const response =
        await request(app)
          .post("/api/customer-segments")
          .set(
            "Authorization",
            authHeader,
          )
          .send({
            name: "VIP",
            description:
              "Customer prioritas",
            color: "#6366F1",
            isDynamic: false,
            active: true,
          });

      expect(response.status).toBe(201);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        response.body.message,
      ).toBe(
        "Customer segment berhasil dibuat",
      );

      expect(
        prismaMock.customerSegment.create,
      ).toHaveBeenCalled();
    },
  );

  it(
    "rejects invalid segment creation payload",
    async () => {
      const response =
        await request(app)
          .post("/api/customer-segments")
          .set(
            "Authorization",
            authHeader,
          )
          .send({
            name: "",
          });

      expect(response.status).toBe(400);

      expect(
        response.body.success,
      ).toBe(false);

      expect(
        response.body.message,
      ).toBe("Validation error");

      expect(
        prismaMock.customerSegment.create,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    "rejects invalid segment id",
    async () => {
      const response =
        await request(app)
          .get(
            "/api/customer-segments/not-a-uuid",
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(400);

      expect(
        prismaMock.customerSegment.findFirst,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    "gets customer segment by id",
    async () => {
      prismaMock.customerSegment.findFirst
        .mockResolvedValue({
          id: segmentId,
          businessId,
          name: "VIP",
          description: "Customer VIP",
          color: "#6366F1",
          isDynamic: false,
          rules: null,
          active: true,
          _count: {
            members: 5,
          },
          createdAt: new Date(
            "2026-01-01",
          ),
          updatedAt: new Date(
            "2026-09-01",
          ),
        });

      const response =
        await request(app)
          .get(
            `/api/customer-segments/${segmentId}`,
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        response.body.data.id,
      ).toBe(segmentId);

      expect(
        response.body.data.name,
      ).toBe("VIP");

      expect(
        response.body.data.customerCount,
      ).toBe(5);
    },
  );

  it(
    "returns 404 when customer segment does not exist",
    async () => {
      prismaMock.customerSegment.findFirst
        .mockResolvedValue(null);

      const response =
        await request(app)
          .get(
            `/api/customer-segments/${segmentId}`,
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(404);

      expect(
        response.body.success,
      ).toBe(false);
    },
  );

  it(
    "updates customer segment",
    async () => {
      prismaMock.customerSegment.findFirst
        .mockResolvedValueOnce({
          id: segmentId,
        })
        .mockResolvedValueOnce(null);

      prismaMock.customerSegment.update
        .mockResolvedValue({
          id: segmentId,
          businessId,
          name: "VIP Updated",
          description: null,
          color: "#6366F1",
          isDynamic: false,
          rules: null,
          active: true,
        });

      const response =
        await request(app)
          .patch(
            `/api/customer-segments/${segmentId}`,
          )
          .set(
            "Authorization",
            authHeader,
          )
          .send({
            name: "VIP Updated",
          });

      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        prismaMock.customerSegment.update,
      ).toHaveBeenCalled();
    },
  );

  it(
    "deletes customer segment",
    async () => {
      prismaMock.customerSegment.findFirst
        .mockResolvedValue({
          id: segmentId,
          businessId,
          name: "VIP",
        });

      prismaMock.customerSegment.delete
        .mockResolvedValue({
          id: segmentId,
        });

      const response =
        await request(app)
          .delete(
            `/api/customer-segments/${segmentId}`,
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        prismaMock.customerSegment.delete,
      ).toHaveBeenCalled();
    },
  );

  it(
    "lists customers in a segment",
    async () => {
      prismaMock.customerSegment.findFirst
        .mockResolvedValue({
          id: segmentId,
          businessId,
        });

      prismaMock.customerSegmentMember.findMany
        .mockResolvedValue([
          {
            segmentId,
            customerId,
            joinedAt: new Date(
              "2026-09-01",
            ),
            customer: {
              id: customerId,
              customerCode:
                "CUS-TEST001",
              name: "Budi Santoso",
              phone: "08123456789",
              whatsapp:
                "08123456789",
              email:
                "budi@example.com",
              status: "ACTIVE",
              totalOrders: 10,
              totalSpent: 500000,
              lastOrderAt:
                new Date(
                  "2026-09-01",
                ),
            },
          },
        ]);

      const response =
        await request(app)
          .get(
            `/api/customer-segments/${segmentId}/customers`,
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        response.body.data,
      ).toHaveLength(1);

      expect(
        response.body.data[0].customer.name,
      ).toBe("Budi Santoso");
    },
  );

  it(
    "assigns customer to segment",
    async () => {
      /*
       * assignCustomerToSegment() flow:
       *
       * 1. ensureSegment()
       *    -> customerSegment.findFirst()
       *
       * 2. ensureCustomer()
       *    -> customer.findFirst()
       *
       * 3. check existing membership
       *    -> customerSegmentMember.findUnique()
       *
       * 4. create membership
       *    -> customerSegmentMember.create()
       *
       * 5. getCustomerSegmentById()
       *    -> customerSegment.findFirst()
       *
       * Therefore customerSegment.findFirst()
       * must have two sequential results.
       */

      prismaMock.customerSegment.findFirst
        .mockResolvedValueOnce({
          id: segmentId,
          businessId,
          active: true,
        })
        .mockResolvedValueOnce({
          id: segmentId,
          businessId,
          name: "VIP",
          description: null,
          color: "#6366F1",
          isDynamic: false,
          rules: null,
          active: true,
          _count: {
            members: 1,
          },
          createdAt: new Date(
            "2026-01-01",
          ),
          updatedAt: new Date(
            "2026-09-01",
          ),
        });

      prismaMock.customer.findFirst
        .mockResolvedValue({
          id: customerId,
          businessId,
          name: "Budi Santoso",
          customerCode:
            "CUS-TEST001",
        });

      prismaMock.customerSegmentMember.findUnique
        .mockResolvedValue(null);

      prismaMock.customerSegmentMember.create
        .mockResolvedValue({
          segmentId,
          customerId,
        });

      const response =
        await request(app)
          .post(
            `/api/customer-segments/${segmentId}/customers/${customerId}`,
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(201);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        response.body.data.id,
      ).toBe(segmentId);

      expect(
        response.body.data.name,
      ).toBe("VIP");

      expect(
        response.body.data.customerCount,
      ).toBe(1);

      expect(
        prismaMock.customerSegmentMember.create,
      ).toHaveBeenCalledWith({
        data: {
          segmentId,
          customerId,
        },
      });
    },
  );

  it(
    "removes customer from segment",
    async () => {
      prismaMock.customerSegment.findFirst
        .mockResolvedValue({
          id: segmentId,
          businessId,
        });

      prismaMock.customer.findFirst
        .mockResolvedValue({
          id: customerId,
          businessId,
          deletedAt: null,
        });

      prismaMock.customerSegmentMember.findUnique
        .mockResolvedValue({
          segmentId,
          customerId,
        });

      prismaMock.customerSegmentMember.delete
        .mockResolvedValue({
          segmentId,
          customerId,
        });

      const response =
        await request(app)
          .delete(
            `/api/customer-segments/${segmentId}/customers/${customerId}`,
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        prismaMock.customerSegmentMember.delete,
      ).toHaveBeenCalled();
    },
  );

  it(
    "previews customers matching segment rules",
    async () => {
      prismaMock.customerSegment.findFirst
        .mockResolvedValue({
          id: segmentId,
          businessId,
          name: "VIP",
          isDynamic: true,
          active: true,
          rules: {
            all: [
              {
                field: "totalOrders",
                operator: "gte",
                value: 10,
              },
            ],
          },
        });

      prismaMock.customer.findMany
        .mockResolvedValue([
          {
            id: customerId,
            customerCode:
              "CUS-TEST001",
            name: "Budi Santoso",
            phone: "08123456789",
            totalOrders: 15,
            totalSpent: 500000,
            averageOrderValue: 33333,
            status: "ACTIVE",
            firstOrderAt:
              new Date(
                "2026-01-01",
              ),
            lastOrderAt:
              new Date(
                "2026-09-01",
              ),
          },
        ]);

      const response =
        await request(app)
          .post(
            `/api/customer-segments/${segmentId}/preview`,
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        response.body.data.segmentId,
      ).toBe(segmentId);

      expect(
        response.body.data.segmentName,
      ).toBe("VIP");

      expect(
        response.body.data.totalCustomers,
      ).toBe(1);

      expect(
        response.body.data.matchedCustomers,
      ).toBe(1);

      expect(
        response.body.data.customers,
      ).toHaveLength(1);

      expect(
        response.body.data.customers[0].id,
      ).toBe(customerId);
    },
  );

  it(
    "refreshes a dynamic customer segment",
    async () => {
      prismaMock.customerSegment.findFirst
        .mockResolvedValue({
          id: segmentId,
          businessId,
          isDynamic: true,
          active: true,
          rules: {
            all: [
              {
                field: "totalOrders",
                operator: "gte",
                value: 10,
              },
            ],
          },
        });

      prismaMock.customer.findMany
        .mockResolvedValue([
          {
            id: customerId,
            totalOrders: 15,
            totalSpent: 500000,
            averageOrderValue: 33333,
            status: "ACTIVE",
            firstOrderAt:
              new Date(
                "2026-01-01",
              ),
            lastOrderAt:
              new Date(
                "2026-09-01",
              ),
          },
        ]);

      prismaMock.customerSegmentMember.findMany
        .mockResolvedValue([]);

      transactionMock.customerSegmentMember.deleteMany
        .mockResolvedValue({
          count: 0,
        });

      transactionMock.customerSegmentMember.createMany
        .mockResolvedValue({
          count: 1,
        });

      const response =
        await request(app)
          .post(
            `/api/customer-segments/${segmentId}/refresh`,
          )
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(
        response.body.success,
      ).toBe(true);

      expect(
        transactionMock
          .customerSegmentMember
          .createMany,
      ).toHaveBeenCalled();
    },
  );
});