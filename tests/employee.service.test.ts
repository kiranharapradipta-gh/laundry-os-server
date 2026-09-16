import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const prismaMock = vi.hoisted(() => ({
  employee: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },

  branch: {
    findFirst: vi.fn(),
  },

  department: {
    findFirst: vi.fn(),
  },

  shift: {
    findMany: vi.fn(),
    count: vi.fn(),
  },

  $transaction: vi.fn(),
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

import { Prisma } from "@prisma/client";

import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployeeShifts,
  listEmployees,
  updateEmployee,
  updateEmployeeStatus,
} from "../src/modules/employees/employee.service.js";

const businessId =
  "4999e4ca-f860-4d3f-84f7-15b04d402eb2";

const otherBusinessId =
  "5999e4ca-f860-4d3f-84b7-15b04d402eb3";

const employeeId =
  "11111111-1111-4111-8111-111111111111";

const branchId =
  "22222222-2222-4222-8222-222222222222";

const departmentId =
  "33333333-3333-4333-8333-333333333333";

const employeeFixture = (
  overrides: Record<string, unknown> = {},
) => ({
  id: employeeId,
  businessId,
  branchId,
  departmentId,
  userId: null,

  employeeCode: "EMP-001",
  name: "John Doe",
  phone: "08123456789",
  email: "john@example.com",
  position: "Staff",

  status: "ACTIVE",

  hiredAt: new Date(
    "2026-01-01T00:00:00.000Z",
  ),

  terminatedAt: null,

  baseSalary: new Prisma.Decimal(
    "5000000",
  ),

  createdAt: new Date(
    "2026-01-01T00:00:00.000Z",
  ),

  updatedAt: new Date(
    "2026-01-01T00:00:00.000Z",
  ),

  branch: {
    id: branchId,
    code: "MAIN",
    name: "Main Branch",
  },

  department: {
    id: departmentId,
    name: "Operations",
  },

  user: null,

  _count: {
    shifts: 0,
    machineUsages: 0,
    productionTasks: 0,
    cashSessions: 0,
    cashMovements: 0,
    complaints: 0,
    auditLogs: 0,
  },

  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();

  prismaMock.$transaction.mockImplementation(
    async (input: unknown) => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      if (typeof input === "function") {
        return input(prismaMock);
      }

      return input;
    },
  );
});

describe("employee.service", () => {
  describe("listEmployees", () => {
    it("lists employees with pagination", async () => {
      prismaMock.employee.findMany.mockResolvedValue([
        employeeFixture(),
      ]);

      prismaMock.employee.count.mockResolvedValue(1);

      const result = await listEmployees(
        businessId,
        {
          page: 1,
          limit: 20,
        },
      );

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it("applies search filter", async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);
      prismaMock.employee.count.mockResolvedValue(0);

      await listEmployees(
        businessId,
        {
          page: 1,
          limit: 20,
          search: "john",
        },
      );

      expect(
        prismaMock.employee.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it("filters by status", async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);
      prismaMock.employee.count.mockResolvedValue(0);

      await listEmployees(
        businessId,
        {
          page: 1,
          limit: 20,
          status: "ACTIVE",
        },
      );

      expect(
        prismaMock.employee.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            status: "ACTIVE",
          }),
        }),
      );
    });

    it("filters by branch", async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);
      prismaMock.employee.count.mockResolvedValue(0);

      await listEmployees(
        businessId,
        {
          page: 1,
          limit: 20,
          branchId,
        },
      );

      expect(
        prismaMock.employee.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            branchId,
          }),
        }),
      );
    });

    it("filters by department", async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);
      prismaMock.employee.count.mockResolvedValue(0);

      await listEmployees(
        businessId,
        {
          page: 1,
          limit: 20,
          departmentId,
        },
      );

      expect(
        prismaMock.employee.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId,
            departmentId,
          }),
        }),
      );
    });
  });

  describe("getEmployeeById", () => {
    it("returns employee from same business", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        employeeFixture(),
      );

      const result = await getEmployeeById(
        businessId,
        employeeId,
      );

      expect(result).toEqual(
        employeeFixture(),
      );
    });

    it("rejects employee from another business", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        getEmployeeById(
          otherBusinessId,
          employeeId,
        ),
      ).rejects.toThrow();
    });
  });

  describe("createEmployee", () => {
    it("creates employee successfully", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      prismaMock.branch.findFirst.mockResolvedValue({
        id: branchId,
        businessId,
        status: "ACTIVE",
      });

      prismaMock.department.findFirst.mockResolvedValue({
        id: departmentId,
        businessId,
        active: true,
      });

      prismaMock.employee.create.mockResolvedValue(
        employeeFixture(),
      );

      const result = await createEmployee(
        businessId,
        {
          employeeCode: "EMP-001",
          name: "John Doe",
          phone: "08123456789",
          email: "john@example.com",
          position: "Staff",
          branchId,
          departmentId,
          hiredAt: new Date(
            "2026-01-01T00:00:00.000Z",
          ),
          baseSalary: "5000000",
        },
      );

      expect(result).toEqual(
        employeeFixture(),
      );

      expect(
        prismaMock.employee.create,
      ).toHaveBeenCalled();
    });

    it("creates employee without optional fields", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      prismaMock.employee.create.mockResolvedValue(
        employeeFixture({
          employeeCode: "EMP-002",
          name: "Jane Doe",
          branchId: null,
          departmentId: null,
          phone: null,
          email: null,
          position: null,
          hiredAt: null,
          baseSalary: null,
        }),
      );

      const result = await createEmployee(
        businessId,
        {
          employeeCode: "EMP-002",
          name: "Jane Doe",
        },
      );

      expect(result.name).toBe(
        "Jane Doe",
      );

      expect(
        prismaMock.employee.create,
      ).toHaveBeenCalled();
    });

    it("rejects duplicate employee code", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        employeeFixture(),
      );

      await expect(
        createEmployee(
          businessId,
          {
            employeeCode: "EMP-001",
            name: "John Doe",
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects branch from another business", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      prismaMock.branch.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        createEmployee(
          businessId,
          {
            employeeCode: "EMP-002",
            name: "Jane Doe",
            branchId,
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects inactive branch", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      prismaMock.branch.findFirst.mockResolvedValue({
        id: branchId,
        businessId,
        status: "INACTIVE",
      });

      await expect(
        createEmployee(
          businessId,
          {
            employeeCode: "EMP-002",
            name: "Jane Doe",
            branchId,
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects department from another business", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      prismaMock.department.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        createEmployee(
          businessId,
          {
            employeeCode: "EMP-002",
            name: "Jane Doe",
            departmentId,
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects inactive department", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      prismaMock.department.findFirst.mockResolvedValue({
        id: departmentId,
        businessId,
        active: false,
      });

      await expect(
        createEmployee(
          businessId,
          {
            employeeCode: "EMP-002",
            name: "Jane Doe",
            departmentId,
          },
        ),
      ).rejects.toThrow();
    });
  });

  describe("updateEmployee", () => {
    it("updates employee successfully", async () => {
      prismaMock.employee.findFirst
        .mockResolvedValueOnce(
          employeeFixture(),
        )
        .mockResolvedValueOnce(
          null,
        );

      prismaMock.employee.update.mockResolvedValue(
        employeeFixture({
          name: "John Updated",
        }),
      );

      const result = await updateEmployee(
        businessId,
        employeeId,
        {
          name: "John Updated",
        },
      );

      expect(result.name).toBe(
        "John Updated",
      );

      expect(
        prismaMock.employee.update,
      ).toHaveBeenCalled();
    });

    it("rejects update for another business", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        updateEmployee(
          otherBusinessId,
          employeeId,
          {
            name: "Updated",
          },
        ),
      ).rejects.toThrow();
    });

    it("updates nullable fields", async () => {
      prismaMock.employee.findFirst
        .mockResolvedValueOnce(
          employeeFixture(),
        )
        .mockResolvedValueOnce(
          null,
        );

      prismaMock.employee.update.mockResolvedValue(
        employeeFixture({
          phone: null,
          email: null,
          position: null,
        }),
      );

      await updateEmployee(
        businessId,
        employeeId,
        {
          phone: null,
          email: null,
          position: null,
        },
      );

      expect(
        prismaMock.employee.update,
      ).toHaveBeenCalled();
    });
  });

  describe("updateEmployeeStatus", () => {
    it("changes status successfully", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        employeeFixture({
          status: "ACTIVE",
        }),
      );

      prismaMock.employee.update.mockResolvedValue(
        employeeFixture({
          status: "INACTIVE",
        }),
      );

      const result =
        await updateEmployeeStatus(
          businessId,
          employeeId,
          {
            status: "INACTIVE",
          },
        );

      expect(result.status).toBe(
        "INACTIVE",
      );

      expect(
        prismaMock.employee.update,
      ).toHaveBeenCalled();
    });

    it("sets terminatedAt when terminated", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        employeeFixture(),
      );

      prismaMock.employee.update.mockResolvedValue(
        employeeFixture({
          status: "TERMINATED",
          terminatedAt: new Date(),
        }),
      );

      await updateEmployeeStatus(
        businessId,
        employeeId,
        {
          status: "TERMINATED",
        },
      );

      expect(
        prismaMock.employee.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "TERMINATED",
            terminatedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("rejects no-op status update", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        employeeFixture({
          status: "ACTIVE",
        }),
      );

      await expect(
        updateEmployeeStatus(
          businessId,
          employeeId,
          {
            status: "ACTIVE",
          },
        ),
      ).rejects.toThrow();
    });

    it("clears terminatedAt when reactivated", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        employeeFixture({
          status: "TERMINATED",
          terminatedAt: new Date(
            "2026-01-10T00:00:00.000Z",
          ),
        }),
      );

      prismaMock.employee.update.mockResolvedValue(
        employeeFixture({
          status: "ACTIVE",
          terminatedAt: null,
        }),
      );

      await updateEmployeeStatus(
        businessId,
        employeeId,
        {
          status: "ACTIVE",
        },
      );

      expect(
        prismaMock.employee.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "ACTIVE",
            terminatedAt: null,
          }),
        }),
      );
    });
  });

  describe("deleteEmployee", () => {
    it("soft deletes employee", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        employeeFixture(),
      );

      prismaMock.employee.update.mockResolvedValue(
        employeeFixture({
          status: "TERMINATED",
          terminatedAt: new Date(),
        }),
      );

      const result = await deleteEmployee(
        businessId,
        employeeId,
      );

      expect(result.status).toBe(
        "TERMINATED",
      );

      expect(
        prismaMock.employee.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "TERMINATED",
            terminatedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("rejects already terminated employee", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        employeeFixture({
          status: "TERMINATED",
          terminatedAt: new Date(),
        }),
      );

      await expect(
        deleteEmployee(
          businessId,
          employeeId,
        ),
      ).rejects.toThrow();
    });

    it("rejects employee from another business", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        deleteEmployee(
          otherBusinessId,
          employeeId,
        ),
      ).rejects.toThrow();
    });
  });

  it("lists employee shifts with pagination", async () => {
    prismaMock.employee.findFirst.mockResolvedValue(
      employeeFixture(),
    );

    const shifts = [
      {
        id: "shift-1",
        employeeId,
        branchId,
        startedAt: new Date(),
        endedAt: null,
        openingCash: new Prisma.Decimal("100000"),
        closingCash: null,
        status: "OPEN",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        branch: {
          id: branchId,
          code: "MAIN",
          name: "Main Branch",
        },
      },
    ];

    prismaMock.shift.findMany.mockResolvedValue(shifts);
    prismaMock.shift.count.mockResolvedValue(1);

    const result = await listEmployeeShifts(
      businessId,
      employeeId,
      {
        page: 1,
        limit: 20,
      },
    );

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
  });
});