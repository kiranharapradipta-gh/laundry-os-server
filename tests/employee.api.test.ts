import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const prismaMock = vi.hoisted(() => ({
  businessMember: {
    findUnique: vi.fn(),
  },
}));

const employeeServiceMock = vi.hoisted(() => ({
  listEmployees: vi.fn(),
  getEmployeeById: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  updateEmployeeStatus: vi.fn(),
  listEmployeeShifts: vi.fn(),
  deleteEmployee: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

vi.mock(
  "../src/modules/employees/employee.service.js",
  () => employeeServiceMock,
);

import {app} from "../src/app.js";
import { signAccessToken } from "../src/utils/jwt.js";

const businessId = "4999e4ca-f860-4d3f-84f7-15b04d402eb2";
const userId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";
const branchId = "33333333-3333-4333-8333-333333333333";
const departmentId = "44444444-4444-4444-8444-444444444444";
const shiftId = "55555555-5555-4555-8555-555555555555";

const accessToken = signAccessToken({
  userId,
  businessId,
  role: "ADMIN",
});

const authHeader = {
  Authorization: `Bearer ${accessToken}`,
};

const fullPermissions = [
  { permission: { code: "employee.read" } },
  { permission: { code: "employee.create" } },
  { permission: { code: "employee.update" } },
  { permission: { code: "employee.delete" } },
];

const employee = {
  id: employeeId,
  businessId,
  branchId,
  departmentId,
  userId: null,
  employeeCode: "EMP-001",
  name: "Budi Santoso",
  phone: "081234567890",
  email: "budi@example.com",
  position: "Staff Laundry",
  status: "ACTIVE",
  hiredAt: new Date("2026-01-01T00:00:00.000Z"),
  terminatedAt: null,
  baseSalary: "3500000",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  branch: {
    id: branchId,
    code: "MAIN",
    name: "Main Branch",
    status: "ACTIVE",
  },
  department: {
    id: departmentId,
    name: "Operations",
    description: null,
    active: true,
  },
  user: null,
  _count: {
    shifts: 2,
    machineUsages: 0,
    productionTasks: 0,
    cashSessions: 0,
    cashMovements: 0,
    complaints: 0,
    auditLogs: 0,
  },
};

const shift = {
  id: shiftId,
  branchId,
  employeeId,
  startedAt: new Date("2026-09-10T08:00:00.000Z"),
  endedAt: new Date("2026-09-10T17:00:00.000Z"),
  openingCash: "500000",
  closingCash: "750000",
  status: "CLOSED",
  notes: null,
  createdAt: new Date("2026-09-10T08:00:00.000Z"),
  updatedAt: new Date("2026-09-10T17:00:00.000Z"),
  branch: {
    id: branchId,
    code: "MAIN",
    name: "Main Branch",
    status: "ACTIVE",
  },
};

const setupPermission = (
  permissions = fullPermissions,
  overrides: Record<string, unknown> = {},
) => {
  prismaMock.businessMember.findUnique.mockResolvedValue({
    id: "member-1",
    businessId,
    userId,
    status: "ACTIVE",
    role: {
      permissions,
    },
    ...overrides,
  });
};

describe("Employee API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setupPermission();

    employeeServiceMock.listEmployees.mockResolvedValue({
      items: [employee],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    employeeServiceMock.getEmployeeById.mockResolvedValue(employee);

    employeeServiceMock.createEmployee.mockResolvedValue(employee);

    employeeServiceMock.updateEmployee.mockResolvedValue(employee);

    employeeServiceMock.updateEmployeeStatus.mockResolvedValue({
      ...employee,
      status: "ON_LEAVE",
    });

    employeeServiceMock.listEmployeeShifts.mockResolvedValue({
      items: [shift],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    employeeServiceMock.deleteEmployee.mockResolvedValue({
      ...employee,
      status: "TERMINATED",
      terminatedAt: new Date("2026-09-10T00:00:00.000Z"),
    });
  });

  describe("Authentication", () => {
    it("returns 401 when authorization header is missing", async () => {
      const response = await request(app).get("/api/employees");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Authorization header wajib diisi",
      );
    });

    it("returns 401 when authorization header is malformed", async () => {
      const response = await request(app)
        .get("/api/employees")
        .set("Authorization", "Basic abc123");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Format Authorization harus Bearer <token>",
      );
    });

    it("returns 401 when token is invalid", async () => {
      const response = await request(app)
        .get("/api/employees")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Token tidak valid atau sudah expired",
      );
    });
  });

  describe("Permission", () => {
    it("returns 403 when business membership is not found", async () => {
      prismaMock.businessMember.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/employees")
        .set(authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Business membership tidak ditemukan",
      );
    });

    it("returns 403 when business membership is inactive", async () => {
      setupPermission([], {
        status: "INACTIVE",
      });

      const response = await request(app)
        .get("/api/employees")
        .set(authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        "Business membership tidak aktif",
      );
    });

    it("returns 403 when employee.read permission is missing", async () => {
      setupPermission([
        { permission: { code: "employee.create" } },
        { permission: { code: "employee.update" } },
        { permission: { code: "employee.delete" } },
      ]);

      const response = await request(app)
        .get("/api/employees")
        .set(authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.requiredPermission).toBe("employee.read");
    });

    it("returns 403 when employee.create permission is missing", async () => {
      setupPermission([
        { permission: { code: "employee.read" } },
        { permission: { code: "employee.update" } },
        { permission: { code: "employee.delete" } },
      ]);

      const response = await request(app)
        .post("/api/employees")
        .set(authHeader)
        .send({
          employeeCode: "EMP-002",
          name: "Siti",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.requiredPermission).toBe("employee.create");
    });

    it("returns 403 when employee.update permission is missing", async () => {
      setupPermission([
        { permission: { code: "employee.read" } },
        { permission: { code: "employee.create" } },
        { permission: { code: "employee.delete" } },
      ]);

      const response = await request(app)
        .patch(`/api/employees/${employeeId}`)
        .set(authHeader)
        .send({
          name: "Budi Updated",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.requiredPermission).toBe("employee.update");
    });

    it("returns 403 when employee.delete permission is missing", async () => {
      setupPermission([
        { permission: { code: "employee.read" } },
        { permission: { code: "employee.create" } },
        { permission: { code: "employee.update" } },
      ]);

      const response = await request(app)
        .delete(`/api/employees/${employeeId}`)
        .set(authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.requiredPermission).toBe("employee.delete");
    });
  });

  describe("List", () => {
    it("lists employees", async () => {
      const response = await request(app)
        .get("/api/employees")
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0]).toMatchObject({
        id: employeeId,
        businessId,
        employeeCode: "EMP-001",
        name: "Budi Santoso",
        status: "ACTIVE",
      });

      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });

      expect(employeeServiceMock.listEmployees).toHaveBeenCalledWith(
        businessId,
        {
          page: 1,
          limit: 20,
        },
      );
    });

    it("accepts search and filters", async () => {
      const response = await request(app)
        .get(
          `/api/employees?page=2&limit=10&search=budi&status=ACTIVE&branchId=${branchId}&departmentId=${departmentId}`,
        )
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(employeeServiceMock.listEmployees).toHaveBeenCalledWith(
        businessId,
        {
          page: 2,
          limit: 10,
          search: "budi",
          status: "ACTIVE",
          branchId,
          departmentId,
        },
      );
    });

    it("returns 400 for invalid pagination", async () => {
      const response = await request(app)
        .get("/api/employees?page=0&limit=101")
        .set(authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation error");

      expect(
        employeeServiceMock.listEmployees,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid status", async () => {
      const response = await request(app)
        .get("/api/employees?status=INVALID")
        .set(authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation error");

      expect(
        employeeServiceMock.listEmployees,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Get detail", () => {
    it("gets employee detail", async () => {
      const response = await request(app)
        .get(`/api/employees/${employeeId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toMatchObject({
        id: employeeId,
        businessId,
        employeeCode: "EMP-001",
        name: "Budi Santoso",
        status: "ACTIVE",
      });

      expect(employeeServiceMock.getEmployeeById).toHaveBeenCalledWith(
        businessId,
        employeeId,
      );
    });

    it("returns 400 for invalid employee id", async () => {
      const response = await request(app)
        .get("/api/employees/not-a-uuid")
        .set(authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation error");

      expect(
        employeeServiceMock.getEmployeeById,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Create", () => {
    it("creates an employee with full payload", async () => {
      const payload = {
        employeeCode: "EMP-002",
        name: "Siti Aminah",
        phone: "081298765432",
        email: "siti@example.com",
        position: "Kasir",
        branchId,
        departmentId,
        hiredAt: "2026-09-01T00:00:00.000Z",
        baseSalary: 4000000,
      };

      const response = await request(app)
        .post("/api/employees")
        .set(authHeader)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toMatchObject({
        id: employeeId,
        businessId,
        employeeCode: "EMP-001",
        name: "Budi Santoso",
      });

      expect(employeeServiceMock.createEmployee).toHaveBeenCalledWith(
        businessId,
        expect.objectContaining({
          employeeCode: "EMP-002",
          name: "Siti Aminah",
          phone: "081298765432",
          email: "siti@example.com",
          position: "Kasir",
          branchId,
          departmentId,
          baseSalary: 4000000,
        }),
      );
    });

    it("creates an employee with minimal payload", async () => {
      const payload = {
        employeeCode: "EMP-003",
        name: "Andi",
      };

      const response = await request(app)
        .post("/api/employees")
        .set(authHeader)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toMatchObject({
        id: employeeId,
        businessId,
        employeeCode: "EMP-001",
        name: "Budi Santoso",
      });

      expect(employeeServiceMock.createEmployee).toHaveBeenCalledWith(
        businessId,
        payload,
      );
    });

    it("returns 400 for invalid payload", async () => {
      const response = await request(app)
        .post("/api/employees")
        .set(authHeader)
        .send({
          employeeCode: "",
          name: "",
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation error");

      expect(
        employeeServiceMock.createEmployee,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Update", () => {
    it("updates an employee", async () => {
      const payload = {
        name: "Budi Santoso Updated",
        phone: "081299999999",
        position: "Senior Staff",
      };

      const response = await request(app)
        .patch(`/api/employees/${employeeId}`)
        .set(authHeader)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toMatchObject({
        id: employeeId,
        businessId,
        employeeCode: "EMP-001",
        name: "Budi Santoso",
      });

      expect(employeeServiceMock.updateEmployee).toHaveBeenCalledWith(
        businessId,
        employeeId,
        payload,
      );
    });

    it("returns 400 for invalid employee id", async () => {
      const response = await request(app)
        .patch("/api/employees/not-a-uuid")
        .set(authHeader)
        .send({
          name: "Updated",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      expect(
        employeeServiceMock.updateEmployee,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 when update body is empty", async () => {
      const response = await request(app)
        .patch(`/api/employees/${employeeId}`)
        .set(authHeader)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation error");

      expect(
        employeeServiceMock.updateEmployee,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Status", () => {
    it("updates employee status", async () => {
      const payload = {
        status: "ON_LEAVE",
      };

      const response = await request(app)
        .patch(`/api/employees/${employeeId}/status`)
        .set(authHeader)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toMatchObject({
        id: employeeId,
        businessId,
        status: "ON_LEAVE",
      });

      expect(
        employeeServiceMock.updateEmployeeStatus,
      ).toHaveBeenCalledWith(
        businessId,
        employeeId,
        payload,
      );
    });

    it("returns 400 for invalid status", async () => {
      const response = await request(app)
        .patch(`/api/employees/${employeeId}/status`)
        .set(authHeader)
        .send({
          status: "INVALID",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation error");

      expect(
        employeeServiceMock.updateEmployeeStatus,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid employee id", async () => {
      const response = await request(app)
        .patch("/api/employees/not-a-uuid/status")
        .set(authHeader)
        .send({
          status: "ON_LEAVE",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      expect(
        employeeServiceMock.updateEmployeeStatus,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Shifts", () => {
    it("lists employee shifts", async () => {
      const response = await request(app)
        .get(`/api/employees/${employeeId}/shifts`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0]).toMatchObject({
        id: shiftId,
        branchId,
        employeeId,
        status: "CLOSED",
      });

      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });

      expect(
        employeeServiceMock.listEmployeeShifts,
      ).toHaveBeenCalledWith(
        businessId,
        employeeId,
        {
          page: 1,
          limit: 20,
        },
      );
    });

    it("accepts shift pagination", async () => {
      employeeServiceMock.listEmployeeShifts.mockResolvedValue({
        items: [shift],
        pagination: {
          page: 2,
          limit: 10,
          total: 11,
          totalPages: 2,
        },
      });

      const response = await request(app)
        .get(`/api/employees/${employeeId}/shifts?page=2&limit=10`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.items).toHaveLength(1);

      expect(response.body.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 11,
        totalPages: 2,
      });

      expect(
        employeeServiceMock.listEmployeeShifts,
      ).toHaveBeenCalledWith(
        businessId,
        employeeId,
        {
          page: 2,
          limit: 10,
        },
      );
    });

    it("returns 400 for invalid employee id", async () => {
      const response = await request(app)
        .get("/api/employees/not-a-uuid/shifts")
        .set(authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      expect(
        employeeServiceMock.listEmployeeShifts,
      ).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid shift pagination", async () => {
      const response = await request(app)
        .get(
          `/api/employees/${employeeId}/shifts?page=0&limit=101`,
        )
        .set(authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation error");

      expect(
        employeeServiceMock.listEmployeeShifts,
      ).not.toHaveBeenCalled();
    });
  });

  describe("Delete", () => {
    it("deletes an employee", async () => {
      const response = await request(app)
        .delete(`/api/employees/${employeeId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data).toMatchObject({
        id: employeeId,
        businessId,
        status: "TERMINATED",
      });

      expect(employeeServiceMock.deleteEmployee).toHaveBeenCalledWith(
        businessId,
        employeeId,
      );
    });

    it("returns 400 for invalid employee id", async () => {
      const response = await request(app)
        .delete("/api/employees/not-a-uuid")
        .set(authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      expect(
        employeeServiceMock.deleteEmployee,
      ).not.toHaveBeenCalled();
    });
  });
});