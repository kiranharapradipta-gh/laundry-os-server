import { beforeEach, describe, expect, it, vi } from "vitest";

const transactionMock = vi.hoisted(() => ({
  shift: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
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
  },

  cashMovement: {
    findMany: vi.fn(),
  },
}));

vi.mock("../src/config/database.js", () => ({
  prisma: prismaMock,
}));

import {
  addCashMovement,
  closeShift,
  getShiftById,
  listCashMovements,
  listShifts,
  openShift,
} from "../src/modules/shift/shift.service.js";

const businessId = "business-1";
const branchId = "branch-1";
const employeeId = "employee-1";
const cashRegisterId = "register-1";
const shiftId = "shift-1";
const sessionId = "session-1";

const createShift = (overrides = {}) => ({
  id: shiftId,
  branchId,
  employeeId,
  startedAt: new Date("2026-01-01T08:00:00.000Z"),
  endedAt: null,
  openingCash: 100000,
  closingCash: null,
  status: "OPEN",
  notes: null,
  branch: {
    id: branchId,
    code: "BR-001",
    name: "Main Branch",
  },
  employee: {
    id: employeeId,
    employeeCode: "EMP-001",
    name: "John Doe",
  },
  ...overrides,
});

const createSession = (overrides = {}) => ({
  id: sessionId,
  cashRegisterId,
  shiftId,
  employeeId,
  openedAt: new Date("2026-01-01T08:00:00.000Z"),
  closedAt: null,
  openingBalance: 100000,
  expectedBalance: 100000,
  actualBalance: null,
  status: "OPEN",
  ...overrides,
});

describe("shift.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();

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

  describe("listShifts", () => {
    it("lists shifts with pagination", async () => {
      const shifts = [createShift()];

      prismaMock.shift.findMany.mockResolvedValue(shifts);
      prismaMock.shift.count.mockResolvedValue(1);

      const result = await listShifts(businessId, {
        page: 1,
        limit: 10,
      });

      expect(result.items).toEqual(shifts);
      expect(result.pagination.total).toBe(1);
      expect(prismaMock.shift.findMany).toHaveBeenCalled();
      expect(prismaMock.shift.count).toHaveBeenCalled();
    });

    it("filters by branch", async () => {
      prismaMock.shift.findMany.mockResolvedValue([]);
      prismaMock.shift.count.mockResolvedValue(0);

      await listShifts(businessId, {
        page: 1,
        limit: 10,
        branchId,
      });

      expect(prismaMock.shift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branch: {
              businessId,
            },
            branchId,
          }),
        }),
      );
    });

    it("filters by employee", async () => {
      prismaMock.shift.findMany.mockResolvedValue([]);
      prismaMock.shift.count.mockResolvedValue(0);

      await listShifts(businessId, {
        page: 1,
        limit: 10,
        employeeId,
      });

      expect(prismaMock.shift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId,
            branch: {
              businessId,
            },
          }),
        }),
      );
    });

    it("filters by status", async () => {
      prismaMock.shift.findMany.mockResolvedValue([]);
      prismaMock.shift.count.mockResolvedValue(0);

      await listShifts(businessId, {
        page: 1,
        limit: 10,
        status: "OPEN",
      });

      expect(prismaMock.shift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "OPEN",
            branch: {
              businessId,
            },
          }),
        }),
      );
    });
  });

  describe("getShift", () => {
    it("returns a shift", async () => {
      const shift = createShift();

      prismaMock.shift.findFirst.mockResolvedValue(shift);

      const result = await getShiftById(businessId, shiftId);

      expect(result).toEqual(shift);
      expect(prismaMock.shift.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: shiftId,
            branch: {
              businessId,
            },
          },
        }),
      );
    });

    it("throws when shift does not exist", async () => {
      prismaMock.shift.findFirst.mockResolvedValue(null);

      await expect(
        getShiftById(businessId, shiftId),
      ).rejects.toThrow("Shift tidak ditemukan");
    });
  });

  describe("openShift", () => {
    const validInput = {
      branchId,
      employeeId,
      cashRegisterId,
      openingCash: 100000,
      notes: "Morning shift",
    };

    beforeEach(() => {
      prismaMock.employee.findFirst.mockResolvedValue({
        id: employeeId,
        businessId,
        employeeCode: "EMP-001",
        name: "John Doe",
        status: "ACTIVE",
        branchId,
      });

      prismaMock.branch.findFirst.mockResolvedValue({
        id: branchId,
        businessId,
        code: "BR-001",
        name: "Main Branch",
        status: "ACTIVE",
      });

      prismaMock.cashRegister.findFirst.mockResolvedValue({
        id: cashRegisterId,
        branchId,
        code: "REG-001",
        name: "Main Register",
        active: true,
      });

      prismaMock.shift.findFirst.mockResolvedValue(null);
      prismaMock.cashSession.findFirst.mockResolvedValue(null);

      transactionMock.shift.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      transactionMock.shift.create.mockResolvedValue(createShift());

      transactionMock.cashSession.create.mockResolvedValue(
        createSession(),
      );

      transactionMock.cashMovement.create.mockResolvedValue({
        id: "movement-1",
      });
    });

    it("opens a shift successfully", async () => {
      const result = await openShift(
        businessId,
        validInput,
      );

      expect(result).toEqual(
        expect.objectContaining({
          shift: expect.anything(),
          cashSession: expect.anything(),
        }),
      );

      expect(prismaMock.employee.findFirst).toHaveBeenCalled();
      expect(prismaMock.branch.findFirst).toHaveBeenCalled();
      expect(prismaMock.cashRegister.findFirst).toHaveBeenCalled();

      expect(transactionMock.shift.create).toHaveBeenCalled();
      expect(transactionMock.cashSession.create).toHaveBeenCalled();
      expect(transactionMock.cashMovement.create).toHaveBeenCalled();

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it("rejects inactive employee", async () => {
      prismaMock.employee.findFirst.mockResolvedValue(null);

      await expect(
        openShift(businessId, validInput),
      ).rejects.toThrow("Employee tidak ditemukan");
    });

    it("rejects employee from another branch", async () => {
      prismaMock.employee.findFirst.mockResolvedValue({
        id: employeeId,
        businessId,
        employeeCode: "EMP-001",
        name: "John Doe",
        status: "ACTIVE",
        branchId: "another-branch",
      });

      await expect(
        openShift(businessId, validInput),
      ).rejects.toThrow(
        "Employee bukan bagian dari branch tersebut",
      );
    });

    it("rejects inactive branch", async () => {
      prismaMock.branch.findFirst.mockResolvedValue(null);

      await expect(
        openShift(businessId, validInput),
      ).rejects.toThrow("Branch tidak ditemukan");
    });

    it("rejects inactive cash register", async () => {
      prismaMock.cashRegister.findFirst.mockResolvedValue(null);

      await expect(
        openShift(businessId, validInput),
      ).rejects.toThrow("Cash register tidak ditemukan");
    });

    it("rejects when employee already has an open shift", async () => {
      prismaMock.shift.findFirst.mockResolvedValue(
        createShift(),
      );

      await expect(
        openShift(businessId, validInput),
      ).rejects.toThrow();
    });

    it("rejects when cash register already has an open session", async () => {
      prismaMock.cashSession.findFirst.mockResolvedValue(
        createSession(),
      );

      await expect(
        openShift(businessId, validInput),
      ).rejects.toThrow();
    });
  });

  describe("closeShift", () => {
    it("closes an open shift", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(
        createShift(),
      );

      transactionMock.cashSession.findFirst.mockResolvedValue(
        createSession(),
      );

      transactionMock.cashMovement.findMany.mockResolvedValue([
        {
          id: "movement-1",
          type: "CASH_IN",
          amount: 50000,
        },
        {
          id: "movement-2",
          type: "CASH_OUT",
          amount: 10000,
        },
      ]);

      transactionMock.shift.update.mockResolvedValue(
        createShift({
          status: "CLOSED",
          endedAt: new Date(),
          closingCash: 140000,
        }),
      );

      transactionMock.cashSession.update.mockResolvedValue(
        createSession({
          status: "CLOSED",
          actualBalance: 140000,
        }),
      );

      transactionMock.cashMovement.create.mockResolvedValue({
        id: "closing-movement",
      });

      const result = await closeShift(
        businessId,
        shiftId,
        {
          closingCash: 140000,
          notes: "Shift closed",
        },
      );

      expect(result).toEqual(
        expect.objectContaining({
          shift: expect.anything(),
          summary: expect.anything(),
        }),
      );

      expect(transactionMock.shift.update).toHaveBeenCalled();
      expect(transactionMock.cashSession.update).toHaveBeenCalled();
      expect(transactionMock.cashMovement.create).toHaveBeenCalled();
    });

    it("rejects closing a missing shift", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(null);

      await expect(
        closeShift(businessId, shiftId, {
          closingCash: 100000,
        }),
      ).rejects.toThrow("Shift tidak ditemukan");
    });

    it("rejects closing an already closed shift", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(
        createShift({
          status: "CLOSED",
        }),
      );

      await expect(
        closeShift(businessId, shiftId, {
          closingCash: 100000,
        }),
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
        id: "movement-1",
        cashSessionId: sessionId,
        employeeId,
        type: "CASH_IN",
        amount: 50000,
      });

      const result = await addCashMovement(
        businessId,
        shiftId,
        {
          type: "CASH_IN",
          amount: 50000,
          description: "Additional cash",
        },
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: "movement-1",
        }),
      );

      expect(transactionMock.shift.findFirst).toHaveBeenCalled();
      expect(transactionMock.cashSession.findFirst).toHaveBeenCalled();
      expect(transactionMock.cashMovement.create).toHaveBeenCalled();
    });

    it("rejects movement when shift does not exist", async () => {
      transactionMock.shift.findFirst.mockResolvedValue(null);

      await expect(
        addCashMovement(
          businessId,
          shiftId,
          {
            type: "CASH_IN",
            amount: 50000,
          },
        ),
      ).rejects.toThrow("Shift tidak ditemukan");
    });

    it("rejects movement when shift is closed", async () => {
      transactionMock.shift.findFirst.mockResolvedValue({
        id: shiftId,
        employeeId,
        status: "CLOSED",
      });

      await expect(
        addCashMovement(
          businessId,
          shiftId,
          {
            type: "CASH_IN",
            amount: 50000,
          },
        ),
      ).rejects.toThrow();
    });

    it("rejects movement when cash session does not exist", async () => {
      transactionMock.shift.findFirst.mockResolvedValue({
        id: shiftId,
        employeeId,
        status: "OPEN",
      });

      transactionMock.cashSession.findFirst.mockResolvedValue(null);

      await expect(
        addCashMovement(
          businessId,
          shiftId,
          {
            type: "CASH_IN",
            amount: 50000,
          },
        ),
      ).rejects.toThrow();
    });
  });

  describe("listCashMovements", () => {
    it("lists cash movements for a shift", async () => {
      const movements = [
        {
          id: "movement-1",
          cashSessionId: sessionId,
          employeeId,
          type: "CASH_IN",
          amount: 50000,
        },
        {
          id: "movement-2",
          cashSessionId: sessionId,
          employeeId,
          type: "CASH_OUT",
          amount: 10000,
        },
      ];

      prismaMock.shift.findFirst.mockResolvedValue(
        createShift(),
      );

      prismaMock.cashSession.findFirst.mockResolvedValue({
        id: sessionId,
      });

      prismaMock.cashMovement.findMany.mockResolvedValue(
        movements,
      );

      const result = await listCashMovements(
        businessId,
        shiftId,
      );

      expect(result).toEqual(movements);

      expect(prismaMock.shift.findFirst).toHaveBeenCalled();
      expect(prismaMock.cashSession.findFirst).toHaveBeenCalled();
      expect(prismaMock.cashMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            cashSessionId: sessionId,
          },
        }),
      );
    });

    it("returns empty array when cash session does not exist", async () => {
      prismaMock.shift.findFirst.mockResolvedValue(
        createShift(),
      );

      prismaMock.cashSession.findFirst.mockResolvedValue(null);

      const result = await listCashMovements(
        businessId,
        shiftId,
      );

      expect(result).toEqual([]);
      expect(prismaMock.cashMovement.findMany).not.toHaveBeenCalled();
    });

    it("rejects when shift does not exist", async () => {
      prismaMock.shift.findFirst.mockResolvedValue(null);

      await expect(
        listCashMovements(businessId, shiftId),
      ).rejects.toThrow("Shift tidak ditemukan");
    });
  });
});