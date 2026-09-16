import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const transactionMock = vi.hoisted(() => ({
  shift: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },

  employee: {
    findFirst: vi.fn(),
  },

  branch: {
    findFirst: vi.fn(),
  },

  cashRegister: {
    findFirst: vi.fn(),
  },

  cashSession: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },

  cashMovement: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),

  shift: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },

  branch: {
    findFirst: vi.fn(),
  },

  cashSession: {
    findFirst: vi.fn(),
  },

}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

import { Prisma } from "@prisma/client";

import {
  openShift,
  closeShift,
  addCashMovement,
  listCashMovements,
  getShiftById,
  listShifts,
} from "../src/modules/shift/shift.service.js";

const businessId =
  "4999e4ca-f860-4d3f-84f7-15b04d402eb2";

const otherBusinessId =
  "5999e4ca-f860-4d3f-84b7-15b04d402eb3";

const shiftId =
  "11111111-1111-4111-8111-111111111111";

const branchId =
  "22222222-2222-4222-8222-222222222222";

const employeeId =
  "33333333-3333-4333-8333-333333333333";

const cashRegisterId =
  "44444444-4444-4444-8444-444444444444";

const sessionId =
  "55555555-5555-4555-8555-555555555555";

const createShift = (
  overrides: Record<string, unknown> = {},
) => ({
  id: shiftId,
  branchId,
  employeeId,
  startedAt: new Date("2026-09-16T08:00:00.000Z"),
  endedAt: null,
  openingCash: new Prisma.Decimal("100000"),
  closingCash: null,
  status: "OPEN",
  notes: null,
  createdAt: new Date("2026-09-16T08:00:00.000Z"),
  updatedAt: new Date("2026-09-16T08:00:00.000Z"),
  ...overrides,
});

const createSession = (
  overrides: Record<string, unknown> = {},
) => ({
  id: sessionId,
  cashRegisterId,
  shiftId,
  employeeId,
  openedAt: new Date("2026-09-16T08:00:00.000Z"),
  closedAt: null,
  openingBalance: new Prisma.Decimal("100000"),
  expectedBalance: null,
  actualBalance: null,
  status: "OPEN",
  createdAt: new Date("2026-09-16T08:00:00.000Z"),
  updatedAt: new Date("2026-09-16T08:00:00.000Z"),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();

  prismaMock.$transaction.mockImplementation(
    async (input: unknown) => {
      if (typeof input === "function") {
        return input(transactionMock);
      }

      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return input;
    },
  );
});

describe("shift.service", () => {
  describe("openShift", () => {
    it("opens a shift successfully", async () => {
      transactionMock.employee.findFirst.mockResolvedValue({
        id: employeeId,
        businessId,
        branchId,
        status: "ACTIVE",
      });

      transactionMock.branch.findFirst.mockResolvedValue({
        id: branchId,
        businessId,
        status: "ACTIVE",
      });

      transactionMock.cashRegister.findFirst.mockResolvedValue({
        id: cashRegisterId,
        branchId,
        active: true,
      });

      transactionMock.shift.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      transactionMock.shift.update.mockResolvedValue(
        createShift(),
      );

      transactionMock.cashSession.create.mockResolvedValue(
        createSession(),
      );

      transactionMock.cashMovement.create.mockResolvedValue({
        id: "movement-1",
      });

      prismaMock.branch.findFirst.mockResolvedValue({
        id: branchId,
        businessId,
        status: "ACTIVE",
      });

      const result = await openShift(
        businessId,
        {
          branchId,
          employeeId,
          cashRegisterId,
          openingCash: "100000",
        },
      );

      expect(result).toBeDefined();

      expect(
        transactionMock.employee.findFirst,
      ).toHaveBeenCalled();

      expect(
        transactionMock.branch.findFirst,
      ).toHaveBeenCalled();

      expect(
        transactionMock.cashRegister.findFirst,
      ).toHaveBeenCalled();

      expect(
        transactionMock.cashSession.create,
      ).toHaveBeenCalled();

      expect(
        transactionMock.cashMovement.create,
      ).toHaveBeenCalled();
    });

    it("rejects an inactive employee", async () => {
      transactionMock.employee.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        openShift(
          businessId,
          {
            branchId,
            employeeId,
            cashRegisterId,
            openingCash: "100000",
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects an employee from another business", async () => {
      transactionMock.employee.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        openShift(
          otherBusinessId,
          {
            branchId,
            employeeId,
            cashRegisterId,
            openingCash: "100000",
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects an inactive branch", async () => {
      transactionMock.employee.findFirst.mockResolvedValue({
        id: employeeId,
        businessId,
        branchId,
        status: "ACTIVE",
      });

      transactionMock.branch.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        openShift(
          businessId,
          {
            branchId,
            employeeId,
            cashRegisterId,
            openingCash: "100000",
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects an inactive cash register", async () => {
      transactionMock.employee.findFirst.mockResolvedValue({
        id: employeeId,
        businessId,
        branchId,
        status: "ACTIVE",
      });

      transactionMock.branch.findFirst.mockResolvedValue({
        id: branchId,
        businessId,
        status: "ACTIVE",
      });

      transactionMock.cashRegister.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        openShift(
          businessId,
          {
            branchId,
            employeeId,
            cashRegisterId,
            openingCash: "100000",
          },
        ),
      ).rejects.toThrow();
    });
  });

  describe("addCashMovement", () => {
    it("adds cash in to an open shift", async () => {
      transactionMock.shift.findFirst.mockResolvedValue({
        id: shiftId,
        employeeId,
        status: "OPEN",
      });

      transactionMock.cashSession.findFirst.mockResolvedValue({
        id: sessionId,
      });

      transactionMock.cashMovement.create.mockResolvedValue({
        id: "cash-movement-id",
        cashSessionId: sessionId,
        employeeId,
        type: "CASH_IN",
        amount: new Prisma.Decimal("50000"),
      });

      const result = await addCashMovement(
        businessId,
        shiftId,
        {
          type: "CASH_IN",
          amount: "50000",
          description: "Modal tambahan",
        },
      );

      expect(result).toBeDefined();

      expect(
        transactionMock.cashMovement.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId,
            type: "CASH_IN",
            amount: expect.any(Prisma.Decimal),
          }),
        }),
      );
    });

    it("rejects cash movement when shift is closed", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(
        createShift({
          status: "CLOSED",
        }),
      );

      await expect(
        addCashMovement(
          businessId,
          shiftId,
          {
            type: "CASH_IN",
            amount: "50000",
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects cash movement when shift does not belong to business", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        addCashMovement(
          otherBusinessId,
          shiftId,
          {
            type: "CASH_IN",
            amount: "50000",
          },
        ),
      ).rejects.toThrow();
    });
  });

  describe("closeShift", () => {
    it("closes shift and calculates expected cash correctly", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(
        createShift(),
      );

      transactionMock.cashSession.findFirst.mockResolvedValue(
        createSession(),
      );

      transactionMock.cashMovement.findMany.mockResolvedValue([
        {
          type: "OPENING_BALANCE",
          amount: new Prisma.Decimal("100000"),
        },
        {
          type: "CASH_IN",
          amount: new Prisma.Decimal("50000"),
        },
        {
          type: "CASH_OUT",
          amount: new Prisma.Decimal("20000"),
        },
      ]);

      transactionMock.shift.update.mockResolvedValue(
        createShift({
          status: "CLOSED",
          closingCash: new Prisma.Decimal("130000"),
          endedAt: new Date(),
        }),
      );

      transactionMock.cashSession.update.mockResolvedValue({
        ...createSession({
          status: "CLOSED",
          expectedBalance: new Prisma.Decimal("130000"),
          actualBalance: new Prisma.Decimal("130000"),
        }),
      });

      transactionMock.cashMovement.create.mockResolvedValue({
        id: "closing-movement",
      });

      const result = await closeShift(
        businessId,
        shiftId,
        {
          closingCash: "130000",
        },
      );

      expect(result.summary.expectedCash).toBe(
        "130000",
      );

      expect(result.summary.closingCash).toBe(
        "130000",
      );

      expect(result.summary.variance).toBe(
        "0",
      );

      expect(
        transactionMock.shift.update,
      ).toHaveBeenCalled();

      expect(
        transactionMock.cashSession.update,
      ).toHaveBeenCalled();

      expect(
        transactionMock.cashMovement.create,
      ).toHaveBeenCalled();
    });

    it("calculates positive variance", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(
        createShift(),
      );

      transactionMock.cashSession.findFirst.mockResolvedValue(
        createSession(),
      );

      transactionMock.cashMovement.findMany.mockResolvedValue([
        {
          type: "OPENING_BALANCE",
          amount: new Prisma.Decimal("100000"),
        },
      ]);

      transactionMock.shift.update.mockResolvedValue(
        createShift({
          status: "CLOSED",
          closingCash: new Prisma.Decimal("110000"),
        }),
      );

      transactionMock.cashSession.update.mockResolvedValue({});
      transactionMock.cashMovement.create.mockResolvedValue({});

      const result = await closeShift(
        businessId,
        shiftId,
        {
          closingCash: "110000",
        },
      );

      expect(result.summary.expectedCash).toBe(
        "100000",
      );

      expect(result.summary.variance).toBe(
        "10000",
      );
    });

    it("rejects closing an already closed shift", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(
        createShift({
          status: "CLOSED",
        }),
      );

      await expect(
        closeShift(
          businessId,
          shiftId,
          {
            closingCash: "100000",
          },
        ),
      ).rejects.toThrow();
    });
  });

  describe("getShiftById", () => {
    it("returns a shift for the same business", async () => {
      prismaMock.shift.findFirst.mockResolvedValue(
        createShift(),
      );

      const result = await getShiftById(
        businessId,
        shiftId,
      );

      expect(result).toEqual(
        createShift(),
      );
    });

    it("does not return a shift from another business", async () => {
      prismaMock.shift.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        getShiftById(
          otherBusinessId,
          shiftId,
        ),
      ).rejects.toThrow();
    });
  });

  describe("listCashMovements", () => {
    it("lists cash movements for the business shift", async () => {
      prismaMock.shift.findFirst.mockResolvedValue(
        createShift(),
      );

      prismaMock.cashSession.findFirst.mockResolvedValue({
        id: sessionId,
      });

      const movements = [
        {
          id: "movement-1",
          amount: new Prisma.Decimal("50000"),
          type: "CASH_IN",
        },
      ];

      transactionMock.cashMovement.findMany.mockResolvedValue(
        movements,
      );

      const result = await listCashMovements(
        businessId,
        shiftId,
      );

      expect(result).toEqual(movements);
    });
  });

  describe("listShifts", () => {
    it("lists shifts with pagination", async () => {
      prismaMock.shift.findMany.mockResolvedValue([
        createShift(),
      ]);

      prismaMock.shift.count.mockResolvedValue(1);

      const result = await listShifts(
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
  });
});
