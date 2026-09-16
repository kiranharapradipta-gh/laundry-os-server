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

const shiftServiceMock = vi.hoisted(() => ({
  listShifts: vi.fn(),
  getShiftById: vi.fn(),
  openShift: vi.fn(),
  closeShift: vi.fn(),
  listCashMovements: vi.fn(),
  addCashMovement: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

vi.mock(
  "../src/modules/shift/shift.service.js",
  () => shiftServiceMock,
);

import { app } from "../src/index.js";
import { signAccessToken } from "../src/utils/jwt.js";

const businessId =
  "4999e4ca-f860-4d3f-84f7-15b04d402eb2";

const userId =
  "11111111-1111-4111-8111-111111111111";

const shiftId =
  "22222222-2222-4222-8222-222222222222";

const branchId =
  "33333333-3333-4333-8333-333333333333";

const employeeId =
  "44444444-4444-4444-8444-444444444444";

const cashRegisterId =
  "55555555-5555-4555-8555-555555555555";

const accessToken = signAccessToken({
  userId,
  businessId,
  role: "ADMIN",
});

const authHeader = `Bearer ${accessToken}`;

const fullPermissions = [
  "shift.read",
  "shift.open",
  "shift.close",
  "shift.cash.read",
  "shift.cash.adjust",
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

const shift = {
  id: shiftId,
  branchId,
  employeeId,
  startedAt: new Date("2026-09-01T08:00:00.000Z"),
  endedAt: null,
  openingCash: "500000.00",
  closingCash: null,
  status: "OPEN",
  notes: "Morning shift",
  createdAt: new Date("2026-09-01T08:00:00.000Z"),
  updatedAt: new Date("2026-09-01T08:00:00.000Z"),
};

const cashMovement = {
  id: "66666666-6666-4666-8666-666666666666",
  cashSessionId:
    "77777777-7777-4777-8777-777777777777",
  employeeId,
  type: "CASH_IN",
  amount: "100000.00",
  description: "Additional cash",
  referenceType: null,
  referenceId: null,
  createdAt: new Date("2026-09-01T09:00:00.000Z"),
};

describe("Shift API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setupPermission();

    shiftServiceMock.listShifts.mockResolvedValue({
      data: [shift],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    shiftServiceMock.getShiftById.mockResolvedValue({
      shift,
      summary: {
        cashIn: "100000.00",
        cashOut: "50000.00",
        expectedCash: "550000.00",
        actualCash: null,
        variance: null,
      },
    });

    shiftServiceMock.openShift.mockResolvedValue({
      shift,
      cashSession: {
        id: "77777777-7777-4777-8777-777777777777",
        cashRegisterId,
        shiftId,
        employeeId,
        openingBalance: "500000.00",
        status: "OPEN",
      },
    });

    shiftServiceMock.closeShift.mockResolvedValue({
      shift: {
        ...shift,
        status: "CLOSED",
        endedAt: new Date(
          "2026-09-01T17:00:00.000Z",
        ),
        closingCash: "550000.00",
      },
      summary: {
        cashIn: "100000.00",
        cashOut: "50000.00",
        expectedCash: "550000.00",
        actualCash: "550000.00",
        variance: "0.00",
      },
    });

    shiftServiceMock.listCashMovements.mockResolvedValue([
      cashMovement,
    ]);

    shiftServiceMock.addCashMovement.mockResolvedValue({
      ...cashMovement,
      amount: "250000.00",
    });
  });

  describe("Authentication", () => {
    it(
      "rejects request without authentication",
      async () => {
        const response =
          await request(app).get("/api/shifts");

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
            .get("/api/shifts")
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
            .get("/api/shifts")
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
  });

  describe("Permission", () => {
    it(
      "rejects user without business membership",
      async () => {
        prismaMock.businessMember.findUnique
          .mockResolvedValue(null);

        const response =
          await request(app)
            .get("/api/shifts")
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
            .get("/api/shifts")
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
      "requires shift.read permission",
      async () => {
        setupPermission([]);

        const response =
          await request(app)
            .get("/api/shifts")
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("shift.read");
      },
    );

    it(
      "requires shift.open permission",
      async () => {
        setupPermission([
          "shift.read",
        ]);

        const response =
          await request(app)
            .post("/api/shifts/open")
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              branchId,
              employeeId,
              cashRegisterId,
              openingCash: 500000,
            });

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("shift.open");
      },
    );

    it(
      "requires shift.close permission",
      async () => {
        setupPermission([
          "shift.read",
        ]);

        const response =
          await request(app)
            .post(
              `/api/shifts/${shiftId}/close`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              closingCash: 550000,
            });

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("shift.close");
      },
    );

    it(
      "requires shift.cash.read permission",
      async () => {
        setupPermission([
          "shift.read",
        ]);

        const response =
          await request(app)
            .get(
              `/api/shifts/${shiftId}/cash`,
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("shift.cash.read");
      },
    );

    it(
      "requires shift.cash.adjust permission",
      async () => {
        setupPermission([
          "shift.read",
        ]);

        const response =
          await request(app)
            .post(
              `/api/shifts/${shiftId}/cash/in`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              amount: 100000,
              description: "Additional cash",
            });

        expect(response.status).toBe(403);

        expect(
          response.body.requiredPermission,
        ).toBe("shift.cash.adjust");
      },
    );
  });

  describe("List", () => {
    it("lists shifts", async () => {
      const response =
        await request(app)
          .get("/api/shifts")
          .set(
            "Authorization",
            authHeader,
          );

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(
        true,
      );

      expect(response.body.data).toBeDefined();

      expect(
        shiftServiceMock.listShifts,
      ).toHaveBeenCalledWith(
        businessId,
        {
          page: 1,
          limit: 20,
        },
      );
    });

    it(
      "accepts shift list filters",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/shifts?page=2&limit=10&branchId=${branchId}&employeeId=${employeeId}&status=OPEN`,
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(200);

        expect(
          shiftServiceMock.listShifts,
        ).toHaveBeenCalledWith(
          businessId,
          {
            page: 2,
            limit: 10,
            branchId,
            employeeId,
            status: "OPEN",
          },
        );
      },
    );

    it(
      "rejects invalid shift list query",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/shifts?page=0&limit=101",
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(400);

        expect(response.body.success).toBe(
          false,
        );

        expect(response.body.message).toBe(
          "Validation error",
        );

        expect(
          shiftServiceMock.listShifts,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Get detail", () => {
    it(
      "gets shift by id",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/shifts/${shiftId}`,
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
          shiftServiceMock.getShiftById,
        ).toHaveBeenCalledWith(
          businessId,
          shiftId,
        );
      },
    );

    it(
      "rejects invalid shift id",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/shifts/not-a-uuid",
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(400);

        expect(
          shiftServiceMock.getShiftById,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Open shift", () => {
    it(
      "opens a shift",
      async () => {
        const payload = {
          branchId,
          employeeId,
          cashRegisterId,
          openingCash: 500000,
          notes: "Morning shift",
        };

        const response =
          await request(app)
            .post("/api/shifts/open")
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
          "Shift berhasil dibuka",
        );

        expect(
          shiftServiceMock.openShift,
        ).toHaveBeenCalledWith(
          businessId,
          payload,
        );
      },
    );

    it(
      "rejects invalid open shift payload",
      async () => {
        const response =
          await request(app)
            .post("/api/shifts/open")
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              branchId: "not-a-uuid",
              employeeId: "not-a-uuid",
              cashRegisterId: "not-a-uuid",
              openingCash: -100,
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
          "Validation error",
        );

        expect(
          shiftServiceMock.openShift,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Close shift", () => {
    it(
      "closes an open shift",
      async () => {
        const payload = {
          closingCash: 550000,
          notes: "End of shift",
        };

        const response =
          await request(app)
            .post(
              `/api/shifts/${shiftId}/close`,
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
          "Shift berhasil ditutup",
        );

        expect(
          shiftServiceMock.closeShift,
        ).toHaveBeenCalledWith(
          businessId,
          shiftId,
          payload,
        );
      },
    );

    it(
      "rejects invalid close shift id",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/shifts/not-a-uuid/close",
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              closingCash: 550000,
            });

        expect(response.status).toBe(400);

        expect(
          shiftServiceMock.closeShift,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects invalid close shift payload",
      async () => {
        const response =
          await request(app)
            .post(
              `/api/shifts/${shiftId}/close`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              closingCash: -100,
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
          "Validation error",
        );

        expect(
          shiftServiceMock.closeShift,
        ).not.toHaveBeenCalled();
      },
    );
  });

  describe("Cash", () => {
    it(
      "gets cash movements",
      async () => {
        const response =
          await request(app)
            .get(
              `/api/shifts/${shiftId}/cash`,
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
          shiftServiceMock.listCashMovements,
        ).toHaveBeenCalledWith(
          businessId,
          shiftId,
        );
      },
    );

    it(
      "rejects invalid cash shift id",
      async () => {
        const response =
          await request(app)
            .get(
              "/api/shifts/not-a-uuid/cash",
            )
            .set(
              "Authorization",
              authHeader,
            );

        expect(response.status).toBe(400);

        expect(
          shiftServiceMock.listCashMovements,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "adds cash in",
      async () => {
        const payload = {
          type: "CASH_IN",
          amount: 250000,
          description: "Additional cash",
        };

        const response =
          await request(app)
            .post(
              `/api/shifts/${shiftId}/cash/in`,
            )
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
          "Cash in berhasil dicatat",
        );

        expect(
          shiftServiceMock.addCashMovement,
        ).toHaveBeenCalledWith(
          businessId,
          shiftId,
          {
            ...payload,
            type: "CASH_IN",
          },
        );
      },
    );

    it(
      "adds cash out",
      async () => {
        const payload = {
          type: "CASH_OUT",
          amount: 50000,
          description: "Cash expense",
        };

        const response =
          await request(app)
            .post(
              `/api/shifts/${shiftId}/cash/out`,
            )
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
          "Cash out berhasil dicatat",
        );

        expect(
          shiftServiceMock.addCashMovement,
        ).toHaveBeenCalledWith(
          businessId,
          shiftId,
          {
            ...payload,
            type: "CASH_OUT",
          },
        );
      },
    );

    it(
      "rejects invalid cash movement amount",
      async () => {
        const response =
          await request(app)
            .post(
              `/api/shifts/${shiftId}/cash/in`,
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              amount: 0,
              description: "Invalid",
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
          "Validation error",
        );

        expect(
          shiftServiceMock.addCashMovement,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rejects invalid cash movement shift id",
      async () => {
        const response =
          await request(app)
            .post(
              "/api/shifts/not-a-uuid/cash/out",
            )
            .set(
              "Authorization",
              authHeader,
            )
            .send({
              amount: 50000,
              description: "Cash expense",
            });

        expect(response.status).toBe(400);

        expect(
          shiftServiceMock.addCashMovement,
        ).not.toHaveBeenCalled();
      },
    );
  });
});